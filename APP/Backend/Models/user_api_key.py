"""
User API Key Model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from DB.database import Base


class UserApiKey(Base):
    """User API Key model for storing encrypted Kite Connect credentials"""
    __tablename__ = "user_api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    api_key = Column(String(500), nullable=False)  # Encrypted
    access_token = Column(String(2000), nullable=True)  # Encrypted
    refresh_token = Column(String(2000), nullable=True)  # Encrypted
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="api_keys")

