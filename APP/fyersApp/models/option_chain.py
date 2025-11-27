from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class OptionChainRequest:
    """
    Lightweight value object describing an option-chain query.
    """

    symbol: str
    strikecount: int = 1
    timestamp: str | None = ""

    def to_payload(self) -> Dict[str, Any]:
        """
        Convert the request data into the structure Fyers expects.
        """
        if not self.symbol:
            raise ValueError("symbol is required for option chain request")
        if self.strikecount < 1:
            raise ValueError("strikecount must be >= 1")
        payload: Dict[str, Any] = {
            "symbol": self.symbol,
            "strikecount": self.strikecount,
            "timestamp": self.timestamp or "",
        }
        return payload


