# MRPL Sovereign On-Premise Agentic AI Workbench - Current State

**Last Updated:** September 13, 2026  
**Document Purpose:** Comprehensive, production-grade technical specification and status report detailing everything implemented, component architecture, data layout, API contracts, model topologies, and file locations across the entire repository.

---

## 1. Executive Summary & Architecture Overview

The **MRPL Sovereign Agentic AI Workbench** is a fully air-gapped, on-premise AI platform engineered for industrial engineering and document analysis. It operates with **zero external telemetry and zero cloud dependencies**, adhering strictly to sovereign computational boundaries.

### Core Architectural Topology
```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             Frontend (React 19 + Vite)                          │
│     Chat Interface │ Document Explorer │ Knowledge Base Manager │ System Health  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ REST / JSON (Port 8000)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Gateway & Orchestration Core                       │
│ ┌──────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐ │
│ │   FastAPI Routes     │──▶│   Task Router Engine  │──▶│  Agentic Orchestrator │ │
│ └──────────────────────┘   └───────────────────────┘   └───────────┬───────────┘ │
└────────────────────────────────────────────────────────────────────┼─────────────┘
                                                                     │
          ┌──────────────────────────────────────────────────────────┴───────────────┐
          │                                                                          │
          ▼                                                                          ▼
┌─────────────────────────────────────┐                    ┌─────────────────────────────────────┐
│      Document & RAG Subsystem       │                    │          Model Providers            │
│ ┌─────────────────────────────────┐ │                    │ ┌─────────────────────────────────┐ │
│ │ PyMuPDF / RapidOCR Extraction   │ │                    │ │ Remote Reasoning (Qwen3-4B)     │ │
│ └────────────────┬────────────────┘ │                    │ │ • Local / Radmin llama.cpp      │ │
│                  ▼                  │                    │ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │                    │ ┌─────────────────────────────────┐ │
│ │ Recursive Semantic Chunking     │ │                    │ │ Remote Vision (Gemma-3-4B)      │ │
│ └────────────────┬────────────────┘ │                    │ │ • Local / Radmin llama.cpp      │ │
│                  ▼                  │                    │ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │                    │ ┌─────────────────────────────────┐ │
│ │ BAAI/bge-small-en-v1.5 Embedder │ │                    │ │ Standby / Mock Providers        │ │
│ └────────────────┬────────────────┘ │                    │ └─────────────────────────────────┘ │
│                  ▼                  │                    └─────────────────────────────────────┘
│ ┌─────────────────────────────────┐ │
│ │ FAISS Vector Store (FlatIP)     │ │
│ │ • Persistent KB (Global)        │ │
│ │ • Per-Document Indexing         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 2. Directory Structure & File Map

```text
mrpl-ai-workbench/
├── .env                              # Active environment configuration & model connection strings
├── .gitignore                        # Git exclusion rules (ignores data/, node_modules/, venv/)
├── CURRENT_STATE.md                  # (This document) Comprehensive project state & architecture
├── README.md                         # Repository documentation
├── requirements.txt                  # Python dependencies (FastAPI, PyMuPDF, FAISS, PyTorch, etc.)
│
├── backend/                          # FastAPI Application Backend
│   ├── main.py                       # FastAPI entrypoint, CORS, static SPA mounting, lifetime hooks
│   │
│   ├── api/                          # HTTP Transport Layer
│   │   ├── routes.py                 # REST endpoints (/v1/analyze, /v1/knowledge/*, /v1/status)
│   │   └── schemas.py                # Pydantic v2 Request/Response contracts and data models
│   │
│   ├── core/                         # Core Configurations
│   │   └── config.py                 # Pydantic BaseSettings (endpoints, timeouts, RAG hyperparameters)
│   │
│   ├── documents/                    # RAG Engine & Vector Subsystems
│   │   ├── embedder.py               # Singleton BAAI/bge-small-en-v1.5 sentence-transformers embedder
│   │   └── knowledge_base.py         # Persistent Knowledge Base service, FAISS index & metadata management
│   │
│   ├── models/                       # Model Provider Abstractions
│   │   ├── base.py                   # Abstract Base Class (ModelProvider) and ModelRegistry
│   │   ├── document_processor.py     # Document Ingestion, PDF parser, OCR fallback, Chunking, Indexing
│   │   ├── mock_reasoning.py         # Offline deterministic reasoning mock
│   │   ├── mock_vision.py            # Offline deterministic vision mock
│   │   ├── registry.py               # Instantiated global provider registry
│   │   ├── remote_reasoning.py       # OpenAI-compatible client for Qwen3-4B-Thinking via llama.cpp
│   │   └── remote_vision.py          # OpenAI-compatible client for Gemma-3-4B-it via llama.cpp
│   │
│   ├── orchestrator/                 # Agentic Execution Engine
│   │   ├── agent.py                  # Agent Orchestrator: intercepts queries, performs RAG, invokes LLMs
│   │   ├── router.py                 # Task router: routes tasks (text, image, document, structured)
│   │   └── state.py                  # State machine enums & AgentExecutionContext dataclass
│   │
│   └── static/                       # Compiled React production assets served directly by FastAPI
│       ├── index.html
│       └── assets/
│
├── data/                             # Local Data & Persistent Vector Storage (Excluded from Git)
│   └── rag/
│       ├── indexes/                  # Individual per-document FAISS indexes (<document_id>.faiss)
│       ├── knowledge_base/           # Global Persistent Knowledge Base
│       │   ├── index.faiss           # Global FAISS FlatIP index containing all ingested vectors
│       │   └── metadata.json         # Array of chunk texts, doc IDs, page numbers, and source types
│       └── metadata/                 # Individual per-document chunk metadata files (<document_id>.json)
│
├── docs/                             # Historical Documentation & Milestones
│   ├── CURRENT_STATE.md              # Historical milestone doc
│   └── TASK_2B_REPORT.md
│
└── frontend/                         # React 19 Frontend Application
    ├── package.json                  # Dependencies (Lucide icons, React, Vite, TypeScript)
    ├── vite.config.ts                # Vite config with backend proxy (/v1 -> http://127.0.0.1:8000)
    └── src/
        ├── App.tsx                   # Top-level application shell, navigation, state coordinator
        ├── main.tsx                  # React DOM entrypoint
        ├── components/
        │   ├── Composer.tsx          # Multi-modal input box (Text prompt, PDF attach, Image attach)
        │   ├── KnowledgeBase.tsx     # First-class Knowledge Base UI (upload, list, status, deletion)
        │   ├── MessageItem.tsx       # Message card with citations, reasoning logs, and metrics
        │   ├── MessageList.tsx       # Chat stream scroll container
        │   ├── MetricsBar.tsx        # System latency, chunking, and memory stats display
        │   └── Sidebar.tsx           # Navigation bar (Chat vs. Knowledge Base, server connectivity)
        ├── styles/
        │   └── globals.css           # Sovereign dark industrial theme (Variables, animations, fonts)
        └── types/
            └── workbench.ts          # TypeScript interfaces matching backend Pydantic schemas
