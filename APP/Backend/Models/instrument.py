"""
Instrument Model
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from DB.database import Base


class Instrument(Base):
    """Instrument model for trading instruments"""
    __tablename__ = "instruments"
    
    id = Column(Integer, primary_key=True, index=True)
    instrument_token = Column(String(50), unique=True, nullable=False, index=True)
    trading_symbol = Column(String(100), nullable=False)
    exchange = Column(String(20), nullable=False)
    instrument_type = Column(String(20), nullable=False)  # EQ, CE, PE, FUT, etc.
    lot_size = Column(Integer, default=1)
    tick_size = Column(Numeric(10, 2), default=0.05)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

