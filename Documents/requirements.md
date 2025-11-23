# 📘 **Algo Trading Web Application — Requirements Document**

## 📌 **1. Overview**
This document defines the complete set of requirements for building a **web-based algorithmic trading platform** with real-time data, automated strategy execution, backtesting, analytics, option chain, and AI-assisted features.  
The application will use **MSSQL** for all relational + tick data storage.

---

# 🎯 **BASE VERSION (MVP) - Build First**

This section defines the **minimum viable product** to get started. Focus on these features first, then expand to the full version.

## ✅ **Base Version Scope**

### **Core Features (Must Have)**
1. **User Authentication (Basic)**
   - User registration & login
   - JWT-based authentication
   - Single user (no multi-user initially)
   - Store Kite API credentials (encrypted)

2. **Kite Connect Integration (Basic)**
   - Connect to Kite API
   - Store API key & access token
   - Basic order placement (Market & Limit orders only)
   - Get order status
   - Cancel orders

3. **Market Data (Basic)**
   - Real-time LTP via Kite WebSocket
   - Subscribe to 5-10 instruments max
   - Display live prices on dashboard
   - No historical data storage initially

4. **Simple Strategy Execution**
   - Create 1-2 simple strategies (hardcoded logic initially)
   - Enable/Disable strategy
   - Auto-place orders based on strategy signals
   - Basic strategy logs

5. **Order Management (Basic)**
   - Place orders manually
   - View order history (last 50 orders)
   - View order status
   - Cancel pending orders

6. **Portfolio View (Basic)**
   - View current positions
   - View live P&L
   - View today's trades

### **Base Version Database Tables (Minimal)**
- `Users` - User accounts
- `UserApiKeys` - Kite API credentials (encrypted)
- `Instruments` - Basic instrument master (NIFTY, BANKNIFTY, few stocks)
- `Orders` - Order history
- `Positions` - Current positions
- `Strategies` - Strategy definitions (simple JSON config)
- `StrategySignals` - Strategy buy/sell signals
- `SystemLogs` - Basic error logs

### **Base Version Tech Stack (Simplified)**
- Backend: Python FastAPI
- Frontend: React + TypeScript (simple dashboard)
- Database: MSSQL (basic tables only)
- Broker API: Kite Connect Python library
- Authentication: JWT (simple)
- **No Redis initially** (can add later)
- **No RabbitMQ initially** (synchronous processing)
- **No complex caching** (direct DB queries)

### **Base Version API Endpoints (Essential Only)**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/broker/connect` - Connect Kite account
- `GET /api/broker/status` - Check connection status
- `GET /api/market/quote` - Get current price
- `POST /api/orders/place` - Place order
- `GET /api/orders/history` - Get order history
- `GET /api/orders/{order_id}` - Get order details
- `DELETE /api/orders/{order_id}` - Cancel order
- `GET /api/portfolio/positions` - Get positions
- `GET /api/portfolio/pnl` - Get P&L
- `POST /api/strategies/create` - Create strategy
- `GET /api/strategies` - List strategies
- `POST /api/strategies/{id}/enable` - Enable strategy
- `POST /api/strategies/{id}/disable` - Disable strategy
- `GET /api/strategies/{id}/signals` - Get strategy signals

### **Base Version WebSocket (Basic)**
- `/ws/market-data` - Stream live prices for subscribed instruments

### **What to Skip in Base Version**
- ❌ Backtesting system
- ❌ Option chain module
- ❌ Risk management (add later)
- ❌ Multi-user/Admin features
- ❌ Email/SMS notifications
- ❌ Historical data storage
- ❌ OHLCV candle data
- ❌ Complex indicators (EMA, RSI, etc.)
- ❌ Strategy builder UI
- ❌ Performance analytics
- ❌ Audit trail (basic logging only)

### **Base Version Deployment (Simple)**
- Single VM/server
- FastAPI backend (systemd service)
- React frontend (nginx)
- MSSQL database
- No load balancer needed
- No Redis/RabbitMQ initially

### **Base Version Implementation Roadmap**

**Phase 1: Setup & Authentication (Week 1)**
1. Setup FastAPI project structure
2. Setup MSSQL database
3. Create Users table & authentication API
4. JWT token generation & validation
5. Basic React login page

