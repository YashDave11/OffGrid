from pydantic import BaseModel
from typing import List, Literal, Optional

class HealthResponse(BaseModel):
    status: str
    service: str

class AnalyzeRequest(BaseModel):
    task: str
    input_type: Literal["text", "image", "document"]
    content: str
    document_name: Optional[str] = None
    document_id: Optional[str] = None
    conversation_id: Optional[str] = None

class DiagramRequest(BaseModel):
    request_id: Optional[str] = None
    topic: str
    context: Optional[str] = ""
    conversation_id: Optional[str] = None

class AnalyzeResponse(BaseModel):
    request_id: str
    status: str
    task_type: Optional[str]
    model: Optional[str]
    result: Optional[str]
    steps: List[str]
    ingestion_details: Optional[dict] = None

class KBSearchRequest(BaseModel):
    query: str
    top_k: int = 5

class KBUploadRequest(BaseModel):
    document_name: str
    content: str  # Base64 encoded string
