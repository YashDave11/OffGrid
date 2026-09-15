from fastapi import APIRouter, HTTPException, Depends
from backend.api.schemas import HealthResponse, AnalyzeRequest, AnalyzeResponse, KBSearchRequest, KBUploadRequest, DiagramRequest
from backend.orchestrator.agent import Orchestrator
from backend.orchestrator.state import AgentState
from backend.models.registry import registry
from backend.orchestrator.router import TaskRouter
from backend.core.config import settings
import httpx
from backend.documents.knowledge_base import KnowledgeBaseService

def get_orchestrator() -> Orchestrator:
    return Orchestrator(registry=registry, router=TaskRouter())

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    return HealthResponse(status="ok", service="mrpl-ai-workbench")

@router.get("/v1/status")
async def status_check():
    """Check availability of configured model providers."""
    async def check_provider(url: str) -> str:
        if not url: return "unconfigured"
        try:
            async with httpx.AsyncClient(timeout=settings.model_connect_timeout) as client:
                res = await client.get(f"{url.rstrip('/')}/health")
                return "ok" if res.status_code == 200 else "offline"
        except Exception:
            return "offline"
            
    if settings.use_mock_providers or settings.use_mock_reasoning:
        primary_res = "standby"
        fallback_res = "standby"
        overall_reasoning = "standby"
        active_model = "Mock-Reasoning"
        fallback_active = False
    else:
        primary_res = await check_provider(settings.primary_reasoning_base_url)
        fallback_res = await check_provider(settings.fallback_reasoning_base_url)
        
        if primary_res == "ok":
            overall_reasoning = "ok"
            active_model = settings.primary_reasoning_model_name
            fallback_active = False
        elif fallback_res == "ok":
            overall_reasoning = "ok"
            active_model = settings.fallback_reasoning_model_name
            fallback_active = True
        else:
            overall_reasoning = "offline"
            active_model = settings.primary_reasoning_model_name
            fallback_active = False

    vision_res = "standby" if (settings.use_mock_providers or settings.use_mock_vision) else await check_provider(settings.vision_base_url)
    diagram_res = "standby" if settings.use_mock_providers else await check_provider(settings.diagram_base_url)
            
    return {
        "reasoning": overall_reasoning,
        "primary_reasoning": primary_res,
        "fallback_reasoning": fallback_res,
        "active_reasoning_model": active_model,
        "reasoning_fallback_active": fallback_active,
        "vision": vision_res,
        "diagram": diagram_res,
        "mode": "mock" if settings.use_mock_providers else "remote",
        "details": {
            "primary_reasoning": {
                "name": settings.primary_reasoning_model_name,
                "url": settings.primary_reasoning_base_url,
                "status": primary_res
            },
            "fallback_reasoning": {
                "name": settings.fallback_reasoning_model_name,
                "url": settings.fallback_reasoning_base_url,
                "status": fallback_res
            },
            "vision": {
                "name": settings.vision_model_name,
                "url": settings.vision_base_url,
                "status": vision_res
            }
        }
    }

@router.post("/v1/providers/toggle")
async def toggle_provider_mode():
    """Toggle between mock standby and remote model servers."""
    from backend.models.mock_reasoning import MockReasoningModel
    from backend.models.mock_vision import MockVisionModel
    from backend.models.remote_reasoning import RemoteReasoningModel
    from backend.models.remote_vision import RemoteVisionModel
    from backend.models.document_processor import DocumentProcessorModel

    settings.use_mock_providers = not settings.use_mock_providers
    registry._providers.clear()
    
    if settings.use_mock_providers:
        registry.register(MockReasoningModel())
        registry.register(MockVisionModel())
        registry.register(DocumentProcessorModel())
    else:
        registry.register(RemoteReasoningModel())
        registry.register(RemoteVisionModel())
        registry.register(DocumentProcessorModel())
        
    return {
        "use_mock_providers": settings.use_mock_providers,
        "mode": "standby" if settings.use_mock_providers else "remote"
    }

