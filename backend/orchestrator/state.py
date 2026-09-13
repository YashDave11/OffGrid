from enum import Enum
from pydantic import BaseModel
from typing import List, Optional

class AgentState(str, Enum):
    RECEIVED = "received"
    CLASSIFIED = "classified"
    ROUTED = "routed"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskContext(BaseModel):
    request_id: str
    state: AgentState
    task_type: Optional[str] = None
    model_used: Optional[str] = None
    result: Optional[str] = None
    steps: List[str] = []
    ingestion_details: Optional[dict] = None
    
    def add_step(self, step: AgentState) -> None:
        self.state = step
        self.steps.append(step.value)
