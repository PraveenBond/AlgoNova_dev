import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

server = os.getenv("DB_SERVER")
database = os.getenv("DB_DATABASE")
username = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

print(f"Testing connection to:")
print(f"Server: {server}")
print(f"Database: {database}")
print(f"User: {username}")
print(f"Driver: {driver}")
print("-" * 20)

connection_string = (
    f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
)

try:
    conn = pyodbc.connect(connection_string, timeout=10)
    print("✅ Connection successful!")
    conn.close()
except Exception as e:
    print("❌ Connection failed:")
    print(e)