**Phase 2: Kite Integration (Week 2)**
1. Install Kite Connect Python library
2. Create Kite API connection service
3. Store API credentials (encrypted)
4. Test connection & token refresh
5. Create broker connection UI

**Phase 3: Market Data (Week 3)**
1. Setup Kite WebSocket connection
2. Subscribe to instruments
3. Create WebSocket endpoint in FastAPI
4. Display live prices in React dashboard
5. Handle reconnection logic

**Phase 4: Order Management (Week 4)**
1. Create Orders table
2. Implement order placement API
3. Implement order status check
4. Implement order cancellation
5. Create order management UI

**Phase 5: Simple Strategy (Week 5)**
1. Create Strategies table
2. Create simple strategy (e.g., "Buy when price crosses above X")
3. Strategy execution engine
4. Auto-order placement on signals
5. Strategy enable/disable functionality

**Phase 6: Portfolio View (Week 6)**
1. Fetch positions from Kite API
2. Calculate P&L
3. Create portfolio dashboard
4. Display today's trades
5. Basic error handling & logging

**Phase 7: Testing & Polish (Week 7)**
1. Basic unit tests
2. Integration testing
3. UI/UX improvements
4. Error handling
5. Documentation

---

# 📋 **FULL VERSION REQUIREMENTS** (Build After Base Version)

---

# 🧩 **2. High-Level Modules**
- User & Authentication
- Broker connectivity
- Market data (real-time & historical)
- Algo strategy engine
- Order management & trade execution
- Risk management
- Portfolio management
- Backtesting system
- AI/ML modules (optional)
- Reporting & notifications
- Admin & system configuration
- Logging & audit trail
- Tick & OHLCV storage (MSSQL)

---

# 🚀 **3. Functional Requirements**

## 3.1 User & Authentication
- User registration & login  
- Role-based access control (Admin, Trader)
- Two-factor authentication (optional)
- User profile & settings
- API key storage for broker connectivity
- User notification settings
- User activity & login history tracking

---

## 3.2 Broker Integration (Kite/Zerodha)
- Connect user accounts to Kite Connect API  
- Store encrypted API keys & access tokens  
- Real-time order execution via Kite API  
- WebSocket connection management for live data  
- Auto-reconnect on connection drops  
- Retry & error handling for broker disruptions  
- Order status reconciliation  
- Support for:
  - Market, Limit, SL, SL-M, OCO orders
  - Basket orders  
  - Multi-account trading (future)
- Kite Connect authentication flow (login URL generation, token management)
- Access token refresh mechanism
- Rate limiting compliance (Kite API limits)

---

## 3.3 Market Data Engine
- Real-time ticks via Kite WebSocket  
- Streaming LTP, bid/ask, volume, OI  
- Historical OHLCV candles (1m to 1D)  
- Market snapshot caching (Redis)  
- Option chain data ingestion  
- Market holiday & trading session logic  
- WebSocket connection pooling & management  
- Subscription management (subscribe/unsubscribe instruments)  
- Data deduplication & validation  
- Missing data detection & gap filling  
- Market data archival strategy  

---

## 3.4 Algo Strategy Engine
- Create, edit, enable, disable strategies  
- Strategy versions & parameters  
- Rule-based strategy builder  
- Python-based scripting support (sandbox execution)  
- Indicator library (EMA, RSI, MACD, VWAP, SuperTrend, etc.)  
- Multi-strategy parallel execution  
- Real-time signal generation  
- Strategy execution logs  
- Strategy error reporting  
- Strategy-level performance analytics  

---

## 3.5 Order Management
- Place orders through broker APIs  
- Modify / cancel orders  
- Track partial fills  
- Order history & execution logs  
- Automated order placement based on signals  
- Rejection handling & error logging  

---

## 3.6 Portfolio & Positions
- Live P&L tracking  
- Unrealized / Realized P&L  
- Consolidated trade book  
- Holdings (equity delivery)  
- Margin tracking  
- End-of-day portfolio snapshot  

---
-Not required yet
## 3.7 Risk Management
- Per-user and per-strategy risk rules  
- Max loss per day  
- Max trades per day  
- Position sizing rules  
- Auto-halt algorithm on rule breach  
- Risk breach logs  
- Circuit breaker (system-level halt)

