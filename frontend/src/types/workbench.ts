export type TaskType = 'text' | 'image' | 'document';

export type ProviderStatus = 'ok' | 'offline' | 'unconfigured' | 'checking' | 'standby';

export interface ModelDetail {
  name: string;
  url: string;
  status: ProviderStatus;
}

export interface SystemStatus {
  reasoning: ProviderStatus;
  vision: ProviderStatus;
  lastChecked: number | null;
  mode?: 'mock' | 'remote';
  primary_reasoning?: ProviderStatus;
  fallback_reasoning?: ProviderStatus;
  active_reasoning_model?: string;
  reasoning_fallback_active?: boolean;
  details?: {
    primary_reasoning?: ModelDetail;
    fallback_reasoning?: ModelDetail;
    vision?: ModelDetail;
  };
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
  metrics?: {
    totalTokens: number;
    tokensPerSecond: number;
  };
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
  conversation_id?: string;
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
