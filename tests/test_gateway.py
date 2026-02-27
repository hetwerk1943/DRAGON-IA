"""Tests for the API Gateway layer."""

import pytest
from fastapi.testclient import TestClient

from dragon_ia.main import create_app


@pytest.fixture()
def client() -> TestClient:
    app = create_app()
    return TestClient(app)


class TestGateway:
    def test_health(self, client: TestClient):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_chat_success(self, client: TestClient):
        resp = client.post(
            "/api/v1/chat",
            json={"session_id": "s1", "prompt": "hello"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "model" in body["data"]

    def test_chat_missing_prompt(self, client: TestClient):
        resp = client.post("/api/v1/chat", json={"session_id": "s1"})
        assert resp.status_code == 422

    def test_tool_endpoint(self, client: TestClient):
        resp = client.post(
            "/api/v1/tool",
            json={"session_id": "s1", "tool_name": "nonexistent"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is False