@router.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest, orchestrator: Orchestrator = Depends(get_orchestrator)):
    """Analyze the given input."""
    context = await orchestrator.analyze(
        task=request.task,
        input_type=request.input_type,
        content=request.content,
        document_name=request.document_name,
        conversation_id=request.conversation_id
    )
    
    if context.state == AgentState.FAILED:
        raise HTTPException(status_code=500, detail=context.result)
        
    return AnalyzeResponse(
        request_id=context.request_id,
        status=context.state.value,
        task_type=context.task_type,
        model=context.model_used,
        result=context.result,
        steps=context.steps,
        ingestion_details=context.ingestion_details
    )

@router.get("/v1/knowledge/documents")
async def get_kb_documents():
    """Retrieve all indexed documents in the Knowledge Base."""
    kb = KnowledgeBaseService.get_instance()
    return {"documents": kb.get_documents()}

@router.post("/v1/knowledge/upload")
async def upload_kb_document(request: KBUploadRequest):
    """Upload and index a document into the Knowledge Base."""
    from backend.models.document_processor import DocumentProcessorModel
    
    provider = registry.get_provider("document")
    if not provider or not isinstance(provider, DocumentProcessorModel):
        raise HTTPException(status_code=500, detail="Document processor unavailable")
        
    res, details = await provider.execute(
        task="Ingest PDF",
        content=request.content,
        document_name=request.document_name,
        add_to_kb=True
    )
    
    return {
        "status": "success",
        "message": res,
        "details": details
    }

@router.post("/v1/knowledge/search")
async def search_kb(request: KBSearchRequest):
    """Search the Knowledge Base for relevant context."""
    kb = KnowledgeBaseService.get_instance()
    results = kb.search(request.query, request.top_k)
    return results

@router.delete("/v1/knowledge/documents/{document_id}")
async def delete_kb_document(document_id: str):
    """Delete a document from the Knowledge Base."""
    kb = KnowledgeBaseService.get_instance()
    if kb.delete_document(document_id):
        return {"status": "success", "message": "Document deleted"}
    raise HTTPException(status_code=404, detail="Document not found")

@router.post("/v1/diagram/generate")
async def generate_diagram(request: DiagramRequest):
    """Generate a diagram via remote service."""
    import uuid
    from fastapi import Response
    
    import re
    
    def sanitize_text(text: str) -> str:
        if not text:
            return ""
        # Remove characters that might break naive JSON parsers (quotes, slashes, brackets)
        text = re.sub(r'["\'\\/\[\]{}<>]', ' ', text)
        # Replace newlines with spaces to avoid raw newline issues
        text = text.replace('\n', ' ').replace('\r', ' ')
        # Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    # Compile conversation history for context
    history_context = ""
    conv_ctx = None
    if request.conversation_id:
        from backend.orchestrator.state import get_conversation, Observation
        conv_ctx = get_conversation(request.conversation_id)
        if conv_ctx:
            # We add the diagram request as a user message
            conv_ctx.add_observation(Observation(source="user", type="message", content=f"Generate diagram: {request.topic}"))
            # Fetch last few messages for context
            for obs in conv_ctx.observations[-10:-1]:
                history_context += f"{obs.source}: {sanitize_text(obs.content)} | "
    
    safe_topic = sanitize_text(request.topic)
    safe_context = f"{sanitize_text(request.context)} Recent History: {history_context}".strip()
    
    payload = {
        "request_id": request.request_id or str(uuid.uuid4()),
        "topic": safe_topic,
        "context": safe_context,
        "output_format": "png"
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            res = await client.post(f"{settings.diagram_base_url.rstrip('/')}/v1/generate", json=payload)
            res.raise_for_status()
            
            # Record diagram generation in conversation context
            if conv_ctx:
                from backend.orchestrator.state import Observation
                conv_ctx.add_observation(Observation(source="mihil", type="diagram", content="[Diagram Generated]"))
                
            return Response(content=res.content, media_type="image/png")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Diagram service unreachable: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Diagram service returned error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal diagram error: {str(e)}")
