"""
Kite Connect Service
"""
from typing import Optional, Dict, Any, List
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
    
    def get_kite_instance_from_env(self) -> Optional[KiteConnect]:
        """Get Kite Connect instance using API key from environment variables"""
        if not settings.KITE_API_KEY:
            return None
        
        return KiteConnect(api_key=settings.KITE_API_KEY)
    
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
    
    def cancel_order(self, user_id: int, db: Session, variety: str, order_id: str, parent_order_id: Optional[str] = None) -> Dict[str, Any]:
        """Cancel an order via Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.cancel_order(variety=variety, order_id=order_id, parent_order_id=parent_order_id)
    
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
    
    def get_margins(self, user_id: int, db: Session) -> Dict[str, Any]:
        """Get account margins from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.margins()
    
    def get_trades(self, user_id: int, db: Session) -> list:
        """Get trades from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.trades()
    
    def get_profile(self, user_id: int, db: Session) -> Dict[str, Any]:
        """Get user profile from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.profile()
    
    def get_margins_segment(self, user_id: int, db: Session, segment: str = "equity") -> Dict[str, Any]:
        """Get account margins for a specific segment (equity/commodity)"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.margins(segment=segment)
    
    def get_holdings(self, user_id: int, db: Session) -> list:
        """Get equity holdings from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.holdings()
    
    def get_orders(self, user_id: int, db: Session) -> list:
        """Get all orders from Kite API"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.orders()
    
    def get_order_history(self, user_id: int, db: Session, order_id: str) -> Dict[str, Any]:
        """Get history of individual order"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.order_history(order_id)
    
    def get_order_trades(self, user_id: int, db: Session, order_id: str) -> list:
        """Get trades executed for a particular order"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.order_trades(order_id)
    
    def get_auction_instruments(self, user_id: int, db: Session) -> list:
        """Get list of available instruments for auction session"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.get_auction_instruments()
    
    def convert_position(
        self,
        user_id: int,
        db: Session,
        exchange: str,
        tradingsymbol: str,
        transaction_type: str,
        position_type: str,
        quantity: int,
        old_product: str,
        new_product: str
    ) -> Dict[str, Any]:
        """Convert position product type"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.convert_position(
            exchange=exchange,
            tradingsymbol=tradingsymbol,
            transaction_type=transaction_type,
            position_type=position_type,
            quantity=quantity,
            old_product=old_product,
            new_product=new_product
        )
    
    # Mutual Fund APIs
    def get_mf_orders(self, user_id: int, db: Session, order_id: Optional[str] = None) -> list:
        """Get all mutual fund orders or individual order info"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.mf_orders(order_id=order_id)
    
    def get_mf_holdings(self, user_id: int, db: Session) -> list:
        """Get list of mutual fund holdings"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.mf_holdings()
    
    def get_mf_sips(self, user_id: int, db: Session, sip_id: Optional[str] = None) -> list:
        """Get list of all mutual fund SIPs or individual SIP info"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.mf_sips(sip_id=sip_id)
    
    def get_mf_instruments(self, user_id: int, db: Session) -> list:
        """Get list of mutual fund instruments"""
        kite = self.get_kite_instance(user_id, db)
        if not kite:
            raise Exception("Kite connection not available")
        
        return kite.mf_instruments()


kite_service = KiteService()

