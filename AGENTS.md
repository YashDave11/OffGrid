# Agent Instructions: MRPL Sovereign On-Premise Agentic AI Workbench

## What is this project?
This is a sovereign, on-premise, agentic AI workbench designed for confidential industrial knowledge work. The ultimate goal is to build a full AI system, but we are building it in phases.

## Current Phase: Phase 0
**The current phase is Phase 0.**
The goal of Phase 0 is strictly to create a clean, maintainable development foundation. 
**DO NOT** implement any AI features, model serving, vector databases, or complex logic yet.

## Source of Truth Documentation
- `docs/PROJECT.md`: Project purpose, vision, and scope.
- `docs/ARCHITECTURE.md`: High-level architecture and design.
- `docs/DECISIONS.md`: Locked architectural decisions.
- `docs/API_CONTRACTS.md`: API interfaces.
- `docs/CURRENT_STATE.md`: Real-time state of the project. Always read this first to understand what has been built.

## Architecture Principles
- **Hub-and-Spoke**: Central orchestration with modular model abstraction.
- **API-Based Boundaries**: Ready for future multi-machine deployment.
- **On-Premise Focus**: No external runtime AI APIs.

## Security Principles
- Do not log sensitive information or secrets.
- Configuration must use `.env` files (never commit `.env`).
- Keep the system contained and predictable.

## Coding Rules
- **Phase Boundaries**: Do not implement future phases prematurely.
- **Simplicity**: Prefer simple code, explicit configuration, and clear structure.
- **Type Hints**: Use Python type hints extensively.
- **Dependencies**: Keep the environment lightweight. Do not add unnecessary frameworks or AI SDKs until their specific phase.
- **No Redesigning**: Do not redesign locked architecture without explicit instruction.
