"""
Strategies Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from DB.database import get_db
from Routers.auth_router import get_current_user
from Models.user import User
from Models.strategy import Strategy
from Models.strategy_signal import StrategySignal

router = APIRouter()


# Pydantic models
class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    strategy_config: Dict[str, Any]


class StrategyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    strategy_config: Dict[str, Any]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class StrategySignalResponse(BaseModel):
    id: int
    instrument_token: str
    signal_type: str
    price: str
    quantity: int
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/create", response_model=StrategyResponse, status_code=status.HTTP_201_CREATED)
async def create_strategy(
    strategy_data: StrategyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new strategy"""
    new_strategy = Strategy(
        user_id=current_user.id,
        name=strategy_data.name,
        description=strategy_data.description,
        strategy_config=strategy_data.strategy_config,
        is_active=False
    )
    
    db.add(new_strategy)
    db.commit()
    db.refresh(new_strategy)
    
    return new_strategy


@router.get("", response_model=List[StrategyResponse])
async def list_strategies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all strategies for current user"""
    strategies = db.query(Strategy).filter(Strategy.user_id == current_user.id).all()
    return strategies


@router.post("/{strategy_id}/enable", status_code=status.HTTP_200_OK)
async def enable_strategy(
    strategy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable a strategy"""
    strategy = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id
    ).first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy.is_active = True
    db.commit()
    
    return {"message": "Strategy enabled"}


@router.post("/{strategy_id}/disable", status_code=status.HTTP_200_OK)
async def disable_strategy(
    strategy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable a strategy"""
    strategy = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id
    ).first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy.is_active = False
    db.commit()
    
    return {"message": "Strategy disabled"}


@router.get("/{strategy_id}/signals", response_model=List[StrategySignalResponse])
async def get_strategy_signals(
    strategy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get signals for a strategy"""
    strategy = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id
    ).first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    signals = db.query(StrategySignal).filter(
        StrategySignal.strategy_id == strategy_id
    ).order_by(StrategySignal.created_at.desc()).all()
    
    return signals

