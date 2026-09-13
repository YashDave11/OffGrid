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
from backend.orchestrator.state import TaskContext, AgentState

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
                                    retrieved_chunks.append(
                                        f"[Source: {meta.get('document', 'Unknown')} | Page: {meta.get('page', 'Unknown')} | Similarity: {dist:.2f}]\n{meta.get('text', '')}"
                                    )
                                    
                        t3 = time.time()
                        retrieval_timing = {
                            "embedding_ms": int((t1 - t0) * 1000),
                            "search_ms": int((t2 - t1) * 1000),
                            "context_ms": int((t3 - t2) * 1000)
                        }
                else:
                    # Global Knowledge Base Check
                    from backend.documents.knowledge_base import KnowledgeBaseService
                    kb = KnowledgeBaseService.get_instance()
                    res = kb.search(task, top_k)
                    results = res.get("results", [])
                    
                    if results:
                        for meta in results:
                            dist = meta.get("similarity_score", 0.0)
                            if dist >= threshold:
                                retrieved_chunks.append(
                                    f"[Source: {meta.get('document_name', 'Unknown')} | Page: {meta.get('page_number', 'Unknown')} | Similarity: {dist:.2f}]\n{meta.get('text', '')}"
                                )
                        retrieval_timing = res.get("timing", {})
                        if retrieved_chunks:
                            kb_used = True

                # If we found relevant chunks from either source, bound and prompt
                if retrieved_chunks:
                    context_str = "\n\n".join(retrieved_chunks)
                    
                    max_chars = getattr(settings, "rag_max_context_chars", 16000)
                    if len(context_str) > max_chars:
                        context_str = context_str[:max_chars] + "\n... [Context truncated to fit budget]"
                        
                    rag_prompt = (
                        "SYSTEM:\n"
                        "You are answering questions about an uploaded document.\n"
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
                        "USER QUESTION:\n"
                        f"{task}"
                    )
                    
                    content = rag_prompt
                    
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
                
            # --- AUTO-CHAIN RAG IF QUESTION PROVIDED ---
            if capability == "document" and task and task.strip() and context.ingestion_details and "document_id" in context.ingestion_details:
                try:
                    reasoning_provider = self.registry.get_provider("reasoning")
                    if reasoning_provider:
                        doc_id = context.ingestion_details["document_id"]
                        rag_context = await self.analyze(task=task, input_type="text", content=task, document_id=doc_id)
                        
                        if rag_context.result:
                            result += f"\n\n---\n\n{rag_context.result}"
                            
                        if rag_context.ingestion_details and "retrieval" in rag_context.ingestion_details:
                            context.ingestion_details["retrieval"] = rag_context.ingestion_details["retrieval"]
                except Exception as e:
                    logger.error(f"Auto-chain RAG failed: {e}")
                    result += f"\n\n---\n\n> ⚠️ *Failed to run reasoning on the uploaded document: {e}*"
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
