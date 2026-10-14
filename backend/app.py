import os
import random
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db_connection, init_db

app = Flask(__name__)
# Enable CORS for all routes so React (port 5173 / localhost) can call API freely
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ensure database is initialized on startup
with app.app_context():
    init_db()

def book_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "author": row["author"],
        "cat": row["category"],
        "category": row["category"],
        "price": row["price"],
        "old": row["old_price"],
        "old_price": row["old_price"],
        "isbn": row["isbn"],
        "publisher": row["publisher"] or "BookNest Editions",
        "pages": row["pages"] or 300,
        "language": row["language"] or "English",
        "description": row["description"] or "A captivating read from BookNest.",
        "cover": row["cover_url"],
        "cover_url": row["cover_url"],
        "rating": float(row["rating"]),
        "reviews": int(row["reviews_count"]),
        "reviews_count": int(row["reviews_count"]),
        "best": bool(row["is_bestseller"]),
        "is_bestseller": bool(row["is_bestseller"]),
        "new": bool(row["is_new_arrival"]),
        "is_new_arrival": bool(row["is_new_arrival"]),
        "stock": bool(row["in_stock"]),
        "in_stock": bool(row["in_stock"])
    }

# ==============================================================================
# Health Check Endpoint
# ==============================================================================
@app.route("/api/health", methods=["GET"])
def health_check():
    conn = get_db_connection()
    book_count = conn.execute("SELECT COUNT(*) FROM books;").fetchone()[0]
    order_count = conn.execute("SELECT COUNT(*) FROM orders;").fetchone()[0]
    conn.close()
    return jsonify({
        "status": "healthy",
        "server": "Flask (Python)",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_books": book_count,
            "total_orders": order_count
        }
    })

# ==============================================================================
# Books Endpoints
# ==============================================================================
@app.route("/api/books", methods=["GET"])
def get_books():
    conn = get_db_connection()
    query = "SELECT * FROM books WHERE 1=1"
    params = []

    # Search filter (title, author, category, isbn)
    q = request.args.get("q") or request.args.get("search")
    if q and q.strip():
        search_term = f"%{q.strip().lower()}%"
        query += " AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(category) LIKE ? OR isbn LIKE ?)"
        params.extend([search_term, search_term, search_term, search_term])

    # Category filter
    category = request.args.get("category")
    if category and category.strip():
        query += " AND category = ?"
        params.append(category.strip())

    # Max price filter
    max_price = request.args.get("max_price")
    if max_price:
        try:
            query += " AND price <= ?"
            params.append(float(max_price))
        except ValueError:
            pass

    # In stock filter
    in_stock = request.args.get("in_stock")
    if in_stock in ["1", "true", "True"]:
        query += " AND in_stock = 1"

    # Bestseller filter
    if request.args.get("best") in ["1", "true", "True"] or request.args.get("bestseller") in ["1", "true", "True"]:
        query += " AND is_bestseller = 1"

    # New arrivals filter
    if request.args.get("new") in ["1", "true", "True"] or request.args.get("new_arrival") in ["1", "true", "True"]:
        query += " AND is_new_arrival = 1"

    # Sorting
    sort_by = request.args.get("sort", "featured")
    if sort_by == "low":
        query += " ORDER BY price ASC"
    elif sort_by == "high":
        query += " ORDER BY price DESC"
    elif sort_by == "rating":
        query += " ORDER BY rating DESC"
    elif sort_by == "reviews":
        query += " ORDER BY reviews_count DESC"
    else:
        query += " ORDER BY id ASC"

    # Optional Limit / Offset
    limit = request.args.get("limit")
    if limit:
        try:
            query += " LIMIT ?"
            params.append(int(limit))
            offset = request.args.get("offset", 0)
            query += " OFFSET ?"
            params.append(int(offset))
        except ValueError:
            pass

    rows = conn.execute(query, params).fetchall()
    books = [book_to_dict(row) for row in rows]
    conn.close()

    return jsonify({
        "books": books,
        "count": len(books)
    })

@app.route("/api/books/<int:book_id>", methods=["GET"])
def get_book(book_id):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM books WHERE id = ?;", (book_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Book not found"}), 404

    book = book_to_dict(row)

    # Fetch related books in the same category
    related_rows = conn.execute(
        "SELECT * FROM books WHERE category = ? AND id != ? LIMIT 5;",
        (book["category"], book_id)
    ).fetchall()
    related = [book_to_dict(r) for r in related_rows]
    conn.close()

    return jsonify({
        "book": book,
        "related": related
    })

