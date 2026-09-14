# MRPL Sovereign Industrial AI Workbench — System Context & Brainstorming Dossier

**Target Initiative:** Smart India Hackathon (SIH 2026)  
**Client / Industrial Partner:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Project Classification:** Air-Gapped, Sovereign, On-Premise Multi-Modal Agentic AI Platform  
**Document Version:** 1.0 (Comprehensive Baseline for AI Model Ingestion & Brainstorming)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Industrial Challenge
In critical industrial sectors like petroleum refining and petrochemical processing, facilities operate complex machinery (catalytic crackers, distillation columns, hydrocrackers, boilers, and high-pressure steam networks). Engineers, technicians, and safety officers interact daily with vast volumes of proprietary data:
- Standard Operating Procedures (SOPs)
- Piping and Instrumentation Diagrams (P&IDs)
- Process Flow Diagrams (PFDs)
- Material Safety Data Sheets (MSDS)
- OEM equipment manuals, valve specifications, and maintenance logs
- Incident logs and shift handover reports

### 1.2 The Sovereignty & Compliance Mandate
Commercial cloud LLM APIs (OpenAI, Anthropic, Google Cloud Vertex) are **strictly prohibited** in this environment:
1. **Confidentiality & National Security:** Refinery layout, operational telemetry, and proprietary chemical processes are critical infrastructure assets. Zero data or telemetry may leave the physical plant premises.
2. **Connectivity:** Industrial facilities frequently operate in air-gapped or restricted intranet environments with intermittent or blocked public internet access.
3. **Deterministic Local Execution:** The system must run on available local computational hardware (on-premise workstations and consumer/workstation GPUs) without recurring token costs.

### 1.3 The Solution: MRPL Sovereign Agentic AI Workbench
A full-stack, air-gapped, sovereign AI workbench engineered to act as an intelligent co-pilot for refinery engineers. It combines local multi-modal reasoning models, a persistent vector knowledge base, semantic document parsing with OCR fallback, and an autonomous agent orchestrator into an industrial-grade interface.

---

## 2. Hardware Environment & Deployment Topology

The entire platform is currently deployed across a dual-node distributed local area network (over physical LAN and encrypted peer-to-peer Radmin VPN). All AI computation runs locally with zero external network calls.

### Node 1: Host Workstation (FastAPI Gateway, Vector RAG, Vision Model, Frontend)
- **Processor (CPU):** 12th Gen Intel(R) Core(TM) i5-12450H (8 Cores: 4 Performance Cores + 4 Efficient Cores, 12 Logical Threads, up to 4.40 GHz)
- **System Memory (RAM):** 16.0 GB DDR4/DDR5
- **Graphics Processing Units (GPU):**
  - NVIDIA GeForce RTX 3050 Laptop GPU (4 GB GDDR6 VRAM)
  - Intel(R) UHD Graphics (integrated)
- **Storage:** High-speed NVMe SSD (M.2 PCIe)
- **Operating System:** Microsoft Windows 11 Home / Pro (64-bit)
- **Services Hosted on Node 1:**
  - **FastAPI Core Gateway (`backend.main:app`):** Port `8000` (Python 3.11/3.12, Uvicorn asynchronous server)
  - **React 19 SPA Frontend:** Port `5173` (Vite dev server) + pre-built static assets served directly by FastAPI on port `8000`
  - **Local Vision Model Server (`llama-server`):** Port `8080` (`http://127.0.0.1:8080`)
    - Model: `gemma-3-4b-it-Q4_K_M.gguf` (Google Gemma 3 4B Multimodal Vision Instruct)
    - Quantization: 4-bit Medium Quantization (`Q4_K_M`) fitting cleanly within the 4GB RTX 3050 VRAM window
  - **Embedding Subsystem:** `BAAI/bge-small-en-v1.5` running on CPU via PyTorch / `sentence-transformers`
  - **Vector Database:** Local FAISS FlatIP index (`data/rag/knowledge_base/index.faiss`)
  - **OCR Engine:** `RapidOCR` ONNX Runtime (CPU inference for scanned documents)

