import os
from typing import Dict

from fyers_apiv3 import fyersModel


class FyersService:
    def __init__(self) -> None:
        self.client_id = os.getenv("FYERS_CLIENT_ID") or os.getenv("Client_Id")
        self.secret_key = os.getenv("FYERS_SECRET_KEY") or os.getenv("Secret_Key")
        self.redirect_uri = os.getenv("FYERS_REDIRECT_URI") or "https://trade.fyers.in/api-login/redirect-uri/index.html"
        self.response_type = "code"
        self.state = "sample_state"

        if not self.client_id or not self.secret_key:
            raise ValueError("Fyers credentials are not configured. Please set FYERS_CLIENT_ID / FYERS_SECRET_KEY (or Client_Id / Secret_Key) in .env")

    def get_login_url(self) -> str:
        """Generate the Fyers auth URL using SessionModel.generate_authcode()."""
        session = fyersModel.SessionModel(
            client_id=self.client_id,
            secret_key=self.secret_key,
            redirect_uri=self.redirect_uri,
            response_type=self.response_type,
            state=self.state,
        )

        # generate_authcode() returns the full URL according to Fyers docs
        auth_url = session.generate_authcode()
        if not isinstance(auth_url, str):
            # Some versions may return a dict; try to extract
            if isinstance(auth_url, dict) and "Url" in auth_url:
                return auth_url["Url"]
            raise ValueError("Unexpected response from Fyers generate_authcode")
        return auth_url
