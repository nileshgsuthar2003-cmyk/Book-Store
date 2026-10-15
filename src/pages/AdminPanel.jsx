import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { useShop } from "../context/useShop";
import { api } from "../services/api";
import { formatPrice, CATEGORIES } from "../data/booksData";
import {
  Shield,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  DollarSign,
  Package,
  Search,
  RotateCcw,
  CheckCircle,
  X,
  LayoutDashboard,
  ExternalLink,
  Store,
  LogOut,
  Menu,
  Lock,
  Mail,
  AlertCircle,
  Star,
  Flame,
  TrendingUp,
  Megaphone,
  Sparkles,
  Palette,
  Globe,
  Check
} from "lucide-react";

const THEME_OPTIONS = [
  { id: "navy", name: "Midnight Navy", bg: "#0f172a", text: "#f8f5ed", accent: "#ffc45a" },
  { id: "terracotta", name: "Terracotta Sunset", bg: "#c2410c", text: "#fff7ed", accent: "#fef08a" },
  { id: "emerald", name: "Forest Emerald", bg: "#065f46", text: "#ecfdf5", accent: "#6ee7b7" },
  { id: "wine", name: "Regal Plum / Wine", bg: "#701a75", text: "#fdf4ff", accent: "#f5d0fe" },
  { id: "amber", name: "Golden Amber", bg: "#78350f", text: "#fffbeb", accent: "#fde68a" },
  { id: "dark", name: "Onyx Minimal", bg: "#18181b", text: "#fafafa", accent: "#38bdf8" }
];

const ANNOUNCEMENT_PRESETS = [
  {
    label: "Default Reading Perks",
    desc: "A little something for your next chapter — Save up to 40% on selected reads",
    data: {
      is_enabled: true,
      lead_text: "A little something for your next chapter",
      separator_symbol: "—",
      highlight_text: "Save up to 40% on selected reads",
      tag_text: "✦ Free shipping on orders over ₹799",
      bg_theme: "navy",
      link_url: "/shop"
    }
  },
  {
    label: "Festive Grand Sale",
    desc: "Celebrate with Stories — Flat 50% OFF on Bestsellers",
    data: {
      is_enabled: true,
      lead_text: "Celebrate with Stories",
      separator_symbol: "—",
      highlight_text: "Flat 50% OFF on Bestsellers",
      tag_text: "✦ Use code FESTIVE50",
      bg_theme: "wine",
      link_url: "/shop"
    }
  },
  {
    label: "Weekend Flash Deal",
    desc: "Weekend Reading Fest is Live • Buy 2 Get 1 Free on all Fiction",
    data: {
      is_enabled: true,
      lead_text: "Weekend Reading Fest is Live",
      separator_symbol: "•",
      highlight_text: "Buy 2 Get 1 Free on all Fiction",
      tag_text: "✦ Limited Hours Only",
      bg_theme: "terracotta",
      link_url: "/categories"
    }
  },
  {
    label: "Free Express Shipping",
    desc: "Special Delivery Perk — Free express doorstep delivery on all orders",
    data: {
      is_enabled: true,
      lead_text: "Special Delivery Perk",
      separator_symbol: "—",
      highlight_text: "Free express doorstep delivery on all orders",
      tag_text: "✦ No minimum cart required",
      bg_theme: "emerald",
      link_url: "/shop"
    }
  },
  {
    label: "Autumn New Releases",
    desc: "Fresh on the Shelves — Explore 50+ new releases for this season",
    data: {
      is_enabled: true,
      lead_text: "Fresh on the Shelves",
      separator_symbol: "—",
      highlight_text: "Explore 50+ new releases for this season",
      tag_text: "✦ Handpicked titles",
      bg_theme: "amber",
      link_url: "/shop"
    }
  }
];

