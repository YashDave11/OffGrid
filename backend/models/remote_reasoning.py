import httpx
from backend.models.base import ModelProvider, CAPABILITY_REASONING
from backend.core.config import settings

class RemoteReasoningModel(ModelProvider):
    @property
    def capability(self) -> str:
        return CAPABILITY_REASONING
        
    @property
    def name(self) -> str:
        return settings.reasoning_model_name
        
    async def execute(self, task: str, content: str, **kwargs) -> str:
        endpoint = f"{settings.reasoning_base_url.rstrip('/')}/v1/chat/completions"
        
        user_msg = f"Task: {task}\nContent: {content}" if task and content and task.strip() != content.strip() else (task or content)
        
        payload = {
            "model": settings.reasoning_model_name,
            "messages": [
                {
                    "role": "user",
                    "content": user_msg
                }
            ],
            "max_tokens": settings.reasoning_max_tokens,
            "reasoning_budget": settings.reasoning_budget
        }
        
        timeout = httpx.Timeout(
            connect=settings.model_connect_timeout,
            read=settings.model_read_timeout,
            write=5.0,
            pool=5.0
        )
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(endpoint, json=payload)
                response.raise_for_status()
                data = response.json()
                choice = data["choices"][0]
                message = choice.get("message", {})
                content_text = message.get("content") or ""
                reasoning_text = message.get("reasoning_content") or ""

                if reasoning_text and "<think>" not in content_text:
                    return f"<think>\n{reasoning_text}\n</think>\n\n{content_text}".strip()
                return (content_text or reasoning_text).strip()
                
        except httpx.ConnectError as e:
            raise RuntimeError(f"Remote reasoning provider ({settings.reasoning_model_name}) unavailable: Connection failed.") from e
        except httpx.TimeoutException as e:
            raise RuntimeError(f"Remote reasoning provider ({settings.reasoning_model_name}) timed out.") from e
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"Remote reasoning provider ({settings.reasoning_model_name}) returned HTTP {e.response.status_code}.") from e
        except Exception as e:
            raise RuntimeError(f"Remote reasoning provider ({settings.reasoning_model_name}) error: {str(e)}") from e
