"""
Position Model
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from DB.database import Base


class Position(Base):
    """Position model for current open positions"""
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    instrument_token = Column(String(50), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # Positive for long, negative for short
    average_price = Column(Numeric(10, 2), nullable=False)
    last_price = Column(Numeric(10, 2), nullable=True)  # For P&L calculation
    pnl = Column(Numeric(10, 2), default=0.0)  # Unrealized P&L
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="positions")

