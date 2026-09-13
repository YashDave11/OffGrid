import os
import json
import faiss
import time
import numpy as np
from typing import List, Dict, Any
from backend.core.config import settings
from backend.documents.embedder import EmbeddingService

class KnowledgeBaseService:
    """
    Singleton service for managing the persistent global Knowledge Base.
    """
    _instance = None
    
    @classmethod
    def get_instance(cls) -> "KnowledgeBaseService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def __init__(self):
        self.kb_dir = "data/rag/knowledge_base"
        self.index_path = os.path.join(self.kb_dir, "index.faiss")
        self.meta_path = os.path.join(self.kb_dir, "metadata.json")
        self.embedder = EmbeddingService.get_instance()
        self.dimension = self.embedder.dimension
        
        os.makedirs(self.kb_dir, exist_ok=True)
        self._ensure_initialized()
        
    def _ensure_initialized(self):
        if not os.path.exists(self.index_path) or not os.path.exists(self.meta_path):
            index = faiss.IndexFlatIP(self.dimension)
            faiss.write_index(index, self.index_path)
            with open(self.meta_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
                
    def get_documents(self) -> List[Dict[str, Any]]:
        """Returns a list of uniquely indexed documents with page counts."""
        if not os.path.exists(self.meta_path):
            return []
            
        with open(self.meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        docs = {}
        for m in metadata:
            doc_name = m.get("document")
            if doc_name not in docs:
                docs[doc_name] = {
                    "document_name": doc_name,
                    "document_id": m.get("document_id", ""),
                    "status": "Indexed",
                    "chunks": 0
                }
            docs[doc_name]["chunks"] += 1
            
        return list(docs.values())
        
    def has_document(self, document_name: str) -> bool:
        """Checks if a document with the given name is already in the KB."""
        if not os.path.exists(self.meta_path):
            return False
            
        with open(self.meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        return any(m.get("document") == document_name for m in metadata)
        
    def add_document(self, document_id: str, document_name: str, chunks: List[Dict[str, Any]], embeddings: np.ndarray) -> bool:
        """
        Adds a document to the persistent Knowledge Base.
        Returns False if the document already exists.
        """
        if self.has_document(document_name):
            return False
            
        # 1. Update index
        index = faiss.read_index(self.index_path)
        index.add(embeddings)
        faiss.write_index(index, self.index_path)
        
        # 2. Update metadata
        with open(self.meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        for i, chunk in enumerate(chunks):
            metadata.append({
                "chunk_id": f"{document_id}_kb_c{i:04d}",
                "document_id": document_id,
                "document": document_name,
                "page": chunk.get("page", 1), # Could be improved if chunker preserves page
                "text": chunk["text"],
                "source_type": "pdf"
            })
            
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            
        return True
        
    def delete_document(self, document_id: str) -> bool:
        """
        Removes a document and all its chunks from the Knowledge Base and FAISS index.
        """
        if not os.path.exists(self.meta_path) or not os.path.exists(self.index_path):
            return False
            
        with open(self.meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        # Find all indices to remove
        indices_to_remove = [idx for idx, m in enumerate(metadata) if m.get("document_id") == document_id]
        
        if not indices_to_remove:
            return False
            
        # Remove from FAISS index
        index = faiss.read_index(self.index_path)
        sel = faiss.IDSelectorArray(indices_to_remove)
        index.remove_ids(sel)
        faiss.write_index(index, self.index_path)
        
        # Remove from metadata list (in reverse to avoid index shifting during deletion)
        for idx in sorted(indices_to_remove, reverse=True):
            del metadata[idx]
            
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            
        return True
        
    def search(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Searches the global knowledge base for the query.
        Returns Top-K relevant chunks above the similarity threshold.
        """
        if not os.path.exists(self.index_path) or not os.path.exists(self.meta_path):
            return {"results": []}
            
        t0 = time.time()
        
        # 1. Embed query
        query_vec = self.embedder.embed([query])
        t1 = time.time()
        
        # 2. Search index
        index = faiss.read_index(self.index_path)
        # Prevent searching for more elements than exist in the index
        if index.ntotal == 0:
             return {"results": []}
             
        k = min(top_k, index.ntotal)
        distances, indices = index.search(query_vec, k)
        t2 = time.time()
        
        # 3. Process results
        with open(self.meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx >= 0 and idx < len(metadata):
                meta = metadata[idx]
                results.append({
                    "document_id": meta.get("document_id"),
                    "document_name": meta.get("document"),
                    "page_number": meta.get("page"),
                    "chunk_id": meta.get("chunk_id"),
                    "text": meta.get("text"),
                    "similarity_score": float(dist),
                    "source_type": meta.get("source_type")
                })
                
        t3 = time.time()
        
        return {
            "results": results,
            "timing": {
                "embedding_ms": int((t1 - t0) * 1000),
                "search_ms": int((t2 - t1) * 1000),
                "processing_ms": int((t3 - t2) * 1000)
            }
        }
