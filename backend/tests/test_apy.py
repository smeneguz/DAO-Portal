import pytest
from httpx import AsyncClient
from sqlmodel import SQLModel

from app.main import app
from app.db.session import get_db
from app.db.models import DAO


# Test data
TEST_DAO = {
    "name": "TestDAO",
    "chain_id": "ethereum",
    "description": "A DAO for testing"
}


# Mock database dependency
async def override_get_db():
    # This would be replaced with a real test database in a real test suite
    yield None


app.dependency_overrides[get_db] = override_get_db


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test the root endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "environment" in data


@pytest.mark.asyncio
async def test_health_check():
    """Test the health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "environment" in data


# Note: For a complete test suite, we would use a test database
# and test all API endpoints including DAO and metrics operations