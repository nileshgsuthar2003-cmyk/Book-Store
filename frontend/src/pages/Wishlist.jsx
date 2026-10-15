import React from "react";
import { useShop } from "../context/ShopContext";
import { BookCard } from "../components/BookCard";
export const Wishlist = () => {
  const { wishlist, books, navigate } = useShop();

  const savedBooks = wishlist
    .map((id) => books.find((b) => b.id === Number(id)))
    .filter(Boolean);

  return (
    <div className="wishlist-page">
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
          <span>Wishlist</span>
        </nav>
        <h1>Your saved shelf</h1>
        <p>All the books you've had your eye on, saved in one cozy spot.</p>
      </div>

      <div className="container wishlist-layout">
        {savedBooks.length > 0 ? (
          <div>
            <div className="wishlist-header-bar">
              <span className="results-count">
                You have {savedBooks.length} book{savedBooks.length > 1 ? "s" : ""} on your wishlist
              </span>
            </div>

            <div className="book-grid shop-grid">
              {savedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <h3>A shelf full of possibility</h3>
            <p>You haven't saved any books to your wishlist yet. Tap the heart on any book to keep it close.</p>
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Discover Books →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
