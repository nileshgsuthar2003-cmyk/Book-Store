import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/useAuth";
import { Search, Heart, ShoppingBag, Menu, X, BookOpen, User, Shield, LogOut, Package } from "lucide-react";

export const Header = () => {
  const {
    currentRoute,
    navigate,
    cartItemCount,
    wishlistCount,
    searchQuery,
    setSearchQuery,
    setSelectedCategory
  } = useShop();

  const { user, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getActiveTab = () => {
    const raw = (currentRoute || "/").replace(/^[#/]+/, "");
    const [route] = raw.split("?");
    if (route === "home" || route === "") return "home";
    if (route === "shop") {
      if (currentRoute.includes("best=1")) return "bestsellers";
      if (currentRoute.includes("new=1")) return "new";
      return "shop";
    }
    if (route === "categories") return "categories";
    if (route === "about") return "about";
    return "";
  };

  const activeTab = getActiveTab();

  const handleNavClick = (e, targetPath, category = null) => {
    e.preventDefault();
    if (category !== null) {
      setSelectedCategory(category);
    }
    navigate(targetPath);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/shop");
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!currentRoute.includes("shop") && val.trim().length > 0) {
      navigate("/shop");
    }
  };

  return (
    <header className="site-header">
      {/* Brand */}
      <a
        className="brand"
        href="/"
        onClick={(e) => handleNavClick(e, "/")}
        aria-label="BookNest Home"
      >
        <span className="brand-mark" aria-hidden="true">
          <BookOpen size={20} strokeWidth={2.4} />
        </span>
        <span className="brand-text">
          <span className="brand-title">book<span className="brand-accent">nest</span></span>
          <small>FIND YOUR NEXT CHAPTER</small>
        </span>
      </a>

      {/* Mobile Menu Hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Main Navigation */}
      <nav className={`main-nav ${mobileMenuOpen ? "open" : ""}`} id="mainNav">
        <a
          href="/"
          className={`nav-link ${activeTab === "home" ? "active" : ""}`}
          onClick={(e) => handleNavClick(e, "/")}
        >
          Home
        </a>
        <a
          href="/shop"
          className={`nav-link ${activeTab === "shop" ? "active" : ""}`}
          onClick={(e) => handleNavClick(e, "/shop", "")}
        >
          Books
        </a>
        <a
          href="/categories"
          className={`nav-link ${activeTab === "categories" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
            setTimeout(() => {
              const el = document.getElementById("categories-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
            setMobileMenuOpen(false);
          }}
        >
          Categories
        </a>
        <a
          href="/shop?best=1"
          className={`nav-link ${activeTab === "bestsellers" ? "active" : ""}`}
          onClick={(e) => handleNavClick(e, "/shop?best=1")}
        >
          Bestsellers
        </a>
        <a
          href="/shop?new=1"
          className={`nav-link ${activeTab === "new" ? "active" : ""}`}
          onClick={(e) => handleNavClick(e, "/shop?new=1")}
        >
          New arrivals
        </a>
        <a
          href="/about"
          className={`nav-link ${activeTab === "about" ? "active" : ""}`}
          onClick={(e) => handleNavClick(e, "/about")}
        >
          Our story
        </a>
      </nav>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Desktop Search */}
        <form className={`search-wrap ${mobileSearchOpen ? "expanded" : ""}`} onSubmit={handleSearchSubmit}>
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            id="globalSearch"
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search books, authors…"
            aria-label="Search books"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </form>

        {/* Mobile Search Toggle */}
        <button
          className="icon-btn mobile-search-toggle"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          aria-label="Open search input"
        >
          <Search size={20} />
        </button>

        {/* Wishlist Button */}
        <button
          className="icon-btn wishlist-top"
          id="wishlistTop"
          onClick={() => navigate("/wishlist")}
          aria-label={`Wishlist with ${wishlistCount} items`}
          title="Your Wishlist"
        >
          <Heart size={21} className={wishlistCount > 0 ? "active-heart" : ""} />
          {wishlistCount > 0 && <i id="wishCount">{wishlistCount}</i>}
        </button>

        {/* Cart Button */}
        <button
          className="icon-btn cart-top"
          id="cartTop"
          onClick={() => navigate("/cart")}
          aria-label={`Shopping bag with ${cartItemCount} items`}
          title="Your Shopping Bag"
        >
          <ShoppingBag size={21} />
          {cartItemCount > 0 && <i id="cartCount">{cartItemCount}</i>}
        </button>

        {/* Role-Based User Menu / Login Action */}
        {isAuthenticated ? (
          <div className="user-profile-menu-wrap">
            <button
              className="user-profile-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label="User account menu"
            >
              <span className="user-avatar-initials">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </span>
              <span className="user-profile-meta">
                <span className="user-profile-name">{user?.name?.split(" ")[0]}</span>
                <span className={`user-role-tag ${user?.role}`}>
                  {user?.role === "admin" ? "Admin" : "Member"}
                </span>
              </span>
            </button>

            {userDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>

                <button
                  className="dropdown-item"
                  onClick={(e) => handleNavClick(e, "/profile")}
                >
                  <User size={15} /> Edit Profile & Address
                </button>

                <button
                  className="dropdown-item"
                  onClick={(e) => handleNavClick(e, "/profile?tab=orders")}
                >
                  <Package size={15} /> My Orders
                </button>

                {isAdmin && (
                  <button
                    className="dropdown-item admin-highlight"
                    onClick={(e) => handleNavClick(e, "/admin")}
                  >
                    <Shield size={15} /> Admin Dashboard
                  </button>
                )}

                <button
                  className="dropdown-item"
                  onClick={(e) => handleNavClick(e, "/cart")}
                >
                  <ShoppingBag size={15} /> My Book Bag
                </button>

                <button
                  className="dropdown-item"
                  onClick={(e) => handleNavClick(e, "/wishlist")}
                >
                  <Heart size={15} /> My Wishlist
                </button>

                <div className="dropdown-divider"></div>

                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-secondary sign-in-btn"
            onClick={() => openAuthModal("login")}
            title="Sign in to your BookNest account"
          >
            <User size={15} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
