import React from "react";
import { useShop } from "../context/ShopContext";
import { ArrowRight } from "lucide-react";

export const About = () => {
  const { navigate } = useShop();

  return (
    <div className="about-page">
      <div className="container page-heading">
        <nav className="breadcrumbs" aria-label="Breadcrumbs">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            Home
          </a>
          <span className="breadcrumb-sep">/</span>
          <span>Our Story</span>
        </nav>
      </div>

      <div className="container">
        <div className="about-hero">
          <div className="about-hero-copy">
            <span className="eyebrow">A little about us</span>
            <h1>We believe every book opens a door.</h1>
            <p>
              BookNest began with a simple yearning: to recreate the magic of slow, intentional browsing in a world of endless digital noise.
            </p>
            <p>
              We are a warm haven for curious minds, late-night page turners, and people who always say "just one more chapter." We hand-select every title on our shelves, prioritizing stories that linger, ideas that sharpen perspectives, and beautiful prose worth returning to.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Find Your Next Read <ArrowRight size={15} />
            </button>
          </div>

          <div className="about-hero-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=85"
              alt="Sunlit shelves filled with books in a cozy reading library"
              className="about-hero-img"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat">
            <strong>30,000+</strong>
            <span>Active Avid Readers</span>
          </div>
          <div className="stat">
            <strong>50,000+</strong>
            <span>Books Delivered Across India</span>
          </div>
          <div className="stat">
            <strong>4.9 ★</strong>
            <span>Reader Satisfaction Score</span>
          </div>
          <div className="stat">
            <strong>100%</strong>
            <span>Thoughtfully Handpicked</span>
          </div>
        </div>

        {/* Values Section */}
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">OUR PHILOSOPHY</span>
              <h2>How we curate our shelves</h2>
              <p>Every book has earned its place through deep consideration.</p>
            </div>
          </div>

          <div className="benefits">
            <div className="benefit">
              <span className="benefit-icon">✦</span>
              <div>
                <strong>Story First</strong>
                <p>We champion prose that evokes genuine emotion and sparks enduring curiosity.</p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">☼</span>
              <div>
                <strong>Accessible Knowledge</strong>
                <p>Democratizing access to great non-fiction, psychology, and personal finance.</p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">♡</span>
              <div>
                <strong>Reader Community</strong>
                <p>Connecting readers, book clubs, and aspiring thinkers across the country.</p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">☕</span>
              <div>
                <strong>Slow Reading Culture</strong>
                <p>Encouraging mindful reading habits, quiet afternoons, and coffee-stained paperbacks.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
