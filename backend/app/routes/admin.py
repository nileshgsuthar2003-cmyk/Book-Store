import json
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

@admin_bp.route("/hero", methods=["GET"])
@admin_required
def get_admin_hero():
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

@admin_bp.route("/hero", methods=["PUT"])
@admin_required
def update_hero():
    data = request.get_json() or {}
    eyebrow = (data.get("eyebrow") or "A world between the pages").strip()
    title_prefix = (data.get("title_prefix") or "Your next great read").strip()
    title_highlight = (data.get("title_highlight") or "starts here.").strip()
    description = (data.get("description") or "").strip()
    primary_btn_text = (data.get("primary_btn_text") or "Explore Books").strip()
    primary_btn_url = (data.get("primary_btn_url") or "/shop").strip()
    secondary_btn_text = (data.get("secondary_btn_text") or "Discover Bestsellers").strip()
    secondary_btn_url = (data.get("secondary_btn_url") or "/shop?best=1").strip()
    feature_1 = (data.get("feature_1") or "Thoughtfully curated").strip()
    feature_2 = (data.get("feature_2") or "Lovely prices").strip()
    feature_3 = (data.get("feature_3") or "For every reader").strip()
    image_url = (data.get("image_url") or "").strip()
    badge_icon = (data.get("badge_icon") or "✦").strip()
    badge_title = (data.get("badge_title") or "30,000+ happy readers").strip()
    badge_subtitle = (data.get("badge_subtitle") or "and counting").strip()

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO store_hero 
                (id, eyebrow, title_prefix, title_highlight, description, primary_btn_text, primary_btn_url, secondary_btn_text, secondary_btn_url, feature_1, feature_2, feature_3, image_url, badge_icon, badge_title, badge_subtitle)
                VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    eyebrow = VALUES(eyebrow),
                    title_prefix = VALUES(title_prefix),
                    title_highlight = VALUES(title_highlight),
                    description = VALUES(description),
                    primary_btn_text = VALUES(primary_btn_text),
                    primary_btn_url = VALUES(primary_btn_url),
                    secondary_btn_text = VALUES(secondary_btn_text),
                    secondary_btn_url = VALUES(secondary_btn_url),
                    feature_1 = VALUES(feature_1),
                    feature_2 = VALUES(feature_2),
                    feature_3 = VALUES(feature_3),
                    image_url = VALUES(image_url),
                    badge_icon = VALUES(badge_icon),
                    badge_title = VALUES(badge_title),
                    badge_subtitle = VALUES(badge_subtitle);
            """, (eyebrow, title_prefix, title_highlight, description, primary_btn_text, primary_btn_url, secondary_btn_text, secondary_btn_url, feature_1, feature_2, feature_3, image_url, badge_icon, badge_title, badge_subtitle))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Homepage hero banner updated successfully!",
            "hero": {
                "id": 1,
                "eyebrow": eyebrow,
                "title_prefix": title_prefix,
                "title_highlight": title_highlight,
                "description": description,
                "primary_btn_text": primary_btn_text,
                "primary_btn_url": primary_btn_url,
                "secondary_btn_text": secondary_btn_text,
                "secondary_btn_url": secondary_btn_url,
                "feature_1": feature_1,
                "feature_2": feature_2,
                "feature_3": feature_3,
                "image_url": image_url,
                "badge_icon": badge_icon,
                "badge_title": badge_title,
                "badge_subtitle": badge_subtitle
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update hero: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/policies/<slug>", methods=["PUT"])
@admin_required
def update_policy(slug):
    slug = (slug or "").strip().lower()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    subtitle = (data.get("subtitle") or "").strip()
    last_updated = (data.get("last_updated") or "October 2026").strip()
    content = data.get("content")

    if not title:
        return jsonify({"error": "Policy title is required."}), 400

    if content is None:
        return jsonify({"error": "Policy content is required."}), 400

    if not isinstance(content, str):
        content_json = json.dumps(content)
    else:
        content_json = content

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO store_policies (slug, title, subtitle, last_updated, content)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    subtitle = VALUES(subtitle),
                    last_updated = VALUES(last_updated),
                    content = VALUES(content);
            """, (slug, title, subtitle, last_updated, content_json))
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Policy '{title}' updated successfully!",
            "policy": {
                "slug": slug,
                "title": title,
                "subtitle": subtitle,
                "last_updated": last_updated,
                "content": content
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update policy: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/categories", methods=["POST"])
@admin_required
def create_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    icon = (data.get("icon") or "✦").strip()

    if not name:
        return jsonify({"error": "Category name is required."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM categories WHERE LOWER(name) = LOWER(%s);", (name,))
            if cur.fetchone():
                return jsonify({"error": f"Category '{name}' already exists."}), 400

            cur.execute("INSERT INTO categories (name, icon) VALUES (%s, %s);", (name, icon))
            new_id = cur.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Category '{name}' created successfully!",
            "category": {"id": new_id, "name": name, "icon": icon, "count": 0}
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to create category: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/categories/<int:category_id>", methods=["PUT"])
@admin_required
def update_category(category_id):
    data = request.get_json() or {}
    new_name = (data.get("name") or "").strip()
    new_icon = (data.get("icon") or "").strip()

    if not new_name:
        return jsonify({"error": "Category name cannot be empty."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, icon FROM categories WHERE id = %s;", (category_id,))
            current = cur.fetchone()
            if not current:
                return jsonify({"error": "Category not found."}), 404

            old_name = current["name"]

            # Check duplicate name with another id
            cur.execute("SELECT id FROM categories WHERE LOWER(name) = LOWER(%s) AND id != %s;", (new_name, category_id))
            if cur.fetchone():
                return jsonify({"error": f"Another category named '{new_name}' already exists."}), 400

            icon_to_save = new_icon if new_icon else current["icon"]
            cur.execute("UPDATE categories SET name = %s, icon = %s WHERE id = %s;", (new_name, icon_to_save, category_id))

            # If category name was renamed, update books table so books remain linked
            if old_name != new_name:
                cur.execute("UPDATE books SET category = %s WHERE category = %s;", (new_name, old_name))

        conn.commit()
        return jsonify({
            "success": True,
            "message": f"Category updated to '{new_name}' successfully!",
            "category": {"id": category_id, "name": new_name, "icon": icon_to_save}
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update category: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@admin_required
def delete_category(category_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM categories WHERE id = %s;", (category_id,))
            cat = cur.fetchone()
            if not cat:
                return jsonify({"error": "Category not found."}), 404

            cat_name = cat["name"]

            cur.execute("SELECT COUNT(*) as cnt FROM books WHERE category = %s;", (cat_name,))
            res = cur.fetchone()
            book_cnt = res["cnt"] if res else 0

            force = request.args.get("force", "false").lower() == "true"
            if book_cnt > 0 and not force:
                return jsonify({
                    "error": f"Cannot delete '{cat_name}' because {book_cnt} book(s) belong to it. Reassign or delete those books first, or confirm force delete."
                }), 400

            if book_cnt > 0 and force:
                cur.execute("UPDATE books SET category = 'General' WHERE category = %s;", (cat_name,))

            cur.execute("DELETE FROM categories WHERE id = %s;", (category_id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Category '{cat_name}' deleted successfully!"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete category: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/support", methods=["GET"])
@admin_required
def admin_get_support():
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

        return jsonify({"support": row})
    finally:
        conn.close()

@admin_bp.route("/support", methods=["PUT"])
@admin_required
def admin_update_support():
    data = request.get_json() or {}
    heading = (data.get("heading") or "Support & Care").strip()
    link_text = (data.get("link_text") or "Your Book Bag").strip()
    link_url = (data.get("link_url") or "/cart").strip()
    email = (data.get("email") or "hello@booknest.example").strip()
    hours = (data.get("hours") or "Mon – Sat: 9am – 7pm IST").strip()
    promo_tag = (data.get("promo_tag") or "Use code BOOK10").strip()
    phone = (data.get("phone") or "+91 (800) 266-5637").strip()

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO store_support (id, heading, link_text, link_url, email, hours, promo_tag, phone)
                VALUES (1, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    heading = VALUES(heading),
                    link_text = VALUES(link_text),
                    link_url = VALUES(link_url),
                    email = VALUES(email),
                    hours = VALUES(hours),
                    promo_tag = VALUES(promo_tag),
                    phone = VALUES(phone);
            """, (heading, link_text, link_url, email, hours, promo_tag, phone))
        conn.commit()
        return jsonify({"success": True, "message": "Support & Care details updated successfully in MySQL!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update support details: {str(e)}"}), 500
    finally:
        conn.close()

# -------------------------------------------------------------------------
# Customer Reviews & Testimonials Management
# -------------------------------------------------------------------------
@admin_bp.route("/reviews", methods=["GET"])
@admin_required
def admin_get_reviews():
    """Retrieve all store reviews (visible and hidden) for admin management."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, tagline, review_text, rating, avatar_text, is_visible, display_order, created_at
                FROM store_reviews
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
                    "is_visible": bool(r["is_visible"]),
                    "display_order": r.get("display_order", 0),
                    "created_at": str(r.get("created_at") or "")
                }
                for r in reviews
            ]
        })
    finally:
        conn.close()

@admin_bp.route("/reviews", methods=["POST"])
@admin_required
def admin_create_review():
    """Add a new reader review / testimonial."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    tagline = (data.get("tagline") or "").strip()
    review_text = (data.get("review_text") or "").strip()
    rating = int(data.get("rating") or 5)
    avatar_text = (data.get("avatar_text") or "").strip()
    is_visible = 1 if data.get("is_visible", True) else 0
    display_order = int(data.get("display_order") or 0)

    if not name:
        return jsonify({"error": "Reader / Reviewer name is required."}), 400
    if not review_text:
        return jsonify({"error": "Review content quote is required."}), 400
    if not tagline:
        tagline = "Verified Reader"
    if not avatar_text and name:
        avatar_text = name[0].upper()

    rating = max(1, min(5, rating))

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO store_reviews (name, tagline, review_text, rating, avatar_text, is_visible, display_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (name, tagline, review_text, rating, avatar_text, is_visible, display_order))
            review_id = cur.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Review by '{name}' added successfully!",
            "review": {
                "id": review_id,
                "name": name,
                "tagline": tagline,
                "review_text": review_text,
                "rating": rating,
                "avatar_text": avatar_text,
                "is_visible": bool(is_visible),
                "display_order": display_order
            }
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to add review: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/reviews/<int:review_id>", methods=["PUT"])
@admin_required
def admin_update_review(review_id):
    """Update an existing review."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    tagline = (data.get("tagline") or "").strip()
    review_text = (data.get("review_text") or "").strip()
    rating = int(data.get("rating") or 5)
    avatar_text = (data.get("avatar_text") or "").strip()
    is_visible = 1 if data.get("is_visible", True) else 0
    display_order = int(data.get("display_order") or 0)

    if not name or not review_text:
        return jsonify({"error": "Reader name and review text are required."}), 400
    if not tagline:
        tagline = "Verified Reader"
    if not avatar_text and name:
        avatar_text = name[0].upper()

    rating = max(1, min(5, rating))

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE store_reviews
                SET name = %s, tagline = %s, review_text = %s, rating = %s, avatar_text = %s, is_visible = %s, display_order = %s
                WHERE id = %s;
            """, (name, tagline, review_text, rating, avatar_text, is_visible, display_order, review_id))
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Review by '{name}' updated successfully!"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update review: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@admin_required
def admin_delete_review(review_id):
    """Delete a review."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM store_reviews WHERE id = %s;", (review_id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Review deleted successfully!"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete review: {str(e)}"}), 500
    finally:
        conn.close()

@admin_bp.route("/reviews/<int:review_id>/toggle-visibility", methods=["PATCH"])
@admin_required
def admin_toggle_review_visibility(review_id):
    """Toggle visibility status of a review."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT is_visible, name FROM store_reviews WHERE id = %s;", (review_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Review not found."}), 404

            new_status = 0 if row["is_visible"] else 1
            cur.execute("UPDATE store_reviews SET is_visible = %s WHERE id = %s;", (new_status, review_id))
        conn.commit()

        return jsonify({
            "success": True,
            "is_visible": bool(new_status),
            "message": f"Review by '{row['name']}' is now {'visible on storefront' if new_status else 'hidden'}."
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to toggle visibility: {str(e)}"}), 500
    finally:
        conn.close()
