import json
import pymysql
import pymysql.cursors
from config import Config

def get_server_connection():
    """Connect to MySQL server without selecting a database."""
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

def get_db_connection():
    """Connect to specific booknest_db MySQL database."""
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

def init_db():
    """Initialize database and all required tables in MySQL."""
    # Step 1: Ensure database exists
    conn_server = get_server_connection()
    with conn_server.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn_server.commit()
    conn_server.close()

    # Step 2: Create tables in database
    conn = get_db_connection()
    with conn.cursor() as cur:
        # Users Table (Role-based authentication & Saved Address)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(191) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            phone VARCHAR(30) NULL,
            address TEXT NULL,
            city VARCHAR(100) NULL,
            state VARCHAR(100) NULL,
            pincode VARCHAR(20) NULL,
            country VARCHAR(100) DEFAULT 'India',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Add profile and address columns if table already existed without them
        for col_stmt in [
            "ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL;",
            "ALTER TABLE users ADD COLUMN address TEXT NULL;",
            "ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL;",
            "ALTER TABLE users ADD COLUMN state VARCHAR(100) NULL;",
            "ALTER TABLE users ADD COLUMN pincode VARCHAR(20) NULL;",
            "ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'India';"
        ]:
            try:
                cur.execute(col_stmt)
            except Exception:
                pass  # Already exists

        # Books Table (Includes is_visible flag)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            price INT NOT NULL,
            old_price INT NOT NULL,
            isbn VARCHAR(50) NOT NULL,
            publisher VARCHAR(150) DEFAULT 'BookNest Editions',
            pages INT DEFAULT 300,
            language VARCHAR(50) DEFAULT 'English',
            description TEXT,
            cover_url VARCHAR(500),
            rating DECIMAL(3, 1) DEFAULT 4.5,
            reviews_count INT DEFAULT 100,
            is_bestseller TINYINT(1) DEFAULT 0,
            is_new_arrival TINYINT(1) DEFAULT 0,
            in_stock TINYINT(1) DEFAULT 1,
            is_visible TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Add is_visible column if table already existed without it
        try:
            cur.execute("ALTER TABLE books ADD COLUMN is_visible TINYINT(1) DEFAULT 1;")
        except Exception:
            pass  # Already exists

        # Categories Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            icon VARCHAR(20) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Coupons Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_type ENUM('percent', 'fixed') NOT NULL,
            value DECIMAL(10, 2) NOT NULL,
            min_order DECIMAL(10, 2) DEFAULT 0.00,
            description VARCHAR(255),
            is_active TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Orders Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_code VARCHAR(50) NOT NULL UNIQUE,
            user_id INT NULL,
            customer_name VARCHAR(150) NOT NULL,
            customer_email VARCHAR(191) NOT NULL,
            customer_phone VARCHAR(30) NOT NULL,
            delivery_address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            pincode VARCHAR(20) NOT NULL,
            payment_method VARCHAR(100) NOT NULL,
            subtotal DECIMAL(10, 2) NOT NULL,
            shipping_fee DECIMAL(10, 2) NOT NULL,
            discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            total DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Order Items Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            book_id INT NULL,
            title VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            quantity INT NOT NULL,
            cover_url VARCHAR(500),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Newsletter Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS newsletter (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(191) NOT NULL UNIQUE,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Wishlist Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS wishlist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            book_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Email OTPs Table (For account creation and email verification)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS email_otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(191) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            purpose VARCHAR(50) DEFAULT 'register',
            is_used TINYINT(1) DEFAULT 0,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email_otp (email, otp_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Store Announcement Top Banner Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS store_announcement (
            id INT PRIMARY KEY DEFAULT 1,
            is_enabled TINYINT(1) DEFAULT 1,
            lead_text VARCHAR(255) DEFAULT 'A little something for your next chapter',
            separator_symbol VARCHAR(10) DEFAULT '—',
            highlight_text VARCHAR(255) DEFAULT 'Save up to 40% on selected reads',
            tag_text VARCHAR(255) DEFAULT '✦ Free shipping on orders over ₹799',
            bg_theme VARCHAR(50) DEFAULT 'navy',
            link_url VARCHAR(255) DEFAULT '/shop',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Ensure default announcement row exists
        cur.execute("""
        INSERT IGNORE INTO store_announcement 
        (id, is_enabled, lead_text, separator_symbol, highlight_text, tag_text, bg_theme, link_url)
        VALUES (1, 1, 'A little something for your next chapter', '—', 'Save up to 40% on selected reads', '✦ Free shipping on orders over ₹799', 'navy', '/shop');
        """)

        # Store Homepage Hero Banner Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS store_hero (
            id INT PRIMARY KEY DEFAULT 1,
            eyebrow VARCHAR(255) DEFAULT 'A world between the pages',
            title_prefix VARCHAR(255) DEFAULT 'Your next great read',
            title_highlight VARCHAR(255) DEFAULT 'starts here.',
            description TEXT,
            primary_btn_text VARCHAR(100) DEFAULT 'Explore Books',
            primary_btn_url VARCHAR(255) DEFAULT '/shop',
            secondary_btn_text VARCHAR(100) DEFAULT 'Discover Bestsellers',
            secondary_btn_url VARCHAR(255) DEFAULT '/shop?best=1',
            feature_1 VARCHAR(100) DEFAULT 'Thoughtfully curated',
            feature_2 VARCHAR(100) DEFAULT 'Lovely prices',
            feature_3 VARCHAR(100) DEFAULT 'For every reader',
            image_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85',
            badge_icon VARCHAR(50) DEFAULT '✦',
            badge_title VARCHAR(150) DEFAULT '30,000+ happy readers',
            badge_subtitle VARCHAR(150) DEFAULT 'and counting',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Ensure default hero row exists
        cur.execute("""
        INSERT IGNORE INTO store_hero 
        (id, eyebrow, title_prefix, title_highlight, description, primary_btn_text, primary_btn_url, secondary_btn_text, secondary_btn_url, feature_1, feature_2, feature_3, image_url, badge_icon, badge_title, badge_subtitle)
        VALUES (
            1,
            'A world between the pages',
            'Your next great read',
            'starts here.',
            'Discover stories, ideas, and adventures worth getting lost in. Thoughtfully curated editions for curious minds, night owls, and book lovers everywhere.',
            'Explore Books',
            '/shop',
            'Discover Bestsellers',
            '/shop?best=1',
            'Thoughtfully curated',
            'Lovely prices',
            'For every reader',
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85',
            '✦',
            '30,000+ happy readers',
            'and counting'
        );
        """)

        # Store Policies Table (Terms & Conditions, Privacy Policy)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS store_policies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(50) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            subtitle VARCHAR(255) NULL,
            last_updated VARCHAR(100) DEFAULT 'October 2026',
            content JSON NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        default_terms_content = json.dumps({
            "intro": "Welcome to BookNest. These Terms and Conditions govern your use of our website, services, and the purchase of books from our catalog. By browsing, creating an account, or placing an order, you agree to comply with and be bound by these terms.",
            "sections": [
                {
                    "id": "eligibility",
                    "heading": "1. Acceptance of Terms & Eligibility",
                    "body": "By accessing BookNest, you represent that you are at least 18 years of age or accessing the site under the supervision of a parent or legal guardian. If you do not agree with any part of these terms, please discontinue using the service immediately."
                },
                {
                    "id": "accounts",
                    "heading": "2. Accounts, Email OTP Verification & Security",
                    "body": "To access certain features like order tracking and wishlists, you must register an account. During registration, a 6-digit email OTP is sent to verify your identity. You are responsible for safeguarding your password and account credentials. Notify us immediately of any unauthorized access."
                },
                {
                    "id": "orders-pricing",
                    "heading": "3. Book Orders, Pricing & Catalog Availability",
                    "body": "All book orders placed are subject to inventory availability. We strive for 100% price accuracy, but in the rare event of a typographical error, BookNest reserves the right to cancel or rectify orders prior to dispatch. Prices are quoted in Indian Rupees (₹) inclusive of applicable taxes."
                },
                {
                    "id": "shipping-delivery",
                    "heading": "4. Shipping & Delivery Timeline",
                    "body": "We offer free standard doorstep delivery on all orders over ₹799. Orders below ₹799 incur a standard shipping fee of ₹49. Most orders are dispatched within 24-48 business hours and delivered within 3-5 business days across India."
                },
                {
                    "id": "returns-refunds",
                    "heading": "5. Cancellations & Easy 7-Day Returns",
                    "body": "You may cancel an order before it has been shipped. If you receive a book that is physically damaged, misprinted, or defective, you may initiate a return within 7 calendar days of delivery for a replacement or full refund to the original payment method."
                },
                {
                    "id": "intellectual-property",
                    "heading": "6. Intellectual Property & Copyrights",
                    "body": "All book titles, cover illustrations, descriptions, brand graphics, and logos displayed on BookNest are the intellectual property of their respective publishers, authors, or BookNest Inc. Unauthorized reproduction or scraping is prohibited."
                },
                {
                    "id": "conduct",
                    "heading": "7. User Conduct & Reviews",
                    "body": "When submitting book reviews or ratings, you agree not to submit unlawful, defamatory, or abusive content. BookNest reserves the right to moderate, edit, or remove reviews that violate community standards."
                },
                {
                    "id": "liability",
                    "heading": "8. Limitation of Liability & Jurisdiction",
                    "body": "BookNest shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the platform. These terms are governed in accordance with the laws of India, subject to the jurisdiction of competent courts."
                },
                {
                    "id": "contact",
                    "heading": "9. Contact Information & Support",
                    "body": "For queries or concerns regarding these terms, reach our support team at hello@booknest.example or via telephone at +91 (800) 266-5637 (Mon-Sat, 9am - 7pm IST)."
                }
            ]
        })

        default_privacy_content = json.dumps({
            "intro": "At BookNest, your privacy is a foundational priority. This Privacy Policy describes how we collect, use, store, and protect your personal information when you browse our bookstore, create an account, or order books.",
            "sections": [
                {
                    "id": "collection",
                    "heading": "1. Information We Collect",
                    "body": "We collect information you provide directly, such as your full name, email address, contact phone number, delivery address, city, state, and pin code. We also collect transactional details regarding books purchased and saved wishlist titles."
                },
                {
                    "id": "usage",
                    "heading": "2. How We Use Your Information",
                    "body": "Your data is used solely to process book orders, verify your account via one-time verification codes (OTPs), coordinate doorstep deliveries, send transactional order invoices, and offer personalized reading recommendations."
                },
                {
                    "id": "security",
                    "heading": "3. Security & Payment Data Protection",
                    "body": "We implement industry-standard encryption, SSL/TLS transmission protocols, and strict access controls. BookNest does not store your credit/debit card numbers or CVV codes; all payment processing is securely managed by certified PCI-DSS compliant payment gateways."
                },
                {
                    "id": "sharing",
                    "heading": "4. Information Sharing & Third Parties",
                    "body": "We do not sell, rent, or monetize your personal details. We share relevant data only with vetted logistics and delivery partners (e.g. courier services) solely to ensure timely book dispatch and package delivery."
                },
                {
                    "id": "cookies",
                    "heading": "5. Cookies & Local Storage",
                    "body": "We use essential cookies and browser local storage to preserve your shopping bag, wishlist, and session authentication tokens between visits for a seamless reading and shopping experience."
                },
                {
                    "id": "user-rights",
                    "heading": "6. Your Data Rights & Choices",
                    "body": "You have the right to view, update, or edit your saved profile information and delivery address at any time from your Account Profile page. You may also request deletion of your account and associated history by contacting support."
                },
                {
                    "id": "updates",
                    "heading": "7. Policy Updates & Notifications",
                    "body": "We may update this Privacy Policy periodically to reflect changes in our legal obligations or store enhancements. Any significant revisions will be indicated by the 'Last Updated' date at the top of this page."
                },
                {
                    "id": "privacy-contact",
                    "heading": "8. Privacy Inquiries & Data Officer",
                    "body": "If you have any questions about this privacy statement or our handling of your data, please contact our Data Protection desk at privacy@booknest.example."
                }
            ]
        })

        cur.execute("""
            INSERT IGNORE INTO store_policies (slug, title, subtitle, last_updated, content)
            VALUES (%s, %s, %s, %s, %s);
        """, ("terms", "Terms & Conditions", "Clear guidelines and mutual commitments for an exceptional reading journey.", "October 2026", default_terms_content))

        cur.execute("""
            INSERT IGNORE INTO store_policies (slug, title, subtitle, last_updated, content)
            VALUES (%s, %s, %s, %s, %s);
        """, ("privacy", "Privacy Policy", "How we protect, respect, and handle your personal reading data.", "October 2026", default_privacy_content))

    conn.commit()
    conn.close()
    print("MySQL database and tables successfully initialized.")

if __name__ == "__main__":
    init_db()
