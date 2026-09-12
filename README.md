# MRPL Sovereign On-Premise Agentic AI Workbench

A sovereign, on-premise, agentic AI workbench for confidential industrial knowledge work.

## Setup Instructions (Phase 0)

1. **Environment Setup**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

2. **Configuration**:
   Copy `.env.example` to `.env` and adjust values if necessary.
   ```bash
   cp .env.example .env
   ```

3. **Run Application**:
   ```bash
   uvicorn backend.main:app --reload
   ```

4. **Verify**:
   Visit `http://localhost:8000/health` to confirm the API is running.

## Documentation
Please refer to the `docs/` directory for detailed information:
- `PROJECT.md`: Project purpose, vision, and scope.
- `ARCHITECTURE.md`: High-level architecture and design.
- `DECISIONS.md`: Locked architectural decisions.
- `API_CONTRACTS.md`: API interfaces.
- `CURRENT_STATE.md`: Real-time state of the project.
