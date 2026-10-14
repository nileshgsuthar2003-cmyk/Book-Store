import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from database import get_db_connection

def hash_password(password):
    return generate_password_hash(password)

def verify_password(plain_password, hashed_password):
    return check_password_hash(hashed_password, plain_password)

def generate_token(user_id, email, role, name=""):
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "name": name,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

def decode_token(token):
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication token is missing or invalid."}), 401

        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token is expired or invalid. Please login again."}), 401

        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, email, role, phone, address, city, state, pincode, country, created_at
                FROM users WHERE id = %s;
            """, (payload["user_id"],))
            user = cur.fetchone()
        conn.close()

        if not user:
            return jsonify({"error": "User associated with this token not found."}), 401

        request.user = user
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Admin authentication token is missing."}), 401

        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token is expired or invalid."}), 401

        if payload.get("role") != "admin":
            return jsonify({"error": "Access forbidden: Admin privilege required."}), 403

        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, email, role, phone, address, city, state, pincode, country, created_at
                FROM users WHERE id = %s;
            """, (payload["user_id"],))
            user = cur.fetchone()
        conn.close()

        if not user or user.get("role") != "admin":
            return jsonify({"error": "Access forbidden: Admin privilege required."}), 403

        request.user = user
        return f(*args, **kwargs)
    return decorated

def optional_token(f):
    """Optional token validator for public endpoints that can personalize if logged in."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        request.user = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            if payload:
                conn = get_db_connection()
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, name, email, role, phone, address, city, state, pincode, country, created_at
                        FROM users WHERE id = %s;
                    """, (payload["user_id"],))
                    request.user = cur.fetchone()
                conn.close()
        return f(*args, **kwargs)
    return decorated
