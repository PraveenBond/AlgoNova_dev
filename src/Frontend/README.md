# Algo Trading Frontend

React + TypeScript frontend for the Algo Trading Web Application.

## Project Structure

```
src/Frontend/
├── Pages/           # Page components
├── Component/       # Reusable components
├── services/        # API services
├── App.tsx          # Main app component
├── main.tsx         # Entry point
└── package.json     # Dependencies
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:8000
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Pages

- **Login** - User login page
- **Register** - User registration page
- **Dashboard** - Main dashboard with broker status
- **Orders** - Order history and management
- **Portfolio** - Positions and P&L
- **Strategies** - Strategy management
- **Broker Connect** - Kite account connection

## Components

- **AuthContext** - Authentication context provider
- **ProtectedRoute** - Route protection wrapper
- **Layout** - Main layout with navigation

## Services

- **api.ts** - Axios instance with interceptors
- **authService.ts** - Authentication API calls

## Development

The app runs on `http://localhost:3000` by default.

API calls are proxied to `http://localhost:8000` via Vite proxy configuration.

