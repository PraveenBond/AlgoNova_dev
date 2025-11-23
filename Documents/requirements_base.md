# 🎯 **Kite Algo Trading App - Base Version (MVP) Requirements**

## 📌 **Overview**
This document defines the **minimum viable product (MVP)** for the Kite algo trading application. Focus on building these core features first before expanding to the full version.

---

## ✅ **Core Features**

### **1. User Authentication (Basic)**
- User registration & login
- JWT-based authentication
- Single user support (no multi-user initially)
- Store Kite API credentials (encrypted in database)

### **2. Kite Connect Integration**
- Connect to Kite Connect API
- Store API key & access token (encrypted)
- Access token refresh mechanism
- Basic order placement:
  - Market orders
  - Limit orders
- Get order status
- Cancel orders
- Basic error handling

### **3. Market Data (Real-time)**
- Real-time LTP via Kite WebSocket
- Subscribe to 5-10 instruments (start small)
- Display live prices on dashboard
- WebSocket reconnection on disconnect
- **No historical data storage** (add later)

### **4. Simple Strategy Execution**
- Create 1-2 simple strategies (hardcoded logic initially)
  - Example: "Buy when price > X, Sell when price < Y"
  - Example: "Buy on price breakout"
- Enable/Disable strategy toggle
- Auto-place orders based on strategy signals
- Basic strategy execution logs
- Strategy status display

### **5. Order Management**
- Place orders manually (Market/Limit)
- View order history (last 50 orders)
- View order status (Pending, Executed, Cancelled)
- Cancel pending orders
- Order details view

### **6. Portfolio View**
- View current positions (from Kite API)
- View live P&L (unrealized)
- View today's trades
- Basic portfolio summary

---

## 🗄️ **Database Tables (Minimal)**

### **Essential Tables Only**
1. **Users**
   - id, username, email, password_hash, created_at, updated_at

2. **UserApiKeys**
   - id, user_id, api_key (encrypted), access_token (encrypted), 
   - refresh_token (encrypted), expires_at, created_at

3. **Instruments**
   - id, instrument_token, trading_symbol, exchange, instrument_type, 
   - lot_size, tick_size, created_at

4. **Orders**
   - id, user_id, order_id (Kite), instrument_token, transaction_type (BUY/SELL),
   - order_type (MARKET/LIMIT), quantity, price, status, 
   - filled_quantity, average_price, placed_at, updated_at

5. **Positions**
   - id, user_id, instrument_token, quantity, average_price,
   - last_price, pnl, created_at, updated_at

6. **Strategies**
   - id, user_id, name, description, strategy_config (JSON),
   - is_active, created_at, updated_at

7. **StrategySignals**
   - id, strategy_id, instrument_token, signal_type (BUY/SELL),
   - price, quantity, created_at

8. **SystemLogs**
   - id, level, message, user_id, created_at

---

## 🔌 **API Endpoints (Essential Only)**

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login & get JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### **Broker Connection**
- `POST /api/broker/connect` - Connect Kite account (save API key)
- `GET /api/broker/status` - Check Kite connection status
- `POST /api/broker/disconnect` - Disconnect Kite account

### **Market Data**
- `GET /api/market/quote?instrument_token=xxx` - Get current price
- `GET /api/market/instruments` - Get instrument list (cached from Kite)

### **Orders**
- `POST /api/orders/place` - Place new order
- `GET /api/orders` - Get order history (paginated, last 50)
- `GET /api/orders/{order_id}` - Get order details
- `DELETE /api/orders/{order_id}` - Cancel order

### **Portfolio**
- `GET /api/portfolio/positions` - Get current positions
- `GET /api/portfolio/pnl` - Get P&L summary
- `GET /api/portfolio/trades` - Get today's trades

### **Strategies**
- `POST /api/strategies` - Create new strategy
- `GET /api/strategies` - List all strategies
- `GET /api/strategies/{id}` - Get strategy details
- `PUT /api/strategies/{id}` - Update strategy
- `DELETE /api/strategies/{id}` - Delete strategy
- `POST /api/strategies/{id}/enable` - Enable strategy
- `POST /api/strategies/{id}/disable` - Disable strategy
- `GET /api/strategies/{id}/signals` - Get strategy signals

