from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from backend.core.config import settings
from backend.core.logging import setup_logging
from backend.api.routes import router

# Import and register models
from backend.models.registry import registry
from backend.models.mock_reasoning import MockReasoningModel
from backend.models.mock_vision import MockVisionModel
from backend.models.remote_reasoning import RemoteReasoningModel
from backend.models.remote_vision import RemoteVisionModel
from backend.models.document_processor import DocumentProcessorModel

# Setup logging
setup_logging()

# Register models based on configuration
if settings.use_mock_providers:
    registry.register(MockReasoningModel())
    registry.register(MockVisionModel())
    registry.register(DocumentProcessorModel())
else:
    if settings.use_mock_reasoning:
        registry.register(MockReasoningModel())
    else:
        registry.register(RemoteReasoningModel())

    if settings.use_mock_vision:
        registry.register(MockVisionModel())
    else:
        registry.register(RemoteVisionModel())
        
    registry.register(DocumentProcessorModel())

app = FastAPI(
    title="MRPL Sovereign On-Premise Agentic AI Workbench",
    description="Backend API for MRPL AI Workbench",
    version="0.1.0"
)

# Include routes
app.include_router(router)

# Mount frontend
app.mount("/", StaticFiles(directory="backend/static", html=True), name="static")
