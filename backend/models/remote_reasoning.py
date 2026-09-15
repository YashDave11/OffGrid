import logging
import httpx
from backend.models.base import ModelProvider, CAPABILITY_REASONING
from backend.core.config import settings

logger = logging.getLogger("mrpl.models.reasoning")

class RemoteReasoningModel(ModelProvider):
    @property
    def capability(self) -> str:
        return CAPABILITY_REASONING
        
    @property
    def name(self) -> str:
        return settings.primary_reasoning_model_name
        
    async def _invoke_model(self, base_url: str, model_name: str, user_msg: str):
        endpoint = f"{base_url.rstrip('/')}/v1/chat/completions"
        
        payload = {
            "model": model_name,
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
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()
            choice = data["choices"][0]
            message = choice.get("message", {})
            content_text = message.get("content") or ""
            reasoning_text = message.get("reasoning_content") or ""

            if reasoning_text and "<think>" not in content_text:
                result_text = f"<think>\n{reasoning_text}\n</think>\n\n{content_text}".strip()
            else:
                result_text = (content_text or reasoning_text).strip()
            
            metrics = {
                "usage": data.get("usage", {}),
                "timings": data.get("timings", {})
            }
            
            return result_text, metrics

    async def execute(self, task: str, content: str, **kwargs) -> str:
        user_msg = f"Task: {task}\nContent: {content}" if task and content and task.strip() != content.strip() else (task or content)

        # 1. Attempt Primary Reasoning Model (Qwen 2.5 1.5B)
        primary_err = None
        try:
            logger.info(f"Invoking primary reasoning model: {settings.primary_reasoning_model_name} at {settings.primary_reasoning_base_url}")
            result_text, metrics = await self._invoke_model(
                base_url=settings.primary_reasoning_base_url,
                model_name=settings.primary_reasoning_model_name,
                user_msg=user_msg
            )
            metrics["model_used"] = settings.primary_reasoning_model_name
            metrics["fallback_used"] = False
            return result_text, metrics
        except Exception as e:
            primary_err = e
            logger.warning(
                f"Primary reasoning model ({settings.primary_reasoning_model_name} at {settings.primary_reasoning_base_url}) "
                f"unavailable ({e}). Automatically falling back to current reasoning model ({settings.fallback_reasoning_model_name} at {settings.fallback_reasoning_base_url})."
            )

        # 2. Fallback to Current Reasoning Model (Qwen 3 4B Thinking)
        try:
            logger.info(f"Invoking fallback reasoning model: {settings.fallback_reasoning_model_name} at {settings.fallback_reasoning_base_url}")
            result_text, metrics = await self._invoke_model(
                base_url=settings.fallback_reasoning_base_url,
                model_name=settings.fallback_reasoning_model_name,
                user_msg=user_msg
            )
            metrics["model_used"] = f"{settings.fallback_reasoning_model_name} (Fallback)"
            metrics["fallback_used"] = True
            metrics["primary_model"] = settings.primary_reasoning_model_name
            metrics["active_model"] = settings.fallback_reasoning_model_name
            metrics["fallback_reason"] = str(primary_err)
            return result_text, metrics
        except Exception as fallback_err:
            logger.error(f"Fallback reasoning model also failed ({fallback_err}).")
            raise RuntimeError(
                f"Both reasoning providers failed. Primary ({settings.primary_reasoning_model_name} at {settings.primary_reasoning_base_url}) error: {primary_err}. "
                f"Fallback ({settings.fallback_reasoning_model_name} at {settings.fallback_reasoning_base_url}) error: {fallback_err}"
            ) from fallback_err
