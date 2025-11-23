"""
Portfolio Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
from DB.database import get_db
from Routers.auth_router import get_current_user
from Models.user import User
from Models.position import Position
from Models.order import Order
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


class DashboardStatsResponse(BaseModel):
    available_balance: float
    number_trades: int
    today_pnl: float
    total_balance: float
    weekly_pnl: float
    monthly_pnl: float


@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    try:
        # Get margins from Kite API
        margins = kite_service.get_margins(current_user.id, db)
        # Kite API returns margins in format: {"equity": {"available": {...}, "utilised": {...}}, ...}
        # Available balance is typically in equity.available.cash or equity.available
        equity_margins = margins.get("equity", {})
        available_margins = equity_margins.get("available", {})
        available_balance = float(available_margins.get("cash", 0) or available_margins.get("net", 0) or 0)
        
        # Get today's date range
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = datetime.utcnow()
        
        # Get weekly date range (last 7 days)
        week_start = today_start - timedelta(days=7)
        
        # Get monthly date range (last 30 days)
        month_start = today_start - timedelta(days=30)
        
        # Count today's trades
        today_trades = db.query(Order).filter(
            Order.user_id == current_user.id,
            Order.placed_at >= today_start,
            Order.placed_at <= today_end
        ).count()
        
        # Calculate today's P&L from positions
        today_positions = db.query(Position).filter(
            Position.user_id == current_user.id,
            Position.created_at >= today_start
        ).all()
        today_pnl = sum(float(pos.pnl) for pos in today_positions)
        
        # Calculate weekly P&L
        week_positions = db.query(Position).filter(
            Position.user_id == current_user.id,
            Position.created_at >= week_start
        ).all()
        weekly_pnl = sum(float(pos.pnl) for pos in week_positions)
        
        # Calculate monthly P&L
        month_positions = db.query(Position).filter(
            Position.user_id == current_user.id,
            Position.created_at >= month_start
        ).all()
        monthly_pnl = sum(float(pos.pnl) for pos in month_positions)
        
        # Total balance = available balance + today's P&L
        total_balance = available_balance + today_pnl
        
        return DashboardStatsResponse(
            available_balance=available_balance,
            number_trades=today_trades,
            today_pnl=today_pnl,
            total_balance=total_balance,
            weekly_pnl=weekly_pnl,
            monthly_pnl=monthly_pnl
        )
        
    except Exception as e:
        # Return default values if Kite API is not connected
        return DashboardStatsResponse(
            available_balance=0.0,
            number_trades=0,
            today_pnl=0.0,
            total_balance=0.0,
            weekly_pnl=0.0,
            monthly_pnl=0.0
        )

