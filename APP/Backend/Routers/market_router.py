"""
Market Data Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from DB.database import get_db
from Routers.auth_router import get_current_user
from Models.user import User
from Services.kite_service import kite_service

router = APIRouter()


# Pydantic models
class QuoteResponse(BaseModel):
    instrument_token: str
    last_price: float
    # Add more fields as needed


@router.get("/quote")
async def get_quote(
    instrument_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current quote for an instrument"""
    try:
        quote = kite_service.get_quote(current_user.id, db, instrument_token)
        return quote
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

