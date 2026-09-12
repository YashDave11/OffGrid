# API Contracts

## Implemented

### `GET /health`
Basic health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "mrpl-ai-workbench"
}
```

### `POST /v1/analyze`
Main endpoint for submitting tasks to the agentic workbench.

**Request:**
```json
{
  "task": "Summarize this inspection report",
  "input_type": "text",
  "content": "Inspection report content..."
}
```
*Note: `input_type` must be one of: "text", "image", "document".*

**Response (200 OK):**
```json
{
  "request_id": "uuid",
  "status": "completed",
  "task_type": "text",
  "model": "mock-reasoning",
  "result": "[MOCK REASONING OUTPUT] Processed task: 'Summarize this inspection report'...",
  "steps": [
    "received",
    "classified",
    "routed",
    "executing",
    "completed"
  ]
}
```

## Future (NOT IMPLEMENTED)
(Any future advanced APIs will be documented here)
