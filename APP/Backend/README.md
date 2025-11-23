# Algo Trading Backend

FastAPI backend for the Algo Trading Web Application.

## Project Structure

```
APP/Backend/
├── DB/              # Database connection and session management
├── Models/          # SQLAlchemy models
├── Services/        # Business logic services
├── Routers/         # API route handlers
├── config.py        # Application configuration
├── main.py          # FastAPI application entry point
└── requirements.txt # Python dependencies
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Configure MSSQL database connection in `.env`

5. Run the application using uvicorn:
```bash
# From APP/Backend directory
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or with auto-reload disabled (production)
uvicorn main:app --host 0.0.0.0 --port 8000

# Or specify workers for production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Note:** Make sure you're in the `APP/Backend` directory when running uvicorn, or use the full module path:
```bash
# From project root
uvicorn APP.Backend.main:app --reload
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Models

- `User` - User accounts
- `UserApiKey` - Encrypted Kite API credentials
- `Instrument` - Trading instruments master data
- `Order` - Order history
- `Position` - Current positions
- `Strategy` - Trading strategies
- `StrategySignal` - Strategy signals
- `SystemLog` - Application logs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Broker
- `POST /api/broker/connect` - Connect Kite account
- `GET /api/broker/status` - Check connection status

### Market Data
- `GET /api/market/quote` - Get current quote

### Orders
- `POST /api/orders/place` - Place order
- `GET /api/orders/history` - Get order history
- `GET /api/orders/{order_id}` - Get order details
- `DELETE /api/orders/{order_id}` - Cancel order

### Portfolio
- `GET /api/portfolio/positions` - Get positions
- `GET /api/portfolio/pnl` - Get P&L

### Strategies
- `POST /api/strategies/create` - Create strategy
- `GET /api/strategies` - List strategies
- `POST /api/strategies/{id}/enable` - Enable strategy
- `POST /api/strategies/{id}/disable` - Disable strategy
- `GET /api/strategies/{id}/signals` - Get strategy signals

