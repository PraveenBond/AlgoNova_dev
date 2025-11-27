import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()


def _build_connection_string() -> str:
    """
    Return an ODBC connection string using either MSSQL_CONNECTION_STRING
    or the legacy DB_* environment variables.
    """
    raw = os.getenv("MSSQL_CONNECTION_STRING")
    if raw:
        return raw

    server = os.getenv("DB_SERVER")
    database = os.getenv("DB_DATABASE")
    driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    trusted = os.getenv("DB_TRUSTED_CONNECTION")

    if not server or not database:
        raise ValueError(
            "Database configuration missing. Set MSSQL_CONNECTION_STRING or "
            "DB_SERVER/DB_DATABASE (+ credentials)."
        )

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
    ]

    if trusted and trusted.lower() in ("yes", "true", "1"):
        parts.append("Trusted_Connection=yes")
    elif username and password:
        parts.append(f"UID={username}")
        parts.append(f"PWD={password}")
    else:
        raise ValueError(
            "Database credentials missing. Provide DB_USER/DB_PASSWORD or set "
            "DB_TRUSTED_CONNECTION=yes."
        )

    return ";".join(parts)


connection_string = _build_connection_string()
encoded_connection_string = quote_plus(connection_string)
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={encoded_connection_string}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
