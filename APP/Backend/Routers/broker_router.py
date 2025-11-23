"""
Broker (Kite Connect) Router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import secrets
from DB.database import get_db
from Models.user_api_key import UserApiKey
from Routers.auth_router import get_current_user
from Models.user import User
from Services.encryption_service import encryption_service
from Services.kite_service import kite_service
from Services.auth_service import auth_service
from config import settings
from kiteconnect import KiteConnect

router = APIRouter()

# In-memory session store for OAuth flow (user_id -> session_token)
# In production, use Redis or database for this
oauth_sessions: Dict[str, int] = {}  # session_token -> user_id


# Pydantic models
class BrokerConnect(BaseModel):
    api_key: str
    access_token: str
    refresh_token: Optional[str] = None


class BrokerStatusResponse(BaseModel):
    connected: bool
    message: str


class LoginUrlResponse(BaseModel):
    login_url: str


@router.get("/login-url", response_model=LoginUrlResponse)
async def get_kite_login_url(
    current_user: User = Depends(get_current_user)
):
    """Get Kite Connect login URL using API key from .env"""
    if not settings.KITE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="KITE_API_KEY not configured in environment variables"
        )
    
    if not settings.KITE_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="KITE_API_SECRET not configured in environment variables"
        )
    
    try:
        kite = KiteConnect(api_key=settings.KITE_API_KEY)
        login_url = kite.login_url()
        
        # Generate a unique session token and store user_id
        session_token = secrets.token_urlsafe(32)
        oauth_sessions[session_token] = current_user.id
        
        # Append session token to login URL so we can identify the user in callback
        # Note: Kite Connect may not preserve all query parameters, so we'll also try to use it in callback
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        parsed_url = urlparse(login_url)
        query_params = parse_qs(parsed_url.query)
        query_params['state'] = [session_token]  # Use state parameter if Kite supports it
        new_query = urlencode(query_params, doseq=True)
        login_url_with_state = urlunparse(parsed_url._replace(query=new_query))
        
        return LoginUrlResponse(login_url=login_url_with_state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate login URL: {str(e)}"
        )


@router.get("/callback")
async def kite_callback(
    request_token: str = Query(..., description="Request token from Kite OAuth callback"),
    state: Optional[str] = Query(None, description="State parameter with session token"),
    db: Session = Depends(get_db)
):
    """Handle Kite Connect OAuth callback and exchange request_token for access_token"""
    if not settings.KITE_API_KEY or not settings.KITE_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kite API credentials not configured"
        )
    
    # Get user from session token
    user = None
    if state and state in oauth_sessions:
        user_id = oauth_sessions[state]
        user = db.query(User).filter(User.id == user_id).first()
        # Clean up session token
        del oauth_sessions[state]
    
    if not user:
        # If no valid session, redirect to frontend with error
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/broker/connect?status=error&message=Session expired or invalid. Please try connecting again.")
    
    try:
        # Exchange request_token for access_token
        kite = KiteConnect(api_key=settings.KITE_API_KEY)
        data = kite.generate_session(request_token, api_secret=settings.KITE_API_SECRET)
        access_token = data["access_token"]
        
        # Encrypt credentials using API key from .env
        encrypted_api_key = encryption_service.encrypt(settings.KITE_API_KEY)
        encrypted_access_token = encryption_service.encrypt(access_token)
        
        # Store refresh token if available
        encrypted_refresh_token = None
        if "refresh_token" in data:
            encrypted_refresh_token = encryption_service.encrypt(data["refresh_token"])
        
        # Calculate expiry time (Kite tokens typically expire in 24 hours)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Check if user already has API keys
        existing_key = db.query(UserApiKey).filter(UserApiKey.user_id == user.id).first()
        
        if existing_key:
            # Update existing
            existing_key.api_key = encrypted_api_key
            existing_key.access_token = encrypted_access_token
            existing_key.refresh_token = encrypted_refresh_token
            existing_key.expires_at = expires_at
        else:
            # Create new
            new_api_key = UserApiKey(
                user_id=user.id,
                api_key=encrypted_api_key,
                access_token=encrypted_access_token,
                refresh_token=encrypted_refresh_token,
                expires_at=expires_at
            )
            db.add(new_api_key)
        
        db.commit()
        
        # Redirect to frontend with success message
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/broker/connect?status=success")
        
    except Exception as e:
        # Redirect to frontend with error message
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        error_message = str(e).replace(' ', '%20')  # URL encode spaces
        return RedirectResponse(url=f"{frontend_url}/broker/connect?status=error&message={error_message}")


@router.post("/connect", status_code=status.HTTP_200_OK)
async def connect_broker(
    broker_data: BrokerConnect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect Kite account and store encrypted credentials (Legacy endpoint - kept for backward compatibility)"""
    # Encrypt credentials
    encrypted_api_key = encryption_service.encrypt(broker_data.api_key)
    encrypted_access_token = encryption_service.encrypt(broker_data.access_token)
    encrypted_refresh_token = None
    if broker_data.refresh_token:
        encrypted_refresh_token = encryption_service.encrypt(broker_data.refresh_token)
    
    # Check if user already has API keys
    existing_key = db.query(UserApiKey).filter(UserApiKey.user_id == current_user.id).first()
    
    if existing_key:
        # Update existing
        existing_key.api_key = encrypted_api_key
        existing_key.access_token = encrypted_access_token
        existing_key.refresh_token = encrypted_refresh_token
    else:
        # Create new
        new_api_key = UserApiKey(
            user_id=current_user.id,
            api_key=encrypted_api_key,
            access_token=encrypted_access_token,
            refresh_token=encrypted_refresh_token
        )
        db.add(new_api_key)
    
    db.commit()
    
    return {"message": "Kite account connected successfully"}


