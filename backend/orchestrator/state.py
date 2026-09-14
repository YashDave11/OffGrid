from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict
import time

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

class Observation(BaseModel):
    source: str
    type: str
    content: str
    timestamp: float = 0.0

    def __init__(self, **data):
        super().__init__(**data)
        if not self.timestamp:
            self.timestamp = time.time()

class ConversationContext(BaseModel):
    conversation_id: str
    observations: List[Observation] = []
    
    def add_observation(self, obs: Observation):
        self.observations.append(obs)

_conversation_store: Dict[str, ConversationContext] = {}

def get_conversation(conv_id: str) -> ConversationContext:
    if conv_id not in _conversation_store:
        _conversation_store[conv_id] = ConversationContext(conversation_id=conv_id)
    return _conversation_store[conv_id]