### **WebSocket**
- `/ws/market-data` - Stream live prices for subscribed instruments

---

## 🛠️ **Tech Stack (Simplified)**

### **Backend**
- **Framework**: Python FastAPI
- **Database**: MSSQL (pyodbc or pymssql)
- **Broker API**: Kite Connect Python library (`kiteconnect`)
- **Authentication**: JWT (PyJWT)
- **WebSocket**: FastAPI WebSocket + Kite WebSocket
- **Encryption**: cryptography library (Fernet for API keys)
- **Password Hashing**: bcrypt

### **Frontend**
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) v5 or Ant Design
- **Icons**: Material Icons or React Icons
- **Charts**: Recharts (for simple price charts)
- **State Management**: React Context API or Zustand
- **Forms**: React Hook Form + Yup
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API
- **Routing**: React Router v6
- **Styling**: CSS Modules or Styled Components (optional)

### **Infrastructure**
- **No Redis** (add later if needed)
- **No RabbitMQ** (synchronous processing)
- **No complex caching** (direct DB queries)

---

## 📱 **Frontend Pages (Basic)**

1. **Login/Register Page**
   - Login form
   - Register form

2. **Dashboard**
   - Kite connection status
   - Live prices (5-10 instruments)
   - Quick order placement
   - Today's P&L summary

3. **Orders Page**
   - Order history table
   - Place new order form
   - Order status indicators

4. **Portfolio Page**
   - Current positions table
   - P&L display
   - Today's trades

5. **Strategies Page**
   - List of strategies
   - Create/Edit strategy form
   - Enable/Disable toggle
   - Strategy signals log

---

## 🎨 **UI/UX Design Specifications**

### **UI Component Library & Styling**
- **UI Framework**: Material-UI (MUI) or Ant Design (recommended: MUI for React)
- **Icons**: Material Icons or React Icons
- **Charts**: Recharts or Chart.js (for simple price charts)
- **State Management**: React Context API or Zustand (simple state)
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API or Socket.io-client
- **Styling**: CSS Modules or Styled Components (optional)

