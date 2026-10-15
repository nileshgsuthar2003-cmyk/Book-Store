import random
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db_connection
from app.utils.auth import optional_token, admin_required

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

@orders_bp.route("", methods=["POST"])
@optional_token
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
    try:
        with conn.cursor() as cur:
            # Calculate verified subtotal and construct items record
            order_items_record = []
            subtotal = 0.0

            for item in items:
                book_id = item.get("id") or item.get("book_id")
                qty = int(item.get("qty") or item.get("quantity") or 1)
                if qty <= 0:
                    continue

                cur.execute("SELECT * FROM books WHERE id = %s;", (book_id,))
                book_row = cur.fetchone()
                if not book_row:
                    return jsonify({"error": f"Book with id {book_id} not found."}), 404

                # Real-time stock verification
                if not bool(book_row.get("in_stock", 1)):
                    return jsonify({
                        "error": f"Sorry, '{book_row['title']}' is currently out of stock. Please remove it from your book bag to proceed."
                    }), 400

                price = float(book_row["price"])
                subtotal += price * qty

                order_items_record.append({
                    "book_id": book_row["id"],
                    "title": book_row["title"],
                    "price": price,
                    "quantity": qty,
                    "cover_url": book_row["cover_url"]
                })

            # Shipping rules: Free above 799, otherwise 49
            shipping_fee = 0.0 if (subtotal >= 799 or subtotal == 0) else 49.0

            # Coupon discount calculation
            discount = 0.0
            if coupon_code:
                cur.execute("SELECT * FROM coupons WHERE code = %s AND is_active = 1;", (coupon_code,))
                cp_row = cur.fetchone()
                if cp_row and subtotal >= float(cp_row["min_order"]):
                    if cp_row["discount_type"] == "percent":
                        discount = round(subtotal * (float(cp_row["value"]) / 100.0))
                    else:
                        discount = round(float(cp_row["value"]))

            total = max(0.0, subtotal + shipping_fee - discount)
            order_code = f"BN-{random.randint(100000, 999999)}"

            # If logged in user, associate user_id
            user_id = request.user["id"] if getattr(request, "user", None) else None

            # Insert order into MySQL
            cur.execute("""
                INSERT INTO orders (
                    order_code, user_id, customer_name, customer_email, customer_phone,
                    delivery_address, city, state, pincode, payment_method,
                    subtotal, shipping_fee, discount, total, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Confirmed');
            """, (
                order_code, user_id, customer["name"], customer["email"], customer["phone"],
                customer["address"], customer["city"], customer["state"], customer["pincode"],
                customer.get("paymentMethod", "Cash on delivery (demo)"),
                subtotal, shipping_fee, discount, total
            ))
            order_id = cur.lastrowid

            # If user checked save address, update user record in MySQL
            if user_id and customer.get("saveAddress"):
                cur.execute("""
                    UPDATE users
                    SET phone = %s, address = %s, city = %s, state = %s, pincode = %s
                    WHERE id = %s;
                """, (
                    customer.get("phone", ""),
                    customer.get("address", ""),
                    customer.get("city", ""),
                    customer.get("state", ""),
                    customer.get("pincode", ""),
                    user_id
                ))

            # Insert order line items
            for item in order_items_record:
                cur.execute("""
                    INSERT INTO order_items (order_id, book_id, title, price, quantity, cover_url)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, (order_id, item["book_id"], item["title"], item["price"], item["quantity"], item["cover_url"]))

        conn.commit()

        created_order = {
            "id": order_id,
            "order_code": order_code,
            "date": datetime.now().strftime("%d %b, %Y"),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "customer_name": customer["name"],
            "name": customer["name"],
            "customer_email": customer["email"],
            "email": customer["email"],
            "customer_phone": customer["phone"],
            "phone": customer["phone"],
            "address": f"{customer['address']}, {customer['city']}, {customer['state']} - {customer['pincode']}",
            "delivery_address": customer.get("address", ""),
            "city": customer.get("city", ""),
            "state": customer.get("state", ""),
            "pincode": customer.get("pincode", ""),
            "payment_method": customer.get("paymentMethod", "Cash on delivery"),
            "paymentMethod": customer.get("paymentMethod", "Cash on delivery"),
            "subtotal": subtotal,
            "shipping": shipping_fee,
            "shipping_fee": shipping_fee,
            "discount": discount,
            "total": total,
            "status": "Confirmed",
            "items": [
                {
                    "id": it["book_id"],
                    "book_id": it["book_id"],
                    "title": it["title"],
                    "price": it["price"],
                    "qty": it["quantity"],
                    "quantity": it["quantity"],
                    "cover": it["cover_url"],
                    "cover_url": it["cover_url"]
                }
                for it in order_items_record
            ]
        }
        return jsonify({"success": True, "order": created_order}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to place order: {str(e)}"}), 500
    finally:
        conn.close()

@orders_bp.route("", methods=["GET"])
@optional_token
def get_orders():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            user = getattr(request, "user", None)
            is_admin = bool(user and user.get("role") == "admin")

            if is_admin:
                # Admins see all orders
                cur.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 100;")
            elif user:
                # Regular logged-in user sees their orders
                cur.execute("SELECT * FROM orders WHERE user_id = %s OR customer_email = %s ORDER BY id DESC;", (user["id"], user["email"]))
            else:
                return jsonify({"orders": []})

            order_rows = cur.fetchall()
            orders = []

            for o in order_rows:
                cur.execute("SELECT * FROM order_items WHERE order_id = %s;", (o["id"],))
                item_rows = cur.fetchall()

                orders.append({
                    "id": o["id"],
                    "order_code": o["order_code"],
                    "date": str(o["created_at"]),
                    "created_at": str(o["created_at"]),
                    "customer_name": o["customer_name"],
                    "customer_email": o["customer_email"],
                    "customer_phone": o["customer_phone"],
                    "address": f"{o['delivery_address']}, {o['city']}, {o['state']} - {o['pincode']}",
                    "delivery_address": o.get("delivery_address") or "",
                    "city": o.get("city") or "",
                    "state": o.get("state") or "",
                    "pincode": o.get("pincode") or "",
                    "payment_method": o["payment_method"],
                    "subtotal": float(o["subtotal"]),
                    "shipping": float(o["shipping_fee"]),
                    "discount": float(o["discount"]),
                    "total": float(o["total"]),
                    "status": o["status"],
                    "items": [
                        {
                            "id": it["book_id"],
                            "title": it["title"],
                            "price": float(it["price"]),
                            "qty": it["quantity"],
                            "quantity": it["quantity"],
                            "cover": it["cover_url"],
                            "cover_url": it["cover_url"]
                        }
                        for it in item_rows
                    ]
                })

        return jsonify({"orders": orders})
    finally:
        conn.close()

@orders_bp.route("/<string:order_code>", methods=["GET"])
def get_order_by_code(order_code):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM orders WHERE order_code = %s;", (order_code,))
            o = cur.fetchone()
            if not o:
                return jsonify({"error": "Order not found."}), 404

            cur.execute("SELECT * FROM order_items WHERE order_id = %s;", (o["id"],))
            item_rows = cur.fetchall()

            order_data = {
                "id": o["id"],
                "order_code": o["order_code"],
                "date": str(o["created_at"]),
                "created_at": str(o["created_at"]),
                "customer_name": o["customer_name"],
                "customer_email": o["customer_email"],
                "customer_phone": o["customer_phone"],
                "address": f"{o['delivery_address']}, {o['city']}, {o['state']} - {o['pincode']}",
                "delivery_address": o.get("delivery_address") or "",
                "city": o.get("city") or "",
                "state": o.get("state") or "",
                "pincode": o.get("pincode") or "",
                "payment_method": o["payment_method"],
                "subtotal": float(o["subtotal"]),
                "shipping": float(o["shipping_fee"]),
                "discount": float(o["discount"]),
                "total": float(o["total"]),
                "status": o["status"],
                "items": [
                    {
                        "id": it["book_id"],
                        "title": it["title"],
                        "price": float(it["price"]),
                        "qty": it["quantity"],
                        "quantity": it["quantity"],
                        "cover": it["cover_url"],
                        "cover_url": it["cover_url"]
                    }
                    for it in item_rows
                ]
            }
        return jsonify({"order": order_data})
    finally:
        conn.close()

@orders_bp.route("/<int:order_id>/status", methods=["PUT"])
@admin_required
def update_order_status(order_id):
    data = request.get_json() or {}
    status = data.get("status")
    allowed = ["Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"]
    if status not in allowed:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(allowed)}"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE orders SET status = %s WHERE id = %s;", (status, order_id))
        conn.commit()
        return jsonify({"success": True, "message": f"Order #{order_id} status updated to {status}."})
    finally:
        conn.close()

@orders_bp.route("/check-stock", methods=["POST"])
def check_stock():
    data = request.get_json() or {}
    items = data.get("items") or []
    if not items:
        return jsonify({"valid": True, "out_of_stock": []})

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            out_of_stock = []
            for it in items:
                b_id = it.get("id") or it.get("book_id")
                cur.execute("SELECT id, title, in_stock FROM books WHERE id = %s;", (b_id,))
                row = cur.fetchone()
                if not row or not bool(row.get("in_stock", 1)):
                    out_of_stock.append({
                        "id": b_id,
                        "title": row["title"] if row else f"Book #{b_id}"
                    })

            if out_of_stock:
                titles = ", ".join([f"'{b['title']}'" for b in out_of_stock])
                return jsonify({
                    "valid": False,
                    "out_of_stock": out_of_stock,
                    "error": f"Sorry, {titles} {'is' if len(out_of_stock) == 1 else 'are'} currently out of stock. Please remove from your bag to continue."
                }), 400

            return jsonify({"valid": True, "out_of_stock": []})
    finally:
        conn.close()
