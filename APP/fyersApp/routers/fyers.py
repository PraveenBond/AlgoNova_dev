import json
import os
from typing import Any, Dict, Optional
from urllib.parse import quote_plus, urlparse

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse

from APP.fyersApp.models import OptionChainRequest
from APP.fyersApp.services import FyersService


router = APIRouter()


def _frontend_urls() -> Dict[str, str]:
    """Return base URLs/origins used for popup messaging + fallback redirects."""
    base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:9000")
    login_url = os.getenv("FRONTEND_LOGIN_URL", f"{base_url.rstrip('/')}/login")
    parsed = urlparse(base_url)
    origin = os.getenv("FRONTEND_ORIGIN") or f"{parsed.scheme}://{parsed.netloc}"
    return {
        "base": base_url.rstrip("/"),
        "login_url": login_url,
        "origin": origin,
    }


@router.get("/login-url")
async def get_fyers_login_url() -> Dict[str, Any]:
    """Return the Fyers login URL for the frontend popup to load."""
    try:
        service = FyersService()
        login_url = service.get_login_url()
        return {"success": True, "login_url": login_url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/callback")
async def fyers_callback(
    auth_code: str = Query(..., description="Auth code returned by Fyers"),
    state: Optional[str] = Query(None),
) -> HTMLResponse:
    """Handle Fyers redirect by exchanging auth_code and messaging the opener window."""
    urls = _frontend_urls()
    payload: Dict[str, Any] = {"provider": "fyers"}

    expected_state = os.getenv("FYERS_STATE") or "algonova-fyers"

    try:
        if state and state != expected_state:
            raise ValueError("State validation failed for Fyers callback")

        service = FyersService()
        result = service.exchange_auth_code(auth_code)
        payload.update({"success": True, "data": result})
        fallback_suffix = "fyers_success=true"
    except Exception as exc:
        error_msg = str(exc).replace("\n", " ")
        payload.update({"success": False, "error": error_msg})
        fallback_suffix = f"fyers_error={quote_plus(error_msg)}"

    payload_json = json.dumps(payload)
    target_origin = urls["origin"]
    fallback_url = urls["login_url"]
    separator = "&" if "?" in fallback_url else "?"
    redirect_with_status = f"{fallback_url}{separator}{fallback_suffix}"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Fyers Login</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
            }}
            .card {{
                background: #fff;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Processing Fyers login...</h2>
            <p>You can close this window.</p>
        </div>
        <script>
            (function() {{
                const payload = {payload_json};
                const targetOrigin = "{target_origin}";
                const fallbackUrl = "{redirect_with_status}";
                function notifyParent() {{
                    if (window.opener && !window.opener.closed) {{
                        window.opener.postMessage(payload, targetOrigin);
                        setTimeout(() => window.close(), 100);
                    }} else {{
                        window.location.href = fallbackUrl;
                    }}
                }}
                notifyParent();
            }})();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.get("/profile")
async def get_fyers_profile(
    refresh: bool = Query(False, description="If true, pull the latest profile from Fyers"),
) -> Dict[str, Any]:
    try:
        service = FyersService()
        if refresh:
            session = service.refresh_profile()
        else:
            session = service.get_cached_profile()
        return {"success": True, "data": session["profile"]}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/option-chain")
async def get_option_chain(
    symbol: str = Query(..., description="Underlying symbol e.g. NSE:TCS-EQ"),
    strikecount: int = Query(
        1, ge=1, le=50, description="Number of strikes to fetch on each side"
    ),
    timestamp: Optional[str] = Query(
        None, description="Optional UNIX timestamp for historical chain"
    ),
) -> Dict[str, Any]:
    """
    Fetch the option-chain snapshot from Fyers for the requested symbol.
    """
    try:
        request = OptionChainRequest(
            symbol=symbol,
            strikecount=strikecount,
            timestamp=timestamp or "",
        )
        service = FyersService()
        data = service.fetch_option_chain(request)
        return {"success": True, "data": data}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


