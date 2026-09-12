from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    environment: str = "development"
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000
    
    use_mock_providers: bool = False
    use_mock_reasoning: bool = False
    use_mock_vision: bool = False
    
    reasoning_base_url: str = "http://26.75.95.122:8080"
    reasoning_model_name: str = "Qwen3-4B-Thinking-2507"
    reasoning_max_tokens: int = 8192
    reasoning_budget: int = 2048
    
    vision_base_url: str = "http://127.0.0.1:8080"
    vision_model_name: str = "gemma-3-4b-it-Q4_K_M.gguf"
    
    model_connect_timeout: float = 2.0
    model_read_timeout: float = 120.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
