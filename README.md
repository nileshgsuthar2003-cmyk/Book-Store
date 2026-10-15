# BookNest — Full-Stack React + Flask + MySQL Bookstore & Admin Portal

A full-stack, enterprise-grade e-commerce bookstore web application powered by **React 19 + Vite** on the frontend, **Python Flask** with a modular application structure on the backend, and a native **MySQL** database (`booknest_db`). Features full **Role-Based Authentication** (`Admin` and `Customer`) and a complete **Admin Management Dashboard**.

---

## 🏗 Full-Stack Architecture & Folder Structure

```
book-store-main/
├── backend/
│   ├── app/
│   │   ├── __init__.py            # Flask application factory (CORS & blueprints)
│   │   ├── utils/
│   │   │   └── auth.py            # JWT token creation, decoding & @admin_required guards
│   │   └── routes/
│   │       ├── auth.py            # /api/auth/register, /login, /me
│   │       ├── books.py           # /api/books (CRUD + /<id>/visibility toggle)
│   │       ├── admin.py           # /api/admin/users, /admin/stats, user roles
│   │       ├── orders.py          # /api/orders (creation, tracking & status updates)
│   │       └── general.py         # /api/health, /categories, /coupons, /newsletter
│   ├── config.py                  # Environment config (MySQL URI, JWT Secret)
│   ├── database.py                # PyMySQL connection pool & table migrations
│   ├── seed.py                    # Seeder with default Admin, Customer, 30 books, categories, coupons
│   ├── run.py                     # Main server entrypoint (starts on http://127.0.0.1:5000)
│   └── requirements.txt           # Flask, PyMySQL, Cryptography, PyJWT, python-dotenv
├── frontend/
│   ├── src/
│   │   ├── components/            # Header, Footer, BookCard, Toast, AuthModal
│   │   ├── context/               # AuthContext (Role auth state) & ShopContext (cart, catalog)
│   │   ├── pages/                 # Home, Shop, BookDetail, Cart, Checkout, Wishlist, AdminPanel
│   │   ├── services/
│   │   │   └── api.js             # API client with automatic Bearer token injection
│   │   ├── App.jsx                # Routing including #admin panel guard
│   │   ├── main.jsx
│   │   └── index.css              # Modern Vanilla CSS design system
│   ├── public/                    # Static assets & brand media
│   ├── index.html                 # Vite HTML entry
│   ├── vite.config.js             # Proxy config forwarding /api -> http://127.0.0.1:5000
│   └── package.json               # Frontend dependencies & scripts
├── package.json                   # Root workspace scripts runner (delegates to frontend)
└── README.md
```

---

## 🔐 Role-Based Authentication System

- **Admin Role (`admin`)**: Access to the Admin Management Dashboard (`#admin`), full catalog control (Add, Edit, Delete, Visibility toggle), user role management, order fulfillment, and financial analytics.
- **Customer Role (`user`)**: Browse public books, add to cart & wishlist, apply discount coupons, checkout, and view order receipts.
- **Secure Authentication**: Passwords hashed with `werkzeug.security` (PBKDF2-SHA256) and authenticated using signed JWT tokens with role claims.

### 🔑 Pre-Configured Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@booknest.com` | `admin123` | Full Admin Dashboard (`#admin`), Book CRUD, Visibility Toggle, User Management |
| **Customer** | `user@example.com` | `user123` | Public store shopping, cart, wishlist, checkout |

*Quick-fill demo buttons are provided in the Sign-In modal for 1-click testing!*

---

## 🛠 Admin Management Dashboard (`#admin`)

The Admin Panel includes 4 dedicated management tabs:

1. **Books Management**:
   - Live book catalog table with search and category filters.
   - **Visible / Non-Visible Toggle**: 1-click toggle button (`is_visible: 1 / 0`). When marked non-visible, the book is immediately hidden from customer searches and store listings while remaining visible in the Admin Panel.
   - **Add New Book**: Modal to create new titles with custom ISBN, category, price, publisher, description, and visibility setting.
   - **Edit Book**: Update price, inventory stock, and catalog details.
   - **Delete Book**: Remove book records with confirmation.
2. **Users Details**:
   - Table of all registered users with ID, Name, Email, Role badge, Registration Date, Total Orders placed, and Total Money Spent.
   - **Role Changer**: Promote customers to Admin or demote admins to Customer.
   - **Delete User**: Remove user accounts.
3. **Customer Orders**:
   - Real-time order tracking table with order code, customer name, items count, and order total.
   - **Status Dropdown**: Update order status (`Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
4. **Store Analytics**:
   - KPI metrics cards for Total Gross Revenue, Total Orders, Total Registered Users, and Books in Catalog.

---

## 📡 REST API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer or admin account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT token |
| `GET` | `/api/auth/me` | Logged In | Get current authenticated user profile |
| `GET` | `/api/books` | Public / Admin | List books (`is_visible = 1` for store; `include_hidden=1` for admin) |
| `POST` | `/api/books` | Admin | Add a new book to MySQL |
| `PUT` | `/api/books/<id>` | Admin | Edit an existing book |
| `PATCH`| `/api/books/<id>/visibility` | Admin | **Toggle book visibility (`is_visible: true / false`)** |
| `DELETE`| `/api/books/<id>` | Admin | Delete book from MySQL |
| `GET` | `/api/admin/users` | Admin | **List all user details, order count & total spent** |
| `PUT` | `/api/admin/users/<id>/role` | Admin | Update user role (`admin` / `user`) |
| `DELETE`| `/api/admin/users/<id>` | Admin | Delete a user account |
| `GET` | `/api/admin/stats` | Admin | Store metrics (revenue, orders, books count) |
| `GET` | `/api/orders` | Customer / Admin | List user orders or all orders if admin |
| `PUT` | `/api/orders/<id>/status` | Admin | Update order delivery status |
| `GET` | `/api/health` | Public | Server health & live database metrics |

---

## 🚀 How to Run Locally

### 1. MySQL Database Setup
Make sure your MySQL server is running (default: `127.0.0.1:3306`).
Configuration is managed in `backend/.env` (defaults to `root:root@127.0.0.1:3306/booknest_db`).

### 2. Start the Flask Backend (Terminal 1)
```bash
cd backend
python -m pip install -r requirements.txt
python seed.py   # Creates MySQL database tables & seeds initial data
python run.py    # Starts Flask server on http://127.0.0.1:5000
```

### 3. Start the React Frontend (Terminal 2)
```bash
# Option A: Run directly inside frontend
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173

# Option B: Run directly from project root
npm run dev      # Automatically delegates to frontend/
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser:
1. Click **"Sign In"** in the top header.
2. Click **"Demo: Fill Admin"** and sign in.
3. Click the **"Admin Panel"** link in the header (or navigate to `#admin`) to manage books, toggle visibility, and view all user details!

