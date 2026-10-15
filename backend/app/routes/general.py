import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from database import get_db_connection
from app.utils.auth import optional_token

general_bp = Blueprint("general", __name__, url_prefix="/api")

@general_bp.route("/health", methods=["GET"])
def health_check():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as count FROM books WHERE is_visible = 1;")
            visible_books = cur.fetchone()["count"]

            cur.execute("SELECT COUNT(*) as count FROM books;")
            total_books = cur.fetchone()["count"]

            cur.execute("SELECT COUNT(*) as count FROM orders;")
            total_orders = cur.fetchone()["count"]

            cur.execute("SELECT COUNT(*) as count FROM users;")
            total_users = cur.fetchone()["count"]

        return jsonify({
            "status": "healthy",
            "server": "Flask (Python) with MySQL",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stats": {
                "total_books": total_books,
                "visible_books": visible_books,
                "total_orders": total_orders,
                "total_users": total_users
            }
        })
    finally:
        conn.close()

@general_bp.route("/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Auto-sync any category from books table that isn't yet in categories table
            cur.execute("""
                INSERT IGNORE INTO categories (name, icon)
                SELECT DISTINCT category, '✦' FROM books 
                WHERE category IS NOT NULL AND TRIM(category) != '';
            """)
            conn.commit()

            cur.execute("""
                SELECT c.id, c.name, c.icon, COUNT(b.id) as book_count
                FROM categories c
                LEFT JOIN books b ON b.category = c.name AND b.is_visible = 1
                GROUP BY c.id, c.name, c.icon
                ORDER BY c.id ASC;
            """)
            categories = cur.fetchall()

        return jsonify({
            "categories": [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "icon": c["icon"],
                    "count": c["book_count"]
                }
                for c in categories
            ]
        })
    finally:
        conn.close()

@general_bp.route("/coupons/validate", methods=["POST"])
def validate_coupon():
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal") or 0)

    if not code:
        return jsonify({"valid": False, "message": "Please provide a coupon code."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM coupons WHERE code = %s AND is_active = 1;", (code,))
            coupon = cur.fetchone()

        if not coupon:
            return jsonify({
                "valid": False,
                "message": "Invalid promo code. Try BOOK10 or WELCOME50."
            }), 404

        min_order = float(coupon["min_order"])
        if subtotal < min_order:
            return jsonify({
                "valid": False,
                "message": f"This code requires a minimum order of ₹{int(min_order)}."
            }), 400

        if coupon["discount_type"] == "percent":
            discount = round(subtotal * (float(coupon["value"]) / 100.0))
        else:
            discount = round(float(coupon["value"]))

        return jsonify({
            "valid": True,
            "code": coupon["code"],
            "discount": discount,
            "description": coupon["description"],
            "message": f"Coupon {coupon['code']} applied successfully!"
        })
    finally:
        conn.close()

@general_bp.route("/newsletter", methods=["POST"])
def subscribe_newsletter():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "Please provide a valid email address."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT IGNORE INTO newsletter (email) VALUES (%s);", (email,))
        conn.commit()
        return jsonify({"success": True, "message": "Thank you for subscribing to BookNest newsletter!"})
    finally:
        conn.close()

@general_bp.route("/wishlist", methods=["GET"])
@optional_token
def get_wishlist():
    user = getattr(request, "user", None)
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if user:
                cur.execute("SELECT book_id FROM wishlist WHERE user_id = %s;", (user["id"],))
            else:
                cur.execute("SELECT book_id FROM wishlist WHERE user_id IS NULL;")
            rows = cur.fetchall()
            ids = [r["book_id"] for r in rows]
        return jsonify({"wishlist": ids})
    finally:
        conn.close()

@general_bp.route("/wishlist/toggle", methods=["POST"])
@optional_token
def toggle_wishlist():
    data = request.get_json() or {}
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"error": "book_id required"}), 400

    user = getattr(request, "user", None)
    user_id = user["id"] if user else None

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if user_id:
                cur.execute("SELECT id FROM wishlist WHERE book_id = %s AND user_id = %s;", (book_id, user_id))
            else:
                cur.execute("SELECT id FROM wishlist WHERE book_id = %s AND user_id IS NULL;", (book_id,))
            existing = cur.fetchone()

            if existing:
                cur.execute("DELETE FROM wishlist WHERE id = %s;", (existing["id"],))
                saved = False
            else:
                cur.execute("INSERT INTO wishlist (user_id, book_id) VALUES (%s, %s);", (user_id, book_id))
                saved = True
        conn.commit()
        return jsonify({"success": True, "saved": saved, "book_id": book_id})
    finally:
        conn.close()

@general_bp.route("/announcement", methods=["GET"])
def get_announcement():
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

