# 📊 Database Schema Documentation

Complete list of all database tables with their schemas, relationships, and constraints.

---

## 📋 Table of Contents

1. [users](#1-users)
2. [user_api_keys](#2-user_api_keys)
3. [instruments](#3-instruments)
4. [orders](#4-orders)
5. [positions](#5-positions)
6. [strategies](#6-strategies)
7. [strategy_signals](#7-strategy_signals)
8. [system_logs](#8-system_logs)

---

## 1. users

**Description**: Stores user account information for authentication and authorization.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing user ID |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL, INDEXED | Unique username for login |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL, INDEXED | User email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | DATETIME (timezone) | NULL, AUTO-UPDATE | Last update timestamp |

**Relationships**:
- One-to-Many with `user_api_keys` (cascade delete)
- One-to-Many with `orders`
- One-to-Many with `positions`
- One-to-Many with `strategies`
- One-to-Many with `system_logs`

**Indexes**:
- Primary Key: `id`
- Unique Index: `username`
- Unique Index: `email`

---

## 2. user_api_keys

**Description**: Stores encrypted Kite Connect API credentials for each user.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `user_id` | INTEGER | FOREIGN KEY → `users.id`, NOT NULL | Reference to user |
| `api_key` | VARCHAR(500) | NOT NULL | Encrypted Kite API key |
| `access_token` | VARCHAR(2000) | NULL | Encrypted Kite access token |
| `refresh_token` | VARCHAR(2000) | NULL | Encrypted Kite refresh token |
| `expires_at` | DATETIME (timezone) | NULL | Token expiration timestamp |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Record creation timestamp |

**Relationships**:
- Many-to-One with `users` (on delete: cascade)

**Indexes**:
- Primary Key: `id`
- Foreign Key Index: `user_id`

**Notes**:
- All sensitive fields (`api_key`, `access_token`, `refresh_token`) are encrypted using Fernet encryption
- One user can have multiple API key records (for multiple broker accounts in future)

---

## 3. instruments

**Description**: Master data table for trading instruments (stocks, options, futures).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `instrument_token` | VARCHAR(50) | UNIQUE, NOT NULL, INDEXED | Kite instrument token (e.g., "NSE:RELIANCE") |
| `trading_symbol` | VARCHAR(100) | NOT NULL | Trading symbol (e.g., "RELIANCE") |
| `exchange` | VARCHAR(20) | NOT NULL | Exchange name (NSE, BSE, NFO, etc.) |
| `instrument_type` | VARCHAR(20) | NOT NULL | Type: EQ, CE, PE, FUT, etc. |
| `lot_size` | INTEGER | DEFAULT: 1 | Minimum lot size for trading |
| `tick_size` | NUMERIC(10, 2) | DEFAULT: 0.05 | Minimum price movement |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Record creation timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `instrument_token`

**Example Data**:
```
instrument_token: "NSE:RELIANCE"
trading_symbol: "RELIANCE"
exchange: "NSE"
instrument_type: "EQ"
lot_size: 1
tick_size: 0.05
```

---

## 4. orders

**Description**: Stores all order information including placed orders, status, and execution details.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `user_id` | INTEGER | FOREIGN KEY → `users.id`, NOT NULL | Reference to user |
| `order_id` | VARCHAR(50) | UNIQUE, NULL, INDEXED | Kite order ID (from broker) |
| `instrument_token` | VARCHAR(50) | NOT NULL | Instrument identifier (e.g., "NSE:RELIANCE") |
| `transaction_type` | ENUM | NOT NULL | BUY or SELL |
| `order_type` | ENUM | NOT NULL | MARKET, LIMIT, SL, SL-M |
| `product_type` | ENUM | DEFAULT: MIS | MIS, CNC, or NRML |
| `validity` | ENUM | DEFAULT: DAY | DAY or IOC |
| `quantity` | INTEGER | NOT NULL | Order quantity |
| `price` | NUMERIC(10, 2) | NULL | Limit price (NULL for market orders) |
| `status` | ENUM | DEFAULT: PENDING | PENDING, OPEN, COMPLETE, CANCELLED, REJECTED |
| `filled_quantity` | INTEGER | DEFAULT: 0 | Quantity filled/executed |
| `average_price` | NUMERIC(10, 2) | NULL | Average execution price |
| `placed_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Order placement timestamp |
| `updated_at` | DATETIME (timezone) | NULL, AUTO-UPDATE | Last update timestamp |

**Enum Values**:

**OrderType**:
- `MARKET` - Market order
- `LIMIT` - Limit order
- `SL` - Stop Loss order
- `SL-M` - Stop Loss Market order

**TransactionType**:
- `BUY` - Buy order
- `SELL` - Sell order

**OrderStatus**:
- `PENDING` - Order pending
- `OPEN` - Order open/active
- `COMPLETE` - Order fully executed
- `CANCELLED` - Order cancelled
- `REJECTED` - Order rejected

**ProductType**:
- `MIS` - Margin Intraday Square-off
- `CNC` - Cash and Carry
- `NRML` - Normal

**ValidityType**:
- `DAY` - Valid for the day
- `IOC` - Immediate or Cancel

**Relationships**:
- Many-to-One with `users`

**Indexes**:
- Primary Key: `id`
- Unique Index: `order_id`
- Foreign Key Index: `user_id`

---

## 5. positions

**Description**: Stores current open positions with P&L information.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `user_id` | INTEGER | FOREIGN KEY → `users.id`, NOT NULL | Reference to user |
| `instrument_token` | VARCHAR(50) | NOT NULL, INDEXED | Instrument identifier |
| `quantity` | INTEGER | NOT NULL | Position quantity (positive for long, negative for short) |
| `average_price` | NUMERIC(10, 2) | NOT NULL | Average entry price |
| `last_price` | NUMERIC(10, 2) | NULL | Last traded price (for P&L calculation) |
| `pnl` | NUMERIC(10, 2) | DEFAULT: 0.0 | Unrealized Profit & Loss |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Position creation timestamp |
| `updated_at` | DATETIME (timezone) | NULL, AUTO-UPDATE | Last update timestamp |

**Relationships**:
- Many-to-One with `users`

**Indexes**:
- Primary Key: `id`
- Index: `instrument_token`
- Foreign Key Index: `user_id`

**Notes**:
- `quantity` can be positive (long) or negative (short)
- `pnl` is calculated as: `(last_price - average_price) * quantity`
- Positions are updated in real-time from Kite API

---

## 6. strategies

**Description**: Stores trading strategy definitions and configurations.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `user_id` | INTEGER | FOREIGN KEY → `users.id`, NOT NULL | Reference to user |
| `name` | VARCHAR(100) | NOT NULL | Strategy name |
| `description` | TEXT | NULL | Strategy description |
| `strategy_config` | JSON | NOT NULL | Strategy parameters stored as JSON |
| `is_active` | BOOLEAN | DEFAULT: FALSE | Whether strategy is currently active |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Strategy creation timestamp |
| `updated_at` | DATETIME (timezone) | NULL, AUTO-UPDATE | Last update timestamp |

**Relationships**:
- Many-to-One with `users`
- One-to-Many with `strategy_signals` (cascade delete)

**Indexes**:
- Primary Key: `id`
- Foreign Key Index: `user_id`

**Strategy Config JSON Structure** (Example):
```json
{
  "type": "price_threshold",
  "instrument_token": "NSE:RELIANCE",
  "buy_threshold": 2500.00,
  "sell_threshold": 2400.00,
  "quantity": 1,
  "order_type": "MARKET"
}
```

**Strategy Types**:
- `price_threshold` - Buy when price > X, Sell when price < Y
- `price_breakout` - Buy when price breaks above X
- (More types can be added)

---

## 7. strategy_signals

**Description**: Logs all buy/sell signals generated by strategies.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `strategy_id` | INTEGER | FOREIGN KEY → `strategies.id`, NOT NULL | Reference to strategy |
| `instrument_token` | VARCHAR(50) | NOT NULL | Instrument for which signal was generated |
| `signal_type` | VARCHAR(10) | NOT NULL | BUY or SELL |
| `price` | VARCHAR(20) | NOT NULL | Price at which signal was generated |
| `quantity` | INTEGER | NOT NULL | Quantity for the signal |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Signal generation timestamp |

**Relationships**:
- Many-to-One with `strategies` (on delete: cascade)

**Indexes**:
- Primary Key: `id`
- Foreign Key Index: `strategy_id`

**Notes**:
- Signals are generated by the strategy execution engine
- Each signal can trigger an order placement
- Used for strategy performance analysis

---

## 8. system_logs

**Description**: Application logs for debugging, monitoring, and audit purposes.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, NOT NULL, INDEXED | Auto-incrementing ID |
| `user_id` | INTEGER | FOREIGN KEY → `users.id`, NULL | Reference to user (NULL for system logs) |
| `level` | VARCHAR(20) | NOT NULL | Log level: INFO, WARNING, ERROR |
| `message` | TEXT | NOT NULL | Log message |
| `created_at` | DATETIME (timezone) | DEFAULT: CURRENT_TIMESTAMP | Log timestamp |

**Relationships**:
- Many-to-One with `users` (optional)

**Indexes**:
- Primary Key: `id`
- Foreign Key Index: `user_id`

**Log Levels**:
- `INFO` - Informational messages
- `WARNING` - Warning messages
- `ERROR` - Error messages

**Notes**:
- `user_id` is NULL for system-level logs
- Used for debugging and audit trail
- Can be used for compliance and monitoring

---

## 🔗 Entity Relationship Diagram (ERD)

```
users (1) ──< (N) user_api_keys
users (1) ──< (N) orders
users (1) ──< (N) positions
users (1) ──< (N) strategies
users (1) ──< (N) system_logs

strategies (1) ──< (N) strategy_signals
```

---

## 📝 Notes

1. **Encryption**: All sensitive data in `user_api_keys` table is encrypted using Fernet encryption (AES-128).

2. **Timestamps**: All tables use timezone-aware DATETIME columns with automatic timestamp management.

3. **Cascade Deletes**:
   - Deleting a user will delete all related `user_api_keys`, `orders`, `positions`, `strategies`, and `system_logs`
   - Deleting a strategy will delete all related `strategy_signals`

4. **Indexes**: All foreign keys and frequently queried columns are indexed for performance.

5. **Enums**: Order-related enums ensure data integrity and prevent invalid values.

6. **JSON Storage**: Strategy configurations are stored as JSON for flexibility in adding new strategy types.

---

## 🔄 Data Flow

1. **User Registration** → `users` table
2. **Kite Connection** → `user_api_keys` table (encrypted)
3. **Order Placement** → `orders` table
4. **Position Tracking** → `positions` table (updated from Kite API)
5. **Strategy Creation** → `strategies` table
6. **Signal Generation** → `strategy_signals` table
7. **Logging** → `system_logs` table

---

## 📊 Table Statistics

| Table Name | Estimated Rows | Growth Rate | Notes |
|-----------|----------------|-------------|-------|
| `users` | Low (10-1000) | Slow | User accounts |
| `user_api_keys` | Low (1-10 per user) | Slow | API credentials |
| `instruments` | Medium (1000-10000) | Slow | Master data |
| `orders` | High (1000-1000000) | Fast | Order history |
| `positions` | Medium (10-1000) | Medium | Current positions |
| `strategies` | Low (1-100 per user) | Slow | Strategy definitions |
| `strategy_signals` | High (1000-100000) | Fast | Signal logs |
| `system_logs` | Very High (10000-1000000) | Very Fast | Application logs |

---

**Last Updated**: Generated from SQLAlchemy models
**Database**: MSSQL Server
**ORM**: SQLAlchemy 2.0

