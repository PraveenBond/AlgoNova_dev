from typing import Any, Dict

import json
from typing import Any, Dict

import pytest

from APP.services.fyers_service import FyersService


class _DummySession:
    """Simple stub emulating fyers_apiv3 SessionModel."""

    def __init__(self, **kwargs: Any) -> None:
        self.kwargs = kwargs
        self.token = None

    def generate_authcode(self) -> Dict[str, str]:
        return {"Url": "https://api-t1.fyers.in/api/v3/generate-authcode?dummy=true"}

    def set_token(self, token: str) -> None:
        self.token = token

    def generate_token(self) -> Dict[str, str]:
        return {"access_token": f"token-for-{self.token}"}


class _DummyFyers:
    """Stub for fyers_apiv3.fyersModel.FyersModel."""

    def __init__(self, client_id: str, token: str, log_path: str) -> None:
        self.client_id = client_id
        self.token = token
        self.log_path = log_path

    def get_profile(self) -> Dict[str, str]:
        return {"data": {"name": "AlgoNova Trader"}}


def _reset_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "FYERS_APP_ID",
        "FYERS_CLIENT_ID",
        "FYERS_CLINT_ID",
        "Client_Id",
        "FYERS_SECRET_KEY",
        "FYERS_SECRET_ID",
        "Secret_Key",
        "FYERS_LOG_PATH",
        "FYERS_TOKEN_PATH",
    ):
        monkeypatch.delenv(key, raising=False)


def _service(monkeypatch: pytest.MonkeyPatch, tmp_path) -> FyersService:
    monkeypatch.setenv("FYERS_APP_ID", "APP-5678")
    monkeypatch.setenv("FYERS_SECRET_KEY", "secret-xyz")
    monkeypatch.setenv("FYERS_LOG_PATH", str(tmp_path / "logs"))
    monkeypatch.setenv("FYERS_TOKEN_PATH", str(tmp_path / "fyers_token.json"))
    return FyersService(session_factory=_DummySession, fyers_factory=_DummyFyers)


def test_get_login_url(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    """Given valid env When get_login_url called Then v3 URL is returned."""
    _reset_env(monkeypatch)
    monkeypatch.setenv("FYERS_CLINT_ID", "APP-1234")
    monkeypatch.setenv("FYERS_SECRET_KEY", "secret-xyz")
    monkeypatch.setenv("FYERS_LOG_PATH", str(tmp_path / "logs"))
    monkeypatch.setenv("FYERS_TOKEN_PATH", str(tmp_path / "fyers_token.json"))

    service = FyersService(session_factory=_DummySession, fyers_factory=_DummyFyers)
    login_url = service.get_login_url()

    assert "api/v3/generate-authcode" in login_url


def test_exchange_auth_code_stores_session(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    """Given auth_code When exchange_auth_code called Then session is persisted."""
    _reset_env(monkeypatch)
    service = _service(monkeypatch, tmp_path)

    result = service.exchange_auth_code("abc123")

    assert result["access_token"] == "token-for-abc123"
    token_file = tmp_path / "fyers_token.json"
    assert token_file.exists()
    payload = json.loads(token_file.read_text())
    assert payload["access_token"] == "token-for-abc123"


def test_get_cached_profile(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    """Given stored session When get_cached_profile called Then data is returned."""
    _reset_env(monkeypatch)
    service = _service(monkeypatch, tmp_path)
    service.exchange_auth_code("abc123")

    cached = service.get_cached_profile()

    assert cached["access_token"] == "token-for-abc123"
    assert cached["profile"]["data"]["name"] == "AlgoNova Trader"


def test_missing_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    """Given no env When service initializes Then ValueError is raised."""
    _reset_env(monkeypatch)

    with pytest.raises(ValueError):
        FyersService(session_factory=_DummySession, fyers_factory=_DummyFyers)