@general_bp.route("/hero", methods=["GET"])
def get_hero():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM store_hero WHERE id = 1 LIMIT 1;")
            row = cur.fetchone()

        if not row:
            row = {
                "id": 1,
                "eyebrow": "A world between the pages",
                "title_prefix": "Your next great read",
                "title_highlight": "starts here.",
                "description": "Discover stories, ideas, and adventures worth getting lost in. Thoughtfully curated editions for curious minds, night owls, and book lovers everywhere.",
                "primary_btn_text": "Explore Books",
                "primary_btn_url": "/shop",
                "secondary_btn_text": "Discover Bestsellers",
                "secondary_btn_url": "/shop?best=1",
                "feature_1": "Thoughtfully curated",
                "feature_2": "Lovely prices",
                "feature_3": "For every reader",
                "image_url": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85",
                "badge_icon": "✦",
                "badge_title": "30,000+ happy readers",
                "badge_subtitle": "and counting"
            }

        return jsonify({
            "hero": {
                "id": row["id"],
                "eyebrow": row["eyebrow"],
                "title_prefix": row["title_prefix"],
                "title_highlight": row["title_highlight"],
                "description": row["description"],
                "primary_btn_text": row["primary_btn_text"],
                "primary_btn_url": row["primary_btn_url"],
                "secondary_btn_text": row["secondary_btn_text"],
                "secondary_btn_url": row["secondary_btn_url"],
                "feature_1": row["feature_1"],
                "feature_2": row["feature_2"],
                "feature_3": row["feature_3"],
                "image_url": row["image_url"],
                "badge_icon": row["badge_icon"],
                "badge_title": row["badge_title"],
                "badge_subtitle": row["badge_subtitle"],
                "updated_at": str(row.get("updated_at") or "")
            }
        })
    finally:
        conn.close()

@general_bp.route("/policies", methods=["GET"])
def get_all_policies():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT slug, title, subtitle, last_updated, updated_at FROM store_policies ORDER BY id ASC;")
            rows = cur.fetchall()
        return jsonify({"policies": rows})
    finally:
        conn.close()

@general_bp.route("/policies/<slug>", methods=["GET"])
def get_policy_by_slug(slug):
    slug = (slug or "").strip().lower()
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM store_policies WHERE slug = %s LIMIT 1;", (slug,))
            row = cur.fetchone()

        if not row:
            return jsonify({"error": f"Policy '{slug}' not found."}), 404

        content = row["content"]
        if isinstance(content, str):
            try:
                content = json.loads(content)
            except Exception:
                pass

        return jsonify({
            "policy": {
                "id": row["id"],
                "slug": row["slug"],
                "title": row["title"],
                "subtitle": row.get("subtitle") or "",
                "last_updated": row.get("last_updated") or "October 2026",
                "content": content,
                "updated_at": str(row.get("updated_at") or "")
            }
        })
    finally:
        conn.close()

@general_bp.route("/support", methods=["GET"])
def get_support():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM store_support WHERE id = 1 LIMIT 1;")
            row = cur.fetchone()

        if not row:
            row = {
                "heading": "Support & Care",
                "link_text": "Your Book Bag",
                "link_url": "/cart",
                "email": "hello@booknest.example",
                "hours": "Mon – Sat: 9am – 7pm IST",
                "promo_tag": "Use code BOOK10",
                "phone": "+91 (800) 266-5637"
            }

        return jsonify({
            "support": {
                "heading": row.get("heading") or "Support & Care",
                "link_text": row.get("link_text") or "Your Book Bag",
                "link_url": row.get("link_url") or "/cart",
                "email": row.get("email") or "hello@booknest.example",
                "hours": row.get("hours") or "Mon – Sat: 9am – 7pm IST",
                "promo_tag": row.get("promo_tag") or "Use code BOOK10",
                "phone": row.get("phone") or "+91 (800) 266-5637"
            }
        })
    finally:
        conn.close()

@general_bp.route("/reviews", methods=["GET"])
def get_public_reviews():
    """Retrieve all visible reviews for the public storefront."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, tagline, review_text, rating, avatar_text, is_visible, display_order, created_at
                FROM store_reviews
                WHERE is_visible = 1
                ORDER BY display_order ASC, id ASC;
            """)
            reviews = cur.fetchall()

        return jsonify({
            "reviews": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "tagline": r["tagline"],
                    "review_text": r["review_text"],
                    "rating": r["rating"],
                    "avatar_text": r.get("avatar_text") or (r["name"][:1].upper() if r.get("name") else "★"),
                    "created_at": str(r.get("created_at") or "")
                }
                for r in reviews
            ]
        })
    finally:
        conn.close()
