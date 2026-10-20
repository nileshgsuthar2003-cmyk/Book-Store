# BookNest — Full-Stack React + Flask + MySQL Bookstore & Admin Portal

A modern, full-stack, enterprise-grade e-commerce bookstore web application powered by **React 19 + Vite** on the frontend, **Python Flask** with modular blueprint architecture on the backend, and a native **MySQL** database (`booknest_db`). Includes full **Role-Based Authentication** (`Admin` and `Customer`), an expansive **Standalone Admin Console**, real-time stock verification, invoice printing, email OTP verification, and a side-wise scrollable customer review carousel.

---

## 📚 Key Features & Highlights

### 🛍️ Storefront & Customer Experience
- **Interactive Book Catalog**: Live search, category filtering, shelf browsing, and instant bestseller badges.
- **Side-wise Scrollable Testimonials Carousel**: "Loved by book lovers" community voices section with smooth horizontal scrolling, left/right chevron navigation, CSS scroll snapping, and mouse/touch drag support.
- **Persistent Shopping Bag & Wishlist**: Real-time quantity adjustments, localized cart caching, and promotional coupon engine (`BOOK10`, `WELCOME50`).
- **Real-Time Stock Verification**: Dual client and server-side inventory verification before checkout with dynamic stock alerts.
- **Mandatory Authentication at Checkout**: Enforced customer sign-in/registration prior to order creation to guarantee all purchases are linked to verified user accounts.
- **Full Order Details & Official Invoices**: Interactive modal with fulfillment timeline stepper, delivery address, itemized books breakdown, and print-optimized **Print Invoice** and **Print Receipt** styled for A4 paper.
- **Forgot Password with Email OTP Verification**: 3-step secure password reset workflow (Request OTP -> Verify 6-digit OTP code -> Set new password).

### 🛠️ Standalone Admin Console (`/admin`)
- **Dashboard Overview (`/admin` / `/admin/overview`)**:
  - Store analytics KPI cards: Total Revenue, Total Orders, Catalog Books, and Registered Users.
  - **Recent 10 Orders Table**: Instant snapshot of the 10 most recent transactions with status updater and order inspection modal.
- **Books Catalog (`/admin/books`)**:
  - Add, edit, and delete book records with ISBN, category, price, publisher, description, and inventory stock.
  - **1-Click Visibility Toggle (`is_visible`)**: Instantly show or hide books from public store listings without deleting data.
  - **1-Click Bestseller Toggle (`is_bestseller`)**: Feature books directly on homepage showcases.
