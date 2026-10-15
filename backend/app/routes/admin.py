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

@admin_bp.route("/announcement", methods=["GET"])
@admin_required
def get_admin_announcement():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM store_announcement WHERE id = 1 LIMIT 1;")
            row = cur.fetchone()

        if not row:
            row = {
                "id": 1,
                "is_enabled": 1,
                "lead_text": "A little something for your next chapter",
                "separator_symbol": "—",
                "highlight_text": "Save up to 40% on selected reads",
                "tag_text": "✦ Free shipping on orders over ₹799",
                "bg_theme": "navy",
                "link_url": "/shop"
            }

        return jsonify({
            "announcement": {
                "id": row["id"],
                "is_enabled": bool(row["is_enabled"]),
                "lead_text": row["lead_text"],
                "separator_symbol": row["separator_symbol"],
                "highlight_text": row["highlight_text"],
                "tag_text": row["tag_text"],
                "bg_theme": row["bg_theme"],
                "link_url": row["link_url"] or "",
                "updated_at": str(row.get("updated_at") or "")
            }
        })
    finally:
        conn.close()

@admin_bp.route("/announcement", methods=["PUT"])
@admin_required
def update_announcement():
    data = request.get_json() or {}
    is_enabled = 1 if data.get("is_enabled", True) else 0
    lead_text = (data.get("lead_text") or "").strip()
    separator_symbol = (data.get("separator_symbol") or "—").strip()
    highlight_text = (data.get("highlight_text") or "").strip()
    tag_text = (data.get("tag_text") or "").strip()
    bg_theme = (data.get("bg_theme") or "navy").strip()
    link_url = (data.get("link_url") or "").strip()

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO store_announcement 
                    (id, is_enabled, lead_text, separator_symbol, highlight_text, tag_text, bg_theme, link_url)
                VALUES (1, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    is_enabled = VALUES(is_enabled),
                    lead_text = VALUES(lead_text),
                    separator_symbol = VALUES(separator_symbol),
                    highlight_text = VALUES(highlight_text),
                    tag_text = VALUES(tag_text),
                    bg_theme = VALUES(bg_theme),
                    link_url = VALUES(link_url);
            """, (is_enabled, lead_text, separator_symbol, highlight_text, tag_text, bg_theme, link_url))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Top announcement bar updated successfully!",
            "announcement": {
                "id": 1,
                "is_enabled": bool(is_enabled),
                "lead_text": lead_text,
                "separator_symbol": separator_symbol,
                "highlight_text": highlight_text,
                "tag_text": tag_text,
                "bg_theme": bg_theme,
                "link_url": link_url
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update announcement: {str(e)}"}), 500
    finally:
        conn.close()