---

## 3.8 Backtesting System
- Historical backtest engine  
- Candle or tick-based backtesting  
- Custom strategy parameters  
- Backtest performance reports (CAGR, Sharpe, drawdown)  
- Equity curve storage  
- Backtest trade log  
- Large dataset compatibility  

---

## 3.9 Option Chain & Derivatives Module
- Option chain live stream  
- Greeks (Delta, Gamma, Theta, Vega)  
- IV & IV percentile  
- Strategy builder (Straddle, Iron Condor, etc.)  
- OI analysis & charts  

---

## 3.10 Reporting & Notifications
- Email / webhook / SMS alerts  
- Signals, orders, system errors  
- Daily/weekly P&L summary  
- Alert rules & triggers  
- Notification queue processing  

---

## 3.11 Admin & System Management
- Manage users, brokers, strategies  
- Monitor system health  
- Manage scheduled jobs  
- View logs & audit trail  
- Error monitoring dashboard  
- Edit global settings  

---

## 3.12 Logging & Audit
- User actions  
- API calls  
- Strategy logs  
- Order logs  
- System events  
- Error logs  
- Immutable audit trail (compliance)

---

# 🗄️ **4. Database Tables (MSSQL)**

## 4.1 User & Authentication Tables
- Users
- UserRoles
- UserSessions
- UserApiKeys (encrypted)
- UserLoginHistory
- UserPreferences
- TwoFactorAuthTokens

---

## 4.2 Market & Instrument Tables
- Instruments
- InstrumentPrices
- InstrumentMetadata
- OptionContracts
- OptionChainSnapshots
- MarketHolidays

---

## 4.3 Tick Data (High Volume)
- Ticks_Equity
- Ticks_Options
- Ticks_Futures

---

## 4.4 OHLCV / Candle Data
- Candles_1m
- Candles_5m
- Candles_15m
- Candles_1h
- Candles_1d

---

## 4.5 Strategy Engine Tables
- Strategies
- StrategyVersions
- StrategyParameters
- StrategyRuntimeStatus
- StrategySignals
- StrategyNotifications
- StrategyExecutionHistory

---

## 4.6 Orders & Trades
- Orders
- OrderFills
- OrderErrors
- TradeBook

---

## 4.7 Portfolio & Positions
- PositionsLive
- PositionsHistory
- PnlLive
- PnlHistory
- Holdings
- PortfolioAllocationRules

---

## 4.8 Risk Management
- RiskRules
- RiskBreaches
- DailyLimits
- CircuitBreakerEvents

---

## 4.9 Backtesting
- BacktestRuns
- BacktestParameters
- BacktestTrades
- BacktestEquityCurve
- BacktestLogs

---

## 4.10 Logging & Monitoring
- SystemLogs
- ApiLogs
- ExecutionLogs
- AuditTrail

---

## 4.11 Notifications
- AlertRules
- AlertsTriggered
- NotificationQueue

---

## 4.12 Admin & System Tables
- AppSettings
- BrokerConfig
- SchedulerJobs
- SchedulerJobHistory
- DataImportJobs
- DataImportErrors

---

# 🔐 **5. Security & Performance Requirements**

## 5.1 Security Requirements
- All API keys & tokens encrypted at rest (AES-256)
- HTTPS/TLS for all API communications
- JWT-based authentication with refresh tokens
- API rate limiting per user
- SQL injection prevention (parameterized queries)
- XSS protection in frontend
- CORS configuration
- Session timeout & management
- Password hashing (bcrypt/argon2)
- Secure credential storage (environment variables/secrets manager)
- Audit logging for sensitive operations
- Data encryption in transit (WebSocket over WSS)

## 5.2 Performance Requirements
- API response time: < 200ms for standard operations
- WebSocket latency: < 50ms for tick data
- Database query optimization (indexes on frequently queried columns)
- Caching strategy (Redis for market snapshots, user sessions)
- Connection pooling for database & broker APIs
- Async processing for heavy operations
- Batch processing for tick data insertion
- Pagination for large datasets
- Data archival for old tick/candle data

