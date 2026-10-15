from werkzeug.security import generate_password_hash
from database import get_db_connection, init_db

BOOKS_DATA = [
    {
        "id": 1,
        "title": "Atomic Habits",
        "author": "James Clear",
        "category": "Self-Help",
        "price": 399,
        "isbn": "9780735211292",
        "publisher": "Avery / Penguin Random House",
        "pages": 320,
        "language": "English",
        "description": "An easy & proven way to build good habits & break bad ones. No matter your goals, Atomic Habits offers a proven framework for improving every day."
    },
    {
        "id": 2,
        "title": "The Psychology of Money",
        "author": "Morgan Housel",
        "category": "Business & Finance",
        "price": 349,
        "isbn": "9780857197689",
        "publisher": "Harriman House",
        "pages": 256,
        "language": "English",
        "description": "Timeless lessons on wealth, greed, and happiness. Doing well with money isn't necessarily about what you know. It's about how you behave."
    },
    {
        "id": 3,
        "title": "Ikigai",
        "author": "Héctor García & Francesc Miralles",
        "category": "Self-Help",
        "price": 299,
        "isbn": "9780143130727",
        "publisher": "Penguin Life",
        "pages": 208,
        "language": "English",
        "description": "The Japanese secret to a long and happy life. Discover your purpose, nurture friendships, and find joy in the art of mindful living."
    },
    {
        "id": 4,
        "title": "The Midnight Library",
        "author": "Matt Haig",
        "category": "Fiction",
        "price": 429,
        "isbn": "9780525559474",
        "publisher": "Viking",
        "pages": 304,
        "language": "English",
        "description": "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived."
    },
    {
        "id": 5,
        "title": "It Ends with Us",
        "author": "Colleen Hoover",
        "category": "Romance",
        "price": 379,
        "isbn": "9781501110368",
        "publisher": "Atria Books",
        "pages": 384,
        "language": "English",
        "description": "A brave and heartbreaking novel that digs its claws into you and doesn't let go, exploring the complexities of love, boundaries, and personal courage."
    },
    {
        "id": 6,
        "title": "The Silent Patient",
        "author": "Alex Michaelides",
        "category": "Mystery & Thriller",
        "price": 399,
        "isbn": "9781250301697",
        "publisher": "Celadon Books",
        "pages": 336,
        "language": "English",
        "description": "Alicia Berenson's life is seemingly perfect. Then one evening she shoots her husband five times and never speaks another word. A criminal psychotherapist is determined to uncover why."
    },
    {
        "id": 7,
        "title": "Educated",
        "author": "Tara Westover",
        "category": "Biographies",
        "price": 449,
        "isbn": "9780399590504",
        "publisher": "Random House",
        "pages": 352,
        "language": "English",
        "description": "An unforgettable memoir about a young girl who, kept out of school and isolated in rural Idaho, teaches herself enough mathematics and grammar to enter college at seventeen."
    },
    {
        "id": 8,
        "title": "Dune",
        "author": "Frank Herbert",
        "category": "Science & Technology",
        "price": 499,
        "isbn": "9780441172719",
        "publisher": "Ace Books",
        "pages": 688,
        "language": "English",
        "description": "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family in a grand interstellar empire, destined to fulfill an ancient prophecy."
    },
    {
        "id": 9,
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "category": "Fiction",
        "price": 299,
        "isbn": "9780062315007",
        "publisher": "HarperOne",
        "pages": 208,
        "language": "English",
        "description": "A magical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure as extravagant as any ever found."
    },
    {
        "id": 10,
        "title": "Deep Work",
        "author": "Cal Newport",
        "category": "Business & Finance",
        "price": 369,
        "isbn": "9781455586691",
        "publisher": "Grand Central Publishing",
        "pages": 304,
        "language": "English",
        "description": "Rules for focused success in a distracted world. Deep work is the ability to focus without distraction on a cognitively demanding task, a superpower in our modern economy."
    },
    {
        "id": 11,
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "category": "Science & Technology",
        "price": 499,
        "isbn": "9780593135204",
        "publisher": "Ballantine Books",
        "pages": 496,
        "language": "English",
        "description": "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself are doomed. Except right now, he doesn't even know his own name."
    },
    {
        "id": 12,
        "title": "Lessons in Chemistry",
        "author": "Bonnie Garmus",
        "category": "Fiction",
        "price": 429,
        "isbn": "9780385547345",
        "publisher": "Doubleday",
        "pages": 400,
        "language": "English",
        "description": "Chemist Elizabeth Zott is not your average woman. But it's the early 1960s and her all-male team at Hastings Research Institute takes a very unscientific view of equality."
    },
    {
        "id": 13,
        "title": "The Creative Act",
        "author": "Rick Rubin",
        "category": "Self-Help",
        "price": 499,
        "isbn": "9780593652886",
        "publisher": "Penguin Press",
        "pages": 432,
        "language": "English",
        "description": "A Way of Being. A legendary music producer distills a lifetime of wisdom into an illuminating guide to unlocking creativity within everyone."
    },
    {
        "id": 14,
        "title": "The House in the Cerulean Sea",
        "author": "TJ Klune",
        "category": "Fiction",
        "price": 399,
        "isbn": "9781250217288",
        "publisher": "Tor Books",
        "pages": 396,
        "language": "English",
        "description": "A cozy and uplifting story about Linus Baker, a by-the-book caseworker at the Department in Charge of Magical Youth, who is assigned a classified mission on a secluded island."
    },
    {
        "id": 15,
        "title": "A Good Girl's Guide to Murder",
        "author": "Holly Jackson",
        "category": "Mystery & Thriller",
        "price": 349,
        "isbn": "9781984896360",
        "publisher": "Delacorte Press",
        "pages": 400,
        "language": "English",
        "description": "The case is closed. Five years ago, schoolgirl Andie Bell was murdered by Sal Singh. Everyone knows he did it. But smart and tenacious Pip Fitz-Amobi isn't so sure."
    },
    {
        "id": 16,
        "title": "Sapiens",
        "author": "Yuval Noah Harari",
        "category": "Science & Technology",
        "price": 499,
        "isbn": "9780062316097",
        "publisher": "Harper",
        "pages": 464,
        "language": "English",
        "description": "A Brief History of Humankind. Explore how an insignificant ape became the ruler of planet Earth, capable of splitting the atom and journeying to the Moon."
    },
    {
        "id": 17,
        "title": "Think Again",
        "author": "Adam Grant",
        "category": "Self-Help",
        "price": 399,
        "isbn": "9781984878106",
        "publisher": "Viking",
        "pages": 320,
        "language": "English",
        "description": "The Power of Knowing What You Don't Know. An organizational psychologist examines the critical art of rethinking: learning to question your opinions and open other people's minds."
    },
    {
        "id": 18,
        "title": "The Very Hungry Caterpillar",
        "author": "Eric Carle",
        "category": "Children’s Books",
        "price": 249,
        "isbn": "9780399226908",
        "publisher": "Philomel Books",
        "pages": 32,
        "language": "English",
        "description": "The beloved timeless children's classic featuring a ravenous caterpillar chewing his way through wholesome treats before becoming a magnificent butterfly."
    },
    {
        "id": 19,
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "category": "Romance",
        "price": 279,
        "isbn": "9780141439518",
        "publisher": "Penguin Classics",
        "pages": 448,
        "language": "English",
        "description": "Few have failed to be charmed by the witty and independent Elizabeth Bennet and the brooding, aristocratic Mr. Darcy in Austen's sparkling romantic masterpiece."
    },
    {
        "id": 20,
        "title": "Steve Jobs",
        "author": "Walter Isaacson",
        "category": "Biographies",
        "price": 499,
        "isbn": "9781451648539",
        "publisher": "Simon & Schuster",
        "pages": 656,
        "language": "English",
        "description": "Based on more than forty interviews with Steve Jobs conducted over two years, this is the definitive biography of the roller-coaster life and searing personality of a creative entrepreneur."
    },
    {
        "id": 21,
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "category": "Fiction",
        "price": 349,
        "isbn": "9780547928227",
        "publisher": "Houghton Mifflin",
        "pages": 366,
        "language": "English",
        "description": "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life. But his contentment is disrupted when the wizard Gandalf and a company of dwarves arrive at his door."
    },
    {
        "id": 22,
        "title": "Can't Hurt Me",
        "author": "David Goggins",
        "category": "Self-Help",
        "price": 399,
        "isbn": "9781544512280",
        "publisher": "Lioncrest Publishing",
        "pages": 364,
        "language": "English",
        "description": "Master Your Mind and Defy the Odds. For David Goggins, childhood was a nightmare of poverty, prejudice, and physical abuse. Through self-discipline and mental toughness, he transformed."
    },
    {
        "id": 23,
        "title": "The Lean Startup",
        "author": "Eric Ries",
        "category": "Business & Finance",
        "price": 399,
        "isbn": "9780307887894",
        "publisher": "Crown Business",
        "pages": 336,
        "language": "English",
        "description": "How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses. A revolutionary approach that has changed the way companies are built."
    },
    {
        "id": 24,
        "title": "The Thursday Murder Club",
        "author": "Richard Osman",
        "category": "Mystery & Thriller",
        "price": 399,
        "isbn": "9781984880963",
        "publisher": "Pamela Dorman Books",
        "pages": 400,
        "language": "English",
        "description": "In a peaceful retirement village, four unlikely friends meet weekly to investigate unsolved crimes. When a local developer is found dead, the club finds themselves in the middle of their first live case."
    },
    {
        "id": 25,
        "title": "Crying in H Mart",
        "author": "Michelle Zauner",
        "category": "Biographies",
        "price": 379,
        "isbn": "9780525657743",
        "publisher": "Knopf",
        "pages": 256,
        "language": "English",
        "description": "An unflinching, powerful memoir about family, food, grief, and love from the indie rockstar Japanese Breakfast, tracing her identity and reckoning with her mother's terminal cancer."
    },
    {
        "id": 26,
        "title": "Charlotte's Web",
        "author": "E.B. White",
        "category": "Children’s Books",
        "price": 229,
        "isbn": "9780061124952",
        "publisher": "HarperCollins",
        "pages": 192,
        "language": "English",
        "description": "The heartwarming tale of Wilbur the pig, who is saved from the butcher by an extraordinary spider named Charlotte who spins words of praise into her web."
    },
    {
        "id": 27,
        "title": "The Song of Achilles",
        "author": "Madeline Miller",
        "category": "Romance",
        "price": 399,
        "isbn": "9780062060624",
        "publisher": "Ecco",
        "pages": 416,
        "language": "English",
        "description": "A breathtaking, profoundly moving retelling of the Trojan War and the legendary love story of Achilles and Patroclus, bound by friendship and doomed by destiny."
    },
    {
        "id": 28,
        "title": "The Code Breaker",
        "author": "Walter Isaacson",
        "category": "Science & Technology",
        "price": 499,
        "isbn": "9781982115852",
        "publisher": "Simon & Schuster",
        "pages": 560,
        "language": "English",
        "description": "Jennifer Doudna, Gene Editing, and the Future of the Human Race. The gripping story of how Nobel Prize winner Jennifer Doudna and her colleagues launched a revolution with CRISPR."
    },
    {
        "id": 29,
        "title": "Fourth Wing",
        "author": "Rebecca Yarros",
        "category": "Romance",
        "price": 449,
        "isbn": "9781649374042",
        "publisher": "Red Tower Books",
        "pages": 512,
        "language": "English",
        "description": "Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant. Instead, the commanding general orders her to join the candidates striving to become the dragon riders of Navarre."
    },
    {
        "id": 30,
        "title": "How to Win Friends & Influence People",
        "author": "Dale Carnegie",
        "category": "Business & Finance",
        "price": 299,
        "isbn": "9780671027032",
        "publisher": "Pocket Books",
        "pages": 320,
        "language": "English",
        "description": "The classic guide on interpersonal communication, winning cooperation, resolving conflicts, and becoming a compelling leader in work and life."
    }
]

