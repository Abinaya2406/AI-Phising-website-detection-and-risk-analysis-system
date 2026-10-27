"""Pytest Configuration and Fixtures for PhishGuard AI."""
import pytest
import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.database import db_manager


@pytest.fixture
def app():
    """Create testing application instance."""
    app_instance = create_app("testing")
    yield app_instance
    db_manager.close()


@pytest.fixture
def client(app):
    """Test HTTP client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Test CLI runner."""
    return app.test_cli_runner()

