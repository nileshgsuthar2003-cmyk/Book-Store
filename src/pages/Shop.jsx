import React, { useState, useMemo, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { BookCard } from "../components/BookCard";
import { CATEGORIES, formatPrice } from "../data/booksData";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";

export const Shop = () => {
  const {
    books,
    currentRoute,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    priceLimit,
    setPriceLimit,
    navigate,
    categoryNames
  } = useShop();

  const [limit, setLimit] = useState(12);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Check URL query params for initial category/best/new filters
  useEffect(() => {
    const queryString = window.location.search || (currentRoute.includes("?") ? `?${currentRoute.split("?")[1]}` : "");
    const params = new URLSearchParams(queryString);

    const catParam = params.get("category");
    if (catParam) {
      setSelectedCategory(decodeURIComponent(catParam));
    }
  }, [currentRoute, setSelectedCategory]);

  const isBestsellerView = currentRoute.includes("best=1");
  const isNewArrivalView = currentRoute.includes("new=1");

  // Filtering and sorting logic
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Global Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.cat.toLowerCase().includes(q) ||
          b.isbn.includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((b) => b.cat === selectedCategory);
    }

    // URL flag filters
    if (isBestsellerView) {
      result = result.filter((b) => b.best);
    }
    if (isNewArrivalView) {
      result = result.filter((b) => b.new);
    }

    // Price Limit filter
    result = result.filter((b) => b.price <= priceLimit);

    // Stock filter
    if (inStockOnly) {
      result = result.filter((b) => b.stock);
    }

    // Sorting
    if (sortBy === "low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "reviews") {
      result.sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [books, searchQuery, selectedCategory, isBestsellerView, isNewArrivalView, priceLimit, inStockOnly, sortBy]);

  const displayedBooks = filteredBooks.slice(0, limit);

  const clearAllFilters = () => {
    setSelectedCategory("");
    setPriceLimit(1000);
    setInStockOnly(false);
    setSortBy("featured");
    setSearchQuery("");
    setLimit(12);
    if (isBestsellerView || isNewArrivalView) {
      navigate("/shop");
    }
  };

  const getPageTitle = () => {
    if (isBestsellerView) return "Bestselling Titles";
    if (isNewArrivalView) return "New Arrivals";
    if (selectedCategory) return `${selectedCategory} Books`;
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    return "Find your next favourite";
  };

  const getBreadcrumbCategory = () => {
    if (isBestsellerView) return "Bestsellers";
    if (isNewArrivalView) return "New Arrivals";
    if (selectedCategory) return selectedCategory;
    return "All Books";
  };

  return (
    <div className="shop-page">
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
          <span>{getBreadcrumbCategory()}</span>
        </nav>
        <h1>{getPageTitle()}</h1>
        <p>A curated shelf full of stories, ideas, and timeless literature.</p>
      </div>

      <div className="container shop-layout">
        {/* Mobile Filter Button */}
        <div className="mobile-filter-bar">
          <button
            className="btn btn-secondary mobile-filter-toggle"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <SlidersHorizontal size={15} />
            {mobileFiltersOpen ? "Hide Filters" : "Filter & Refine"}
          </button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`filters ${mobileFiltersOpen ? "show" : ""}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            {(selectedCategory || priceLimit < 1000 || inStockOnly || searchQuery) && (
              <button className="clear-btn-inline" onClick={clearAllFilters}>
                Reset
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h4>Categories</h4>
            <label className="filter-radio-label">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === ""}
                onChange={() => {
                  setSelectedCategory("");
                  if (isBestsellerView || isNewArrivalView) navigate("/shop");
                }}
              />
              <span>All Categories</span>
            </label>
            {(categoryNames && categoryNames.length > 0 ? categoryNames : CATEGORIES).map((cat) => (
              <label key={cat} className="filter-radio-label">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <h4>Price range</h4>
            <div className="price-slider-wrap">
              <input
                id="priceRange"
                type="range"
                min="200"
                max="1000"
                step="50"
                value={priceLimit}
                onChange={(e) => setPriceLimit(Number(e.target.value))}
                aria-label="Filter by maximum price"
              />
              <div className="price-display">
                <span>Up to {formatPrice(priceLimit)}</span>
              </div>
            </div>
          </div>

          {/* In Stock Only */}
          <div className="filter-group">
            <h4>Availability</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>

          <button className="btn btn-secondary full" onClick={clearAllFilters}>
            <RotateCcw size={14} /> Clear all filters
          </button>
        </aside>

        {/* Catalog Main Section */}
        <main className="shop-main">
          {/* Top Sort & Count Bar */}
          <div className="filter-top">
            <span className="results-count">
              Showing {displayedBooks.length} of {filteredBooks.length} books
            </span>

            <div className="sort-wrap">
              <label htmlFor="sort" className="sort-label">
                Sort by:
              </label>
              <select
                id="sort"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured Picks</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedCategory || searchQuery || isBestsellerView || isNewArrivalView || priceLimit < 1000) && (
            <div className="active-chips">
              {selectedCategory && (
                <span className="filter-chip">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("")} aria-label="Remove category filter">
                    <X size={12} />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="filter-chip">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} aria-label="Remove search query">
                    <X size={12} />
                  </button>
                </span>
              )}
              {priceLimit < 1000 && (
                <span className="filter-chip">
                  ≤ {formatPrice(priceLimit)}
                  <button onClick={() => setPriceLimit(1000)} aria-label="Remove price filter">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Book Grid or Empty State */}
          {filteredBooks.length > 0 ? (
            <div className="book-grid shop-grid">
              {displayedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3>No books found on this shelf</h3>
              <p>We couldn't find any books matching your current filters or search query.</p>
              <button className="btn btn-primary" onClick={clearAllFilters}>
                Reset all filters
              </button>
            </div>
          )}

          {/* Load More Button */}
          {filteredBooks.length > limit && (
            <div className="load-more-wrap">
              <button className="btn btn-secondary load-more-btn" onClick={() => setLimit((l) => l + 12)}>
                Load more books ↓ ({filteredBooks.length - limit} remaining)
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
