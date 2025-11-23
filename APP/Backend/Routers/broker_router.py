"""
Broker (Kite Connect) Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from DB.database import get_db
from Models.user_api_key import UserApiKey
from Routers.auth_router import get_current_user
from Models.user import User
from Services.encryption_service import encryption_service
from Services.kite_service import kite_service

router = APIRouter()


# Pydantic models
class BrokerConnect(BaseModel):
    api_key: str
    access_token: str
    refresh_token: Optional[str] = None


class BrokerStatusResponse(BaseModel):
    connected: bool
    message: str


@router.post("/connect", status_code=status.HTTP_200_OK)
async def connect_broker(
    broker_data: BrokerConnect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect Kite account and store encrypted credentials"""
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