```

---

## 3. Implemented Subsystems & Detailed Functionality

### 3.1. Local Document Processing & Ingestion (`backend/models/document_processor.py`)
- **Extraction Engine:**
  - Uses **PyMuPDF (`fitz`)** for native digital text extraction with page demarcations (`--- PAGE X ---`).
  - **RapidOCR Fallback:** Evaluates character count per page. If extracted text is `< 50` characters, the page is rendered into an in-memory high-DPI pixmap and scanned via `RapidOCR`.
- **Page-Aware Semantic Chunking:**
  - Normalizes text and splits on paragraph boundaries (`\n\n`).
  - Implements a chunk size target of **1,200 characters** with a **200-character sliding overlap window**.
  - Guarantees zero missed characters and preserves context over chunk boundaries.
- **Timing & Diagnostics:** Returns detailed sub-millisecond execution metrics:
  - `extraction_ms`: PDF parsing and OCR runtime.
  - `chunking_ms`: Paragraph slicing and chunk aggregation runtime.
  - `embedding_ms`: CPU tensor vectorization runtime.
  - `indexing_ms`: FAISS index addition runtime.

### 3.2. Local Vector Embedding Pipeline (`backend/documents/embedder.py`)
- **Model:** `BAAI/bge-small-en-v1.5` loaded locally via `sentence-transformers` / PyTorch.
- **Hardware Target:** Runs 100% locally on CPU (`device="cpu"`).
- **Properties:**
  - Vector Dimension: `384`.
  - Normalization: Vectors are automatically L2-normalized (`normalize_embeddings=True`), allowing cosine similarity to be evaluated via inner product.
  - Singleton lifecycle: Model weights are loaded once in memory and reused across all tasks.

### 3.3. Persistent Global Knowledge Base (`backend/documents/knowledge_base.py`)
- **Vector Storage:** Uses FAISS `IndexFlatIP` (Inner Product on normalized vectors).
- **Incremental Indexing:**
  - When a document is uploaded, only the new document's chunks are embedded.
  - Vectors are appended to `data/rag/knowledge_base/index.faiss` using `index.add(embeddings)`.
  - Chunk metadata is appended to `data/rag/knowledge_base/metadata.json`.
  - Existing index records are **never** unnecessarily regenerated or re-embedded.
- **Document Deletion Support:**
  - Endpoint: `DELETE /v1/knowledge/documents/{document_id}`.
  - Removes document chunks from `metadata.json`.
  - Uses `faiss.IDSelectorArray` on `index.remove_ids()` to permanently excise vectors from the binary index without corrupting subsequent indices.
- **Retrieval Engine:**
  - Queries are embedded on-the-fly via `bge-small-en-v1.5`.
  - FAISS conducts a Top-$K$ ($K=5$) nearest-neighbor search.
  - Chunks with similarity score $\ge 0.50$ (configured in `config.py`) are retrieved and ranked.

### 3.4. Agentic Orchestrator & Auto-RAG (`backend/orchestrator/agent.py`)
- **Transparent Context Augmentation:**
  - For every text query submitted in the chat interface, the Orchestrator automatically queries the global Knowledge Base.
  - If relevant chunks are found above the threshold, an augmented prompt is constructed:
    ```text
    Context information from internal knowledge base:
    ---------------------
    [1] (Doc: Operations_Safety.pdf, Page: 1)
    ...text...
    ---------------------
    Given the context above, answer the question: <user query>
    ```
  - If no chunks pass the similarity threshold, the query proceeds directly to the LLM without injecting noise or forcing false hallucinations.
- **Multi-Modal Dispatching:**
  - Routes image tasks to the Vision provider (`gemma-3-4b-it`).
  - Routes standalone document ingestion tasks to the `DocumentProcessorModel`.
  - Routes standard reasoning queries to the Reasoning provider (`Qwen3-4B-Thinking`).

### 3.5. Model Serving & Remote Providers
- **Reasoning Provider (`backend/models/remote_reasoning.py`):**
  - Connected to `llama.cpp` server hosting **`Qwen3-4B-Thinking-2507`**.
  - Default Endpoint: `http://26.75.95.122:8080` (or `http://127.0.0.1:8080` when hosted locally).
  - Protocol: OpenAI-compatible `/v1/chat/completions`.
  - Extracts and isolates deep `<think>` reasoning traces from the final answer and surfaces them in the UI.
