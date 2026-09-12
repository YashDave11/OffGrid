import logging
import sys
from backend.core.config import settings

def setup_logging() -> None:
    """Configure standard Python logging for the application."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    
    # Configure basic format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Reduce noise from external libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)