CATEGORIES_DATA = [
    {"name": "Fiction", "icon": "✧"},
    {"name": "Self-Help", "icon": "☼"},
    {"name": "Business & Finance", "icon": "↗"},
    {"name": "Science & Technology", "icon": "⌘"},
    {"name": "Biographies", "icon": "♙"},
    {"name": "Romance", "icon": "♡"},
    {"name": "Mystery & Thriller", "icon": "⌕"},
    {"name": "Children’s Books", "icon": "✿"}
]

COUPONS_DATA = [
    {
        "code": "BOOK10",
        "discount_type": "percent",
        "value": 10.0,
        "min_order": 0,
        "description": "10% off on all orders"
    },
    {
        "code": "WELCOME50",
        "discount_type": "fixed",
        "value": 50.0,
        "min_order": 499.0,
        "description": "₹50 off on orders above ₹499"
    },
    {
        "code": "READER20",
        "discount_type": "percent",
        "value": 20.0,
        "min_order": 999.0,
        "description": "Special 20% off on orders above ₹999"
    }
]

def seed_database():
    init_db()
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Seed Default Admin User
            admin_pwd = generate_password_hash("admin123")
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, role, phone)
                VALUES (1, 'Admin Nilesh', 'admin@booknest.com', %s, 'admin', '+91 98765 00001')
                ON DUPLICATE KEY UPDATE name='Admin Nilesh', role='admin', password_hash=%s, phone='+91 98765 00001';
            """, (admin_pwd, admin_pwd))

            # 2. Seed Default Customer User
            user_pwd = generate_password_hash("user123")
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, role, phone)
                VALUES (2, 'Maya Sharma', 'user@example.com', %s, 'user', '+91 98765 43210')
                ON DUPLICATE KEY UPDATE name='Maya Sharma', role='user', password_hash=%s, phone='+91 98765 43210';
            """, (user_pwd, user_pwd))

            # 3. Seed Categories
            for cat in CATEGORIES_DATA:
                cur.execute("""
                    INSERT INTO categories (name, icon)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE icon=%s;
                """, (cat["name"], cat["icon"], cat["icon"]))

            # 4. Seed Coupons
            for cp in COUPONS_DATA:
                cur.execute("""
                    INSERT INTO coupons (code, discount_type, value, min_order, description)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE value=%s, min_order=%s, description=%s;
                """, (cp["code"], cp["discount_type"], cp["value"], cp["min_order"], cp["description"],
                      cp["value"], cp["min_order"], cp["description"]))

            # 5. Seed Books (default is_visible = 1)
            for i, b in enumerate(BOOKS_DATA):
                cover_url = f"https://covers.openlibrary.org/b/isbn/{b['isbn']}-L.jpg"
                old_price = b["price"] + 150
                rating = round(4.5 + (i % 5) / 10, 1)
                reviews = 400 + i * 83
                is_bestseller = 1 if i < 9 else 0
                is_new_arrival = 1 if (9 < i < 13) else 0
                in_stock = 0 if i == 27 else 1
                is_visible = 1

                cur.execute("""
                    INSERT INTO books (
                        id, title, author, category, price, old_price, isbn,
                        publisher, pages, language, description, cover_url,
                        rating, reviews_count, is_bestseller, is_new_arrival, in_stock, is_visible
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        title=%s, author=%s, category=%s, price=%s, old_price=%s, isbn=%s,
                        publisher=%s, pages=%s, language=%s, description=%s, cover_url=%s,
                        rating=%s, reviews_count=%s, is_bestseller=%s, is_new_arrival=%s, in_stock=%s;
                """, (
                    b["id"], b["title"], b["author"], b["category"], b["price"], old_price, b["isbn"],
                    b["publisher"], b["pages"], b["language"], b["description"], cover_url,
                    rating, reviews, is_bestseller, is_new_arrival, in_stock, is_visible,
                    b["title"], b["author"], b["category"], b["price"], old_price, b["isbn"],
                    b["publisher"], b["pages"], b["language"], b["description"], cover_url,
                    rating, reviews, is_bestseller, is_new_arrival, in_stock
                ))

        conn.commit()
        print("✅ MySQL database seeded successfully:")
        print("   👤 Admin User:    admin@booknest.com  / Password: admin123")
        print("   👤 Customer User: user@example.com   / Password: user123")
        print(f"   📚 Books:         {len(BOOKS_DATA)} titles seeded")
        print(f"   🏷️  Categories:    {len(CATEGORIES_DATA)} categories seeded")
        print(f"   🎟️  Coupons:       {len(COUPONS_DATA)} coupons seeded")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