- **Vision Provider (`backend/models/remote_vision.py`):**
  - Connected to `llama.cpp` server hosting **`gemma-3-4b-it-Q4_K_M.gguf`**.
  - Supports base64 image encoding and OpenAI multi-modal message formats.
- **Offline Standby Mocks:**
  - `MockReasoningModel` and `MockVisionModel` allow complete end-to-end testing with zero network connectivity or hardware model requirements.
  - Dynamic toggling supported via `POST /v1/providers/toggle`.

### 3.6. Frontend User Interface (`frontend/`)
- **Theme & Aesthetics:** Sovereign industrial design using dark slate backgrounds, high-contrast typography, emerald status indicators, and amber document highlights.
- **Multi-Modal Composer (`Composer.tsx`):** Allows typing prompts, dragging/attaching PDFs for direct analysis, or attaching images for vision inspection.
- **Persistent Knowledge Base Section (`KnowledgeBase.tsx`):**
  - Dedicated screen accessible from the Sidebar.
  - **Upload Area:** Single-click PDF file selection, instant client-side base64 reading, and real-time indexing status feedback.
  - **Document Catalog:** Lists all indexed PDFs, chunk counts, index status, and a **Delete** button with confirmation prompts.
- **Chat & Citations (`MessageItem.tsx`):**
  - Displays retrieved document badges with source file name and page numbers.
  - Expandable thinking drawer for Qwen reasoning steps.
  - Displays execution timing badges (latency, chunking, OCR status).

