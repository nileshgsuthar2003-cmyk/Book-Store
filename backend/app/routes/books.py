from flask import Blueprint, request, jsonify
from database import get_db_connection
from app.utils.auth import admin_required, optional_token

books_bp = Blueprint("books", __name__, url_prefix="/api/books")

def book_row_to_dict(row):
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
        "rating": float(row["rating"]) if row["rating"] is not None else 4.5,
        "reviews": int(row["reviews_count"]) if row["reviews_count"] is not None else 100,
        "reviews_count": int(row["reviews_count"]) if row["reviews_count"] is not None else 100,
        "best": bool(row["is_bestseller"]),
        "is_bestseller": bool(row["is_bestseller"]),
        "new": bool(row["is_new_arrival"]),
        "is_new_arrival": bool(row["is_new_arrival"]),
        "stock": bool(row["in_stock"]),
        "in_stock": bool(row["in_stock"]),
        "is_visible": bool(row.get("is_visible", 1)),
        "units_sold": int(row.get("units_sold") or 0),
        "times_sold": int(row.get("times_sold") or 0),
        "created_at": str(row.get("created_at", ""))
    }

@books_bp.route("", methods=["GET"])
@optional_token
def get_books():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            query = """
                SELECT b.*,
                       COALESCE(sales.units_sold, 0) as units_sold,
                       COALESCE(sales.times_sold, 0) as times_sold
                FROM books b
                LEFT JOIN (
                    SELECT book_id, SUM(quantity) as units_sold, COUNT(DISTINCT order_id) as times_sold
                    FROM order_items
                    GROUP BY book_id
                ) sales ON sales.book_id = b.id
                WHERE 1=1
            """
            params = []

            # Visibility check:
            # If the user is an admin and explicitly passes include_hidden=1, show all books.
            # Otherwise, regular customers ONLY see visible books (is_visible = 1)
            is_admin = bool(getattr(request, "user", None) and request.user.get("role") == "admin")
            include_hidden = request.args.get("include_hidden") in ["1", "true", "True"] and is_admin

            if not include_hidden:
                query += " AND b.is_visible = 1"

            # Search filter
            q = request.args.get("q") or request.args.get("search")
            if q and q.strip():
                term = f"%{q.strip().lower()}%"
                query += " AND (LOWER(b.title) LIKE %s OR LOWER(b.author) LIKE %s OR LOWER(b.category) LIKE %s OR b.isbn LIKE %s)"
                params.extend([term, term, term, term])

            # Category filter
            category = request.args.get("category")
            if category and category.strip():
                query += " AND b.category = %s"
                params.append(category.strip())

            # Max price filter
            max_price = request.args.get("max_price")
            if max_price:
                try:
                    query += " AND b.price <= %s"
                    params.append(float(max_price))
                except ValueError:
                    pass

            # In stock filter
            if request.args.get("in_stock") in ["1", "true", "True"]:
                query += " AND b.in_stock = 1"

            # Bestseller filter
            if request.args.get("best") in ["1", "true", "True"] or request.args.get("bestseller") in ["1", "true", "True"]:
                query += " AND b.is_bestseller = 1"

            # New arrival filter
            if request.args.get("new") in ["1", "true", "True"] or request.args.get("new_arrival") in ["1", "true", "True"]:
                query += " AND b.is_new_arrival = 1"

            # Sorting
            sort_by = request.args.get("sort", "featured")
            if sort_by in ["sold", "sales", "bestselling"]:
                query += " ORDER BY units_sold DESC, b.id ASC"
            elif sort_by == "low":
                query += " ORDER BY b.price ASC"
            elif sort_by == "high":
                query += " ORDER BY b.price DESC"
            elif sort_by == "rating":
                query += " ORDER BY b.rating DESC"
            elif sort_by == "reviews":
                query += " ORDER BY b.reviews_count DESC"
            else:
                query += " ORDER BY b.id ASC"

            # Limit & offset
            limit = request.args.get("limit")
            if limit:
                try:
                    query += " LIMIT %s"
                    params.append(int(limit))
                except ValueError:
                    pass

            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        books = [book_row_to_dict(r) for r in rows]
        return jsonify({"books": books, "count": len(books)})
    finally:
        conn.close()

