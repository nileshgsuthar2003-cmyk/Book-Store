import os
from dotenv import load_dotenv

# Load .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class Config:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
    MYSQL_DB = os.getenv("MYSQL_DB", "booknest_db")

    SECRET_KEY = os.getenv("SECRET_KEY", "booknest_super_secret_key_2026")
    JWT_SECRET = os.getenv("JWT_SECRET", "booknest_jwt_secret_token_auth_key_2026")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 72))
    PORT = int(os.getenv("PORT", 5000))
