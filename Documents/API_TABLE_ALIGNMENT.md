# API Endpoints vs Database Tables Alignment

## ✅ Correctly Aligned

### 1. **users** table
- ✅ `POST /api/auth/register` - Creates user
- ✅ `POST /api/auth/login` - Authenticates user
- ✅ `GET /api/auth/me` - Returns user data
- ✅ All endpoints use `get_current_user` dependency

### 2. **user_api_keys** table
- ✅ `POST /api/broker/connect` - Creates/updates UserApiKey
- ✅ `GET /api/broker/status` - Reads UserApiKey
- ✅ `POST /api/broker/disconnect` - Deletes UserApiKey

### 3. **orders** table
- ✅ `POST /api/orders/place` - Creates Order
- ✅ `GET /api/orders` - Reads Orders
- ✅ `GET /api/orders/{order_id}` - Reads Order
- ✅ `DELETE /api/orders/{order_id}` - Updates Order status
- ✅ `GET /api/portfolio/trades` - Reads Orders (for trades)
- ✅ `GET /api/portfolio/pnl` - Reads Orders (for realized P&L)

### 4. **strategies** table
- ✅ `POST /api/strategies` - Creates Strategy
- ✅ `GET /api/strategies` - Reads Strategies
- ✅ `GET /api/strategies/{id}` - Reads Strategy
- ✅ `PUT /api/strategies/{id}` - Updates Strategy
- ✅ `DELETE /api/strategies/{id}` - Deletes Strategy
- ✅ `POST /api/strategies/{id}/enable` - Updates Strategy.is_active
- ✅ `POST /api/strategies/{id}/disable` - Updates Strategy.is_active

### 5. **strategy_signals** table
- ✅ `GET /api/strategies/{id}/signals` - Reads StrategySignals

---

## ✅ Fixed Issues

### 1. **positions** table - NOW USED ✅
**Fixed Behavior:**
- `GET /api/portfolio/positions` - Now saves positions to `positions` table when fetched from Kite
- Syncs positions from Kite API to database
- Updates existing positions or creates new ones
- Removes positions with zero quantity
- Returns positions from database

**Implementation:** Updated `portfolio.py` to sync and persist positions

---

### 2. **instruments** table - NOW USED ✅
**Fixed Behavior:**
- `GET /api/market/instruments` - Now caches instruments in `instruments` table
- Reads from database cache first
- If cache is empty, fetches from Kite and caches it
- Reduces API calls to Kite

**Implementation:** Updated `market.py` to cache instruments

---

### 3. **system_logs** table - NOW USED ✅
**Fixed Behavior:**
- Added `LogService` for logging to `system_logs` table
- Logs user registration
- Logs user login
- Logs order placements
- Logs Kite connection/disconnection

**Implementation:** 
- Created `app/services/log_service.py`
- Integrated logging in `auth.py`, `orders.py`, and `broker.py`

---

## 📋 Summary

| Table | Used in APIs | Status |
|-------|-------------|--------|
| users | ✅ Yes | Aligned |
| user_api_keys | ✅ Yes | Aligned |
| instruments | ✅ Yes | **Fixed - Now Cached** |
| orders | ✅ Yes | Aligned |
| positions | ✅ Yes | **Fixed - Now Synced** |
| strategies | ✅ Yes | Aligned |
| strategy_signals | ✅ Yes | Aligned |
| system_logs | ✅ Yes | **Fixed - Now Logging** |

---

## ✅ All Issues Fixed!

All tables are now properly aligned with API endpoints:

1. ✅ **positions table** - Now synced from Kite and persisted
2. ✅ **instruments table** - Now cached in database
3. ✅ **system_logs table** - Now logging important events

## 🔧 Future Enhancements

1. **Add background job** to periodically sync positions and instruments
2. **Add more logging** for strategy signals and errors
3. **Add log query endpoints** for viewing system logs
4. **Add instrument search/filter** functionality

