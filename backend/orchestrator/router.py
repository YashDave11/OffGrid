from backend.models.base import CAPABILITY_REASONING, CAPABILITY_VISION, CAPABILITY_DOCUMENT

class TaskRouter:
    @staticmethod
    def route(input_type: str) -> str:
        """Route the input type to the appropriate capability."""
        if input_type == "text":
            return CAPABILITY_REASONING
        elif input_type == "image":
            return CAPABILITY_VISION
        elif input_type == "document":
            return CAPABILITY_DOCUMENT
        else:
            raise ValueError(f"Unsupported input type: {input_type}")
