import httpx
from backend.models.base import ModelProvider, CAPABILITY_VISION
from backend.core.config import settings

class RemoteVisionModel(ModelProvider):
    @property
    def capability(self) -> str:
        return CAPABILITY_VISION
        
    @property
    def name(self) -> str:
        return settings.vision_model_name
        
    async def execute(self, task: str, content: str, **kwargs) -> str:
        endpoint = f"{settings.vision_base_url.rstrip('/')}/v1/chat/completions"
        
        payload = {
            "model": settings.vision_model_name,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": task},
                        {"type": "image_url", "image_url": {"url": content}}
                    ]
                }
            ],
            "max_tokens": 1024
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
                return data["choices"][0]["message"]["content"]
                
        except httpx.ConnectError as e:
            raise RuntimeError(f"Remote vision provider ({settings.vision_model_name}) unavailable: Connection failed.") from e
        except httpx.TimeoutException as e:
            raise RuntimeError(f"Remote vision provider ({settings.vision_model_name}) timed out.") from e
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"Remote vision provider ({settings.vision_model_name}) returned HTTP {e.response.status_code}.") from e
        except Exception as e:
            raise RuntimeError(f"Remote vision provider ({settings.vision_model_name}) error: {str(e)}") from e
