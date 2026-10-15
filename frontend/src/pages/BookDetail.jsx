import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { BookCard } from "../components/BookCard";
import { formatPrice } from "../data/booksData";
import { Heart, Plus, Minus, Check, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export const BookDetail = ({ bookId }) => {
  const { books, addToCart, toggleWishlist, isInWishlist, navigate } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const book = books.find((b) => b.id === Number(bookId));

  if (!book) {
    return (
      <div className="container empty-state-container">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Book Not Found</h3>
          <p>The book you are looking for may have moved or is not in our current catalog.</p>
          <button className="btn btn-primary" onClick={() => navigate("/shop")}>
            Back to Book Catalog
          </button>
        </div>
      </div>
    );
  }

  const isSaved = isInWishlist(book.id);
  const relatedBooks = books.filter((x) => x.id !== book.id && x.cat === book.cat).slice(0, 5);

  const handleAddToCart = () => {
    addToCart(book.id, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const fallbackCover = `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80`;

  return (
    <div className="book-detail-page">
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
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              navigate("/shop");
            }}
          >
            Books
          </a>
          <span className="breadcrumb-sep">/</span>
          <span>{book.title}</span>
        </nav>
      </div>

      <div className="container detail-layout">
        {/* Book Cover Visual */}
        <div className="detail-cover-wrapper">
          <div className="detail-cover">
            {book.best && <span className="discount badge-best">BESTSELLER</span>}
            <img
              src={imgError ? fallbackCover : book.cover}
              alt={`Cover of ${book.title}`}
              onError={() => setImgError(true)}
            />
          </div>
        </div>

        {/* Book Information */}
        <div className="detail-info">
          <span className="eyebrow">{book.cat}</span>
          <h1 className="detail-title">{book.title}</h1>
          <p className="detail-author">by <strong>{book.author}</strong></p>

          <div className="rating detail-rating">
            <span className="rating-stars" aria-hidden="true">★★★★★</span>
            <small>
              {book.rating.toFixed(1)} score · {book.reviews} reader reviews
            </small>
          </div>

          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(book.price)}</span>
            <del className="detail-old-price">{formatPrice(book.old)}</del>
            <span className="detail-discount-tag">
              Save {Math.round(((book.old - book.price) / book.old) * 100)}%
            </span>
          </div>

          <p className="detail-description">{book.description}</p>

          <div className="stock-status-row">
            {book.stock ? (
              <span className="stock-badge in-stock">✓ In stock and ready to ship</span>
            ) : (
              <span className="stock-badge out-stock">Currently out of stock</span>
            )}
          </div>

          {/* Interactive controls */}
          <div className="quantity-row">
            {book.stock && (
              <div className="quantity-control" aria-label="Quantity selector">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            <button
              className={`btn btn-primary add-detail-btn ${justAdded ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={!book.stock}
            >
              {justAdded ? (
                <>
                  <Check size={16} /> Added {quantity > 1 ? `${quantity} copies` : ""} to Bag!
                </>
              ) : book.stock ? (
                <>Add to bag · {formatPrice(book.price * quantity)}</>
              ) : (
                "Out of Stock"
              )}
            </button>

            <button
              className={`btn btn-secondary wishlist-detail-btn ${isSaved ? "saved" : ""}`}
              onClick={() => toggleWishlist(book.id)}
              aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={16}
                fill={isSaved ? "#c2414b" : "transparent"}
                stroke={isSaved ? "#c2414b" : "currentColor"}
              />
              {isSaved ? "Saved" : "Wishlist"}
            </button>
          </div>

          {/* Shipping perks */}
          <div className="product-perks">
            <div className="perk-item">
              <Truck size={16} />
              <span>Free shipping on orders above ₹799</span>
            </div>
            <div className="perk-item">
              <RotateCcw size={16} />
              <span>Easy 7-day hassle-free replacement</span>
            </div>
            <div className="perk-item">
              <ShieldCheck size={16} />
              <span>100% Genuine bookstore edition guarantee</span>
            </div>
          </div>

          {/* Metadata Specifications */}
          <div className="meta-list">
            <div>
              Publisher
              <strong>{book.publisher}</strong>
            </div>
            <div>
              Language
              <strong>{book.language}</strong>
            </div>
            <div>
              Pages
              <strong>{book.pages} pages</strong>
            </div>
            <div>
              ISBN-13
              <strong>{book.isbn}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* You Might Also Like */}
      {relatedBooks.length > 0 && (
        <section className="section-soft">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">MORE FROM THIS GENRE</span>
                <h2>You might also like</h2>
                <p>Readers who enjoyed {book.title} also gravitated toward these titles.</p>
              </div>
            </div>

            <div className="book-grid">
              {relatedBooks.map((relBook) => (
                <BookCard key={relBook.id} book={relBook} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
