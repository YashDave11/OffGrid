from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from backend.core.config import settings

class EmbeddingService:
    """
    Singleton service for generating vector embeddings locally.
    Uses sentence-transformers and defaults to CPU execution to avoid
    competing with the vision model on VRAM.
    """
    _instance = None
    
    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def __init__(self):
        self.model_name = settings.embedding_model
        self.device = settings.embedding_device
        # Load the model only once. It will be stored in SentenceTransformers default cache.
        self.model = SentenceTransformer(self.model_name, device=self.device)
        self.dimension = self.model.get_embedding_dimension()
        
    def embed(self, texts: List[str]) -> np.ndarray:
        """
        Embed a list of text chunks.
        Returns a normalized numpy array of vectors, suitable for FAISS inner product search.
        """
        if not texts:
            return np.array([])
            
        embeddings = self.model.encode(
            texts, 
            normalize_embeddings=True, 
            convert_to_numpy=True,
            show_progress_bar=False
        )
        return embeddings
