from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging
from APP.services.kite_service import KiteService
from kiteconnect import KiteConnect
from kiteconnect.exceptions import TokenException

router = APIRouter()
logger = logging.getLogger(__name__)

class SetAccessTokenRequest(BaseModel):
    access_token: str

@router.get("/status")
async def get_broker_status() -> Dict[str, Any]:
    """Check Kite connection status"""
    try:
        kite_service = KiteService()
        try:
            profile = kite_service.get_profile(use_stored_token=True)
            return {
                "connected": True,
                "message": "Connected to Kite",
                "user_id": profile.get("user_id", "Unknown")
            }
        except Exception:
            return {
                "connected": False,
                "message": "Not connected. Please connect your Kite account."
            }
    except Exception as e:
        logger.error(f"Error checking status: {str(e)}")
        return {
            "connected": False,
            "message": f"Error: {str(e)}"
        }

@router.get("/kite-callback")
async def kite_callback(
    request_token: str = Query(..., description="Request token from Kite redirect"),
    status: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    type: Optional[str] = Query(None)
):
    """
    Handle Kite redirect - Extract request_token from URL, generate access_token, store it
    Returns HTML page that closes popup and notifies parent window
    """
    try:
        logger.info(f"Received Kite callback with request_token: {request_token[:10]}...")
        
        kite_service = KiteService()
        session_data = kite_service.generate_session_from_token(request_token)
        
        # Token is now stored automatically
        logger.info("Access token generated and stored successfully")
        
        # Return HTML that closes popup and sends message to parent
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Kite Login Success</title>
        </head>
        <body>
            <script>
                // Send message to parent window
                if (window.opener) {{
                    window.opener.postMessage({{ request_token: '{request_token}', success: true }}, '*');
                    setTimeout(() => {{
                        window.close();
                    }}, 500);
                }} else {{
                    // If no opener, redirect to frontend
                    window.location.href = 'http://localhost:3000/login?kite_success=true';
                }}
            </script>
            <div style="text-align: center; padding: 2rem; font-family: Arial;">
                <h2>Login Successful!</h2>
                <p>You can close this window.</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error processing Kite callback: {error_msg}")
        # Return error HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Kite Login Error</title>
        </head>
        <body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{ error: '{error_msg}', success: false }}, '*');
                    setTimeout(() => {{
                        window.close();
                    }}, 2000);
                }} else {{
                    window.location.href = 'http://localhost:3000/login?error={error_msg}';
                }}
            </script>
            <div style="text-align: center; padding: 2rem; font-family: Arial;">
                <h2 style="color: red;">Login Failed</h2>
                <p>{error_msg}</p>
                <p>This window will close automatically.</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

@router.get("/process-token")
async def process_token(
    request_token: str = Query(..., description="Request token from Kite"),
    redirect: Optional[str] = Query("http://localhost:3000/login", description="Redirect URL after processing")
) -> RedirectResponse:
    """
    SIMPLE: Extract request_token from URL, generate access_token, store it, redirect to profile
    Use this URL: http://localhost:8000/api/broker/process-token?request_token=YOUR_TOKEN
    """
    try:
        kite_service = KiteService()
        session_data = kite_service.generate_session_from_token(request_token)
        
        # Token is now stored automatically
        logger.info(f"Access token generated and stored. Redirecting to {redirect}")
        
        # Redirect to frontend profile page
        return RedirectResponse(url=redirect)
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error processing token: {error_msg}")
        # Redirect to error page or back to connect page
        error_url = f"http://localhost:3000/login?error={error_msg}"
        return RedirectResponse(url=error_url)

@router.post("/set-token")
async def set_access_token(request: SetAccessTokenRequest) -> Dict[str, Any]:
    """Manually set access token"""
    try:
        import json
        from datetime import datetime
        from pathlib import Path
        
        TOKEN_STORAGE_FILE = Path("kite_token.json")
        
        kite_service = KiteService()
        if not kite_service.api_key:
            raise ValueError("KITE_API_KEY not found")
        
        kite = KiteConnect(api_key=kite_service.api_key)
        kite.set_access_token(request.access_token)
        profile = kite.profile()
        
        token_data = {
            "access_token": request.access_token,
            "profile": profile,
            "stored_at": datetime.now().isoformat()
        }
        with open(TOKEN_STORAGE_FILE, 'w') as f:
            json.dump(token_data, f, indent=2)
        
        return {
            "success": True,
            "message": "Access token set successfully",
            "data": {"profile": profile}
        }
    except TokenException as e:
        raise HTTPException(status_code=400, detail=f"Invalid access token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")

@router.get("/login-url")
async def get_login_url() -> Dict[str, Any]:
    """Generate Kite Connect login URL"""
    try:
        kite_service = KiteService()
        login_url = kite_service.get_login_url()
        return {"success": True, "login_url": login_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callback")
async def handle_callback(
    request_token: str = Query(...),
    action: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Handle Kite callback - generate access_token from request_token"""
    try:
        kite_service = KiteService()
        session_data = kite_service.generate_session_from_token(request_token)
        
        return {
            "success": True,
            "message": "Successfully connected to Kite",
            "data": {
                "profile": session_data["profile"],
                "access_token": session_data["access_token"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile")
async def get_profile(request_token: Optional[str] = Query(None)) -> Dict[str, Any]:
    """Fetch user profile"""
    try:
        kite_service = KiteService()
        profile = kite_service.get_profile(request_token=request_token)
        return {"success": True, "data": profile}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