@books_bp.route("/<int:book_id>", methods=["GET"])
@optional_token
def get_book_by_id(book_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM books WHERE id = %s;", (book_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Book not found."}), 404

            # Non-admins cannot see non-visible books directly
            is_admin = bool(getattr(request, "user", None) and request.user.get("role") == "admin")
            if not row.get("is_visible", 1) and not is_admin:
                return jsonify({"error": "This book is currently unavailable."}), 404

            book = book_row_to_dict(row)

            # Fetch related visible books
            cur.execute("""
                SELECT * FROM books
                WHERE category = %s AND id != %s AND is_visible = 1
                LIMIT 5;
            """, (book["category"], book_id))
            related_rows = cur.fetchall()
            related = [book_row_to_dict(r) for r in related_rows]

        return jsonify({"book": book, "related": related})
    finally:
        conn.close()

@books_bp.route("", methods=["POST"])
@admin_required
def create_book():
    data = request.get_json() or {}
    required = ["title", "author", "category", "price", "isbn"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Field '{field}' is required."}), 400

    price = int(data["price"])
    old_price = int(data.get("old_price", price + 150))
    isbn = str(data["isbn"]).strip()
    cover_url = data.get("cover_url") or f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"
    is_visible = 1 if data.get("is_visible", True) else 0

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO books (
                    title, author, category, price, old_price, isbn,
                    publisher, pages, language, description, cover_url,
                    rating, reviews_count, is_bestseller, is_new_arrival, in_stock, is_visible
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                data["title"], data["author"], data["category"], price, old_price, isbn,
                data.get("publisher", "BookNest Editions"), int(data.get("pages", 300)),
                data.get("language", "English"), data.get("description", ""), cover_url,
                float(data.get("rating", 4.5)), int(data.get("reviews_count", 100)),
                1 if data.get("is_bestseller") else 0,
                1 if data.get("is_new_arrival") else 0,
                1 if data.get("in_stock", True) else 0,
                is_visible
            ))
            new_id = cur.lastrowid
        conn.commit()

        with conn.cursor() as cur:
            cur.execute("SELECT * FROM books WHERE id = %s;", (new_id,))
            created = cur.fetchone()

        return jsonify({
            "success": True,
            "message": f"Book '{data['title']}' created successfully!",
            "book": book_row_to_dict(created)
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to create book: {str(e)}"}), 500
    finally:
        conn.close()

@books_bp.route("/<int:book_id>", methods=["PUT"])
@admin_required
def update_book(book_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM books WHERE id = %s;", (book_id,))
            existing = cur.fetchone()
            if not existing:
                return jsonify({"error": "Book not found."}), 404

            title = data.get("title", existing["title"])
            author = data.get("author", existing["author"])
            category = data.get("category", existing["category"])
            price = int(data.get("price", existing["price"]))
            old_price = int(data.get("old_price", existing["old_price"]))
            isbn = data.get("isbn", existing["isbn"])
            publisher = data.get("publisher", existing["publisher"])
            pages = int(data.get("pages", existing["pages"]))
            language = data.get("language", existing["language"])
            description = data.get("description", existing["description"])
            cover_url = data.get("cover_url", existing["cover_url"])
            rating = float(data.get("rating", existing["rating"]))
            reviews_count = int(data.get("reviews_count", existing["reviews_count"]))
            is_bestseller = 1 if data.get("is_bestseller", existing["is_bestseller"]) else 0
            is_new_arrival = 1 if data.get("is_new_arrival", existing["is_new_arrival"]) else 0
            in_stock = 1 if data.get("in_stock", existing["in_stock"]) else 0
            is_visible = 1 if data.get("is_visible", existing.get("is_visible", 1)) else 0

            cur.execute("""
                UPDATE books SET
                    title = %s, author = %s, category = %s, price = %s, old_price = %s, isbn = %s,
                    publisher = %s, pages = %s, language = %s, description = %s, cover_url = %s,
                    rating = %s, reviews_count = %s, is_bestseller = %s, is_new_arrival = %s,
                    in_stock = %s, is_visible = %s
                WHERE id = %s;
            """, (
                title, author, category, price, old_price, isbn,
                publisher, pages, language, description, cover_url,
                rating, reviews_count, is_bestseller, is_new_arrival,
                in_stock, is_visible, book_id
            ))
        conn.commit()

        with conn.cursor() as cur:
            cur.execute("SELECT * FROM books WHERE id = %s;", (book_id,))
            updated = cur.fetchone()

        return jsonify({
            "success": True,
            "message": "Book updated successfully!",
            "book": book_row_to_dict(updated)
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update book: {str(e)}"}), 500
    finally:
        conn.close()

@books_bp.route("/<int:book_id>/visibility", methods=["PATCH"])
@admin_required
def toggle_book_visibility(book_id):
    """Toggle or set book visibility between visible (1) and non-visible (0)."""
    data = request.get_json() or {}
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, is_visible FROM books WHERE id = %s;", (book_id,))
            book = cur.fetchone()
            if not book:
                return jsonify({"error": "Book not found."}), 404

            # If explicit is_visible boolean/int passed, use it, else toggle
            if "is_visible" in data:
                new_visible = 1 if data["is_visible"] else 0
            else:
                new_visible = 0 if book["is_visible"] else 1

            cur.execute("UPDATE books SET is_visible = %s WHERE id = %s;", (new_visible, book_id))
        conn.commit()

        status_label = "visible to customers" if new_visible else "hidden (non-visible) from customers"
        return jsonify({
            "success": True,
            "book_id": book_id,
            "is_visible": bool(new_visible),
            "message": f"Book '{book['title']}' is now {status_label}."
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update visibility: {str(e)}"}), 500
    finally:
        conn.close()

@books_bp.route("/<int:book_id>/bestseller", methods=["PATCH"])
@admin_required
def toggle_book_bestseller(book_id):
    """Toggle or set whether a book is marked as a Bestseller."""
    data = request.get_json() or {}
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, is_bestseller FROM books WHERE id = %s;", (book_id,))
            book = cur.fetchone()
            if not book:
                return jsonify({"error": "Book not found."}), 404

            # If explicit boolean passed, use it, else toggle
            if "is_bestseller" in data:
                new_bestseller = 1 if data["is_bestseller"] else 0
            else:
                new_bestseller = 0 if book["is_bestseller"] else 1

            cur.execute("UPDATE books SET is_bestseller = %s WHERE id = %s;", (new_bestseller, book_id))
        conn.commit()

        status_label = "marked as Bestseller ⭐" if new_bestseller else "removed from Bestsellers"
        return jsonify({
            "success": True,
            "book_id": book_id,
            "is_bestseller": bool(new_bestseller),
            "message": f"Book '{book['title']}' is now {status_label}."
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update bestseller status: {str(e)}"}), 500
    finally:
        conn.close()

@books_bp.route("/<int:book_id>", methods=["DELETE"])
@admin_required
def delete_book(book_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title FROM books WHERE id = %s;", (book_id,))
            book = cur.fetchone()
            if not book:
                return jsonify({"error": "Book not found."}), 404

            cur.execute("DELETE FROM books WHERE id = %s;", (book_id,))
        conn.commit()
        return jsonify({
            "success": True,
            "message": f"Book '{book['title']}' deleted successfully!"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete book: {str(e)}"}), 500
    finally:
        conn.close()
