# Locked Decisions

These decisions are locked and should not be changed without explicit instruction.

1.  **Architecture**: Hub-and-spoke architecture with central orchestration.
2.  **Model Abstraction**: Modular model abstraction to allow swapping underlying models easily.
3.  **Service Boundaries**: API-based service boundaries to enable future multi-machine deployment.
4.  **Model Serving**: `llama.cpp` will be used as the future model-serving technology.
5.  **Model Selection**:
    - Reasoning: `Qwen3-4B-Thinking-2507` (source: https://huggingface.co/lmstudio-community/Qwen3-4B-Thinking-2507-GGUF)
    - Vision: `gemma-3-4b-it-Q4_K_M.gguf` (source: https://huggingface.co/ggml-org/gemma-3-4b-it-GGUF)
6.  **Data Privacy**: Strictly NO external runtime AI APIs. All processing must be local/on-premise.
7.  **RAG**: RAG is scheduled for a later phase. It is not part of the initial AI capability roll-out.
8.  **Graphify**: Graphify is used as development/code-context tooling, not for runtime RAG.
9.  **Development Process**: Implementation is strictly phase-gated. Future phases must not block current development, and agents must not implement future features prematurely.
