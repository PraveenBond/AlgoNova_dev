from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse

from APP.services.fyers_service import FyersService


router = APIRouter()


@router.get("/login-url")
async def get_fyers_login_url() -> Dict[str, Any]:
    """Return the Fyers login URL for the frontend to redirect the user."""
    try:
        service = FyersService()
        login_url = service.get_login_url()
        return {"success": True, "login_url": login_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def fyers_callback(
    code: str = Query(..., description="Auth code returned by Fyers"),
    state: Optional[str] = Query(None),
) -> HTMLResponse:
    """Handle Fyers redirect.

    For now, we just acknowledge the auth code and redirect back to the frontend.
    You can later extend this to exchange the code for access token and store it.
    """
    # TODO: exchange `code` for access token if needed
    frontend_url = "http://localhost:3000/broker-connect?fyers_success=true"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fyers Login</title>
        <meta http-equiv="refresh" content="0; url={frontend_url}" />
    </head>
    <body>
        <p>Redirecting back to application...</p>
        <script>
            window.location.href = "{frontend_url}";
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
