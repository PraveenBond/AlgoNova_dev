"""
Orders Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from DB.database import get_db
from Routers.auth_router import get_current_user
from Models.user import User
from Models.order import Order, OrderType, TransactionType, OrderStatus, ProductType, ValidityType
from Services.kite_service import kite_service

router = APIRouter()


# Pydantic models
class OrderPlace(BaseModel):
    instrument_token: str
    transaction_type: str  # BUY or SELL
    order_type: str  # MARKET, LIMIT, SL, SL-M
    quantity: int
    price: Optional[float] = None
    product_type: str = "MIS"
    validity: str = "DAY"


class OrderResponse(BaseModel):
    id: int
    order_id: Optional[str]
    instrument_token: str
    transaction_type: str
    order_type: str
    quantity: int
    price: Optional[float]
    status: str
    filled_quantity: int
    average_price: Optional[float]
    placed_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/place", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    order_data: OrderPlace,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a new order"""
    try:
        # Place order via Kite API
        kite_response = kite_service.place_order(
            user_id=current_user.id,
            db=db,
            instrument_token=order_data.instrument_token,
            transaction_type=order_data.transaction_type,
            order_type=order_data.order_type,
            quantity=order_data.quantity,
            price=order_data.price,
            product=order_data.product_type,
            validity=order_data.validity
        )
        
        # Store order in database
        new_order = Order(
            user_id=current_user.id,
            order_id=kite_response.get("order_id"),
            instrument_token=order_data.instrument_token,
            transaction_type=TransactionType(order_data.transaction_type),
            order_type=OrderType(order_data.order_type),
            product_type=ProductType(order_data.product_type),
            validity=ValidityType(order_data.validity),
            quantity=order_data.quantity,
            price=order_data.price,
            status=OrderStatus.PENDING
        )
        
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        return new_order
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history", response_model=List[OrderResponse])
async def get_order_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order history"""
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.placed_at.desc()).limit(limit).all()
    
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order.order_id:
        raise HTTPException(status_code=400, detail="Order ID not available")
    
    try:
        # Cancel via Kite API
        kite_service.cancel_order(current_user.id, db, order.order_id)
        
        # Update status in database
        order.status = OrderStatus.CANCELLED
        db.commit()
        
        return {"message": "Order cancelled successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

