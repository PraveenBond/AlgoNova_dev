from typing import Any, Dict, List, Optional

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from APP.fyersApp.db.connection import get_db
from APP.fyersApp.models.dropdown import DropdownMaster

logger = logging.getLogger(__name__)
router = APIRouter()

DEFAULT_SYMBOLS: List[Dict[str, str]] = [
    {"label": "NIFTY 50", "value": "NSE:NIFTY50-INDEX"},
    {"label": "BANK NIFTY", "value": "NSE:NIFTYBANK-INDEX"},
    {"label": "FIN NIFTY", "value": "NSE:FINNIFTY-INDEX"},
    {"label": "MIDCP NIFTY", "value": "NSE:MIDCPNIFTY-INDEX"},
    {"label": "SENSEX", "value": "BSE:SENSEX-INDEX"},
    {"label": "NIFTY NEXT 50", "value": "NSE:NIFTYNXT50-INDEX"},
    {"label": "RELIANCE", "value": "NSE:RELIANCE-EQ"},
    {"label": "TCS", "value": "NSE:TCS-EQ"},
    {"label": "INFY", "value": "NSE:INFY-EQ"},
    {"label": "HDFCBANK", "value": "NSE:HDFCBANK-EQ"},
]


@router.get("/dropdown")
async def get_dropdown_values(
    type: Optional[str] = Query(None, description="Filter by DropdownType"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Fetch active dropdown values from Dropdown_Master.
    """
    try:
        query = db.query(DropdownMaster).filter(DropdownMaster.IsActive == True)

        if type:
            query = query.filter(DropdownMaster.DropdownType == type)

        results = query.all()

        data = [
            {
                "label": item.DropdownName,
                "value": item.Value,
                "type": item.DropdownType,
                "description": item.Description,
            }
            for item in results
            if item.Value is not None
        ]

        return {"success": True, "data": data}
    except Exception as exc:
        logger.exception("Failed to load dropdown values from DB: %s", exc)
        fallback = DEFAULT_SYMBOLS if type in (None, "SYMBOL", "symbol") else []
        if not fallback:
            raise HTTPException(status_code=500, detail=str(exc))
        return {
            "success": True,
            "data": fallback,
            "warning": "DB unavailable, serving fallback symbols",
        }
