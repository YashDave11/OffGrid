import uuid
import logging
from backend.models.registry import ModelRegistry
from backend.orchestrator.router import TaskRouter
import os
import json
import faiss
import time
from backend.core.config import settings
from backend.documents.embedder import EmbeddingService
from backend.orchestrator.state import TaskContext, AgentState, Observation, get_conversation

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self, registry: ModelRegistry, router: TaskRouter):
        self.registry = registry
        self.router = router
        
    async def analyze(self, task: str, input_type: str, content: str, **kwargs) -> TaskContext:
        """Main entry point for task analysis."""
        request_id = str(uuid.uuid4())
        context = TaskContext(request_id=request_id, state=AgentState.RECEIVED)
        context.add_step(AgentState.RECEIVED)
        
        conversation_id = kwargs.get("conversation_id")
        conv_ctx = None
        if conversation_id:
            conv_ctx = get_conversation(conversation_id)
            if task and not kwargs.get("skip_user_obs", False):
                conv_ctx.add_observation(Observation(source="user", type="message", content=task))
        
        try:
            # Classification
            context.add_step(AgentState.CLASSIFIED)
            context.task_type = input_type
            
            # Routing
            capability = self.router.route(input_type)
            context.add_step(AgentState.ROUTED)
            
            # Retrieve Model
            provider = self.registry.get_provider(capability)
            if not provider:
                raise ValueError(f"No model provider found for capability: {capability}")
                
            # --- RAG INTERCEPTION ---
            if capability == "reasoning":
                top_k = getattr(settings, "rag_top_k", 5)
                threshold = getattr(settings, "rag_similarity_threshold", 0.5)
                
                document_id = kwargs.get("document_id")
                retrieved_chunks = []
                retrieval_timing = {}
                kb_used = False
                
                if document_id:
                    index_path = f"data/rag/indexes/{document_id}.faiss"
                    meta_path = f"data/rag/metadata/{document_id}.json"
                    
                    if os.path.exists(index_path) and os.path.exists(meta_path):
                        t0 = time.time()
                        embedder = EmbeddingService.get_instance()
                        query_vec = embedder.embed([task])
                        t1 = time.time()
                        
                        index = faiss.read_index(index_path)
                        k = min(top_k, index.ntotal)
                        distances, indices = [] , []
                        if k > 0:
                            distances, indices = index.search(query_vec, k)
                        t2 = time.time()
                        
                        with open(meta_path, "r", encoding="utf-8") as f:
                            metadata = json.load(f)
                            
                        if len(indices) > 0 and len(distances) > 0:
                            for idx, dist in zip(indices[0], distances[0]):
                                if idx >= 0 and idx < len(metadata) and float(dist) >= threshold:
                                    meta = metadata[idx]
                                    retrieved_chunks.append({
                                        "text": f"[Source: {meta.get('document', 'Unknown')} | Page: {meta.get('page', 'Unknown')} | Similarity: {dist:.2f}]\n{meta.get('text', '')}",
                                        "similarity": float(dist)
                                    })
                                    
                        t3 = time.time()
                        retrieval_timing = {
                            "embedding_ms": int((t1 - t0) * 1000),
                            "search_ms": int((t2 - t1) * 1000),
                            "context_ms": int((t3 - t2) * 1000)
                        }
                
                # Global Knowledge Base Check (always run to combine contexts)
                from backend.documents.knowledge_base import KnowledgeBaseService
                kb = KnowledgeBaseService.get_instance()
                res = kb.search(task, top_k)
                results = res.get("results", [])
                
                if results:
                    for meta in results:
                        dist = meta.get("similarity_score", 0.0)
                        if dist >= threshold:
                            retrieved_chunks.append({
                                "text": f"[Source: {meta.get('document_name', 'Unknown')} | Page: {meta.get('page_number', 'Unknown')} | Similarity: {dist:.2f}]\n{meta.get('text', '')}",
                                "similarity": float(dist)
                            })
                    if not retrieval_timing:
                        retrieval_timing = res.get("timing", {})
                    else:
                        retrieval_timing["kb_search_ms"] = res.get("timing", {}).get("search_ms", 0)
                    kb_used = True

                # If we found relevant chunks from either source, bound and prompt
                if retrieved_chunks:
                    # Sort by similarity descending
                    retrieved_chunks.sort(key=lambda x: x["similarity"], reverse=True)
                    retrieved_chunks = retrieved_chunks[:top_k]
                    
                    context_str = "\n\n".join([c["text"] for c in retrieved_chunks])
                    
                    if conv_ctx:
                        conv_ctx.add_observation(Observation(source="rag", type="retrieval", content=context_str))
                    
                    max_chars = getattr(settings, "rag_max_context_chars", 16000)
                    if len(context_str) > max_chars:
                        context_str = context_str[:max_chars] + "\n... [Context truncated to fit budget]"
                        
                    rag_prompt = (
                        "SYSTEM:\n"
                        "You are answering questions about an uploaded document or knowledge base.\n"
                        "Use the provided document context as the primary evidence.\n"
                        "Rules:\n"
                        "1. Answer using the supplied context.\n"
                        "2. Do not invent facts that are not supported by the context.\n"
                        "3. If the retrieved context does not contain enough information, clearly say that the information could not be found in the provided document.\n"
                        "4. Preserve important numbers, units, equipment identifiers, standards, and technical terminology exactly.\n"
                        "5. When the answer is supported by a source, mention the relevant document and page.\n"
                        "6. Do not treat the similarity score as factual document content.\n\n"
                        "DOCUMENT CONTEXT:\n"
                        f"{context_str}\n\n"
                    )
                else:
                    rag_prompt = ""

                # --- UNIFIED CONTEXT BUILDER ---
                history_str = ""
                if conv_ctx:
                    # Collect last 10 observations excluding the current user message just added
                    # We will append the current task at the end.
                    for obs in conv_ctx.observations[-10:-1]:
                        if obs.source == "user":
                            history_str += f"User: {obs.content}\n\n"
                        elif obs.source == "assistant":
                            history_str += f"Assistant: {obs.content}\n\n"
                        elif obs.source == "gemma":
                            history_str += f"[Vision Model Analysis]: {obs.content}\n\n"
                        # We don't need to append 'rag' from history because RAG is query specific and
                        # usually the current RAG context is enough, but if needed, we can.
                        # We omit previous RAG to save tokens, only passing current RAG context.
                
                content = ""
                if rag_prompt:
                    content += rag_prompt
                if history_str:
                    content += "CONVERSATION HISTORY & OBSERVATIONS:\n" + history_str
                content += f"USER QUESTION:\n{task}"
                
                if retrieved_chunks:
                    context.ingestion_details = {
                        "document_id": document_id or "knowledge_base",
                        "retrieval": {
                            "status": "success",
                            "source": "knowledge_base" if kb_used else "per_document",
                            "top_k": top_k,
                            "threshold_applied": threshold,
                            "chunks_injected": len(retrieved_chunks),
                            "timing": retrieval_timing
                        }
                    }
            # --- END RAG INTERCEPTION ---
                
            context.model_used = provider.name
            
            # Execution
            context.add_step(AgentState.EXECUTING)
            # Support both returning a string or a tuple of (string, dict)
            exec_res = await provider.execute(task, content, **kwargs)
            if isinstance(exec_res, tuple):
                result, details = exec_res
                if context.ingestion_details:
                    # Update existing details (like RAG retrieval) if present
                    context.ingestion_details.update(details)
                else:
                    context.ingestion_details = details
            else:
                result = exec_res
                
            if conv_ctx:
                if capability == "vision":
                    conv_ctx.add_observation(Observation(source="gemma", type="image_analysis", content=result))
                elif capability == "reasoning":
                    conv_ctx.add_observation(Observation(source="assistant", type="message", content=result))
                elif capability == "document":
                    conv_ctx.add_observation(Observation(source="document", type="extraction", content="Document ingested."))
                
            # --- AUTO-CHAIN REASONING IF QUESTION PROVIDED ---
            if task and task.strip():
                if capability == "document" and context.ingestion_details and "document_id" in context.ingestion_details:
                    try:
                        reasoning_provider = self.registry.get_provider("reasoning")
                        if reasoning_provider:
                            doc_id = context.ingestion_details["document_id"]
                            rag_context = await self.analyze(
                                task=task, 
                                input_type="text", 
                                content=task, 
                                document_id=doc_id,
                                conversation_id=conversation_id,
                                skip_user_obs=True
                            )
                            
                            if rag_context.result:
                                result += f"\n\n---\n\n{rag_context.result}"
                                
                            if rag_context.ingestion_details and "retrieval" in rag_context.ingestion_details:
                                context.ingestion_details["retrieval"] = rag_context.ingestion_details["retrieval"]
                    except Exception as e:
                        logger.error(f"Auto-chain RAG failed: {e}")
                        result += f"\n\n---\n\n> ⚠️ *Failed to run reasoning on the uploaded document: {e}*"
                        
                elif capability == "vision":
                    try:
                        reasoning_provider = self.registry.get_provider("reasoning")
                        if reasoning_provider:
                            reasoning_context = await self.analyze(
                                task=task, 
                                input_type="text", 
                                content=task, 
                                conversation_id=conversation_id,
                                skip_user_obs=True
                            )
                            
                            if reasoning_context.result:
                                result += f"\n\n---\n\n{reasoning_context.result}"
                                
                            if reasoning_context.ingestion_details and "retrieval" in reasoning_context.ingestion_details:
                                if not context.ingestion_details:
                                    context.ingestion_details = {}
                                context.ingestion_details["retrieval"] = reasoning_context.ingestion_details["retrieval"]
                    except Exception as e:
                        logger.error(f"Auto-chain reasoning failed for vision: {e}")
                        result += f"\n\n---\n\n> ⚠️ *Failed to run reasoning on the image analysis: {e}*"
            # --- END AUTO-CHAIN ---
                
            # Completion
            context.result = result
            context.add_step(AgentState.COMPLETED)
            
            return context
            
        except Exception as e:
            err_str = str(e)
            logger.error(f"Error processing request {request_id}: {err_str}")
            
            # If a remote provider fails due to connection error or timeout, seamlessly fall back to local standby engine
            if any(k in err_str.lower() for k in ("connection", "timed out", "unavailable")):
                try:
                    logger.warning(f"Remote provider unreachable, activating sovereign standby fallback for request {request_id}")
                    from backend.models.mock_reasoning import MockReasoningModel
                    from backend.models.mock_vision import MockVisionModel
                    from backend.models.base import CAPABILITY_VISION
                    
                    capability = locals().get("capability", "reasoning")
                    fallback = MockVisionModel() if capability == CAPABILITY_VISION else MockReasoningModel()
                    context.model_used = f"{fallback.name} (standby fallback)"
                    res = await fallback.execute(task, content)
                    context.result = f"> ⚠️ *Second laptop / remote provider offline. Executed via Sovereign Standby Engine.*\n\n{res}"
                    context.add_step(AgentState.COMPLETED)
                    return context
                except Exception as fb_err:
                    logger.error(f"Standby fallback failed: {fb_err}")

            context.add_step(AgentState.FAILED)
            context.result = f"Error: {str(e)}"
            return context
