from abc import ABC, abstractmethod

CAPABILITY_REASONING = "reasoning"
CAPABILITY_VISION = "vision"

class ModelProvider(ABC):
    @property
    @abstractmethod
    def capability(self) -> str:
        """Return the capability this model provides."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the unique name of this provider."""
        pass
        
    @abstractmethod
    async def execute(self, task: str, content: str) -> str:
        """Execute the model with the given task and content."""
        pass
