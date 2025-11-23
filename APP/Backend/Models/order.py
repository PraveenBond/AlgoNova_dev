"""
Order Model
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from DB.database import Base


class OrderType(str, enum.Enum):
    """Order type enum"""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    SL = "SL"
    SL_M = "SL-M"


class TransactionType(str, enum.Enum):
    """Transaction type enum"""
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, enum.Enum):
    """Order status enum"""
    PENDING = "PENDING"
    OPEN = "OPEN"
    COMPLETE = "COMPLETE"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class ProductType(str, enum.Enum):
    """Product type enum"""
    MIS = "MIS"
    CNC = "CNC"
    NRML = "NRML"


class ValidityType(str, enum.Enum):
    """Validity type enum"""
    DAY = "DAY"
    IOC = "IOC"


class Order(Base):
    """Order model"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(String(50), unique=True, nullable=True, index=True)  # Kite order ID
    instrument_token = Column(String(50), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    order_type = Column(Enum(OrderType), nullable=False)
    product_type = Column(Enum(ProductType), default=ProductType.MIS)
    validity = Column(Enum(ValidityType), default=ValidityType.DAY)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=True)  # NULL for market orders
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    filled_quantity = Column(Integer, default=0)
    average_price = Column(Numeric(10, 2), nullable=True)
    placed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="orders")

