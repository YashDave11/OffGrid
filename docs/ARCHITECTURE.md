# Architecture

## Current Foundation (Phase 1)
The architecture follows a hub-and-spoke model. The backend is built using FastAPI.

### Core Components
- **Orchestrator**: Central logic for managing agent state (`RECEIVED`, `CLASSIFIED`, `ROUTED`, `EXECUTING`, `COMPLETED`, `FAILED`) and routing tasks.
- **Task Router**: Routes requests based on input type. Currently:
  - `text` -> `reasoning` capability
  - `image` / `document` -> `vision` capability
- **Model Registry**: A central registry holding available model providers.
- **Model Abstraction**: A `ModelProvider` base class ensuring we can swap mock models with real ones (e.g., Llama.cpp) later. Currently only `MockReasoningModel` and `MockVisionModel` are implemented.

## Planned Architecture (Future)

```text
USER
 ↓
WEB WORKBENCH  (Future)
 ↓
ORCHESTRATOR (Current)
 ↓
RAG / TOOLS / MODEL ROUTER (Future Expansions)
 ↓
REASONING / VISION SERVICES (Future Real Models)
```
