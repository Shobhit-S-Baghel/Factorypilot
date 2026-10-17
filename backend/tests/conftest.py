import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.chroma_service import chroma_service


@pytest.fixture(autouse=True)
def setup_test_services():
    # Ensure in-memory chroma is active for unit testing
    chroma_service.connect()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