@router.get("/status", response_model=BrokerStatusResponse)
async def get_broker_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check Kite connection status"""
    api_key_record = db.query(UserApiKey).filter(UserApiKey.user_id == current_user.id).first()
    
    if not api_key_record or not api_key_record.access_token:
        return BrokerStatusResponse(connected=False, message="Not connected")
    
    # Try to verify connection
    try:
        kite = kite_service.get_kite_instance(current_user.id, db)
        if kite:
            # Try a simple API call
            kite.profile()
            return BrokerStatusResponse(connected=True, message="Connected and verified")
    except Exception as e:
        return BrokerStatusResponse(connected=False, message=f"Connection error: {str(e)}")
    
    return BrokerStatusResponse(connected=False, message="Not connected")


class UserDetailsResponse(BaseModel):
    user_id: str
    user_name: str
    user_shortname: str
    email: str
    user_type: str
    broker: str
    exchanges: List[str]
    products: List[str]
    order_types: List[str]
    avatar_url: Optional[str] = None
    api_key: str
    access_token: str
    public_token: Optional[str] = None
    enctoken: Optional[str] = None
    login_time: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


@router.get("/user-details", response_model=UserDetailsResponse)
async def get_user_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user details from Kite API"""
    try:
        profile = kite_service.get_profile(current_user.id, db)
        
        # Get margins for additional account info
        margins = kite_service.get_margins(current_user.id, db)
        
        # Combine profile and margins data
        user_details = {
            "user_id": profile.get("user_id", ""),
            "user_name": profile.get("user_name", ""),
            "user_shortname": profile.get("user_shortname", ""),
            "email": profile.get("email", ""),
            "user_type": profile.get("user_type", ""),
            "broker": profile.get("broker", ""),
            "exchanges": profile.get("exchanges", []),
            "products": profile.get("products", []),
            "order_types": profile.get("order_types", []),
            "avatar_url": profile.get("avatar_url"),
            "api_key": profile.get("api_key", ""),
            "access_token": profile.get("access_token", ""),
            "public_token": profile.get("public_token"),
            "enctoken": profile.get("enctoken"),
            "login_time": profile.get("login_time"),
            "meta": {
                "profile": profile,
                "margins": margins
            }
        }
        
        return UserDetailsResponse(**user_details)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch user details: {str(e)}"
        )


# Additional user-related endpoints
@router.get("/holdings")
async def get_holdings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get equity holdings from Kite API"""
    try:
        holdings = kite_service.get_holdings(current_user.id, db)
        return {"holdings": holdings}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch holdings: {str(e)}"
        )


@router.get("/orders")
async def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders from Kite API"""
    try:
        orders = kite_service.get_orders(current_user.id, db)
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch orders: {str(e)}"
        )


@router.get("/order/{order_id}/history")
async def get_order_history(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get history of individual order"""
    try:
        order_history = kite_service.get_order_history(current_user.id, db, order_id)
        return {"order_history": order_history}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch order history: {str(e)}"
        )


@router.get("/order/{order_id}/trades")
async def get_order_trades(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trades executed for a particular order"""
    try:
        trades = kite_service.get_order_trades(current_user.id, db, order_id)
        return {"trades": trades}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch order trades: {str(e)}"
        )


@router.get("/margins/{segment}")
async def get_margins_segment(
    segment: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get account margins for a specific segment (equity/commodity)"""
    try:
        if segment not in ["equity", "commodity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Segment must be 'equity' or 'commodity'"
            )
        margins = kite_service.get_margins_segment(current_user.id, db, segment)
        return {"margins": margins, "segment": segment}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch margins: {str(e)}"
        )


@router.get("/auction-instruments")
async def get_auction_instruments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of available instruments for auction session"""
    try:
        instruments = kite_service.get_auction_instruments(current_user.id, db)
        return {"instruments": instruments}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch auction instruments: {str(e)}"
        )


# Mutual Fund endpoints
@router.get("/mf/orders")
async def get_mf_orders(
    order_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all mutual fund orders or individual order info"""
    try:
        orders = kite_service.get_mf_orders(current_user.id, db, order_id)
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch MF orders: {str(e)}"
        )


@router.get("/mf/holdings")
async def get_mf_holdings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of mutual fund holdings"""
    try:
        holdings = kite_service.get_mf_holdings(current_user.id, db)
        return {"holdings": holdings}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch MF holdings: {str(e)}"
        )


@router.get("/mf/sips")
async def get_mf_sips(
    sip_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of all mutual fund SIPs or individual SIP info"""
    try:
        sips = kite_service.get_mf_sips(current_user.id, db, sip_id)
        return {"sips": sips}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch MF SIPs: {str(e)}"
        )


@router.get("/mf/instruments")
async def get_mf_instruments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of mutual fund instruments"""
    try:
        instruments = kite_service.get_mf_instruments(current_user.id, db)
        return {"instruments": instruments}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch MF instruments: {str(e)}"
        )

