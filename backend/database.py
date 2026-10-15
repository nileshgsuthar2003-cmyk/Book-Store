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

    conn.commit()
    conn.close()
    print("MySQL database and tables successfully initialized.")

if __name__ == "__main__":
    init_db()
