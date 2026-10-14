import React from "react";
import { useShop } from "../context/ShopContext";
import { BookOpen } from "lucide-react";

export const Footer = () => {
  const { navigate, setSelectedCategory } = useShop();

  const handleLink = (e, path, cat = "") => {
    e.preventDefault();
    if (cat !== "") setSelectedCategory(cat);
    navigate(path);
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <a className="brand footer-brand" href="/" onClick={(e) => handleLink(e, "/")}>
              <span className="brand-mark" aria-hidden="true">
                <BookOpen size={18} strokeWidth={2.4} />
              </span>
              <span className="brand-text">
                book<span className="brand-accent">nest</span>
                <small>FIND YOUR NEXT CHAPTER</small>
              </span>
            </a>
            <p className="footer-about">
              A little corner for people who love getting lost in a good book. Curating unforgettable
              stories, timeless wisdom, and modern ideas.
            </p>
            <div className="footer-badge">
              <span>✦ Specially handpicked editions</span>
            </div>
          </div>

          {/* Col 1 */}
          <div className="footer-col">
            <h3>Explore</h3>
            <a href="/shop" onClick={(e) => handleLink(e, "/shop", "")}>
              All Books
            </a>
            <a href="/shop?best=1" onClick={(e) => handleLink(e, "/shop?best=1")}>
              Bestsellers
            </a>
            <a href="/shop?new=1" onClick={(e) => handleLink(e, "/shop?new=1")}>
              New Arrivals
            </a>
            <a href="/categories" onClick={(e) => handleLink(e, "/")}>
              Genres & Categories
            </a>
          </div>

          {/* Col 2 */}
          <div className="footer-col">
            <h3>BookNest</h3>
            <a href="/about" onClick={(e) => handleLink(e, "/about")}>
              Our Story & Mission
            </a>
            <a href="/wishlist" onClick={(e) => handleLink(e, "/wishlist")}>
              Saved Wishlist
            </a>
            <a href="/about" onClick={(e) => handleLink(e, "/about")}>
              Reading Community
            </a>
          </div>

          {/* Col 3 */}
          <div className="footer-col">
            <h3>Support & Care</h3>
            <a href="/cart" onClick={(e) => handleLink(e, "/cart")}>
              Your Book Bag
            </a>
            <a href="mailto:hello@booknest.example">hello@booknest.example</a>
            <span className="footer-support-hours">Mon - Sat: 9am - 7pm IST</span>
            <span className="footer-promo-pill">Use code <strong>BOOK10</strong></span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 BookNest Inc. Crafted with devotion for the love of reading.</p>
          <div className="footer-bottom-links">
            <span>Free Shipping Over ₹799</span>
            <span>•</span>
            <span>Easy 7-day Returns</span>
            <span>•</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
