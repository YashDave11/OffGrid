# Project Purpose

The MRPL Sovereign On-Premise Agentic AI Workbench addresses the critical need for advanced AI capabilities within highly confidential industrial environments where data cannot leave the premises. 

## Problem Being Addressed

Industrial knowledge work requires analyzing sensitive documents, proprietary specifications, and internal communications. Using cloud-based LLM APIs poses unacceptable security and compliance risks. Existing on-premise solutions often lack the agentic orchestration and multi-modal reasoning required for complex, multi-step tasks.

## Product Vision

To provide a fully sovereign, multi-modal AI workbench that empowers engineers and analysts with agentic capabilities (RAG, code analysis, document processing) running entirely on internal, air-gapped or restricted networks.

## Current Scope (Phase 0)

The current scope is strictly the **development foundation**:
- Repository setup
- API scaffolding
- Configuration management
- Logging foundation
- CI/CD & testing basics

## Future Direction (High Level)

Subsequent phases will introduce:
- **Phase 1**: Agent orchestration logic and mock model integration.
- **Phase 2**: Actual on-premise model serving (via llama.cpp/vLLM).
- **Phase 3**: RAG and vector database integration.
- **Phase X**: Distributed multi-machine deployment and UI implementation.

## Implemented vs Future Functionality

**Implemented:**
- Repository structure
- FastAPI application scaffolding
- Basic health endpoint
- Environment and configuration management
- Testing foundation

**Future (NOT IMPLEMENTED):**
- RAG, FAISS, embeddings
- OCR and vision parsing
- Qwen3-4B-Thinking-2507, gemma-3-4b-it-Q4_K_M.gguf or any real model serving
- Tool execution and agent reasoning
- Graphify runtime integration
- Final UI/UX frontend
