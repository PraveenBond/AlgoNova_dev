import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from dotenv import load_dotenv
from fyers_apiv3.fyersModel import FyersModel, SessionModel

load_dotenv()


class FyersService:
    """Encapsulates Fyers auth-code flow helpers."""

    def __init__(
        self,
        session_factory: Optional[type] = None,
        fyers_factory: Optional[type] = None,
    ) -> None:
        self.session_factory = session_factory or SessionModel
        self.fyers_factory = fyers_factory or FyersModel

        self.app_id = self._first_env_value(
            [
                "FYERS_APP_ID",
                "FYERS_CLIENT_ID",
                "FYERS_CLINT_ID",
                "Client_Id",
            ]
        )
        self.secret_key = self._first_env_value(
            [
                "FYERS_SECRET_KEY",
                "FYERS_SECRET_ID",
                "Secret_Key",
            ]
        )
        self.redirect_uri = (
            os.getenv("FYERS_REDIRECT_URI")
            or os.getenv("FYERS_REDIRECT_URL")
            or "http://localhost:8000/api/fyers/callback"
        )
        self.scope = os.getenv("FYERS_SCOPE", "")
        self.state = os.getenv("FYERS_STATE") or "algonova-fyers"
        self.nonce = os.getenv("FYERS_NONCE", "")
        default_log_dir = os.getenv("FYERS_LOG_PATH", "./logs")
        os.makedirs(default_log_dir, exist_ok=True)
        self.log_path = default_log_dir
        token_path = os.getenv("FYERS_TOKEN_PATH", "fyers_token.json")
        self.token_file = Path(token_path)

        missing = []
        if not self.app_id:
            missing.append("FYERS_APP_ID/FYERS_CLIENT_ID/FYERS_CLINT_ID")
        if not self.secret_key:
            missing.append("FYERS_SECRET_KEY")
        if missing:
            raise ValueError(
                "Fyers credentials are not configured. Please set "
                + " and ".join(missing)
                + " in .env"
            )

    @staticmethod
    def _first_env_value(keys: Iterable[str]) -> Optional[str]:
        for key in keys:
            value = os.getenv(key)
            if value:
                return value
        return None

    def _create_session(self) -> SessionModel:
        """Create a Fyers SessionModel configured for auth-code flow."""
        session = self.session_factory(
            client_id=self.app_id,
            secret_key=self.secret_key,
            redirect_uri=self.redirect_uri,
            response_type="code",
            grant_type="authorization_code",
            state=self.state,
            scope=self.scope,
            nonce=self.nonce,
        )
        return session

    def get_login_url(self) -> str:
        """Generate the Fyers auth URL using SessionModel.generate_authcode()."""
        session = self._create_session()
        auth_url = session.generate_authcode()
        if isinstance(auth_url, dict):
            possible_url = auth_url.get("Url") or auth_url.get("url")
            if possible_url:
                return possible_url
        if isinstance(auth_url, str):
            return auth_url
        raise ValueError("Unexpected response from Fyers generate_authcode")

    def exchange_auth_code(self, auth_code: str) -> Dict[str, Any]:
        """Exchange auth_code for access_token and fetch basic profile."""
        session = self._create_session()
        session.set_token(auth_code)
        token_response = session.generate_token()

        access_token_value = token_response.get("access_token")
        if not access_token_value:
            raise ValueError(
                f"Failed to generate access token from auth_code: {token_response}"
            )

        fyers = self.fyers_factory(
            client_id=self.app_id,
            token=access_token_value,
            log_path=self.log_path,
        )

        profile = fyers.get_profile()
        self._store_session(access_token_value, profile)
        return {
            "access_token": access_token_value,
            "profile": profile,
        }

    def _store_session(self, access_token: str, profile: Dict[str, Any]) -> None:
        self.token_file.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "access_token": access_token,
            "profile": profile,
            "stored_at": datetime.now(UTC).isoformat(),
        }
        with self.token_file.open("w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2)

    def _load_session(self) -> Dict[str, Any]:
        if not self.token_file.exists():
            raise ValueError("No stored Fyers session found. Please login via Fyers first.")
        with self.token_file.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def get_cached_profile(self) -> Dict[str, Any]:
        return self._load_session()

    def refresh_profile(self) -> Dict[str, Any]:
        session = self._load_session()
        fyers = self.fyers_factory(
            client_id=self.app_id,
            token=session["access_token"],
            log_path=self.log_path,
        )
        profile = fyers.get_profile()
        self._store_session(session["access_token"], profile)
        return {"access_token": session["access_token"], "profile": profile}
