from backend.models.base import CAPABILITY_REASONING, CAPABILITY_VISION

class TaskRouter:
    @staticmethod
    def route(input_type: str) -> str:
        """Route the input type to the appropriate capability."""
        if input_type == "text":
            return CAPABILITY_REASONING
        elif input_type in ("image", "document"):
            return CAPABILITY_VISION
        else:
            raise ValueError(f"Unsupported input type: {input_type}")