- **Customer Orders (`/admin/orders`)**:
  - Real-time order tracking table with order reference, customer details, item counts, and totals.
  - Live status dropdown (`Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- **User Accounts (`/admin/users`)**:
  - Comprehensive user directory with registration dates, lifetime order count, and total spend.
  - Role changer (Promote to Admin / Demote to Customer) and account deletion.
- **Customer Reviews (`/admin/reviews`)**:
  - Dedicated testimonial management page with summary statistics and visibility filters.
  - Interactive Add/Edit Review modal with real-time live card preview matching the storefront layout.
- **Storefront & Promotions Management**:
  - **Top Announcement Banner (`/admin/announcement`)**: Customizable banner text, highlight chips, background color themes, and presets.
  - **Homepage Hero Banner (`/admin/hero`)**: Customizable headline, subheadings, CTA buttons, and badges.
  - **Store Categories (`/admin/categories`)**: Create, update, and manage categories and icons.
  - **Legal Policies (`/admin/policies`)**: Clause-by-clause editor for Terms & Conditions and Privacy Policy.
  - **Support & Care (`/admin/support`)**: Dynamic contact details, phone, support hours, and promo tags.

---

## 🏗 Full-Stack Architecture & Folder Structure

```
book-store-main/
├── backend/
│   ├── app/
│   │   ├── __init__.py            # Flask application factory (CORS & blueprints)
│   │   ├── utils/
│   │   │   └── auth.py            # JWT token creation, decoding, @token_required & @admin_required guards
│   │   └── routes/
│   │       ├── auth.py            # /api/auth (login, register, forgot-password, OTP, profile)
│   │       ├── books.py           # /api/books (CRUD, visibility & bestseller toggles, stock verification)
│   │       ├── orders.py          # /api/orders (creation, tracking, status updates)
│   │       ├── admin.py           # /api/admin (stats, users, reviews, hero, announcement, policies, support)
│   │       └── general.py         # /api/health, categories, coupons, reviews, newsletter
│   ├── config.py                  # Environment config (MySQL connection, JWT Secret, Mail settings)
│   ├── database.py                # PyMySQL pool, table migrations & schema initialization
│   ├── seed.py                    # Seeder script (Admin, Customer, 30 books, categories, coupons, reviews)
│   ├── run.py                     # Main server entrypoint (starts on http://127.0.0.1:5000)
│   ├── requirements.txt           # Flask, PyMySQL, Cryptography, PyJWT, python-dotenv
│   └── .env.example               # Database & application environment template
├── frontend/
│   ├── src/
│   │   ├── components/            # Header, Footer, BookCard, Toast, AuthModal, OrderDetailsModal
│   │   ├── context/               # AuthContext (JWT auth state) & ShopContext (cart, catalog, reviews)
│   │   ├── pages/                 # Home, Shop, BookDetail, Cart, Checkout, OrderConfirmation, Profile, Wishlist, LegalPage, AdminPanel
│   │   ├── services/
│   │   │   └── api.js             # Centralized API service with Bearer token injection
│   │   ├── App.jsx                # Client routing & authentication guards
│   │   ├── main.jsx               # React DOM root entry
│   │   └── index.css              # Custom Vanilla CSS BookNest design system
│   ├── public/                    # Static assets & brand media
│   ├── index.html                 # HTML entry point
│   ├── vite.config.js             # Vite config forwarding /api requests to http://127.0.0.1:5000
│   └── package.json               # Frontend dependencies & npm scripts
├── package.json                   # Root workspace scripts runner
└── README.md                      # Documentation
```

---

## 🔐 Role-Based Authentication System

- **Admin Role (`admin`)**: Access to the Standalone Admin Portal (`/admin`), full catalog management, order fulfillment, financial analytics, customer accounts, and site content settings.
- **Customer Role (`user`)**: Browse books, manage cart & wishlist, apply promo coupons, checkout with mandatory account security, track order history, and print invoices.
- **Security Standards**: Passwords securely hashed using `werkzeug.security` (PBKDF2-SHA256) and verified via signed JSON Web Tokens (JWT) with bearer authorization headers.

### 🔑 Pre-Configured Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@booknest.com` | `admin123` | Full Admin Console (`/admin`), Catalog CRUD, Order Manager, User Roles, Content CMS |
| **Customer** | `user@example.com` | `user123` | Public store shopping, cart, wishlist, checkout, profile order tracking |

*Quick-fill demo buttons are provided in the Sign-In modal for 1-click testing!*

---

## 📡 REST API Reference

### 1. Authentication & Account (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT token |
| `POST` | `/api/auth/send-otp` | Public | Send 6-digit email OTP for password reset |
| `POST` | `/api/auth/reset-password` | Public | Verify OTP code and reset account password |
| `GET` | `/api/auth/me` | Logged In | Get authenticated user profile details |
| `PUT` | `/api/auth/profile` | Logged In | Update user profile and shipping address |

### 2. Catalog & Books (`/api/books`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/books` | Public / Admin | List books (`is_visible = 1` for store; `include_hidden=1` for admin) |
| `GET` | `/api/books/<id>` | Public | Get single book details |
| `POST` | `/api/books` | Admin | Add a new book to the catalog |
| `PUT` | `/api/books/<id>` | Admin | Update an existing book's details |
| `PATCH`| `/api/books/<id>/visibility` | Admin | Toggle book visibility (`is_visible: 1 / 0`) |
| `PATCH`| `/api/books/<id>/bestseller` | Admin | Toggle bestseller badge status |
| `DELETE`| `/api/books/<id>` | Admin | Delete book record from database |

### 3. Orders & Checkout (`/api/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Logged In | Place new customer order (mandates authentication) |
| `POST` | `/api/orders/check-stock` | Public | Verify stock availability for items in cart |
| `GET` | `/api/orders` | Logged In / Admin | List customer's orders (or all orders if admin) |
| `GET` | `/api/orders/<order_code>` | Logged In / Admin | Fetch full order details by order reference |
| `PUT` | `/api/orders/<id>/status` | Admin | Update order delivery status |

### 4. Admin Portal (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Get revenue, order counts, and catalog stats |
| `GET` | `/api/admin/users` | Admin | List all registered users with order count and total spend |
| `PUT` | `/api/admin/users/<id>/role` | Admin | Update user role (`admin` / `user`) |
| `DELETE`| `/api/admin/users/<id>` | Admin | Delete user account |
| `GET` | `/api/admin/reviews` | Admin | List all customer testimonials |
| `POST` | `/api/admin/reviews` | Admin | Create new customer review |
| `PUT` | `/api/admin/reviews/<id>` | Admin | Edit customer review |
| `DELETE`| `/api/admin/reviews/<id>` | Admin | Delete customer review |
| `PATCH`| `/api/admin/reviews/<id>/toggle-visibility` | Admin | Toggle review visibility on homepage |
| `GET` | `/api/admin/announcement` | Admin | Fetch top announcement banner configuration |
| `PUT` | `/api/admin/announcement` | Admin | Update top announcement banner settings |
| `GET` | `/api/admin/hero` | Admin | Fetch homepage hero section content |
| `PUT` | `/api/admin/hero` | Admin | Update homepage hero section content |
| `PUT` | `/api/admin/policies/<slug>` | Admin | Update Terms (`terms`) or Privacy (`privacy`) policy |
| `POST` | `/api/admin/categories` | Admin | Create new store category |
| `PUT` | `/api/admin/categories/<id>` | Admin | Update category name and icon |
| `DELETE`| `/api/admin/categories/<id>` | Admin | Delete store category |
| `GET` | `/api/admin/support` | Admin | Fetch support contact details |
| `PUT` | `/api/admin/support` | Admin | Update support contact details |

### 5. General & Public Storefront (`/api`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Check backend server & MySQL connection status |
| `GET` | `/api/categories` | Public | List all store book categories |
| `GET` | `/api/reviews` | Public | List visible customer reviews for homepage carousel |
| `GET` | `/api/announcement` | Public | Get active announcement banner |
| `GET` | `/api/hero` | Public | Get active homepage hero configuration |
| `GET` | `/api/policies/<slug>` | Public | Get Terms or Privacy policy content |
| `GET` | `/api/support` | Public | Get support contact info |
| `POST` | `/api/coupons/validate` | Public | Validate promotional discount code |
| `POST` | `/api/newsletter` | Public | Subscribe email to bookstore newsletter |

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher)
- **MySQL Server** (running locally on `127.0.0.1:3306`)

### 2. MySQL Database Configuration
Ensure MySQL is running. In `backend/.env` (or copying from `backend/.env.example`), verify your credentials:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=booknest_db
JWT_SECRET=your_secret_key_here
```

### 3. Start the Flask Backend (Terminal 1)
```bash
cd backend
python -m pip install -r requirements.txt
python seed.py   # Creates MySQL database tables & seeds default books, users, and reviews
python run.py    # Starts Flask API server on http://127.0.0.1:5000
```

### 4. Start the React Frontend (Terminal 2)
```bash
# Option A: From frontend directory
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173

# Option B: From project root directory
npm run dev      # Automatically delegates to frontend/
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser:
1. **Browse as Customer**: Add books to the bag, view the side-wise scrollable customer reviews carousel, and explore categories.
2. **Checkout**: When clicking **"Proceed to checkout"**, sign in or create an account to finalize your order.
3. **Admin Portal**: Sign in with `admin@booknest.com` / `admin123` and click **"Admin Panel"** (or visit `http://localhost:5173/admin`) to manage orders, books, reviews, policies, and site content!
