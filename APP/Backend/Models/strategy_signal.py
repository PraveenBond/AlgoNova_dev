"""
Strategy Signal Model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from DB.database import Base


class StrategySignal(Base):
    """Strategy Signal model for logging buy/sell signals"""
    __tablename__ = "strategy_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False, index=True)
    instrument_token = Column(String(50), nullable=False)
    signal_type = Column(String(10), nullable=False)  # BUY or SELL
    price = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    strategy = relationship("Strategy", back_populates="signals")

