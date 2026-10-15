import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from database import get_db_connection
from app.utils.auth import hash_password, verify_password, generate_token, token_required
from app.utils.email import send_otp_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    """
    Generate and send a 6-digit verification code to the user's email.
    Checks if account exists if purpose is 'register'.
    """
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "Book Lover").strip()
    phone = (data.get("phone") or "").strip()
    purpose = (data.get("purpose") or "register").strip()

    if not email or "@" not in email:
        return jsonify({"error": "Please enter a valid email address."}), 400

    if purpose == "register" and not phone:
        return jsonify({"error": "Please provide your mobile number."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check if email is already registered
            if purpose == "register":
                cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
                if cur.fetchone():
                    return jsonify({"error": "An account with this email address already exists. Please sign in instead."}), 409

            # Generate random 6-digit OTP
            otp_code = f"{random.randint(100000, 999999)}"
            expires_at = datetime.now() + timedelta(minutes=10)

            # Invalidate any existing unused OTPs for this email and purpose
            cur.execute("""
                UPDATE email_otps SET is_used = 1 
                WHERE email = %s AND purpose = %s AND is_used = 0;
            """, (email, purpose))

            # Store new OTP
            cur.execute("""
                INSERT INTO email_otps (email, otp_code, purpose, expires_at)
                VALUES (%s, %s, %s, %s);
            """, (email, otp_code, purpose, expires_at))

        conn.commit()

        # Send email (or log to console if SMTP not configured)
        send_otp_email(email, otp_code, name)

        return jsonify({
            "success": True,
            "message": f"Verification code sent to {email}.",
            "email": email,
            "demo_otp": otp_code
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to send verification code: {str(e)}"}), 500
    finally:
        conn.close()

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    otp = (data.get("otp") or "").strip()
    # Public registration always creates standard customer accounts
    role = "user"

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if not phone:
        return jsonify({"error": "Mobile number is required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if not otp:
        return jsonify({"error": "Email verification code (OTP) is required."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Validate OTP from MySQL
            cur.execute("""
                SELECT id, expires_at FROM email_otps 
                WHERE email = %s AND otp_code = %s AND purpose = 'register' AND is_used = 0
                ORDER BY id DESC LIMIT 1;
            """, (email, otp))
            otp_record = cur.fetchone()

            if not otp_record:
                return jsonify({"error": "Invalid verification code. Please check and try again."}), 400

            if otp_record["expires_at"] < datetime.now():
                return jsonify({"error": "Verification code has expired. Please request a new code."}), 400

            # 2. Check if email already registered
            cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
            if cur.fetchone():
                return jsonify({"error": "An account with this email address already exists."}), 409

            # 3. Mark OTP as consumed
            cur.execute("UPDATE email_otps SET is_used = 1 WHERE id = %s;", (otp_record["id"],))

            # 4. Insert new user into MySQL with mobile number
            pwd_hash = hash_password(password)
            cur.execute("""
                INSERT INTO users (name, email, password_hash, role, phone)
                VALUES (%s, %s, %s, %s, %s);
            """, (name, email, pwd_hash, role, phone))
            user_id = cur.lastrowid
        conn.commit()

        token = generate_token(user_id, email, role, name)
        user_info = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "phone": phone,
            "address": "",
            "city": "",
            "state": "",
            "pincode": "",
            "country": "India"
        }
        return jsonify({
            "success": True,
            "message": "Email verified! Account created successfully.",
            "token": token,
            "user": user_info
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500
    finally:
        conn.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, email, password_hash, role, phone, address, city, state, pincode, country, created_at 
                FROM users WHERE email = %s;
            """, (email,))
            user = cur.fetchone()

        if not user or not verify_password(password, user["password_hash"]):
            return jsonify({"error": "Invalid email or password."}), 401

        token = generate_token(user["id"], user["email"], user["role"], user["name"])
        user_info = {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "phone": user.get("phone") or "",
            "address": user.get("address") or "",
            "city": user.get("city") or "",
            "state": user.get("state") or "",
            "pincode": user.get("pincode") or "",
            "country": user.get("country") or "India",
            "created_at": str(user["created_at"])
        }
        return jsonify({
            "success": True,
            "message": f"Welcome back, {user['name']}!",
            "token": token,
            "user": user_info
        }), 200
    finally:
        conn.close()

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    user = request.user
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as order_count FROM orders WHERE user_id = %s;", (user["id"],))
            stats = cur.fetchone()
        order_count = stats["order_count"] if stats else 0
    finally:
        conn.close()

    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "phone": user.get("phone") or "",
            "address": user.get("address") or "",
            "city": user.get("city") or "",
            "state": user.get("state") or "",
            "pincode": user.get("pincode") or "",
            "country": user.get("country") or "India",
            "created_at": str(user["created_at"]),
            "orders_count": order_count
        }
    })

@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json() or {}
    user_id = request.user["id"]
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    address = (data.get("address") or "").strip()
    city = (data.get("city") or "").strip()
    state = (data.get("state") or "").strip()
    pincode = (data.get("pincode") or "").strip()
    country = (data.get("country") or "India").strip()

    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not name:
        return jsonify({"error": "Full name cannot be empty."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check if password update was requested
            if new_password:
                if len(new_password) < 6:
                    return jsonify({"error": "New password must be at least 6 characters long."}), 400
                if not current_password:
                    return jsonify({"error": "Current password is required to change password."}), 400

                cur.execute("SELECT password_hash FROM users WHERE id = %s;", (user_id,))
                user_row = cur.fetchone()
                if not user_row or not verify_password(current_password, user_row["password_hash"]):
                    return jsonify({"error": "Current password does not match our records."}), 400

                new_hash = hash_password(new_password)
                cur.execute("""
                    UPDATE users 
                    SET name = %s, phone = %s, address = %s, city = %s, state = %s, pincode = %s, country = %s, password_hash = %s
                    WHERE id = %s;
                """, (name, phone, address, city, state, pincode, country, new_hash, user_id))
            else:
                cur.execute("""
                    UPDATE users 
                    SET name = %s, phone = %s, address = %s, city = %s, state = %s, pincode = %s, country = %s
                    WHERE id = %s;
                """, (name, phone, address, city, state, pincode, country, user_id))

            conn.commit()

            # Retrieve updated user record
            cur.execute("""
                SELECT id, name, email, role, phone, address, city, state, pincode, country, created_at 
                FROM users WHERE id = %s;
            """, (user_id,))
            updated_user = cur.fetchone()

            cur.execute("SELECT COUNT(*) as order_count FROM orders WHERE user_id = %s;", (user_id,))
            stats = cur.fetchone()
            order_count = stats["order_count"] if stats else 0

        # Generate updated token
        token = generate_token(updated_user["id"], updated_user["email"], updated_user["role"], updated_user["name"])

        user_info = {
            "id": updated_user["id"],
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": updated_user["role"],
            "phone": updated_user.get("phone") or "",
            "address": updated_user.get("address") or "",
            "city": updated_user.get("city") or "",
            "state": updated_user.get("state") or "",
            "pincode": updated_user.get("pincode") or "",
            "country": updated_user.get("country") or "India",
            "created_at": str(updated_user["created_at"]),
            "orders_count": order_count
        }

        return jsonify({
            "success": True,
            "message": "Profile and address updated successfully!",
            "token": token,
            "user": user_info
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500
    finally:
        conn.close()
