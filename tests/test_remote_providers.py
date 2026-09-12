import pytest
import httpx
from unittest.mock import patch, AsyncMock, MagicMock
from backend.models.remote_reasoning import RemoteReasoningModel
from backend.models.remote_vision import RemoteVisionModel
from backend.core.config import settings

@pytest.fixture
def mock_reasoning():
    return RemoteReasoningModel()

@pytest.fixture
def mock_vision():
    return RemoteVisionModel()

@pytest.mark.anyio
async def test_remote_reasoning_success(mock_reasoning):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {"choices": [{"message": {"content": "Reasoning Success"}}]}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = await mock_reasoning.execute("Some Task", "Some content")
        
        assert result == "Reasoning Success"
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{settings.reasoning_base_url.rstrip('/')}/v1/chat/completions"
        assert kwargs["json"]["messages"][0]["content"] == "Task: Some Task\nContent: Some content"
        assert kwargs["json"]["model"] == settings.reasoning_model_name
        assert kwargs["json"]["max_tokens"] == 8192
        assert kwargs["json"]["reasoning_budget"] == 2048

@pytest.mark.anyio
async def test_remote_reasoning_with_reasoning_content(mock_reasoning):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "reasoning_content": "Thinking steps",
                    "content": "Final code"
                }
            }]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = await mock_reasoning.execute("Write code", "Write code")
        assert "<think>\nThinking steps\n</think>" in result
        assert "Final code" in result
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["messages"][0]["content"] == "Write code"

@pytest.mark.anyio
async def test_remote_vision_success(mock_vision):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {"choices": [{"message": {"content": "Vision Success"}}]}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = await mock_vision.execute("Identify", "base64image")
        
        assert result == "Vision Success"
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{settings.vision_base_url.rstrip('/')}/v1/chat/completions"
        assert kwargs["json"]["messages"][0]["content"][0]["text"] == "Identify"
        assert kwargs["json"]["messages"][0]["content"][1]["image_url"]["url"] == "base64image"

@pytest.mark.anyio
async def test_remote_reasoning_connection_error(mock_reasoning):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Connection refused")
        
        with pytest.raises(RuntimeError) as exc:
            await mock_reasoning.execute("Task", "Content")
            
        assert f"Remote reasoning provider ({settings.reasoning_model_name}) unavailable" in str(exc.value)

@pytest.mark.anyio
async def test_remote_vision_timeout_error(mock_vision):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Read timeout")
        
        with pytest.raises(RuntimeError) as exc:
            await mock_vision.execute("Task", "Content")
            
        assert f"Remote vision provider ({settings.vision_model_name}) timed out" in str(exc.value)

@pytest.mark.anyio
async def test_remote_reasoning_http_error(mock_reasoning):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        request = httpx.Request("POST", "http://example.com")
        response = httpx.Response(status_code=500, request=request)
        mock_post.side_effect = httpx.HTTPStatusError("500 Server Error", request=request, response=response)
        
        with pytest.raises(RuntimeError) as exc:
            await mock_reasoning.execute("Task", "Content")
            
        assert f"Remote reasoning provider ({settings.reasoning_model_name}) returned HTTP 500" in str(exc.value)

@pytest.mark.anyio
async def test_remote_vision_general_error(mock_vision):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = Exception("Unknown failure")
        
        with pytest.raises(RuntimeError) as exc:
            await mock_vision.execute("Task", "Content")
            
        assert f"Remote vision provider ({settings.vision_model_name}) error" in str(exc.value)
