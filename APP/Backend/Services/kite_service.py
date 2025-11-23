"""
Kite Connect Service
"""
from typing import Optional, Dict, Any
from kiteconnect import KiteConnect
from sqlalchemy.orm import Session
from Models.user_api_key import UserApiKey
from Services.encryption_service import encryption_service
from config import settings


class KiteService:
    """Service for Kite Connect API interactions"""
    
    def __init__(self):
        """Initialize Kite service"""
        self.kite: Optional[KiteConnect] = None
    
    def get_kite_instance(self, user_id: int, db: Session) -> Optional[KiteConnect]:
        """Get Kite Connect instance for a user"""
        api_key_record = db.query(UserApiKey).filter(UserApiKey.user_id == user_id).first()
        
        if not api_key_record:
            return None
        
        # Decrypt credentials
        api_key = encryption_service.decrypt(api_key_record.api_key)
        access_token = encryption_service.decrypt(api_key_record.access_token) if api_key_record.access_token else None
        
        if not api_key or not access_token:
            return None
        
        # Create Kite instance
        kite = KiteConnect(api_key=api_key)
        kite.set_access_token(access_token)
        
        return kite
    
    def place_order(
        self,
        user_id: int,
        db: Session,
        instrument_token: str,
        transaction_type: str,
        order_type: str,
        quantity: int,
        price: Optional[float] = None,
        product: str = "MIS",
        validity: str = "DAY"
    ) -> Dict[str, Any]:
        """Place an order via Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        order_params = {
            "exchange": instrument_token.split(":")[0],
            "tradingsymbol": instrument_token.split(":")[1],
            "transaction_type": transaction_type,
            "quantity": quantity,
            "order_type": order_type,
            "product": product,
            "validity": validity
        }
        
        if price and order_type == "LIMIT":
            order_params["price"] = price
        
        return kite.place_order(**order_params)
    
    def get_order_status(self, user_id: int, db: Session, order_id: str) -> Dict[str, Any]:
        """Get order status from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        orders = kite.orders()
        for order in orders:
            if order["order_id"] == order_id:
                return order
        
        raise Exception("Order not found")
    
    def cancel_order(self, user_id: int, db: Session, order_id: str) -> Dict[str, Any]:
        """Cancel an order via Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.cancel_order(order_id=order_id)
    
    def get_positions(self, user_id: int, db: Session) -> list:
        """Get current positions from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.positions()
    
    def get_quote(self, user_id: int, db: Session, instrument_token: str) -> Dict[str, Any]:
        """Get current quote for an instrument"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.quote(instrument_token)


kite_service = KiteService()