### Node 2: Remote Reasoning Node (Distributed Peer via LAN / Radmin VPN)
- **Network Address:** `http://26.75.95.122:8080` (accessible over sovereign encrypted virtual LAN)
- **Service:** `llama-server` (llama.cpp)
- **Model:** `Qwen3-4B-Thinking-2507` (Alibaba Cloud / Qwen Deep Reasoning Model)
- **Context Window:** Up to 8,192 tokens with dedicated `<think>` reasoning trace budget (2,048 tokens)
- **Role:** High-order step-by-step logic, technical analysis, code synthesis, and grounded question answering over retrieved context

### Fallback / Offline Standby Mode
- **Zero-Hardware Testing:** Includes built-in deterministic Python mocks (`MockReasoningModel`, `MockVisionModel`) accessible via toggle (`POST /v1/providers/toggle`) so development and UI testing can proceed without starting any LLM servers.

---

## 3. End-to-End Architectural Flow

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               OPERATOR WORKSTATION UI                                   │
│                           React 19 + TypeScript + Vite                                  │
│   ┌──────────────────────────┐ ┌──────────────────────────┐ ┌─────────────────────────┐│
│   │ Multi-Modal Chat Console │ │  Knowledge Base Manager  │ │ System Diagnostics Modal││
│   │ • Text Prompts           │ │  • PDF & Image Upload    │ │ • Model Latency Metrics ││
│   │ • Inline File Attachment │ │  • Vector Status / Delete│ │ • Radmin / LAN Health   ││
│   │ • Lightbox Image Zoom    │ │  • Real-Time Progress    │ │ • Mock Provider Toggle  ││
│   └─────────────┬────────────┘ └────────────┬─────────────┘ └─────────────────────────┘│
└─────────────────┼───────────────────────────┼───────────────────────────────────────────┘
                  │ REST / JSON               │ Multipart / Base64 Payload
                  ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI APPLICATION BACKEND (Port 8000)                        │
