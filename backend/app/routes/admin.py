from flask import Blueprint, request, jsonify
from database import get_db_connection
from app.utils.auth import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_admin_stats():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Users statistics
            cur.execute("SELECT COUNT(*) as total, SUM(CASE WHEN role='admin' THEN 1 ELSE 0 END) as admins FROM users;")
            user_stats = cur.fetchone()

            # Books statistics
            cur.execute("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN is_visible = 1 THEN 1 ELSE 0 END) as visible,
                    SUM(CASE WHEN is_visible = 0 THEN 1 ELSE 0 END) as hidden,
                    SUM(CASE WHEN in_stock = 0 THEN 1 ELSE 0 END) as out_of_stock
                FROM books;
            """)
            book_stats = cur.fetchone()

            # Orders & Revenue statistics
            cur.execute("""
                SELECT
                    COUNT(*) as total_orders,
                    COALESCE(SUM(total), 0) as total_revenue,
                    SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_orders
                FROM orders;
            """)
            order_stats = cur.fetchone()

            # Recent 5 orders
            cur.execute("""
                SELECT id, order_code, customer_name, customer_email, total, status, created_at
                FROM orders
                ORDER BY id DESC LIMIT 5;
            """)
            recent_orders = cur.fetchall()

        return jsonify({
            "users": {
                "total": user_stats["total"] or 0,
                "admins": user_stats["admins"] or 0,
                "customers": (user_stats["total"] or 0) - (user_stats["admins"] or 0)
            },
            "books": {
                "total": book_stats["total"] or 0,
                "visible": book_stats["visible"] or 0,
                "hidden": book_stats["hidden"] or 0,
                "out_of_stock": book_stats["out_of_stock"] or 0
            },
            "orders": {
                "total_orders": order_stats["total_orders"] or 0,
                "total_revenue": float(order_stats["total_revenue"] or 0),
                "pending_orders": order_stats["pending_orders"] or 0,
                "delivered_orders": order_stats["delivered_orders"] or 0
            },
            "recent_orders": [
                {
                    "id": o["id"],
                    "order_code": o["order_code"],
                    "customer_name": o["customer_name"],
                    "customer_email": o["customer_email"],
                    "total": float(o["total"]),
                    "status": o["status"],
                    "created_at": str(o["created_at"])
                }
                for o in recent_orders
            ]
        })
    finally:
        conn.close()

@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_all_users():
    """Retrieve all users with their order counts and total spent."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    u.id, u.name, u.email, u.role, u.phone, u.address, u.city, u.state, u.pincode, u.country, u.created_at,
                    COUNT(o.id) as orders_count,
                    COALESCE(SUM(o.total), 0) as total_spent
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id OR (o.user_id IS NULL AND o.customer_email = u.email)
                GROUP BY u.id
                ORDER BY u.id ASC;
            """)
            users = cur.fetchall()

        return jsonify({
            "users": [
                {
                    "id": u["id"],
                    "name": u["name"],
                    "email": u["email"],
                    "role": u["role"],
                    "phone": u.get("phone") or "",
                    "address": u.get("address") or "",
                    "city": u.get("city") or "",
                    "state": u.get("state") or "",
                    "pincode": u.get("pincode") or "",
                    "country": u.get("country") or "India",
                    "orders_count": u["orders_count"],
                    "total_spent": float(u["total_spent"]),
                    "created_at": str(u["created_at"])
                }
                for u in users
            ]
        })
    finally:
        conn.close()

@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def update_user_role(user_id):
    data = request.get_json() or {}
    new_role = data.get("role")
    if new_role not in ["admin", "user"]:
        return jsonify({"error": "Role must be 'admin' or 'user'."}), 400

    # Prevent admin from demoting themselves accidentally
    if request.user["id"] == user_id and new_role != "admin":
        return jsonify({"error": "You cannot remove your own admin privileges."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM users WHERE id = %s;", (user_id,))
            user = cur.fetchone()
            if not user:
                return jsonify({"error": "User not found."}), 404

            cur.execute("UPDATE users SET role = %s WHERE id = %s;", (new_role, user_id))
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"User '{user['name']}' role updated to '{new_role}'.",
            "user_id": user_id,
            "role": new_role
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update role: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    if request.user["id"] == user_id:
        return jsonify({"error": "You cannot delete your own logged-in account."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM users WHERE id = %s;", (user_id,))
            user = cur.fetchone()
            if not user:
                return jsonify({"error": "User not found."}), 404

            cur.execute("DELETE FROM users WHERE id = %s;", (user_id,))
        conn.commit()
        return jsonify({
            "success": True,
            "message": f"User '{user['name']}' deleted successfully."
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete user: {str(e)}"}), 500
    finally:
        conn.close()