export const AdminPanel = ({ currentPath = "admin" }) => {
  const { user, isAdmin, login, logout } = useAuth();
  const {
    showToast,
    refreshBooks,
    navigate,
    currentRoute,
    announcement: globalAnnouncement,
    setAnnouncement: setGlobalAnnouncement,
    refreshAnnouncement
  } = useShop();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announcement bar state
  const [announcementForm, setAnnouncementForm] = useState({
    is_enabled: true,
    lead_text: "A little something for your next chapter",
    separator_symbol: "—",
    highlight_text: "Save up to 40% on selected reads",
    tag_text: "✦ Free shipping on orders over ₹799",
    bg_theme: "navy",
    link_url: "/shop"
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    if (globalAnnouncement) {
      setAnnouncementForm({
        is_enabled: Boolean(globalAnnouncement.is_enabled),
        lead_text: globalAnnouncement.lead_text || "",
        separator_symbol: globalAnnouncement.separator_symbol || "—",
        highlight_text: globalAnnouncement.highlight_text || "",
        tag_text: globalAnnouncement.tag_text || "",
        bg_theme: globalAnnouncement.bg_theme || "navy",
        link_url: globalAnnouncement.link_url || ""
      });
    }
  }, [globalAnnouncement]);

  const handleSaveAnnouncement = async (e) => {
    if (e) e.preventDefault();
    setSavingAnnouncement(true);
    try {
      const res = await api.updateAnnouncement(announcementForm);
      if (res && res.announcement) {
        setGlobalAnnouncement(res.announcement);
      }
      showToast("Top announcement banner updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update announcement.", "warning");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleResetAnnouncement = () => {
    const defaultData = {
      is_enabled: true,
      lead_text: "A little something for your next chapter",
      separator_symbol: "—",
      highlight_text: "Save up to 40% on selected reads",
      tag_text: "✦ Free shipping on orders over ₹799",
      bg_theme: "navy",
      link_url: "/shop"
    };
    setAnnouncementForm(defaultData);
    showToast("Reset form to default banner. Click 'Save Announcement Changes' to apply.", "info");
  };

  // Synchronize active tab with URL path: /admin, /admin/books, /admin/users, /admin/orders, /admin/announcement
  const getActiveTab = () => {
    const raw = (currentPath || currentRoute || "admin").replace(/^[#/]+/, "");
    const parts = raw.split("?")[0].split("/");
    const sub = parts[1];
    if (sub === "books") return "books";
    if (sub === "users") return "users";
    if (sub === "orders") return "orders";
    if (sub === "announcement" || sub === "banner") return "announcement";
    if (sub === "overview" || sub === "dashboard") return "overview";
    return "overview";
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab) => {
    if (tab === "overview") {
      navigate("/admin");
    } else {
      navigate(`/admin/${tab}`);
    }
    setMobileSidebarOpen(false);
  };

  // Filters for books
  const [bookSearch, setBookSearch] = useState("");
  const [bookCategory, setBookCategory] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // 'all', 'visible', 'hidden'
  const [bestsellerFilter, setBestsellerFilter] = useState("all"); // 'all', 'bestseller', 'regular'
  const [salesSort, setSalesSort] = useState("default"); // 'default', 'high_sold', 'low_sold'

  // Modal states
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookFormData, setBookFormData] = useState({
    title: "",
    author: "",
    category: "Fiction",
    price: 399,
    old_price: 549,
    isbn: "",
    publisher: "BookNest Editions",
    pages: 320,
    language: "English",
    description: "",
    cover_url: "",
    in_stock: true,
    is_visible: true,
    is_bestseller: false
  });

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [statsRes, booksRes, usersRes, ordersRes] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getBooks({ include_hidden: true }).catch(() => null),
        api.getAdminUsers().catch(() => null),
        api.getOrders().catch(() => null)
      ]);

      if (statsRes) setStats(statsRes);
      if (booksRes && booksRes.books) setBooks(booksRes.books);
      if (usersRes && usersRes.users) setUsers(usersRes.users);
      if (ordersRes && ordersRes.orders) setOrders(ordersRes.orders);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      showToast("Error loading admin data.", "warning");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      if (!isAdmin) return;
      try {
        const [statsRes, booksRes, usersRes, ordersRes] = await Promise.all([
          api.getAdminStats().catch(() => null),
          api.getBooks({ include_hidden: true }).catch(() => null),
          api.getAdminUsers().catch(() => null),
          api.getOrders().catch(() => null)
        ]);

        if (!ignore) {
          if (statsRes) setStats(statsRes);
          if (booksRes && booksRes.books) setBooks(booksRes.books);
          if (usersRes && usersRes.users) setUsers(usersRes.users);
          if (ordersRes && ordersRes.orders) setOrders(ordersRes.orders);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load admin data:", err);
          showToast("Error loading admin data.", "warning");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [isAdmin, showToast]);

  // Handle direct Admin Login from the dedicated admin portal
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.user.role !== "admin") {
        setLoginError("Access denied: This account does not possess administrator privileges.");
        return;
      }
      showToast(`Welcome back to Admin Console, ${res.user.name}!`, "success");
      loadAdminData();
    } catch (err) {
      setLoginError(err.message || "Authentication failed. Check your admin credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Dedicated Admin Login screen if not signed in as an Admin
  if (!isAdmin) {
    return (
      <div className="admin-portal-login-screen">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <span className="admin-shield-badge">
              <Shield size={32} />
            </span>
            <h2>BookNest Admin Portal</h2>
            <p>Enter your administrator credentials to access store controls</p>
          </div>

          {loginError && (
            <div className="admin-login-error">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <div className="admin-login-field">
              <label>Admin Email</label>
              <div className="admin-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  required
                  placeholder="admin@booknest.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label>Password</label>
              <div className="admin-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary full admin-login-btn" disabled={loginLoading}>
              {loginLoading ? "Authenticating…" : "Sign In to Admin Console →"}
            </button>
          </form>

          <div className="admin-login-footer">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className="admin-return-link"
            >
              ← Return to Customer Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Handle Book Form Open
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookFormData({
      title: "",
      author: "",
      category: "Fiction",
      price: 399,
      old_price: 549,
      isbn: `9780${Math.floor(100000000 + Math.random() * 900000000)}`,
      publisher: "BookNest Editions",
      pages: 300,
      language: "English",
      description: "",
      cover_url: "",
      in_stock: true,
      is_visible: true,
      is_bestseller: false
    });
    setBookModalOpen(true);
  };

  const handleOpenEditBook = (b) => {
    setEditingBook(b);
    setBookFormData({
      title: b.title,
      author: b.author,
      category: b.cat || b.category,
      price: b.price,
      old_price: b.old || b.old_price,
      isbn: b.isbn,
      publisher: b.publisher,
      pages: b.pages,
      language: b.language,
      description: b.description,
      cover_url: b.cover || b.cover_url,
      in_stock: b.stock !== undefined ? b.stock : b.in_stock,
      is_visible: b.is_visible !== undefined ? b.is_visible : true,
      is_bestseller: Boolean(b.is_bestseller || b.best)
    });
    setBookModalOpen(true);
  };

  // Submit Book Form (Create or Update)
  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await api.updateBook(editingBook.id, bookFormData);
        showToast(`Book "${bookFormData.title}" updated successfully!`, "success");
      } else {
        await api.createBook(bookFormData);
        showToast(`Book "${bookFormData.title}" added to catalog!`, "success");
      }
      setBookModalOpen(false);
      loadAdminData();
      refreshBooks();
    } catch (err) {
      showToast(err.message || "Failed to save book.", "warning");
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (bookId, currentVisibility, title) => {
    const newVisibility = !currentVisibility;
    try {
      await api.toggleBookVisibility(bookId, newVisibility);
      showToast(
        `"${title}" is now ${newVisibility ? "Visible in customer catalog" : "Hidden (Non-Visible)"}`,
        newVisibility ? "success" : "info"
      );
      // Update local state immediately
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, is_visible: newVisibility } : b))
      );
      refreshBooks();
    } catch (err) {
      showToast(err.message || "Failed to update visibility.", "warning");
    }
  };

  // Toggle Bestseller Status
  const handleToggleBestseller = async (bookId, currentBestseller, title) => {
    const newBestseller = !currentBestseller;
    try {
      await api.toggleBookBestseller(bookId, newBestseller);
      showToast(
        `"${title}" is now ${newBestseller ? "marked as Bestseller ⭐" : "removed from Bestsellers"}`,
        newBestseller ? "success" : "info"
      );
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, is_bestseller: newBestseller, best: newBestseller }
            : b
        )
      );
      refreshBooks();
    } catch (err) {
      showToast(err.message || "Failed to update bestseller status.", "warning");
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.deleteBook(bookId);
      showToast(`Book "${title}" deleted from catalog.`, "info");
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      refreshBooks();
    } catch (err) {
      showToast(err.message || "Failed to delete book.", "warning");
    }
  };

  // Update User Role
  const handleUpdateRole = async (userId, currentRole, name) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (
      !window.confirm(
        `Change role for "${name}" from ${currentRole.toUpperCase()} to ${newRole.toUpperCase()}?`
      )
    )
      return;

    try {
      await api.updateUserRole(userId, newRole);
      showToast(`User role updated to ${newRole.toUpperCase()}!`, "success");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      showToast(err.message || "Failed to update user role.", "warning");
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user account "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(userId);
      showToast(`User "${name}" has been deleted.`, "info");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      showToast(err.message || "Failed to delete user.", "warning");
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} marked as ${newStatus}!`, "success");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      showToast(err.message || "Failed to update order status.", "warning");
    }
  };

  // Filtered and sorted books for admin table
  const filteredBooks = books
    .filter((b) => {
      const q = bookSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q);

      const matchesCategory = !bookCategory || b.cat === bookCategory || b.category === bookCategory;

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && b.is_visible) ||
        (visibilityFilter === "hidden" && !b.is_visible);

      const matchesBestseller =
        bestsellerFilter === "all" ||
        (bestsellerFilter === "bestseller" && (b.is_bestseller || b.best)) ||
        (bestsellerFilter === "regular" && !b.is_bestseller && !b.best);

      return matchesSearch && matchesCategory && matchesVisibility && matchesBestseller;
    })
    .sort((a, b) => {
      if (salesSort === "high_sold") {
        return (b.units_sold || 0) - (a.units_sold || 0);
      }
      if (salesSort === "low_sold") {
        return (a.units_sold || 0) - (b.units_sold || 0);
      }
      return 0;
    });

  return (
    <div className="admin-portal-app">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Standalone Admin Sidebar */}
      <aside className={`admin-portal-sidebar ${mobileSidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand" onClick={() => handleTabChange("overview")}>
            <span className="admin-brand-icon">
              <BookOpen size={20} strokeWidth={2.4} />
            </span>
            <div className="admin-brand-text">
              <h3>book<span>nest</span></h3>
              <span className="admin-brand-tag">ADMIN PRO</span>
            </div>
          </div>
          <button
            className="sidebar-close-mobile"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="sidebar-group-title">STORE MANAGEMENT</div>

          <button
            className={`admin-sidebar-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`admin-sidebar-link ${activeTab === "books" ? "active" : ""}`}
            onClick={() => handleTabChange("books")}
          >
            <BookOpen size={18} />
            <span>Books Catalog</span>
            <span className="sidebar-count">{books.length}</span>
          </button>

          <button
            className={`admin-sidebar-link ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            <Users size={18} />
            <span>Users Details</span>
            <span className="sidebar-count">{users.length}</span>
          </button>

          <button
            className={`admin-sidebar-link ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => handleTabChange("orders")}
          >
            <Package size={18} />
            <span>Customer Orders</span>
            <span className="sidebar-count">{orders.length}</span>
          </button>

          <div className="sidebar-group-title">STOREFRONT & PROMOTIONS</div>

          <button
            className={`admin-sidebar-link ${activeTab === "announcement" ? "active" : ""}`}
            onClick={() => handleTabChange("announcement")}
          >
            <Megaphone size={18} />
            <span>Top Announcement</span>
            <span className={`sidebar-pill-badge ${announcementForm.is_enabled ? "active" : "muted"}`}>
              {announcementForm.is_enabled ? "ON" : "OFF"}
            </span>
          </button>

          <a
            href="/"
            className="admin-sidebar-link store-switch"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            <Store size={18} />
            <span>View Public Store</span>
            <ExternalLink size={13} className="ext-icon" />
          </a>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="admin-user-details">
              <strong>{user?.name || "Admin"}</strong>
              <small>{user?.email || "admin@booknest.com"}</small>
            </div>
            <button className="admin-logout-action" onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Admin Main Body */}
      <div className="admin-portal-main">
        {/* Topbar */}
        <header className="admin-portal-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-trigger"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Toggle Navigation"
            >
              <Menu size={20} />
            </button>
            <div className="topbar-breadcrumb">
              <span>Admin Console</span>
              <span className="sep">/</span>
              <strong>
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "books" && "Books Catalog & Visibility"}
                {activeTab === "users" && "User Accounts & Details"}
                {activeTab === "orders" && "Customer Orders"}
                {activeTab === "announcement" && "Store Announcement Banner"}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-mysql-badge" title="Connected to MySQL database">
              <span className="mysql-pulse-dot"></span> MySQL Connected
            </span>

            <button
              className="topbar-btn secondary"
              onClick={loadAdminData}
              disabled={loading}
              title="Refresh data from MySQL"
            >
              <RotateCcw size={14} className={loading ? "spin" : ""} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button className="topbar-btn primary" onClick={handleOpenAddBook}>
              <Plus size={15} /> Add Book
            </button>

            <a
              href="/"
              className="topbar-btn store"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              <Store size={15} /> Store
            </a>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-portal-content">

        {/* =========================================================================
            TAB 1: BOOKS MANAGEMENT (Add, Edit, Delete, Toggle Visible / Hidden)
            ========================================================================= */}
        {activeTab === "books" && (
          <div className="admin-tab-panel">
            {/* Filter & Search Bar */}
            <div className="admin-filter-bar">
              <div className="admin-search-input">
                <Search size={16} />
                <input
                  placeholder="Search by title, author, ISBN…"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                />
                {bookSearch && (
                  <button onClick={() => setBookSearch("")} className="clear-search-btn">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="admin-selects">
                <select value={bookCategory} onChange={(e) => setBookCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
                  <option value="all">All Visibility ({books.length})</option>
                  <option value="visible">
                    Visible Only ({books.filter((b) => b.is_visible).length})
                  </option>
                  <option value="hidden">
                    Hidden Only ({books.filter((b) => !b.is_visible).length})
                  </option>
                </select>

                <select
                  value={bestsellerFilter}
                  onChange={(e) => setBestsellerFilter(e.target.value)}
                  className="bestseller-filter-select"
                >
                  <option value="all">All Books ({books.length})</option>
                  <option value="bestseller">
                    ⭐ Bestsellers ({books.filter((b) => b.is_bestseller || b.best).length})
                  </option>
                  <option value="regular">
                    Regular Books ({books.filter((b) => !b.is_bestseller && !b.best).length})
                  </option>
                </select>

                <select
                  value={salesSort}
                  onChange={(e) => setSalesSort(e.target.value)}
                  className="sales-sort-select"
                >
                  <option value="default">Sort by Default</option>
                  <option value="high_sold">🔥 Most Sold First</option>
                  <option value="low_sold">Lowest Sold First</option>
                </select>

                <button className="btn btn-primary" onClick={handleOpenAddBook}>
                  <Plus size={15} /> Add Book
                </button>
              </div>
            </div>

            {/* Books Table */}
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Status</th>
                    <th>Sold (Sales)</th>
                    <th>Bestseller</th>
                    <th>Visibility (Catalog)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className={!b.is_visible ? "row-hidden-book" : ""}>
                      <td className="book-cell">
                        <img
                          src={b.cover || b.cover_url}
                          alt={b.title}
                          className="admin-book-thumb"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <div>
                          <strong>{b.title}</strong>
                          <span className="book-cell-author">by {b.author}</span>
                          <span className="book-cell-isbn">ISBN: {b.isbn}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{b.cat || b.category}</span>
                      </td>
                      <td>
                        <strong>{formatPrice(b.price)}</strong>
                        <span className="admin-old-price">{formatPrice(b.old || b.old_price)}</span>
                      </td>
                      <td>
                        {b.stock || b.in_stock ? (
                          <span className="status-pill in-stock">✓ In Stock</span>
                        ) : (
                          <span className="status-pill out-of-stock">Out of Stock</span>
                        )}
                      </td>
                      <td>
                        {/* Units and Times Sold */}
                        <div className="sales-metric-cell">
                          <span
                            className={`sales-count-pill ${(b.units_sold || 0) > 0 ? "has-sales" : "zero-sales"}`}
                          >
                            {(b.units_sold || 0) > 0 ? (
                              <>
                                <Flame size={13} className="flame-icon" />
                                <strong>{b.units_sold} sold</strong>
                              </>
                            ) : (
                              <span>0 sold</span>
                            )}
                          </span>
                          {(b.times_sold || 0) > 0 && (
                            <small className="sales-orders-subtext">
                              in {b.times_sold} order{b.times_sold > 1 ? "s" : ""}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        {/* Select as Bestseller or Regular */}
                        <button
                          className={`bestseller-toggle-btn ${
                            b.is_bestseller || b.best ? "is-bestseller" : "not-bestseller"
                          }`}
                          onClick={() =>
                            handleToggleBestseller(b.id, b.is_bestseller || b.best, b.title)
                          }
                          title={
                            b.is_bestseller || b.best
                              ? "Currently selected as Bestseller ⭐. Click to remove."
                              : "Click to select and feature this book in Bestsellers ⭐"
                          }
                        >
                          {b.is_bestseller || b.best ? (
                            <>
                              <Star size={13} fill="#f59e0b" color="#f59e0b" />
                              <span>Bestseller</span>
                            </>
                          ) : (
                            <>
                              <Star size={13} color="#94a3b8" />
                              <span>Regular</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        {/* THE REQUESTED VISIBLE / NON-VISIBLE WORK */}
                        <button
                          className={`visibility-toggle-btn ${b.is_visible ? "is-visible" : "is-hidden"}`}
                          onClick={() => handleToggleVisibility(b.id, b.is_visible, b.title)}
                          title={
                            b.is_visible
                              ? "Click to make NON-VISIBLE (hide from customer store)"
                              : "Click to make VISIBLE in customer store"
                          }
                        >
                          {b.is_visible ? (
                            <>
                              <Eye size={14} /> Visible
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} /> Non-Visible
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="action-btns-group">
                          <button
                            className="icon-action-btn edit"
                            onClick={() => handleOpenEditBook(b)}
                            title="Edit Book Details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="icon-action-btn delete"
                            onClick={() => handleDeleteBook(b.id, b.title)}
                            title="Delete Book"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBooks.length === 0 && (
                <div className="empty-table-state">
                  <p>No books match your current search and filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: USERS DETAILS (ID, Name, Email, Role, Orders count, Spent)
            ========================================================================= */}
        {activeTab === "users" && (
          <div className="admin-tab-panel">
            <div className="admin-table-card">
              <div className="table-header-row">
                <h2>All Registered Users ({users.length})</h2>
                <span>Managed directly in MySQL database</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Orders Placed</th>
                    <th>Total Spend</th>
                    <th>Registered On</th>
                    <th>Role Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <strong>{u.name}</strong>
                        {u.phone && <div className="admin-user-submeta">📞 {u.phone}</div>}
                      </td>
                      <td>
                        <div>{u.email}</div>
                        {u.address && (
                          <div className="admin-user-address-meta" title={`${u.address}, ${u.city || ''} ${u.pincode || ''}`}>
                            🏠 {u.address.length > 28 ? u.address.substring(0, 28) + "…" : u.address}
                            {u.city ? ` (${u.city})` : ""}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                          {u.role === "admin" ? "👑 Admin" : "🛍️ Customer"}
                        </span>
                      </td>
                      <td>{u.orders_count || 0} orders</td>
                      <td>
                        <strong>{formatPrice(u.total_spent || 0)}</strong>
                      </td>
                      <td className="date-cell">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>
                        <div className="action-btns-group">
                          <button
                            className={`btn-role-toggle ${u.role === "admin" ? "demote" : "promote"}`}
                            onClick={() => handleUpdateRole(u.id, u.role, u.name)}
                            disabled={u.id === user.id}
                            title={
                              u.id === user.id
                                ? "Cannot modify your own active admin account"
                                : u.role === "admin"
                                ? "Demote to Customer"
                                : "Promote to Admin"
                            }
                          >
                            {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          </button>

                          {u.id !== user.id && (
                            <button
                              className="icon-action-btn delete"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CUSTOMER ORDERS (Orders list & Status Updater)
            ========================================================================= */}
        {activeTab === "orders" && (
          <div className="admin-tab-panel">
            <div className="admin-table-card">
              <div className="table-header-row">
                <h2>Customer Orders ({orders.length})</h2>
                <span>Real-time records from MySQL `orders` table</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>#{o.order_code}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{o.customer_name}</strong>
                          <span className="cell-sub">{o.customer_email}</span>
                          <span className="cell-sub">{o.customer_phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="items-summary-pill">
                          {o.items ? `${o.items.length} title(s)` : "Items record"}
                        </span>
                      </td>
                      <td>
                        <strong className="order-price">{formatPrice(o.total)}</strong>
                      </td>
                      <td>{o.payment_method}</td>
                      <td className="date-cell">
                        {o.date ? new Date(o.date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>
                        <select
                          className={`order-status-select ${o.status.toLowerCase()}`}
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {orders.length === 0 && (
                <div className="empty-table-state">
                  <p>No orders placed yet. Place an order to see it tracked here live.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: STORE ANALYTICS & OVERVIEW
            ========================================================================= */}
        {activeTab === "overview" && stats && (
          <div className="admin-tab-panel">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon-wrap revenue">
                  <DollarSign size={24} />
                </div>
                <div>
                  <span className="stat-label">Total Revenue</span>
                  <h3>{formatPrice(stats.orders?.total_revenue || 0)}</h3>
                  <small>From {stats.orders?.total_orders || 0} completed orders</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-wrap orders">
                  <Package size={24} />
                </div>
                <div>
                  <span className="stat-label">Total Orders</span>
                  <h3>{stats.orders?.total_orders || 0}</h3>
                  <small>{stats.orders?.pending_orders || 0} pending confirmation</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-wrap books">
                  <BookOpen size={24} />
                </div>
                <div>
                  <span className="stat-label">Catalog Books</span>
                  <h3>{stats.books?.total || 0}</h3>
                  <small>
                    {stats.books?.visible || 0} Visible • {stats.books?.hidden || 0} Hidden
                  </small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-wrap users">
                  <Users size={24} />
                </div>
                <div>
                  <span className="stat-label">Registered Users</span>
                  <h3>{stats.users?.total || 0}</h3>
                  <small>
                    {stats.users?.admins || 0} Admins • {stats.users?.customers || 0} Customers
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: TOP ANNOUNCEMENT BANNER MANAGEMENT
            ========================================================================= */}
        {activeTab === "announcement" && (
          <div className="admin-tab-panel announcement-manager-panel">
            {/* Page Header */}
            <div className="announcement-page-header">
              <div className="header-text-group">
                <div className="header-badge-row">
                  <span className="section-kicker">Storefront Settings</span>
                  <span className={`status-pill ${announcementForm.is_enabled ? "live" : "paused"}`}>
                    <span className="dot"></span>
                    {announcementForm.is_enabled ? "Currently Visible to Shoppers" : "Hidden from Shoppers"}
                  </span>
                </div>
                <h2>Store Announcement Bar</h2>
                <p>
                  Customize the promotional banner displayed at the very top of all public storefront pages.
                </p>
              </div>

              <div className="header-action-group">
                <button
                  type="button"
                  className="btn-store-preview"
                  onClick={() => navigate("/")}
                  title="Open public store in view mode"
                >
                  <ExternalLink size={15} />
                  <span>View Public Store</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="announcement-preview-card">
              <div className="preview-card-header">
                <div className="browser-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="preview-label">
                  <Sparkles size={14} />
                  <span>Live Storefront Preview (Updates in real time)</span>
                </div>
                <span className="preview-theme-indicator">
                  Theme: <strong>{announcementForm.bg_theme}</strong>
                </span>
              </div>

              <div className="preview-browser-canvas">
                {announcementForm.is_enabled ? (
                  <div
                    className={`announcement-mockup announcement announcement-${announcementForm.bg_theme || "navy"}`}
                  >
                    {announcementForm.lead_text && <span>{announcementForm.lead_text}</span>}
                    {announcementForm.lead_text && (announcementForm.highlight_text || announcementForm.tag_text) && (
                      <span className="announcement-sep">{announcementForm.separator_symbol || "—"}</span>
                    )}
                    {announcementForm.highlight_text && <strong>{announcementForm.highlight_text}</strong>}
                    {announcementForm.tag_text && (
                      <span className="announcement-tag">{announcementForm.tag_text}</span>
                    )}
                  </div>
                ) : (
                  <div className="announcement-disabled-placeholder">
                    <EyeOff size={16} />
                    <span>The announcement bar is currently turned OFF. Customers will not see any banner.</span>
                  </div>
                )}

                {/* Simulated Mini Nav Bar */}
                <div className="preview-mock-header">
                  <div className="mock-brand">
                    <strong>book<span>nest</span></strong>
                  </div>
                  <div className="mock-links">
                    <span>Home</span>
                    <span>Books</span>
                    <span>Categories</span>
                    <span>Bestsellers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form & Preset Grid */}
            <form onSubmit={handleSaveAnnouncement} className="announcement-editor-form">
              <div className="announcement-editor-grid">
                
                {/* Left Column: Form Controls */}
                <div className="editor-main-card">
                  <div className="card-section-title">
                    <Megaphone size={18} />
                    <h3>Banner Content & Messages</h3>
                  </div>

                  {/* Toggle Switch */}
                  <div className="announcement-switch-field">
                    <div className="switch-info">
                      <strong>Enable Announcement Bar</strong>
                      <p>Show or hide this promotion across the public storefront.</p>
                    </div>
                    <label className="admin-toggle-switch">
                      <input
                        type="checkbox"
                        checked={announcementForm.is_enabled}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, is_enabled: e.target.checked })
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Field 1: Lead Message */}
                  <div className="admin-form-group">
                    <label htmlFor="leadText">
                      Lead Message / Prefix
                      <span className="field-hint">e.g. "A little something for your next chapter"</span>
                    </label>
                    <input
                      id="leadText"
                      type="text"
                      value={announcementForm.lead_text}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, lead_text: e.target.value })
                      }
                      placeholder="e.g. A little something for your next chapter"
                    />
                  </div>

                  {/* Field 2: Separator */}
                  <div className="admin-form-group">
                    <label htmlFor="sepSymbol">
                      Separator Symbol
                      <span className="field-hint">Divider between prefix and bold highlight</span>
                    </label>
                    <div className="separator-input-row">
                      <input
                        id="sepSymbol"
                        type="text"
                        maxLength={5}
                        value={announcementForm.separator_symbol}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, separator_symbol: e.target.value })
                        }
                        className="short-sep-input"
                      />
                      <div className="quick-symbol-chips">
                        {["—", "•", "|", "✦", "★", "~"].map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            className={`symbol-chip ${announcementForm.separator_symbol === sym ? "selected" : ""}`}
                            onClick={() => setAnnouncementForm({ ...announcementForm, separator_symbol: sym })}
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Field 3: Highlight Text */}
                  <div className="admin-form-group">
                    <label htmlFor="highlightText">
                      Highlighted / Bold Promo Text
                      <span className="field-hint">e.g. "Save up to 40% on selected reads"</span>
                    </label>
                    <input
                      id="highlightText"
                      type="text"
                      value={announcementForm.highlight_text}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, highlight_text: e.target.value })
                      }
                      placeholder="e.g. Save up to 40% on selected reads"
                    />
                  </div>

                  {/* Field 4: Tag / Badge Text */}
                  <div className="admin-form-group">
                    <label htmlFor="tagText">
                      Tag / Badge Pill
                      <span className="field-hint">e.g. "✦ Free shipping on orders over ₹799"</span>
                    </label>
                    <input
                      id="tagText"
                      type="text"
                      value={announcementForm.tag_text}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, tag_text: e.target.value })
                      }
                      placeholder="e.g. ✦ Free shipping on orders over ₹799"
                    />
                  </div>

                  {/* Field 5: Target Link URL */}
                  <div className="admin-form-group">
                    <label htmlFor="linkUrl">
                      Click Destination URL (Optional)
                      <span className="field-hint">Page to open when a customer clicks the banner (e.g. /shop, /categories)</span>
                    </label>
                    <div className="link-input-wrapper">
                      <Globe size={16} className="link-icon" />
                      <input
                        id="linkUrl"
                        type="text"
                        value={announcementForm.link_url}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, link_url: e.target.value })
                        }
                        placeholder="/shop"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Visual Theme & Presets */}
                <div className="editor-side-card">
                  {/* Color Theme Selector */}
                  <div className="card-section-title">
                    <Palette size={18} />
                    <h3>Color Scheme Theme</h3>
                  </div>

                  <div className="theme-swatch-grid">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = announcementForm.bg_theme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          className={`theme-swatch-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setAnnouncementForm({ ...announcementForm, bg_theme: theme.id })}
                        >
                          <div className="swatch-color-bar" style={{ background: theme.bg }}>
                            <span className="swatch-accent-dot" style={{ background: theme.accent }}></span>
                          </div>
                          <div className="swatch-info">
                            <strong>{theme.name}</strong>
                            <span className="swatch-preview-text" style={{ color: theme.accent }}>
                              Preview
                            </span>
                          </div>
                          {isSelected && <CheckCircle size={16} className="swatch-check-icon" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Campaign Presets */}
                  <div className="card-section-title presets-title">
                    <Sparkles size={18} />
                    <h3>1-Click Campaign Presets</h3>
                  </div>
                  <p className="presets-sub">Click any template below to automatically fill the announcement bar:</p>

                  <div className="presets-list">
                    {ANNOUNCEMENT_PRESETS.map((preset, index) => (
                      <div
                        key={index}
                        className="preset-item-card"
                        onClick={() => {
                          setAnnouncementForm({ ...preset.data });
                          showToast(`Applied preset: "${preset.label}"`, "info");
                        }}
                      >
                        <div className="preset-item-header">
                          <strong>{preset.label}</strong>
                          <span className="preset-apply-hint">Apply Template</span>
                        </div>
                        <p>{preset.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Bottom Sticky Actions */}
              <div className="announcement-actions-bar">
                <button
                  type="button"
                  className="btn-reset-defaults"
                  onClick={handleResetAnnouncement}
                  disabled={savingAnnouncement}
                >
                  <RotateCcw size={15} />
                  <span>Reset to Default</span>
                </button>

                <div className="actions-right">
                  <button
                    type="submit"
                    className="btn-save-announcement"
                    disabled={savingAnnouncement}
                  >
                    <CheckCircle size={16} />
                    <span>{savingAnnouncement ? "Saving Changes…" : "Save Announcement Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>

      {/* =========================================================================
          ADD / EDIT BOOK MODAL
          ========================================================================= */}
      {bookModalOpen && (
        <div className="modal-backdrop" onClick={() => setBookModalOpen(false)}>
          <div className="admin-book-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBook ? "Edit Book Details" : "Add New Book to Catalog"}</h2>
              <button className="modal-close-btn" onClick={() => setBookModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="admin-book-form">
              <div className="form-grid">
                <div className="field full-field">
                  <label>Book Title *</label>
                  <input
                    required
                    value={bookFormData.title}
                    onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                    placeholder="e.g. Sapiens: A Brief History of Humankind"
                  />
                </div>

                <div className="field">
                  <label>Author *</label>
                  <input
                    required
                    value={bookFormData.author}
                    onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                    placeholder="e.g. Yuval Noah Harari"
                  />
                </div>

                <div className="field">
                  <label>Category *</label>
                  <select
                    value={bookFormData.category}
                    onChange={(e) => setBookFormData({ ...bookFormData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bookFormData.price}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, price: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="field">
                  <label>Original / Crossed-out Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={bookFormData.old_price}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, old_price: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="field">
                  <label>ISBN-13 *</label>
                  <input
                    required
                    value={bookFormData.isbn}
                    onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                    placeholder="e.g. 9780062316097"
                  />
                </div>

                <div className="field">
                  <label>Cover Image URL (Optional)</label>
                  <input
                    value={bookFormData.cover_url}
                    onChange={(e) => setBookFormData({ ...bookFormData, cover_url: e.target.value })}
                    placeholder="Leave empty for auto OpenLibrary cover"
                  />
                </div>

                <div className="field">
                  <label>Publisher</label>
                  <input
                    value={bookFormData.publisher}
                    onChange={(e) => setBookFormData({ ...bookFormData, publisher: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Pages Count</label>
                  <input
                    type="number"
                    value={bookFormData.pages}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, pages: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="field full-field">
                  <label>Book Synopsis / Description</label>
                  <textarea
                    rows={3}
                    value={bookFormData.description}
                    onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                    placeholder="Enter an engaging description for readers..."
                  />
                </div>

                <div className="field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={bookFormData.in_stock}
                      onChange={(e) =>
                        setBookFormData({ ...bookFormData, in_stock: e.target.checked })
                      }
                    />
                    <span>Book is currently In Stock</span>
                  </label>
                </div>

                <div className="field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={bookFormData.is_visible}
                      onChange={(e) =>
                        setBookFormData({ ...bookFormData, is_visible: e.target.checked })
                      }
                    />
                    <span>
                      <strong>Visible in Store</strong> (Uncheck to keep hidden from customers)
                    </span>
                  </label>
                </div>

                <div className="field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={bookFormData.is_bestseller}
                      onChange={(e) =>
                        setBookFormData({ ...bookFormData, is_bestseller: e.target.checked })
                      }
                    />
                    <span>
                      <strong>⭐ Mark as Bestseller</strong> (Feature in Bestsellers section)
                    </span>
                  </label>
                </div>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBook ? "Save Changes" : "Create Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