### **Design Theme**
- **Color Scheme**:
  - Primary: Blue (#1976d2) - for actions, links
  - Success: Green (#2e7d32) - for profits, buy signals
  - Error: Red (#d32f2f) - for losses, sell signals, errors
  - Warning: Orange (#ed6c02) - for warnings
  - Background: Light gray (#f5f5f5) or white
  - Text: Dark gray (#212121) for primary text, gray (#757575) for secondary
- **Typography**: Roboto or Inter font family
- **Spacing**: 8px grid system
- **Border Radius**: 4px for cards, 8px for buttons
- **Shadows**: Subtle shadows for cards and elevation

### **Layout Structure**

#### **Main Layout**
```
┌─────────────────────────────────────────┐
│  Header (Navbar)                        │
│  [Logo] [Dashboard] [Orders] [Portfolio] [Strategies] [Logout] │
├─────────────────────────────────────────┤
│                                         │
│  Sidebar (optional) or Full Width      │
│                                         │
│  Main Content Area                      │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### **Header/Navbar Components**
- App logo/name (left)
- Navigation menu: Dashboard, Orders, Portfolio, Strategies
- User menu: Username dropdown → Logout
- Kite connection status indicator (green dot = connected, red = disconnected)
- Real-time clock (optional)

---

### **Page 1: Login/Register Page**

#### **Layout**
- Centered card (max-width: 400px)
- Tabs or toggle between Login/Register
- Form fields with labels
- Submit button
- Error messages below form

#### **Login Form Fields**
- Email/Username (text input)
- Password (password input with show/hide toggle)
- "Remember me" checkbox (optional)
- "Forgot Password?" link (optional, can skip in MVP)
- Login button (primary, full width)

#### **Register Form Fields**
- Username (text input, required)
- Email (email input, required, validation)
- Password (password input, required, min 8 chars)
- Confirm Password (password input, required, must match)
- Register button (primary, full width)

#### **UI States**
- Loading state: Disable button, show spinner
- Error state: Red error message below form
- Success state: Redirect to dashboard after login

---

### **Page 2: Dashboard**

#### **Layout (Grid System)**
```
┌──────────────────┬──────────────────┐
│  Connection Card  │  P&L Summary     │
│  (Status)         │  (Today's P&L)   │
├──────────────────┴──────────────────┤
│  Live Prices Table                   │
│  (5-10 instruments)                  │
│  [Symbol] [LTP] [Change] [%Change]   │
├──────────────────────────────────────┤
│  Quick Order Form (Collapsible)      │
│  [Symbol] [Buy/Sell] [Qty] [Price]   │
└──────────────────────────────────────┘
```

#### **Components**

**1. Kite Connection Status Card**
- Status indicator (green/red dot)
- Connection status text ("Connected" / "Disconnected")
- "Connect Kite" button (if disconnected)
- Last connected time (if connected)

**2. P&L Summary Card**
- Today's P&L (large, bold)
  - Green if positive, Red if negative
- Unrealized P&L
- Realized P&L
- Total P&L

**3. Live Prices Table**
- Columns: Symbol, LTP, Change, % Change, Volume (optional)
- Real-time updates (highlight row on price change)
- Color coding:
  - Green background for price increase
  - Red background for price decrease
  - Fade to white after 1 second
- Click row to open quick order form with pre-filled symbol

**4. Quick Order Form (Collapsible Panel)**
- Instrument selector (dropdown or search)
- Transaction type: Buy/Sell (radio buttons or toggle)
- Order type: Market/Limit (dropdown)
- Quantity (number input)
- Price (number input, disabled for Market orders)
- Place Order button
- Form validation before submission

#### **Real-time Updates**
- WebSocket connection indicator (top right)
- Auto-refresh prices every second via WebSocket
- Visual feedback on price changes (flash green/red)

---

### **Page 3: Orders Page**

#### **Layout**
```
┌──────────────────────────────────────┐
│  Place New Order (Card/Form)          │
│  [All order fields]                   │
│  [Place Order Button]                 │
├──────────────────────────────────────┤
│  Order History Table                 │
│  [Filters: Status, Date Range]       │
│  [Table with orders]                  │
└──────────────────────────────────────┘
```

#### **Place Order Form**
- **Instrument**: Search/Select dropdown (with autocomplete)
- **Transaction Type**: Buy/Sell toggle or radio buttons
- **Order Type**: Market/Limit dropdown
- **Product Type**: MIS/CNC/NRML (dropdown, default: MIS)
- **Quantity**: Number input (min: 1, validate lot size)
- **Price**: Number input (required for Limit orders, disabled for Market)
- **Validity**: DAY/IOC (dropdown, default: DAY)
- **Place Order** button (primary, full width)
- **Reset** button (secondary)

#### **Order History Table**
- Columns:
  - Order ID (Kite order ID)
  - Symbol
  - Transaction Type (Buy/Sell)
  - Order Type (Market/Limit)
  - Quantity
  - Price
  - Status (with color coding)
  - Filled Qty
  - Average Price
  - Placed At (timestamp)
  - Actions (Cancel button if pending)
- Status Badges:
  - Pending: Yellow/Orange
  - Executed: Green
  - Cancelled: Gray
  - Rejected: Red
- Filters:
  - Status filter (dropdown)
  - Date range picker (optional, can skip in MVP)
- Pagination: Show last 50 orders, "Load More" button
- Sort: By date (newest first)

#### **Order Details Modal (on row click)**
- Full order details
- Order timeline (if available)
- Cancel button (if status is pending)

---

### **Page 4: Portfolio Page**

#### **Layout**
```
┌──────────────────┬──────────────────┐
│  Portfolio Summary│  Today's Trades  │
│  (Total Value)    │  (Table)         │
├──────────────────┴──────────────────┤
│  Current Positions Table             │
│  [All positions with P&L]            │
└──────────────────────────────────────┘
```

#### **Portfolio Summary Card**
- Total Investment Value
- Current Market Value
- Total P&L (with color coding)
- Total P&L % (with color coding)

#### **Current Positions Table**
- Columns:
  - Symbol
  - Quantity
  - Average Price
  - Last Price (real-time)
  - Current Value
  - P&L (with color: green/red)
  - P&L % (with color: green/red)
- Real-time price updates via WebSocket
- Sort by P&L (highest/lowest)
- Filter by instrument type (optional)

#### **Today's Trades Table**
- Columns:
  - Symbol
  - Buy/Sell
  - Quantity
  - Price
  - Time
  - P&L (if closed)
- Show only today's executed trades
- Sort by time (newest first)

---

### **Page 5: Strategies Page**

#### **Layout**
```
┌──────────────────────────────────────┐
│  Strategies List (Cards)             │
│  [Strategy Card 1] [Strategy Card 2]  │
│  [+ Create New Strategy Button]       │
├──────────────────────────────────────┤
│  Selected Strategy Details           │
│  (if strategy selected)               │
│  [Config] [Signals Log] [Enable/Disable]│
└──────────────────────────────────────┘
```

#### **Strategy List View**
- Strategy cards in grid (2-3 columns)
- Each card shows:
  - Strategy name
  - Status badge (Active/Inactive)
  - Description
  - Last signal time
  - Enable/Disable toggle
  - Edit button
  - Delete button

#### **Create/Edit Strategy Form**
- Strategy name (text input)
- Description (textarea)
- Strategy type (dropdown):
  - "Price Threshold" (Buy when price > X, Sell when price < Y)
  - "Price Breakout" (Buy when price breaks above X)
- Parameters (dynamic based on type):
  - Instrument (select)
  - Buy threshold/price
  - Sell threshold/price
  - Quantity
  - Order type (Market/Limit)
- Save button

#### **Strategy Details View**
- Strategy information
- Current status (Active/Inactive)
- Enable/Disable toggle (large, prominent)
- Strategy configuration (read-only or editable)
- Signals log table:
  - Columns: Time, Signal Type (Buy/Sell), Price, Quantity, Status
  - Real-time updates when new signals generated
  - Color coding for Buy (green) and Sell (red)

---

### **UI Components Specifications**

#### **Common Components**

**1. Button**
- Primary: Blue background, white text
- Secondary: Gray border, gray text
- Danger: Red background (for delete/cancel actions)
- Disabled: Gray background, disabled cursor
- Loading state: Spinner icon, disabled

**2. Input Fields**
- Label above input
- Border on focus (primary color)
- Error state: Red border, error message below
- Success state: Green border (optional)
- Helper text below input (optional)

**3. Table**
- Striped rows (alternating background)
- Hover effect on rows
- Sortable columns (click header)
- Responsive: Horizontal scroll on mobile

**4. Status Badge**
- Small rounded badge
- Color coded by status
- Text: uppercase, small font

**5. Card**
- White background
- Subtle shadow
- Rounded corners (8px)
- Padding: 16px or 24px

**6. Modal/Dialog**
- Centered overlay
- Backdrop (semi-transparent)
- Close button (X) top right
- Max width: 500px for forms, 800px for details

**7. Loading Spinner**
- Circular progress indicator
- Show during API calls
- Center on page or inline

**8. Toast/Notification**
- Success: Green, bottom right
- Error: Red, bottom right
- Info: Blue, bottom right
- Auto-dismiss after 3-5 seconds
- Manual close button

---

### **User Flows**

#### **Flow 1: First Time User**
1. Land on Login page
2. Click "Register" tab
3. Fill registration form
4. Submit → Success message → Auto login → Redirect to Dashboard
5. Dashboard shows "Connect Kite" prompt
6. Click "Connect Kite" → Enter API key → Connect
7. Dashboard shows live prices

#### **Flow 2: Place Order**
1. Navigate to Orders page
2. Fill order form (or use Quick Order from Dashboard)
3. Click "Place Order"
4. Loading state → Success toast → Order appears in table
5. Order status updates in real-time

#### **Flow 3: Create Strategy**
1. Navigate to Strategies page
2. Click "Create New Strategy"
3. Fill strategy form
4. Save → Strategy appears in list
5. Toggle "Enable" → Strategy becomes active
6. Monitor signals in Signals log

---

### **Responsive Design**

#### **Breakpoints**
- Mobile: < 600px
- Tablet: 600px - 960px
- Desktop: > 960px

#### **Mobile Adaptations**
- Hamburger menu for navigation
- Stack cards vertically
- Full-width tables with horizontal scroll
- Bottom sheet for forms (instead of modal)
- Larger touch targets (min 44px)

---

### **Error Handling in UI**

#### **Error States**
- **Network Error**: Toast notification + retry button
- **API Error**: Error message in form or toast
- **Validation Error**: Inline error messages below fields
- **WebSocket Disconnect**: Connection status indicator turns red, auto-reconnect message
- **Session Expired**: Redirect to login with message

#### **Loading States**
- Button: Show spinner, disable button
- Page: Show skeleton loader or spinner
- Table: Show loading rows
- Form: Disable all inputs during submission

---

### **Form Validations**

#### **Client-Side Validation**
- Required fields: Show error if empty
- Email: Valid email format
- Password: Min 8 characters
- Number inputs: Must be positive, validate min/max
- Price: Must be > 0, validate decimal places
- Quantity: Must be >= lot size

#### **Validation Feedback**
- Real-time validation (on blur or onChange)
- Error messages in red below field
- Success checkmark (optional, for complex validations)

---

### **Real-time Updates**

#### **WebSocket Integration**
- Connection indicator in header
- Auto-reconnect on disconnect
- Show "Reconnecting..." message
- Update UI components when data received:
  - Prices in Dashboard
  - Order status in Orders page
  - Positions P&L in Portfolio page
  - Strategy signals in Strategies page

#### **Visual Feedback**
- Flash effect on price changes (green/red)
- Highlight updated rows in tables
- Animate number changes (count up/down)

---

### **Accessibility (Basic)**
- Keyboard navigation support
- Focus indicators on interactive elements
- Alt text for icons
- ARIA labels for screen readers (basic)
- Color contrast ratio (WCAG AA minimum)

---

### **Performance Considerations**
- Lazy load routes (React.lazy)
- Debounce search inputs
- Virtualize long lists (if > 100 items)
- Optimize re-renders (React.memo where needed)
- Image optimization (if using images)

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Setup & Authentication (Week 1)**
- [ ] Setup FastAPI project structure
- [ ] Setup MSSQL database connection
- [ ] Create Users table
- [ ] Implement user registration API
- [ ] Implement login API with JWT
- [ ] Setup React project with TypeScript
- [ ] Install UI library (MUI or Ant Design)
- [ ] Setup routing (React Router)
- [ ] Create layout component (Header, Navigation)
- [ ] Create Login/Register pages with forms
- [ ] Implement form validation
- [ ] Connect frontend to backend APIs
- [ ] JWT token storage (localStorage)
- [ ] Protected routes
- [ ] Basic error handling & toast notifications

### **Phase 2: Kite Integration (Week 2)**
- [ ] Install `kiteconnect` library
- [ ] Create Kite API service class
- [ ] Create UserApiKeys table
- [ ] Implement API key storage (encrypted)
- [ ] Implement Kite connection API
- [ ] Implement token refresh mechanism
- [ ] Create broker connection UI component
- [ ] Connection status indicator in header
- [ ] Connect Kite form (API key input)
- [ ] Connection status display
- [ ] Error handling UI (connection failures)
- [ ] Test connection & error handling

### **Phase 3: Market Data (Week 3)**
- [ ] Setup Kite WebSocket connection
- [ ] Create Instruments table
- [ ] Implement instrument subscription
- [ ] Create WebSocket endpoint in FastAPI
- [ ] Forward Kite WebSocket data to frontend
- [ ] Create Dashboard page layout
- [ ] Create live prices table component
- [ ] Implement WebSocket connection in React
- [ ] Real-time price updates with visual feedback
- [ ] Price change animation (green/red flash)
- [ ] WebSocket connection indicator
- [ ] Implement reconnection logic
- [ ] Handle WebSocket errors (UI feedback)
- [ ] P&L summary card component
- [ ] Quick order form component (collapsible)

### **Phase 4: Order Management (Week 4)**
- [ ] Create Orders table
- [ ] Implement order placement API
- [ ] Implement order status check API
- [ ] Implement order cancellation API
- [ ] Implement order history API
- [ ] Create Orders page layout
- [ ] Create place order form component
- [ ] Form validation (quantity, price, etc.)
- [ ] Instrument search/select component
- [ ] Create order history table component
- [ ] Status badges with color coding
- [ ] Order details modal
- [ ] Cancel order button (with confirmation)
- [ ] Real-time order status updates
- [ ] Loading states for order placement
- [ ] Success/error toast notifications
- [ ] Test order placement (paper trading first!)

### **Phase 5: Simple Strategy (Week 5)**
- [ ] Create Strategies table
- [ ] Create StrategySignals table
- [ ] Design simple strategy config (JSON)
- [ ] Create strategy execution engine
- [ ] Implement strategy signal generation
- [ ] Auto-order placement on signals
- [ ] Strategy enable/disable API
- [ ] Create Strategies page layout
- [ ] Strategy list view (cards or grid)
- [ ] Create/Edit strategy form component
- [ ] Strategy type selector
- [ ] Dynamic form fields based on strategy type
- [ ] Enable/Disable toggle component
- [ ] Strategy details view
- [ ] Signals log table component
- [ ] Real-time signal updates
- [ ] Strategy status indicators
- [ ] Strategy execution logs display

### **Phase 6: Portfolio View (Week 6)**
- [ ] Create Positions table
- [ ] Fetch positions from Kite API
- [ ] Calculate P&L
- [ ] Implement portfolio APIs
- [ ] Create Portfolio page layout
- [ ] Portfolio summary card component
- [ ] Current positions table component
- [ ] P&L color coding (green/red)
- [ ] Today's trades table component
- [ ] Real-time price updates in positions
- [ ] Real-time P&L calculation
- [ ] Sort and filter options (optional)
- [ ] Responsive table design

### **Phase 7: Testing & Polish (Week 7)**
- [ ] Write basic unit tests (backend)
- [ ] Write basic component tests (frontend)
- [ ] Integration testing
- [ ] UI/UX polish:
  - [ ] Consistent spacing and styling
  - [ ] Loading states for all async operations
  - [ ] Error states and user feedback
  - [ ] Toast notifications for all actions
  - [ ] Form validation improvements
  - [ ] Mobile responsiveness check
- [ ] Error handling & user feedback
- [ ] Logging improvements
- [ ] Performance optimization (React.memo, lazy loading)
- [ ] Basic documentation
- [ ] Security review
- [ ] User acceptance testing

---

## ❌ **What to Skip in Base Version**

- Backtesting system
- Option chain module
- Risk management rules
- Multi-user/Admin features
- Email/SMS notifications
- Historical data storage
- OHLCV candle data
- Complex technical indicators
- Strategy builder UI
- Performance analytics
- Advanced audit trail
- Redis caching
- Message queues
- Load balancing

---

## 🔒 **Security (Basic)**

- Password hashing (bcrypt)
- JWT token expiration (1 hour access, 7 days refresh)
- API keys encrypted at rest (Fernet)
- HTTPS for production
- SQL injection prevention (parameterized queries)
- Basic CORS configuration

---

## 📊 **Success Criteria**

The base version is complete when:
1. ✅ User can register and login
2. ✅ User can connect Kite account
3. ✅ Live prices display on dashboard
4. ✅ User can place orders manually
5. ✅ User can view order history
6. ✅ User can create and enable a simple strategy
7. ✅ Strategy auto-places orders based on signals
8. ✅ User can view portfolio and P&L
9. ✅ Basic error handling works
10. ✅ Application runs without crashes

---

## 📝 **Notes**

- Start with **paper trading** (virtual orders) before live trading
- Test thoroughly with small amounts first
- Focus on core functionality, polish later
- Keep it simple - avoid over-engineering
- Add features incrementally after base version works

---

**Next Steps**: After base version is complete, refer to `requirements.md` for full version features.

