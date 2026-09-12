import uuid
import logging
from backend.models.registry import ModelRegistry
from backend.orchestrator.router import TaskRouter
from backend.orchestrator.state import TaskContext, AgentState

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self, registry: ModelRegistry, router: TaskRouter):
        self.registry = registry
        self.router = router
        
    async def analyze(self, task: str, input_type: str, content: str) -> TaskContext:
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
                
            context.model_used = provider.name
            
            # Execution
            context.add_step(AgentState.EXECUTING)
            result = await provider.execute(task, content)
            
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
