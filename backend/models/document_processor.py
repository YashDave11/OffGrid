import base64
import asyncio
import time
import os
import json
import uuid
import faiss
import pymupdf as fitz
from rapidocr_onnxruntime import RapidOCR
from backend.models.base import ModelProvider, CAPABILITY_DOCUMENT
from backend.documents.embedder import EmbeddingService
from backend.documents.knowledge_base import KnowledgeBaseService

class DocumentProcessorModel(ModelProvider):
    def __init__(self):
        super().__init__()
        # Initialize RapidOCR once for reuse
        self.ocr = RapidOCR()
        # Initialize the embedding service (lazy loads inside get_instance if needed)
        self.embedder = EmbeddingService.get_instance()
        
    @property
    def capability(self) -> str:
        return CAPABILITY_DOCUMENT
        
    @property
    def name(self) -> str:
        return "PyMuPDF Ingestion (Semantic + OCR + FAISS)"
        
    def _process_pdf_sync(self, b64_data: str, document_name: str, add_to_kb: bool = False) -> tuple[str, dict]:
        t0 = time.time()
        
        pdf_bytes = base64.b64decode(b64_data)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        extracted_chunks = []
        chunk_size = 1200
        chunk_overlap = 200
        
        total_text_extracted = 0
        pages_ocred = 0
        
        try:
            full_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                num_images = len(page.get_images(full=True))
                
                # Using sort=True extracts text in logical reading order
                page_text = page.get_text("text", sort=True)
                
                # OCR Fallback
                if len(page_text.strip()) < 50 and num_images > 0:
                    try:
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        res, _ = self.ocr(img_bytes)
                        if res:
                            page_text = "\n".join([r[1] for r in res])
                            pages_ocred += 1
                    except Exception as e:
                        print(f"OCR failed on page {page_num}: {e}")
                
                if page_text.strip():
                    full_text += f"\n\n--- PAGE {page_num + 1} ---\n\n" + page_text.strip()
            
            total_text_extracted = len(full_text.strip())
            
            if total_text_extracted == 0:
                return "**Extraction Failed**: The PDF contains no text and OCR could not detect any text.", {}
            
            t1 = time.time()
            extraction_ms = int((t1 - t0) * 1000)
            
            # Semantic chunking
            paragraphs = full_text.split("\n\n")
            current_chunk = ""
            
            for para in paragraphs:
                if not para.strip():
                    continue
                    
                if len(para) > chunk_size * 1.5:
                    lines = para.split("\n")
                    for line in lines:
                        if len(current_chunk) + len(line) > chunk_size and current_chunk:
                            extracted_chunks.append({"text": current_chunk.strip()})
                            current_chunk = current_chunk[-chunk_overlap:] + "\n" + line
                        else:
                            current_chunk += "\n" + line
                    continue

                if len(current_chunk) + len(para) > chunk_size and current_chunk:
                    extracted_chunks.append({"text": current_chunk.strip()})
                    current_chunk = current_chunk[-chunk_overlap:] + "\n\n" + para
                else:
                    current_chunk += "\n\n" + para
                    
            if current_chunk.strip():
                extracted_chunks.append({"text": current_chunk.strip()})
                
            t2 = time.time()
            chunking_ms = int((t2 - t1) * 1000)
            
            # Document ID Generation
            document_id = str(uuid.uuid4())
            safe_doc_name = document_name if document_name else "unnamed_document.pdf"
            
            # --- EMBEDDING ---
            t3 = time.time()
            texts = [c["text"] for c in extracted_chunks]
            embeddings = self.embedder.embed(texts)
            
            t4 = time.time()
            embedding_ms = int((t4 - t3) * 1000)
            
            # --- INDEXING ---
            # Create a simple flat inner-product index since embeddings are normalized
            dimension = self.embedder.dimension
            index = faiss.IndexFlatIP(dimension)
            index.add(embeddings)
            
            # Map vectors to chunks
            metadata = []
            for i, chunk in enumerate(extracted_chunks):
                # We do a rough estimate of page number based on where we are, 
                # but since we chunked by paragraph across the full text, we just map it generally here.
                # In a more advanced chunker, we'd preserve exactly which page each chunk came from.
                metadata.append({
                    "chunk_id": f"{document_id}_c{i:04d}",
                    "document": safe_doc_name,
                    "page": 1, # Placeholder unless we track page per chunk precisely
                    "text": chunk["text"],
                    "source_type": "pdf"
                })
                
            os.makedirs("data/rag/indexes", exist_ok=True)
            os.makedirs("data/rag/metadata", exist_ok=True)
            
            faiss.write_index(index, f"data/rag/indexes/{document_id}.faiss")
            with open(f"data/rag/metadata/{document_id}.json", "w") as f:
                json.dump(metadata, f, indent=2)
                
            t5 = time.time()
            indexing_ms = int((t5 - t4) * 1000)
            
            # --- KNOWLEDGE BASE ---
            kb_status = "skipped"
            if add_to_kb:
                kb_service = KnowledgeBaseService.get_instance()
                if kb_service.add_document(document_id, safe_doc_name, extracted_chunks, embeddings):
                    kb_status = "added"
                else:
                    kb_status = "duplicate"
            
            # Generate Ingestion Details Dictionary
            ingestion_details = {
                "document_id": document_id,
                "document": safe_doc_name,
                "page_count": len(doc),
                "chunk_count": len(extracted_chunks),
                "embedding": {
                    "model": self.embedder.model_name,
                    "dimension": dimension,
                    "device": self.embedder.device
                },
                "index": {
                    "type": "faiss",
                    "status": "created",
                    "location": f"data/rag/indexes/{document_id}.faiss"
                },
                "timing": {
                    "extraction_ms": extraction_ms,
                    "chunking_ms": chunking_ms,
                    "embedding_ms": embedding_ms,
                    "indexing_ms": indexing_ms,
                    "total_ms": int((t5 - t0) * 1000)
                },
                "knowledge_base": kb_status
            }
                
            # Create Markdown Result
            response = [
                f"✅ **Successfully ingested `{safe_doc_name}` into local vector store.**",
                f"- Extracted {len(extracted_chunks)} chunks from {len(doc)} pages.",
                f"- Embedded {len(extracted_chunks)} chunks using `{self.embedder.model_name}` on `{self.embedder.device}`.",
                f"- Indexed into FAISS FlatIP (ID: `{document_id}`)",
                f"*(Total extraction text: {total_text_extracted:,} chars)*",
            ]
            
            if pages_ocred > 0:
                response.append(f"*(Note: {pages_ocred} page(s) were scanned using the RapidOCR fallback engine)*")
                
            if kb_status == "added":
                response.append(f"- **Also added to Persistent Knowledge Base**")
            elif kb_status == "duplicate":
                response.append(f"- **Document already exists in Knowledge Base (Duplicate ignored)**")
                
            response.extend([
                "",
                "### Ingestion Details",
                "```json",
                json.dumps(ingestion_details, indent=2),
                "```",
                "",
                "### Extraction Preview",
                ""
            ])
            
            display_limit = min(5, len(extracted_chunks))
            if len(extracted_chunks) > display_limit:
                response.append(f"> Note: Displaying the first {display_limit} chunks below.")
                response.append("")
                
            for i in range(display_limit):
                chunk_text = extracted_chunks[i]["text"]
                response.append(f"**Chunk {i+1}**")
                response.append("```text")
                response.append(chunk_text[:500] + ("..." if len(chunk_text) > 500 else ""))
                response.append("```")
                response.append("")
                
            return "\n".join(response), ingestion_details
            
        finally:
            doc.close()

    async def execute(self, task: str, content: str, **kwargs) -> tuple[str, dict]:
        try:
            document_name = kwargs.get("document_name", "unknown_document.pdf")
            add_to_kb = kwargs.get("add_to_kb", False)
            if "," in content:
                _, b64_data = content.split(",", 1)
            else:
                b64_data = content
                
            return await asyncio.to_thread(self._process_pdf_sync, b64_data, document_name, add_to_kb)
        except Exception as e:
            return f"Failed to process document: {str(e)}", {}
