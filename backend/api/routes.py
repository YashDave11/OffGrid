from fastapi import APIRouter, HTTPException, Depends
from backend.api.schemas import HealthResponse, AnalyzeRequest, AnalyzeResponse, KBSearchRequest, KBUploadRequest
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
            
    reasoning_res = "standby" if (settings.use_mock_providers or settings.use_mock_reasoning) else await check_provider(settings.reasoning_base_url)
    vision_res = "standby" if (settings.use_mock_providers or settings.use_mock_vision) else await check_provider(settings.vision_base_url)
            
    return {
        "reasoning": reasoning_res,
        "vision": vision_res,
        "mode": "mock" if settings.use_mock_providers else "remote"
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
        document_name=request.document_name
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