## 5.3 Scalability Requirements
- Support 100+ concurrent users
- Handle 10,000+ ticks/second
- Horizontal scaling capability (future)
- Database partitioning for tick data tables
- Message queue for async job processing

## 5.4 Reliability Requirements
- 99.5% uptime target
- Automatic failover for critical services
- Database backup (daily full, hourly incremental)
- Disaster recovery plan
- Health check endpoints
- Monitoring & alerting system

---

# 🔌 **6. API Specifications**

## 6.1 REST API Endpoints (FastAPI)
- Authentication: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`
- User Management: `/api/users/*`
- Broker Connection: `/api/broker/connect`, `/api/broker/disconnect`, `/api/broker/status`
- Market Data: `/api/market/instruments`, `/api/market/ohlcv`, `/api/market/option-chain`
- Strategies: `/api/strategies/*` (CRUD operations)
- Orders: `/api/orders/*` (place, modify, cancel, history)
- Portfolio: `/api/portfolio/*` (positions, P&L, holdings)
- Backtesting: `/api/backtest/*` (run, results, history)
- Admin: `/api/admin/*` (user management, system config)

## 6.2 WebSocket Endpoints
- `/ws/market-data` - Real-time market ticks
- `/ws/orders` - Order updates
- `/ws/portfolio` - Portfolio updates
- `/ws/strategy-signals` - Strategy signal notifications

## 6.3 API Rate Limiting
- Standard endpoints: 100 requests/minute per user
- Market data endpoints: 200 requests/minute per user
- WebSocket: Connection limits per user

---

# 🧪 **7. Testing Requirements**

## 7.1 Unit Testing
- Minimum 85% code coverage
- All business logic must have unit tests
- Mock external dependencies (Kite API, database)

## 7.2 Integration Testing
- API endpoint testing
- Database integration tests
- WebSocket connection tests
- Broker API integration tests (sandbox mode)

## 7.3 Performance Testing
- Load testing for API endpoints
- WebSocket connection stress testing
- Database query performance testing

## 7.4 Security Testing
- Authentication & authorization tests
- SQL injection vulnerability tests
- XSS vulnerability tests
- Encryption/decryption tests

---

# 🚀 **8. Deployment & Infrastructure**

## 8.1 Deployment Architecture
- Backend: FastAPI on VM with systemd service
- Frontend: React build served via nginx
- Database: MSSQL on dedicated server/VM
- Redis: For caching & session management
- Message Queue: RabbitMQ for async jobs
- Web Server: nginx as reverse proxy

## 8.2 System Requirements
- Backend VM: 4 CPU cores, 8GB RAM minimum
- Database Server: 8 CPU cores, 16GB RAM, SSD storage
- Redis: 2GB RAM minimum
- Network: Low latency connection to broker APIs

## 8.3 Monitoring & Logging
- Application logs (structured JSON format)
- Error tracking (Sentry or similar)
- Performance monitoring
- Database query monitoring
- System resource monitoring (CPU, memory, disk)

## 8.4 Backup & Recovery
- Daily database backups (retain 30 days)
- Configuration backup
- Disaster recovery procedures
- Data retention policy:
  - Tick data: 1 year
  - OHLCV data: 5 years
  - Trade/Order data: 7 years (compliance)
  - Logs: 90 days

---

# 📌 **9. Tech Stack**
- Backend: Python FastAPI  
- Frontend: React + TypeScript  
- Database: MSSQL  
- Caching: Redis  
- Messaging: WebSockets + RabbitMQ  
- Broker API: Kite Connect (Zerodha)  
- Authentication: JWT  
- Testing: pytest, pytest-asyncio  
- Deployment: VM + systemd + nginx (no docker)  
- Monitoring: Prometheus + Grafana (optional)

---

# 📋 **10. Development Guidelines**

## 10.1 Code Standards
- Python: PEP 8 compliance, type hints
- TypeScript: ESLint + Prettier
- Git: Feature branches, meaningful commit messages
- Code review required before merge

## 10.2 Documentation
- API documentation (OpenAPI/Swagger)
- Code comments for complex logic
- README for setup & deployment
- Database schema documentation

## 10.3 Version Control
- Git repository
- Branching strategy (main, develop, feature/*)
- Tag releases

---

# 📌 **Document End**
