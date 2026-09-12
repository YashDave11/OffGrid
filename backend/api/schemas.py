from pydantic import BaseModel
from typing import List, Literal, Optional

class HealthResponse(BaseModel):
    status: str
    service: str

class AnalyzeRequest(BaseModel):
    task: str
    input_type: Literal["text", "image", "document"]
    content: str

class AnalyzeResponse(BaseModel):
    request_id: str
    status: str
    task_type: Optional[str]
    model: Optional[str]
    result: Optional[str]
    steps: List[str]
