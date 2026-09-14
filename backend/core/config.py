from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    environment: str = "development"
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000
    
    use_mock_providers: bool = False
    use_mock_reasoning: bool = False
    use_mock_vision: bool = False
    
    reasoning_base_url: str = "http://192.168.0.2:8080"
    reasoning_model_name: str = "Qwen3-4B-Thinking-2507"
    reasoning_max_tokens: int = 8192
    reasoning_budget: int = 2048
    
    vision_base_url: str = "http://127.0.0.1:8080"
    vision_model_name: str = "gemma-3-4b-it-Q4_K_M.gguf"
    
    model_connect_timeout: float = 2.0
    model_read_timeout: float = 120.0
    
    diagram_base_url: str = "http://192.168.0.3:8090"
    
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_device: str = "cpu"
    
    rag_top_k: int = 10
    rag_max_context_chars: int = 16000
    rag_similarity_threshold: float = 0.2

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