---

## 4. API Specification

| Method | Path | Description | Payload / Parameters |
|---|---|---|---|
| `GET` | `/health` | Application health probe | None |
| `GET` | `/v1/status` | Model connectivity and mode status | None |
| `POST` | `/v1/providers/toggle` | Switch between mock standby & live models | None |
| `POST` | `/v1/analyze` | Unified orchestrator analysis endpoint | `{ "task": str, "input_type": "text"\|"image"\|"document", "content": str, "document_name": Optional[str] }` |
| `GET` | `/v1/knowledge/documents` | List all indexed documents in the Knowledge Base | None |
| `POST` | `/v1/knowledge/upload` | Ingest, embed, and index a PDF into the KB | `{ "document_name": str, "content": "<base64_encoded_pdf>" }` |
| `POST` | `/v1/knowledge/search` | Direct similarity search over Knowledge Base | `{ "query": str, "top_k": int }` |
| `DELETE`| `/v1/knowledge/documents/{document_id}` | Permanently delete document & remove vectors | `document_id` path parameter |

---

## 5. Configuration Reference (`.env` / `backend/core/config.py`)

```ini
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# Provider Mode
USE_MOCK_PROVIDERS=false
USE_MOCK_REASONING=false
USE_MOCK_VISION=false

# Reasoning Service (Qwen3-4B-Thinking)
REASONING_BASE_URL=http://26.75.95.122:8080
REASONING_MODEL_NAME=Qwen3-4B-Thinking-2507
REASONING_MAX_TOKENS=8192
REASONING_BUDGET=2048

# Vision Service (Gemma-3-4B-it)
VISION_BASE_URL=http://127.0.0.1:8080
VISION_MODEL_NAME=gemma-3-4b-it-Q4_K_M.gguf

# Model Client Timeouts (Seconds)
MODEL_CONNECT_TIMEOUT=2.0
MODEL_READ_TIMEOUT=120.0

# Embedding & RAG Parameters
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
EMBEDDING_DEVICE=cpu
RAG_TOP_K=5
RAG_MAX_CONTEXT_CHARS=16000
RAG_SIMILARITY_THRESHOLD=0.5
```

---

## 6. How to Run & Verify

### 1. Start Local LLM Server (Optional / If running models locally)
```powershell
llama-server -m models/qwen3-4b-thinking.gguf --port 8080 --host 0.0.0.0
```

### 2. Start Backend API
```powershell
cd "c:\Users\yashd\Music\SIH 2026\mrpl-ai-workbench"
.\.venv\Scripts\activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start Frontend Development Server
```powershell
cd "c:\Users\yashd\Music\SIH 2026\mrpl-ai-workbench\frontend"
npm run dev
```

### 4. Build Production SPA Bundle
```powershell
npm run build
# Compiles directly into ../backend/static, allowing FastAPI to serve both frontend and backend on port 8000
```
