from typing import Dict, Optional
from backend.models.base import ModelProvider

class ModelRegistry:
    def __init__(self):
        # Maps capability -> ModelProvider
        self._providers: Dict[str, ModelProvider] = {}
        
    def register(self, provider: ModelProvider) -> None:
        """Register a model provider for its capability."""
        self._providers[provider.capability] = provider
        
    def get_provider(self, capability: str) -> Optional[ModelProvider]:
        """Retrieve a provider for a specific capability."""
        return self._providers.get(capability)

# Singleton registry
registry = ModelRegistry()
