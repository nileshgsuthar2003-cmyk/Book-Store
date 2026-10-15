import React from "react";
import { useShop } from "../context/ShopContext";
import { BookOpen } from "lucide-react";

export const Footer = () => {
  const { navigate, setSelectedCategory, supportInfo } = useShop();

  const support = supportInfo || {
    heading: "Support & Care",
    link_text: "Your Book Bag",
    link_url: "/cart",
    email: "hello@booknest.example",
    hours: "Mon – Sat: 9am – 7pm IST",
    promo_tag: "Use code BOOK10",
    phone: "+91 (800) 266-5637"
  };

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
                <span className="brand-title">book<span className="brand-accent">nest</span></span>
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
            <a href="/terms" onClick={(e) => handleLink(e, "/terms")}>
              Terms & Conditions
            </a>
            <a href="/privacy" onClick={(e) => handleLink(e, "/privacy")}>
              Privacy Policy
            </a>
          </div>

          {/* Col 3: Support & Care (Configurable via Admin Panel) */}
          <div className="footer-col">
            <h3>{support.heading || "Support & Care"}</h3>
            {support.link_text && (
              <a href={support.link_url || "/cart"} onClick={(e) => handleLink(e, support.link_url || "/cart")}>
                {support.link_text}
              </a>
            )}
            {support.email && (
              <a href={`mailto:${support.email}`}>{support.email}</a>
            )}
            {support.hours && (
              <span className="footer-support-hours">{support.hours}</span>
            )}
            {support.promo_tag && (
              <span className="footer-promo-pill">{support.promo_tag}</span>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 BookNest Inc. Crafted with devotion for the love of reading.</p>
          <div className="footer-bottom-links">
            <a href="/terms" onClick={(e) => handleLink(e, "/terms")} className="footer-legal-link">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href="/privacy" onClick={(e) => handleLink(e, "/privacy")} className="footer-legal-link">
              Privacy Policy
            </a>
            <span>•</span>
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
