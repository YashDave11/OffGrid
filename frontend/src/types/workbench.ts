export type TaskType = 'text' | 'image' | 'document';

export type ProviderStatus = 'ok' | 'offline' | 'unconfigured' | 'checking';

export interface SystemStatus {
  reasoning: ProviderStatus;
  vision: ProviderStatus;
  lastChecked: number | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedImage?: string; // base64 data URL
  attachedDocument?: { name: string; data: string }; // base64 document with name
  model?: string;
  taskType?: TaskType;
  steps?: string[];
  reasoning?: string; // parsed <think> block
  status?: 'sending' | 'completed' | 'error';
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface AnalyzeRequestPayload {
  task: string;
  input_type: TaskType;
  content: string;
  document_name?: string;
  document_id?: string;
}

export interface AnalyzeResponsePayload {
  request_id: string;
  status: string;
  task_type: string;
  model: string;
  result: string;
  steps: string[];
  ingestion_details?: any;
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Actions' | 'Navigation' | 'View' | 'System';
  shortcut?: string;
  iconName: string;
  action: () => void;
}
