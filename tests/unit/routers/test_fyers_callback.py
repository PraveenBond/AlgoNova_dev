import pytest
import json
from pathlib import Path

from fastapi import FastAPI
from starlette.testclient import TestClient

from APP.routers import fyers as fyers_router


def test_callback_rejects_invalid_state(monkeypatch: pytest.MonkeyPatch):
    """Given mismatched state When callback invoked Then frontend error is sent."""
    app = FastAPI()
    app.include_router(fyers_router.router, prefix="/api/fyers")

    monkeypatch.setenv("FYERS_STATE", "algonova-fyers")

    client = TestClient(app)
    response = client.get("/api/fyers/callback", params={"auth_code": "abc", "state": "wrong"})

    assert response.status_code == 200
    assert "State validation failed" in response.text


def test_callback_success_posts_payload(monkeypatch: pytest.MonkeyPatch):
    """Given valid state When callback succeeds Then payload contains token."""
    app = FastAPI()
    app.include_router(fyers_router.router, prefix="/api/fyers")

    class DummyService:
        def exchange_auth_code(self, auth_code: str):
            return {
                "access_token": "token123",
                "profile": {"data": {"client_id": "FY123", "display_name": "Fyers User"}},
            }

    monkeypatch.setenv("FYERS_STATE", "algonova-fyers")
    monkeypatch.setattr(fyers_router, "FyersService", lambda: DummyService())

    client = TestClient(app)
    response = client.get("/api/fyers/callback", params={"auth_code": "abc", "state": "algonova-fyers"})

    assert response.status_code == 200
    assert "token123" in response.text


def test_get_profile_returns_cached_data(monkeypatch: pytest.MonkeyPatch, tmp_path):
    """Given stored fyers_token.json When /profile called Then cached data is returned."""
    token_path = tmp_path / "fyers_token.json"
    token_path.write_text(
        json.dumps(
            {
                "access_token": "token123",
                "profile": {"data": {"client_id": "FY123", "display_name": "Algo User"}},
            }
        )
    )

    monkeypatch.setenv("FYERS_TOKEN_PATH", str(token_path))
    app = FastAPI()
    app.include_router(fyers_router.router, prefix="/api/fyers")

    client = TestClient(app)
    response = client.get("/api/fyers/profile")

    assert response.status_code == 200
    assert response.json()["data"]["data"]["client_id"] == "FY123"


def test_option_chain_endpoint_returns_data(monkeypatch: pytest.MonkeyPatch):
    """Given valid params When /option-chain called Then service payload returned."""
    app = FastAPI()
    app.include_router(fyers_router.router, prefix="/api/fyers")

    captured = {}

    class DummyService:
        def fetch_option_chain(self, request):
            captured["request"] = request
            return {"chain": ["CALL", "PUT"], "symbol": request.symbol}

    monkeypatch.setattr(fyers_router, "FyersService", lambda: DummyService())

    client = TestClient(app)
    response = client.get(
        "/api/fyers/option-chain",
        params={"symbol": "NSE:TCS-EQ", "strikecount": 2},
    )

    assert response.status_code == 200
    assert response.json()["data"]["symbol"] == "NSE:TCS-EQ"
    assert captured["request"].strikecount == 2


def test_option_chain_endpoint_handles_validation_error(monkeypatch: pytest.MonkeyPatch):
    """Given invalid params When option-chain requested Then 400 is returned."""
    app = FastAPI()
    app.include_router(fyers_router.router, prefix="/api/fyers")

    class DummyService:
        def fetch_option_chain(self, request):
            raise ValueError("symbol is required for option chain request")

    monkeypatch.setattr(fyers_router, "FyersService", lambda: DummyService())

    client = TestClient(app)
    response = client.get("/api/fyers/option-chain", params={"symbol": "NSE:TCS-EQ"})

    assert response.status_code == 400
    assert "symbol is required" in response.json()["detail"]

