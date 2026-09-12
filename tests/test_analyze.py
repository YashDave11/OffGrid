from fastapi.testclient import TestClient
from backend.main import app
from backend.core.config import settings

# Force mock providers for unit tests
settings.use_mock_providers = True
from backend.models.registry import registry
from backend.models.mock_reasoning import MockReasoningModel
from backend.models.mock_vision import MockVisionModel

registry._providers.clear()
registry.register(MockReasoningModel())
registry.register(MockVisionModel())

client = TestClient(app)

def test_analyze_text():
    response = client.post(
        "/v1/analyze",
        json={"task": "Test reason", "input_type": "text", "content": "Text content"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["status"] == "completed"
    assert data["task_type"] == "text"
    assert data["model"] == "mock-reasoning"
    assert "MOCK REASONING OUTPUT" in data["result"]
    assert "received" in data["steps"]
    assert "completed" in data["steps"]

def test_analyze_image():
    response = client.post(
        "/v1/analyze",
        json={"task": "Test vision", "input_type": "image", "content": "Image content"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "mock-vision"
    assert "MOCK VISION OUTPUT" in data["result"]

def test_analyze_document():
    response = client.post(
        "/v1/analyze",
        json={"task": "Test doc", "input_type": "document", "content": "Document content"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "mock-vision"

def test_analyze_invalid_type():
    response = client.post(
        "/v1/analyze",
        json={"task": "Test", "input_type": "audio", "content": "audio content"}
    )
    assert response.status_code == 422 # Pydantic validation error

def test_analyze_missing_fields():
    response = client.post(
        "/v1/analyze",
        json={"task": "Test"}
    )
    assert response.status_code == 422
