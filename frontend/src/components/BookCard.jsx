import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { formatPrice } from "../data/booksData";
import { Heart, Plus, Check } from "lucide-react";

export const BookCard = ({ book }) => {
  const { addToCart, toggleWishlist, isInWishlist, navigate } = useShop();
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSaved = isInWishlist(book.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(book.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWish = (e) => {
    e.stopPropagation();
    toggleWishlist(book.id);
  };

  const handleCardClick = () => {
    navigate(`/book/${book.id}`);
  };

  // Safe fallback cover if OpenLibrary cover fails to load
  const fallbackCover = `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80`;

  return (
    <article className="book-card" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") handleCardClick(); }}>
      <div className="cover-wrap">
        {book.best ? (
          <span className="discount badge-best">BESTSELLER</span>
        ) : (
          <span className="discount">SPECIAL PRICE</span>
        )}

        <img
          className="book-cover"
          src={imgError ? fallbackCover : book.cover}
          alt={`Book cover: ${book.title}`}
          loading="lazy"
          onError={() => setImgError(true)}
        />

        <button
          className={`heart-btn ${isSaved ? "saved" : ""}`}
          onClick={handleWish}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          title={isSaved ? "Saved to wishlist" : "Save to wishlist"}
        >
          <Heart size={16} fill={isSaved ? "#c2414b" : "transparent"} stroke={isSaved ? "#c2414b" : "currentColor"} />
        </button>

        {!book.stock && <div className="out-of-stock-overlay">Out of Stock</div>}
      </div>

      <div className="book-info">
        <span className="book-category">{book.cat}</span>
        <a
          className="book-title"
          href={`/book/${book.id}`}
          onClick={(e) => {
            e.preventDefault();
            handleCardClick();
          }}
        >
          {book.title}
        </a>
        <p className="book-author">{book.author}</p>

        <div className="rating">
          <span className="rating-stars" aria-hidden="true">★★★★★</span>
          <small className="rating-score">
            {book.rating.toFixed(1)} <span className="review-count">({book.reviews})</span>
          </small>
        </div>

        <div className="price-row">
          <span className="price">{formatPrice(book.price)}</span>
          <span className="old-price">{formatPrice(book.old)}</span>
          <span className="save-badge">Save ₹{book.old - book.price}</span>
        </div>

        <button
          className={`add-btn ${justAdded ? "added" : ""}`}
          onClick={handleAdd}
          disabled={!book.stock}
        >
          {justAdded ? (
            <>
              <Check size={13} /> Added to bag
            </>
          ) : book.stock ? (
            <>
              <Plus size={13} /> Add to bag
            </>
          ) : (
            "Out of stock"
          )}
        </button>
      </div>
    </article>
  );
};
