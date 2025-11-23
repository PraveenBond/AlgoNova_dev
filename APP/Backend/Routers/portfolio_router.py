"""
Portfolio Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from DB.database import get_db
from Routers.auth_router import get_current_user
from Models.user import User
from Models.position import Position
from Services.kite_service import kite_service

router = APIRouter()


# Pydantic models
class PositionResponse(BaseModel):
    id: int
    instrument_token: str
    quantity: int
    average_price: float
    last_price: float
    pnl: float
    
    class Config:
        from_attributes = True


class PnLResponse(BaseModel):
    total_pnl: float
    positions: List[PositionResponse]


@router.get("/positions", response_model=List[PositionResponse])
async def get_positions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current positions"""
    try:
        # Fetch from Kite API
        kite_positions = kite_service.get_positions(current_user.id, db)
        
        # Update positions in database
        # This is a simplified version - you may want to sync positions properly
        positions = db.query(Position).filter(Position.user_id == current_user.id).all()
        
        return positions
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pnl", response_model=PnLResponse)
async def get_pnl(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get P&L summary"""
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    
    total_pnl = sum(float(pos.pnl) for pos in positions)
    
    position_responses = [
        PositionResponse(
            id=pos.id,
            instrument_token=pos.instrument_token,
            quantity=pos.quantity,
            average_price=float(pos.average_price),
            last_price=float(pos.last_price) if pos.last_price else 0.0,
            pnl=float(pos.pnl)
        )
        for pos in positions
    ]
    
    return PnLResponse(total_pnl=total_pnl, positions=position_responses)