│                                                                                         │
│  ┌───────────────────────┐       ┌───────────────────────┐      ┌────────────────────┐  │
│  │   /v1/analyze API     │       │ /v1/knowledge/* APIs  │      │   /v1/status API   │  │
│  └──────────┬────────────┘       └──────────┬────────────┘      └────────────────────┘  │
│             │                               │                                           │
│             ▼                               ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            AGENTIC ORCHESTRATOR CORE                             │   │
│  │  1. Intercepts incoming user request and analyzes input modality                 │   │
│  │  2. Automatically queries Persistent Knowledge Base (Auto-RAG)                   │   │
│  │  3. Filters context against similarity threshold (Score >= 0.50)                 │   │
│  │  4. Conditionally augments user prompt with grounded citations                   │   │
│  │  5. Dispatches request to designated model provider via OpenAI API standard      │   │
│  └───────────────────┬──────────────────────────────────────────────┬───────────────┘   │
└──────────────────────┼──────────────────────────────────────────────┼───────────────────┘
                       │                                              │
         ┌─────────────┴─────────────┐                  ┌─────────────┴─────────────┐
         ▼                           ▼                  ▼                           ▼
┌──────────────────┐       ┌──────────────────┐  ┌──────────────────┐     ┌──────────────────┐
│  REASONING NODE  │       │   VISION NODE    │  │  EMBEDDING CORE  │     │   VECTOR STORE   │
│ Qwen3-4B-Thinking│       │  Gemma-3-4B-it   │  │ bge-small-en-v1.5│     │   FAISS FlatIP   │
│ 26.75.95.122:8080│       │  127.0.0.1:8080  │  │ CPU Execution    │     │ data/rag/kb/     │
│ (Radmin LAN Node)│       │ (Local RTX 3050) │  │ 384-Dimensional  │     │ Persistent Index │
└──────────────────┘       └──────────────────┘  └──────────────────┘     └──────────────────┘
```

---

## 4. Subsystems & Technical Implementation

### 4.1 Document Ingestion & Chunking Pipeline (`backend/models/document_processor.py`)
- **PDF Extraction Engine:**
  - Extracts text natively via **PyMuPDF (`fitz`)**, preserving page markers (`--- PAGE X ---`).
  - **Dynamic RapidOCR Fallback:** Scans extracted character density per page. If a page yields fewer than 50 text characters while containing image objects, it automatically renders the page into a 150 DPI pixmap and runs `RapidOCR` (ONNX runtime on CPU) to extract text from scanned documents, stamps, or low-resolution tables.
- **Semantic Chunking:**
  - Uses paragraph-aware sliding window chunking with a target size of **1,200 characters** and a **200-character overlap window**.
  - Guarantees boundary continuity without truncating sentences or chemical formulas.
- **Detailed Subsystem Telemetry:** Measures and returns granular execution timing in milliseconds:
  - `extraction_ms`: PDF parsing and OCR duration
  - `chunking_ms`: Text segmentation duration
  - `embedding_ms`: CPU tensor vectorization duration
  - `indexing_ms`: FAISS index addition duration

### 4.2 Standalone Image Ingestion Pipeline (Gemma → BGE → FAISS)
- **Multi-Modal Vision Extraction:**
  - Accepts image formats: `.png`, `.jpg`, `.jpeg`, `.webp`.
  - Transmits base64 data URI to local Gemma 3 4B Vision (`gemma-3-4b-it-Q4_K_M.gguf`).
  - Prompt: *"Describe this image in extreme detail, extracting all text, structure, context, and visual information so it can be indexed in a text-based knowledge base. Be comprehensive."*
- **Deterministic Deduplication:**
  - Calculates a cryptographic **SHA-256 hash** of the raw image bytes.
  - Prevents duplicate indexing of identical plant diagrams or site photographs.
- **Vector Indexing:**
  - The extracted semantic text is embedded via `bge-small-en-v1.5` and committed to the global FAISS index with metadata (`source_type = "image"`, `page = null`).

### 4.3 Persistent Vector Storage & Deletion (`backend/documents/knowledge_base.py`)
- **Embedding Model:** `BAAI/bge-small-en-v1.5` (loaded locally via HuggingFace `sentence-transformers`).
- **Vector Dimension:** 384 dimensions, L2-normalized (`normalize_embeddings=True`).
- **Index Type:** FAISS `IndexFlatIP` (Exact Inner Product, identical to Cosine Similarity for normalized vectors).
- **Incremental Indexing:** Uploading a new PDF or image embeds **only** the new file's chunks and appends them to `data/rag/knowledge_base/index.faiss`. Existing document vectors are never re-calculated.
- **Surgical Vector Deletion:**
  - API: `DELETE /v1/knowledge/documents/{document_id}`
  - Identifies target vector indices in `metadata.json`.
  - Invokes `faiss.IDSelectorArray` on `index.remove_ids()` to excise vectors directly from the binary index without requiring full index reconstruction.

### 4.4 Agentic Orchestrator & Auto-RAG (`backend/orchestrator/agent.py`)
- **Transparent Query Augmentation:**
  - Every incoming user chat prompt is automatically vectorized and queried against the Knowledge Base.
  - Top-$K$ ($K=5$) nearest neighbors are retrieved.
  - **Threshold Filter:** Chunks with similarity score $< 0.50$ are discarded.
  - If relevant chunks exist, context is injected cleanly into the reasoning prompt:
    ```text
    Context information from internal knowledge base:
    ---------------------
    [1] (Doc: SOP-MRPL-CRU-04.pdf, Page: 12)
    Emergency shutdown procedure for Hydrocracker Unit...
    ---------------------
    Given the context above, answer the question: What are the emergency steps for HCU trip?
    ```
  - If no chunks pass the threshold, the query passes to Qwen untouched, completely avoiding hallucinated connections to irrelevant documents.

### 4.5 Frontend User Experience (`frontend/`)
- **Industrial Design Theme:** Sovereign dark slate palette (`#0a0d12`), neon emerald status indicators (`#10b981`), warm amber document highlights (`#f59e0b`), and clean monospace typography.
- **Multi-Modal Composer:** Single interface supporting text input, drag-and-drop PDF attachments, and visual image inspection attachments.
- **Full Image Lightbox:** Interactive modal popup to inspect complex refinery schematics with zoom support and `<kbd>Esc</kbd>` key dismiss.
- **Deep Reasoning Drawer:** Collapsible UI accordion displaying real-time `<think>` traces emitted by `Qwen3-4B-Thinking`.
- **Knowledge Base Hub:** Dedicated screen to upload files, view indexed documents, inspect chunk counts, and execute permanent deletions.

---

## 5. Software Stack & File Inventory

```text
mrpl-ai-workbench/
├── backend/
│   ├── main.py                       # FastAPI application entrypoint, CORS, static SPA mount
│   ├── api/
│   │   ├── routes.py                 # REST endpoints: /v1/analyze, /v1/knowledge/*, /v1/status
│   │   └── schemas.py                # Pydantic v2 data models & request/response contracts
│   ├── core/
│   │   └── config.py                 # Pydantic BaseSettings (.env loading, timeouts, thresholds)
│   ├── documents/
│   │   ├── embedder.py               # Singleton BAAI/bge-small-en-v1.5 sentence-transformers embedder
│   │   └── knowledge_base.py         # FAISS IndexFlatIP management, incremental write, deletion
│   ├── models/
│   │   ├── base.py                   # ModelProvider abstract interface & capability constants
│   │   ├── registry.py               # Singleton ModelRegistry
│   │   ├── document_processor.py     # PDF parsing, RapidOCR, Gemma image extraction, chunking
│   │   ├── remote_reasoning.py       # OpenAI-compatible client for Qwen3-4B-Thinking
│   │   ├── remote_vision.py          # OpenAI-compatible client for Gemma-3-4B-it
│   │   ├── mock_reasoning.py         # Offline deterministic reasoning mock
│   │   └── mock_vision.py            # Offline deterministic vision mock
│   ├── orchestrator/
│   │   ├── agent.py                  # Orchestrator core: Auto-RAG retrieval, prompt fusion, dispatch
│   │   ├── router.py                 # Multi-modal task router
│   │   └── state.py                  # AgentExecutionContext & lifecycle state machine
│   └── static/                       # Compiled React 19 production bundle (served at /)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Main layout coordinator (Sidebar, ChatArea, KnowledgeBase)
│   │   ├── components/
│   │   │   ├── Composer.tsx          # Multi-modal input box (PDF/Image file previews)
│   │   │   ├── KnowledgeBase.tsx     # Knowledge Base management interface (Upload, List, Delete)
│   │   │   ├── MessageItem.tsx       # Message cards with citations, reasoning logs, and lightbox
│   │   │   ├── ReasoningProcess.tsx  # Interactive collapsible reasoning trace viewer
│   │   │   └── Sidebar.tsx           # App navigation & live backend connectivity indicators
│   │   └── styles/
│   │       └── index.css             # Comprehensive CSS design system (Dark industrial theme)
│   └── package.json                  # React 19, Lucide icons, Vite 6, TypeScript
│
└── data/rag/
    ├── knowledge_base/
    │   ├── index.faiss               # Global persistent FAISS index binary
    │   └── metadata.json             # Chunks, doc mappings, page numbers, source types
    └── indexes/ & metadata/          # Per-document archival indices
```

---

## 6. Key Constraints & Operational Boundaries

When brainstorming improvements or new features, the following constraints **must be respected**:
1. **Zero External API Calls:** Do not propose OpenAI, Anthropic, Gemini, Pinecone, or AWS cloud integrations. All tools, models, and dependencies must run locally on Windows / Linux without an active internet connection.
2. **Hardware Budget:**
   - Total host RAM: 16 GB.
   - Host GPU VRAM: 4 GB (NVIDIA RTX 3050).
   - CPU: 8 Cores / 12 Threads (Intel i5-12450H).
   - Any secondary model running simultaneously on Node 1 must be quantized (`Q4_K_M`, `Q4_0`, or smaller) and consume $< 3.5\text{ GB}$ VRAM, or execute on CPU.
   - Heavy reasoning models (`Qwen3-4B-Thinking` or 7B/8B variants) are delegated to the distributed peer node over LAN (`26.75.95.122:8080`).
3. **No Breaking Changes to Existing RAG:**
   - The persistent FAISS `IndexFlatIP` + `BAAI/bge-small-en-v1.5` architecture is verified and stable. New capabilities should augment or wrap this system, not dismantle it.
4. **Standard Protocols:**
   - Model serving must adhere to the standard OpenAI-compatible API (`/v1/chat/completions`) supported by `llama.cpp` (`llama-server`) and `vLLM`.

---

## 7. Strategic Brainstorming Dimensions for AI Models

Feed this section directly to the AI models (Qwen, Gemma, Claude, etc.) to brainstorm advanced features across 7 high-impact industrial AI vectors:

### Vector 1: Industrial Agentic Tools & Function Calling
*Context: Currently, the agent performs single-turn Auto-RAG retrieval and question answering.*
- **Refinery Unit Converters:** Conversion between API gravity, specific gravity, Barrels Per Stream Day (BPSD), metric tons, psi/bar, and Celsius/Fahrenheit.
- **Thermodynamic & Steam Table Calculations:** Enthalpy/entropy lookups for superheated steam networks.
- **P&ID Tag Lookup & Instrument Cross-Referencing:** Extracting tag numbers (e.g., `FV-1021`, `PT-405`) and looking up their loop sheets or calibration records.
- **Chemical Compatibility Matrix Checker:** Instant cross-checking of chemical mixtures against safety tables to flag violent exothermic reactions or toxic gas generation.
- **HazOp (Hazard & Operability) Checklist Assistant:** Autonomous generation of HazOp guidewords (`MORE FLOW`, `NO FLOW`, `HIGH TEMP`, `REVERSE FLOW`) for process sections.

### Vector 2: Advanced Retrieval & Hybrid RAG Architectures
*Context: Currently using dense vector retrieval via BGE-small + FAISS FlatIP with cosine threshold 0.50.*
- **Hybrid Retrieval (Dense + Sparse BM25):** Combining keyword search (crucial for exact valve numbers, part codes, and chemical abbreviations like `MEK`, `H2S`, `FCCU`) with semantic FAISS retrieval using Reciprocal Rank Fusion (RRF).
- **Local Cross-Encoder Reranking:** Adding a lightweight CPU cross-encoder (e.g., `bge-reranker-small` or `ms-marco-MiniLM-L-6-v2`) to re-score top-15 retrieved chunks down to the top-3 most precise chunks.
- **Knowledge Graph RAG (Graphify / LightGraph):** Mapping refinery hierarchies (`Plant Area` $\rightarrow$ `Unit (e.g., Hydrocracker)` $\rightarrow$ `Equipment (e.g., Pump P-101A)` $\rightarrow$ `Sub-components / Instruments`) into a local graph database for structural graph-augmented queries.
- **Multi-Vector / ColBERT-style Late Interaction on CPU:** Exploring token-level retrieval for high-precision technical query matching.

### Vector 3: Industrial Computer Vision & Diagram Understanding
*Context: Gemma 3 4B Vision is currently used for semantic summarization of images into text.*
- **P&ID & Process Diagram Symbol Recognizer:** Fine-tuning or prompt-engineering vision models to detect standard ISA-5.1 instrumentation symbols (control valves, transmitters, orifice plates, bypass lines).
- **Analog Dial & Gauge Reader:** Reading needle positions on pressure gauges and temperature dials from maintenance inspection photos.
- **Equipment Surface Defect & Corrosion Classifier:** Analyzing pipe and tank wall photographs to grade surface rust (ASTM D610 standards) or pipe insulation damage.
- **Safety Equipment / PPE Compliance Detection:** Real-time checking of hard hats, safety glasses, and fire-retardant suits from CCTV snapshots.

### Vector 4: Operational Edge Optimization & Model Topology
*Context: Running Qwen 4B on LAN Node and Gemma 4B on local RTX 3050.*
- **KV Cache Quantization (`q8_0` or `q4_0`):** Reducing RAM and VRAM footprint in `llama-server` to enable 16k+ token context windows without OOM errors.
- **Speculative Decoding on CPU/GPU:** Pairing a tiny draft model (e.g., `Qwen-0.5B`) with `Qwen-4B` or `Gemma-4B` to achieve $2\times$ to $3\times$ faster token generation on local hardware.
- **Dynamic Context Pruning:** Automatically stripping filler words and boilerplate headers from retrieved SOPs before submitting them to the model context.
- **Multi-Model Orchestration:** Having `Qwen3-4B-Thinking` generate code/SQL queries, executing them locally in a secure sandbox, and returning verified outputs.

### Vector 5: Refinery Shift-Handover & Autonomous Incident Reporting
*Context: Refinery operators must synthesize shift logs across multiple units every 8 to 12 hours.*
- **Shift Handover Synthesis:** Automatically ingesting operator notes from morning, evening, and night shifts to highlight unresolved alarms, isolated equipment, and ongoing permit-to-work jobs.
- **Root Cause Analysis (RCA) Tree Builder:** Guiding engineers through the "5 Whys" and Ishikawa (Fishbone) diagrams based on recorded historical incident reports.
- **Management of Change (MOC) Risk Assessment:** Automatically evaluating proposed piping or setpoint changes against safety guidelines and flagging required HazOp reviews.

### Vector 6: Enterprise Security, Sovereign Governance & Auditability
*Context: The platform runs in a strictly regulated national energy infrastructure environment.*
- **Document-Level Access Control (RBAC):** Restricting retrieval of sensitive documents (e.g., executive audits, financial cost sheets) based on the active operator profile.
- **Cryptographic Audit Trail:** Storing every user query, retrieved chunk hash, and model response in a local append-only SQLite/JSONL ledger for regulatory compliance.
- **Hallucination & Grounding Verifier:** A secondary fast check that compares every factual claim in the model's answer against the verbatim text of retrieved chunks, highlighting ungrounded statements in red.
- **Air-Gapped Data Sync:** Secure batch synchronization mechanism (via encrypted USB / approved physical media) to update model weights and knowledge bases across physical air-gaps.

### Vector 7: High-Stress Operational Ergonomics & UI/UX
*Context: React 19 frontend with responsive dark industrial aesthetic.*
- **Emergency / Blackout Mode:** High-contrast, red-alert emergency dashboard view designed for high-stress refinery trips or plant evacuations.
- **Offline Voice-to-Text Interface (Whisper Local):** Enabling hands-free voice queries for field engineers wearing protective gloves using local CPU-based `whisper.cpp`.
- **Interactive P&ID Viewer:** Zoomable SVG/Canvas viewer allowing operators to click on an equipment tag in the chat and have it highlighted directly on the engineering schematic.
- **Citation Side-by-Side Diffing:** Clicking a citation opens a split-screen view showing the exact highlighted paragraph in the original PDF document.

---

## 8. Summary of Active Ports & Environment Variables

| Variable | Current Default | Purpose |
|---|---|---|
| `PORT` | `8000` | FastAPI HTTP Gateway & Static SPA server |
| `VITE_PORT` | `5173` | Vite development server (proxies `/v1` to `8000`) |
| `REASONING_BASE_URL` | `http://26.75.95.122:8080` | `llama-server` hosting `Qwen3-4B-Thinking-2507` |
| `VISION_BASE_URL` | `http://127.0.0.1:8080` | `llama-server` hosting `gemma-3-4b-it-Q4_K_M.gguf` |
| `EMBEDDING_MODEL` | `BAAI/bge-small-en-v1.5` | Sentence-transformers 384-dimensional embedding model |
| `EMBEDDING_DEVICE` | `cpu` | Device allocation for embedding inference |
| `RAG_TOP_K` | `5` | Maximum retrieved context chunks per query |
| `RAG_SIMILARITY_THRESHOLD` | `0.5` | Minimum inner-product cosine score to accept context |
| `RAG_MAX_CONTEXT_CHARS` | `16000` | Maximum character budget for injected RAG context |
| `USE_MOCK_PROVIDERS` | `false` | When `true`, routes to instant offline Python mocks |

---

*This document is formatted for direct ingestion into AI context windows (Qwen, Gemma, Claude, GPT) to serve as full ground-truth context for system expansion, architectural review, and feature ideation.*
