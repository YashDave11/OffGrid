import pytest
from backend.orchestrator.router import TaskRouter
from backend.models.base import CAPABILITY_REASONING, CAPABILITY_VISION

def test_router_text():
    assert TaskRouter.route("text") == CAPABILITY_REASONING

def test_router_image():
    assert TaskRouter.route("image") == CAPABILITY_VISION
    
def test_router_document():
    assert TaskRouter.route("document") == CAPABILITY_VISION

def test_router_invalid():
    with pytest.raises(ValueError):
        TaskRouter.route("audio")
