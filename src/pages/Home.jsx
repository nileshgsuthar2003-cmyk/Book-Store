import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { BookCard } from "../components/BookCard";
import { CATEGORIES, CATEGORY_ICONS } from "../data/booksData";
import { api } from "../services/api";
import { ArrowRight } from "lucide-react";

export const Home = () => {
  const { books, navigate, setSelectedCategory, showToast } = useShop();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const bestsellers = books.filter((b) => b.best).slice(0, 5);
  const newArrivals = books.filter((b) => b.new).slice(0, 5);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    navigate(`/shop?category=${encodeURIComponent(cat)}`);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      try {
        const res = await api.subscribeNewsletter(newsletterEmail);
        showToast(res.message || "Thank you for joining our reading circle!", "success");
      } catch {
        showToast("Thank you for joining our reading circle!", "success");
      }
      setSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-panel">
            <div className="hero-copy">
              <span className="eyebrow">A world between the pages</span>
              <h1>
                Your next great read <em>starts here.</em>
              </h1>
              <p>
                Discover stories, ideas, and adventures worth getting lost in. Thoughtfully curated
                editions for curious minds, night owls, and book lovers everywhere.
              </p>

              <div className="hero-buttons">
                <a
                  className="btn btn-primary"
                  href="/shop"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedCategory("");
                    navigate("/shop");
                  }}
                >
                  Explore Books <ArrowRight size={15} />
                </a>
                <a
                  className="btn btn-secondary"
                  href="/shop?best=1"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/shop?best=1");
                  }}
                >
                  Discover Bestsellers
                </a>
              </div>

              <div className="trust-row">
                <span>Thoughtfully curated</span>
                <span>Lovely prices</span>
                <span>For every reader</span>
              </div>
            </div>

            <div className="hero-visual">
              <img
                className="hero-img"
                src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85"
                alt="A warm and welcoming sunlit library filled with books"
              />
              <div className="floating-note">
                <span className="note-star">✦</span>
                <div>
                  <strong>30,000+ happy readers</strong>
                  <span>and counting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section" id="categories-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">BOOKNEST EDITION</span>
              <h2>Browse by category</h2>
              <p>Whatever you are in the mood for, there is a dedicated shelf for that.</p>
            </div>
            <a
              className="text-link"
              href="/shop"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory("");
                navigate("/shop");
              }}
            >
              Browse all shelves →
            </a>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
                aria-label={`Browse ${category}`}
              >
                <span className="category-art">{CATEGORY_ICONS[category] || "✦"}</span>
                <strong>{category}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="section-soft">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">READERS' FAVORITES</span>
              <h2>Bestselling books</h2>
              <p>The stories and ideas readers can't stop discussing.</p>
            </div>
            <a
              className="text-link"
              href="/shop?best=1"
              onClick={(e) => {
                e.preventDefault();
                navigate("/shop?best=1");
              }}
            >
              View all bestsellers →
            </a>
          </div>

          <div className="book-grid">
            {bestsellers.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals & Promotional Banner */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">FRESH OFF THE PRESS</span>
              <h2>New arrivals</h2>
              <p>Meet the newest additions to your growing reading list.</p>
            </div>
            <a
              className="text-link"
              href="/shop?new=1"
              onClick={(e) => {
                e.preventDefault();
                navigate("/shop?new=1");
              }}
            >
              View new additions →
            </a>
          </div>

          <div className="book-grid">
            {newArrivals.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Offer Banner */}
          <div className="offer-banner">
            <div className="offer-copy">
              <span className="eyebrow">A little treat for your shelves</span>
              <h2>Build your personal library.</h2>
              <p>
                Save up to 40% on selected reads this week. Free delivery across India on orders
                above ₹799 with coupon <strong>BOOK10</strong>.
              </p>
              <a
                className="btn btn-amber"
                href="/shop"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory("");
                  navigate("/shop");
                }}
              >
                Shop the collection →
              </a>
            </div>
            <div className="offer-art">
              <img
                src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80"
                alt="Open book awaiting readers"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Reader Reviews */}
      <section className="section-soft">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">COMMUNITY VOICES</span>
              <h2>Loved by book lovers</h2>
              <p>Real stories from readers who found their sanctuary in BookNest.</p>
            </div>
          </div>

          <div className="review-grid">
            <div className="review-card">
              <div className="review-stars">★★★★★</div>
              <blockquote>
                "BookNest reminds me of the charming independent bookstores I loved growing up. The
                curation is impeccable, and the packaging feels like receiving a thoughtful gift."
              </blockquote>
              <div className="review-person">
                <div className="avatar">A</div>
                <div>
                  <strong>Arundhati Roy</strong>
                  <small>Verified Reader • Bangalore</small>
                </div>
              </div>
            </div>

            <div className="review-card">
              <div className="review-stars">★★★★★</div>
              <blockquote>
                "Found Atomic Habits and Sapiens at lovely prices, and they arrived in mint
                condition within two days. BookNest is now my go-to reading corner."
              </blockquote>
              <div className="review-person">
                <div className="avatar">R</div>
                <div>
                  <strong>Rohan Verma</strong>
                  <small>Verified Reader • Mumbai</small>
                </div>
              </div>
            </div>

            <div className="review-card">
              <div className="review-stars">★★★★★</div>
              <blockquote>
                "The recommendations are genuinely thoughtful. It's not just algorithms pushing
                bestsellers—it's genuine passion for good literature."
              </blockquote>
              <div className="review-person">
                <div className="avatar">P</div>
                <div>
                  <strong>Pooja Menon</strong>
                  <small>Verified Reader • Delhi</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">OUR PROMISE</span>
              <h2>More than just a bookshop</h2>
              <p>Thoughtful picks, lovely prices, and a book for every reader.</p>
            </div>
          </div>

          <div className="benefits">
            <div className="benefit">
              <span className="benefit-icon">✦</span>
              <div>
                <strong>Thoughtfully curated</strong>
                <p>Books we would wholeheartedly recommend to our own closest friends.</p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">♧</span>
              <div>
                <strong>Lovely prices</strong>
                <p>Great stories, special editions, and no guilty splurge on your wallet.</p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">♡</span>
              <div>
                <strong>Easy browsing</strong>
                <p>Clean, distraction-free discovery with instant wishlist and cart tools.</p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">☼</span>
              <div>
                <strong>Every kind of reader</strong>
                <p>From gripping thrillers to transformative non-fiction and cozy bedtime tales.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <div className="container newsletter-inner">
          <div>
            <h2>A little note for your next chapter.</h2>
            <p>New arrivals, author essays, quiet inspiration, and secret promo codes.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Your email address"
              required
              aria-label="Email address for newsletter"
            />
            <button className="btn btn-primary" type="submit">
              {subscribed ? "Welcome aboard! ✓" : "Count me in →"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
