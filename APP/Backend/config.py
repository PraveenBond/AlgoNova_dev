"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import json
import os


def parse_cors_origins(value: str) -> List[str]:
    """Parse CORS origins from string to list"""
    if not value:
        return ["http://localhost:3000", "http://localhost:5173"]
    
    # Try JSON format first
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except (json.JSONDecodeError, ValueError):
        pass
    
    # Try comma-separated format
    if ',' in value:
        return [origin.strip() for origin in value.split(',') if origin.strip()]
    
    # Single value
    return [value.strip()] if value.strip() else ["http://localhost:3000", "http://localhost:5173"]


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Algo Trading API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Encryption
    ENCRYPTION_KEY: str = "your-encryption-key-change-in-production"
    
    # Kite Connect
    KITE_API_KEY: str = ""
    KITE_API_SECRET: str = ""
    KITE_REDIRECT_URL: str = "http://localhost:8000/api/broker/callback"  # Backend callback URL
    FRONTEND_URL: str = "http://localhost:3000"  # Frontend URL for redirects after OAuth
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        # Exclude CORS_ORIGINS from pydantic_settings parsing
        extra = "ignore"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Get CORS origins, parsing from environment variable if present"""
        # Check environment variable first
        cors_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
        return parse_cors_origins(cors_str)


settings = Settings()