@app.route("/api/books", methods=["POST"])
def create_book():
    data = request.get_json() or {}
    required = ["title", "author", "category", "price", "isbn"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    price = int(data["price"])
    old_price = int(data.get("old_price", price + 150))
    isbn = str(data["isbn"]).strip()
    cover_url = data.get("cover_url", f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO books (
            title, author, category, price, old_price, isbn,
            publisher, pages, language, description, cover_url,
            rating, reviews_count, is_bestseller, is_new_arrival, in_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["title"], data["author"], data["category"], price, old_price, isbn,
        data.get("publisher", "BookNest"), data.get("pages", 300), data.get("language", "English"),
        data.get("description", ""), cover_url,
        float(data.get("rating", 4.5)), int(data.get("reviews_count", 100)),
        1 if data.get("is_bestseller") else 0,
        1 if data.get("is_new_arrival") else 0,
        1 if data.get("in_stock", True) else 0
    ))
    new_id = cursor.lastrowid
    conn.commit()

    created = conn.execute("SELECT * FROM books WHERE id = ?;", (new_id,)).fetchone()
    conn.close()
    return jsonify(book_to_dict(created)), 201

# ==============================================================================
# Categories Endpoints
# ==============================================================================
@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT c.id, c.name, c.icon, COUNT(b.id) as book_count
        FROM categories c
        LEFT JOIN books b ON b.category = c.name
        GROUP BY c.id
        ORDER BY c.id ASC;
    """).fetchall()
    categories = [
        {
            "id": r["id"],
            "name": r["name"],
            "icon": r["icon"],
            "count": r["book_count"]
        }
        for r in rows
    ]
    conn.close()
    return jsonify({"categories": categories})

# ==============================================================================
# Coupons Endpoints
# ==============================================================================
@app.route("/api/coupons/validate", methods=["POST"])
def validate_coupon():
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal") or 0)

    if not code:
        return jsonify({"valid": False, "message": "Please provide a coupon code."}), 400

    conn = get_db_connection()
    coupon = conn.execute(
        "SELECT * FROM coupons WHERE code = ? AND is_active = 1;",
        (code,)
    ).fetchone()
    conn.close()

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

    # Calculate discount
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

# ==============================================================================
# Orders Endpoints
# ==============================================================================
@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json() or {}
    customer = data.get("customer") or {}
    items = data.get("items") or []
    coupon_code = (data.get("coupon") or "").strip().upper()

    if not items:
        return jsonify({"error": "Cannot create order with an empty bag."}), 400

    required_customer = ["name", "email", "phone", "address", "city", "state", "pincode"]
    for field in required_customer:
        if not customer.get(field):
            return jsonify({"error": f"Customer detail '{field}' is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Calculate subtotal and build items record from database
    order_items_record = []
    subtotal = 0.0

    for item in items:
        book_id = item.get("id") or item.get("book_id")
        qty = int(item.get("qty") or item.get("quantity") or 1)
        if qty <= 0:
            continue

        book_row = conn.execute("SELECT * FROM books WHERE id = ?;", (book_id,)).fetchone()
        if not book_row:
            conn.close()
            return jsonify({"error": f"Book with id {book_id} not found."}), 404

        price = float(book_row["price"])
        item_total = price * qty
        subtotal += item_total

        order_items_record.append({
            "book_id": book_row["id"],
            "title": book_row["title"],
            "price": price,
            "quantity": qty,
            "cover_url": book_row["cover_url"]
        })

    # Shipping rules: Free above 799, otherwise 49
    shipping_fee = 0.0 if (subtotal >= 799 or subtotal == 0) else 49.0

    # Discount verification
    discount = 0.0
    if coupon_code:
        cp_row = conn.execute("SELECT * FROM coupons WHERE code = ? AND is_active = 1;", (coupon_code,)).fetchone()
        if cp_row and subtotal >= float(cp_row["min_order"]):
            if cp_row["discount_type"] == "percent":
                discount = round(subtotal * (float(cp_row["value"]) / 100.0))
            else:
                discount = round(float(cp_row["value"]))

    total = max(0.0, subtotal + shipping_fee - discount)

    # Generate unique order reference code: BN-XXXXXX
    order_code = f"BN-{random.randint(100000, 999999)}"

    # Insert order
    cursor.execute("""
        INSERT INTO orders (
            order_code, customer_name, customer_email, customer_phone,
            delivery_address, city, state, pincode, payment_method,
            subtotal, shipping_fee, discount, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_code, customer["name"], customer["email"], customer["phone"],
        customer["address"], customer["city"], customer["state"], customer["pincode"],
        customer.get("paymentMethod", "Cash on delivery (demo)"),
        subtotal, shipping_fee, discount, total, "Confirmed"
    ))

    order_id = cursor.lastrowid

    # Insert items
    for item in order_items_record:
        cursor.execute("""
            INSERT INTO order_items (order_id, book_id, title, price, quantity, cover_url)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (order_id, item["book_id"], item["title"], item["price"], item["quantity"], item["cover_url"]))

    conn.commit()

    created_order = {
        "id": order_id,
        "order_code": order_code,
        "date": datetime.now().strftime("%d %b, %Y"),
        "customer_name": customer["name"],
        "customer_email": customer["email"],
        "customer_phone": customer["phone"],
        "address": f"{customer['address']}, {customer['city']}, {customer['state']} - {customer['pincode']}",
        "payment_method": customer.get("paymentMethod", "Cash on delivery (demo)"),
        "subtotal": subtotal,
        "shipping": shipping_fee,
        "discount": discount,
        "total": total,
        "items": [
            {
                "id": it["book_id"],
                "title": it["title"],
                "price": it["price"],
                "qty": it["quantity"],
                "cover": it["cover_url"]
            }
            for it in order_items_record
        ]
    }

    conn.close()
    return jsonify({"success": True, "order": created_order}), 201

@app.route("/api/orders", methods=["GET"])
def get_orders():
    conn = get_db_connection()
    orders_rows = conn.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 50;").fetchall()
    orders = []

    for o in orders_rows:
        items_rows = conn.execute("SELECT * FROM order_items WHERE order_id = ?;", (o["id"],)).fetchall()
        items = [
            {
                "id": it["book_id"],
                "title": it["title"],
                "price": it["price"],
                "qty": it["quantity"],
                "cover": it["cover_url"]
            }
            for it in items_rows
        ]

        orders.append({
            "id": o["id"],
            "order_code": o["order_code"],
            "date": o["created_at"],
            "customer_name": o["customer_name"],
            "customer_email": o["customer_email"],
            "customer_phone": o["customer_phone"],
            "address": f"{o['delivery_address']}, {o['city']}, {o['state']} - {o['pincode']}",
            "payment_method": o["payment_method"],
            "subtotal": float(o["subtotal"]),
            "shipping": float(o["shipping_fee"]),
            "discount": float(o["discount"]),
            "total": float(o["total"]),
            "status": o["status"],
            "items": items
        })

    conn.close()
    return jsonify({"orders": orders})

@app.route("/api/orders/<string:order_code>", methods=["GET"])
def get_order_by_code(order_code):
    conn = get_db_connection()
    o = conn.execute("SELECT * FROM orders WHERE order_code = ?;", (order_code,)).fetchone()
    if not o:
        conn.close()
        return jsonify({"error": "Order not found"}), 404

    items_rows = conn.execute("SELECT * FROM order_items WHERE order_id = ?;", (o["id"],)).fetchall()
    items = [
        {
            "id": it["book_id"],
            "title": it["title"],
            "price": it["price"],
            "qty": it["quantity"],
            "cover": it["cover_url"]
        }
        for it in items_rows
    ]

    order_data = {
        "id": o["id"],
        "order_code": o["order_code"],
        "date": o["created_at"],
        "customer_name": o["customer_name"],
        "customer_email": o["customer_email"],
        "customer_phone": o["customer_phone"],
        "address": f"{o['delivery_address']}, {o['city']}, {o['state']} - {o['pincode']}",
        "payment_method": o["payment_method"],
        "subtotal": float(o["subtotal"]),
        "shipping": float(o["shipping_fee"]),
        "discount": float(o["discount"]),
        "total": float(o["total"]),
        "status": o["status"],
        "items": items
    }
    conn.close()
    return jsonify({"order": order_data})

# ==============================================================================
# Newsletter Subscription Endpoint
# ==============================================================================
@app.route("/api/newsletter", methods=["POST"])
def subscribe_newsletter():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "Please provide a valid email address."}), 400

    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO newsletter (email) VALUES (?);", (email,))
        conn.commit()
        message = "Thank you for subscribing to BookNest newsletter!"
    except sqlite3.IntegrityError:
        message = "You are already subscribed to our reading circle!"
    finally:
        conn.close()

    return jsonify({"success": True, "message": message})

# ==============================================================================
# Wishlist Sync Endpoints
# ==============================================================================
@app.route("/api/wishlist", methods=["GET"])
def get_wishlist():
    conn = get_db_connection()
    rows = conn.execute("SELECT book_id FROM wishlist ORDER BY id DESC;").fetchall()
    ids = [r["book_id"] for r in rows]
    conn.close()
    return jsonify({"wishlist": ids})

@app.route("/api/wishlist/toggle", methods=["POST"])
def toggle_wishlist():
    data = request.get_json() or {}
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"error": "book_id required"}), 400

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM wishlist WHERE book_id = ?;", (book_id,)).fetchone()
    if existing:
        conn.execute("DELETE FROM wishlist WHERE book_id = ?;", (book_id,))
        saved = False
    else:
        conn.execute("INSERT OR IGNORE INTO wishlist (book_id) VALUES (?);", (book_id,))
        saved = True

    conn.commit()
    conn.close()
    return jsonify({"success": True, "saved": saved, "book_id": book_id})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting BookNest Flask API server on http://127.0.0.1:{port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)
