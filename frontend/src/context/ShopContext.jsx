// eslint-disable-next-line react-refresh/only-export-components
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ShopContext } from "./ShopContextInstance";
import { BOOKS as FALLBACK_BOOKS, CATEGORIES, CATEGORY_ICONS } from "../data/booksData";
import { api } from "../services/api";

const loadFromStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key} from storage`, e);
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage`, e);
  }
};

const DEFAULT_CATEGORIES = CATEGORIES.map((name, idx) => ({
  id: idx + 1,
  name,
  icon: CATEGORY_ICONS[name] || "✦",
  count: 0
}));

const DEFAULT_HERO = {
  eyebrow: "A world between the pages",
  title_prefix: "Your next great read",
  title_highlight: "starts here.",
  description:
    "Discover stories, ideas, and adventures worth getting lost in. Thoughtfully curated editions for curious minds, night owls, and book lovers everywhere.",
  primary_btn_text: "Explore Books",
  primary_btn_url: "/shop",
  secondary_btn_text: "Discover Bestsellers",
  secondary_btn_url: "/shop?best=1",
  feature_1: "Thoughtfully curated",
  feature_2: "Lovely prices",
  feature_3: "For every reader",
  image_url:
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85",
  badge_icon: "✦",
  badge_title: "30,000+ happy readers",
  badge_subtitle: "and counting"
};

const DEFAULT_ANNOUNCEMENT = {
  is_enabled: true,
  lead_text: "A little something for your next chapter",
  separator_symbol: "—",
  highlight_text: "Save up to 40% on selected reads",
  tag_text: "✦ Free shipping on orders over ₹799",
  bg_theme: "navy",
  link_url: "/shop"
};

const DEFAULT_SUPPORT = {
  heading: "Support & Care",
  link_text: "Your Book Bag",
  link_url: "/cart",
  email: "hello@booknest.example",
  hours: "Mon – Sat: 9am – 7pm IST",
  promo_tag: "Use code BOOK10",
  phone: "+91 (800) 266-5637"
};

export const ShopProvider = ({ children }) => {
  const [books, setBooks] = useState(FALLBACK_BOOKS);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendStats, setBackendStats] = useState(null);

  const [categories, setCategories] = useState(() =>
    loadFromStorage("bn-categories", DEFAULT_CATEGORIES)
  );
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [hero, setHero] = useState(() =>
    loadFromStorage("bn-hero", DEFAULT_HERO)
  );

  const [announcement, setAnnouncement] = useState(() =>
    loadFromStorage("bn-announcement", DEFAULT_ANNOUNCEMENT)
  );

  const [supportInfo, setSupportInfo] = useState(() =>
    loadFromStorage("bn-support", DEFAULT_SUPPORT)
  );

  const [cart, setCart] = useState(() => loadFromStorage("bn-cart", {}));
  const [wishlist, setWishlist] = useState(() => loadFromStorage("bn-wish", []));
  const [lastOrder, setLastOrder] = useState(() => loadFromStorage("bn-order", null));
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [priceLimit, setPriceLimit] = useState(1000);
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (window.location.hash) {
      const clean = window.location.hash.replace(/^#\/?/, "/");
      window.history.replaceState({}, "", clean === "/home" ? "/" : clean);
      return clean === "/home" ? "/" : clean;
    }
    const path = window.location.pathname + window.location.search;
    return path || "/";
  });

  // Keep storage in sync
  useEffect(() => {
    saveToStorage("bn-cart", cart);
  }, [cart]);

  useEffect(() => {
    saveToStorage("bn-wish", wishlist);
  }, [wishlist]);

  useEffect(() => {
    saveToStorage("bn-announcement", announcement);
  }, [announcement]);

  useEffect(() => {
    saveToStorage("bn-hero", hero);
  }, [hero]);

  useEffect(() => {
    saveToStorage("bn-support", supportInfo);
  }, [supportInfo]);

  // Load books & announcement from Flask Backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [healthRes, booksRes, announcementRes, categoriesRes, heroRes, supportRes] = await Promise.all([
          api.checkHealth().catch(() => null),
          api.getBooks().catch(() => null),
          api.getAnnouncement().catch(() => null),
          api.getCategories().catch(() => null),
          api.getHero().catch(() => null),
          api.getSupport().catch(() => null)
        ]);

        if (!isMounted) return;

        if (healthRes && healthRes.status === "healthy") {
          setBackendOnline(true);
          setBackendStats(healthRes.stats);
        } else {
          setBackendOnline(false);
        }

        if (booksRes && Array.isArray(booksRes.books) && booksRes.books.length > 0) {
          setBooks(booksRes.books);
        }

        if (announcementRes && announcementRes.announcement) {
          setAnnouncement(announcementRes.announcement);
        }

        if (categoriesRes && Array.isArray(categoriesRes.categories) && categoriesRes.categories.length > 0) {
          setCategories(categoriesRes.categories);
          saveToStorage("bn-categories", categoriesRes.categories);
        }

        if (heroRes && heroRes.hero) {
          setHero(heroRes.hero);
          saveToStorage("bn-hero", heroRes.hero);
        }

        if (supportRes && supportRes.support) {
          setSupportInfo(supportRes.support);
          saveToStorage("bn-support", supportRes.support);
        }
      } catch (err) {
        console.warn("Backend connection notice; using local fallback dataset:", err);
      } finally {
        if (isMounted) {
          setLoadingBooks(false);
        }
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await api.getCategories();
      if (res && Array.isArray(res.categories) && res.categories.length > 0) {
        setCategories(res.categories);
        saveToStorage("bn-categories", res.categories);
        return res.categories;
      }
    } catch (err) {
      console.warn("Failed to refresh categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const refreshBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const [healthRes, booksRes, catRes] = await Promise.all([
        api.checkHealth().catch(() => null),
        api.getBooks().catch(() => null),
        api.getCategories().catch(() => null)
      ]);

      if (healthRes && healthRes.status === "healthy") {
        setBackendOnline(true);
        setBackendStats(healthRes.stats);
      }

      if (booksRes && Array.isArray(booksRes.books) && booksRes.books.length > 0) {
        setBooks(booksRes.books);
      }

      if (catRes && Array.isArray(catRes.categories) && catRes.categories.length > 0) {
        setCategories(catRes.categories);
        saveToStorage("bn-categories", catRes.categories);
      }
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  const categoryNames = useMemo(() => {
    const names = (categories || []).map((c) => c.name).filter(Boolean);
    return names.length > 0 ? names : CATEGORIES;
  }, [categories]);

  const categoryIconMap = useMemo(() => {
    const map = { ...CATEGORY_ICONS };
    (categories || []).forEach((c) => {
      if (c && c.name && c.icon) {
        map[c.name] = c.icon;
      }
    });
    return map;
  }, [categories]);

  const refreshAnnouncement = useCallback(async () => {
    try {
      const res = await api.getAnnouncement();
      if (res && res.announcement) {
        setAnnouncement(res.announcement);
        saveToStorage("bn-announcement", res.announcement);
        return res.announcement;
      }
    } catch (err) {
      console.warn("Failed to refresh announcement:", err);
    }
  }, []);

  const refreshHero = useCallback(async () => {
    try {
      const res = await api.getHero();
      if (res && res.hero) {
        setHero(res.hero);
        saveToStorage("bn-hero", res.hero);
        return res.hero;
      }
    } catch (err) {
      console.warn("Failed to refresh hero:", err);
    }
  }, []);

  const refreshSupport = useCallback(async () => {
    try {
      const res = await api.getSupport();
      if (res && res.support) {
        setSupportInfo(res.support);
        saveToStorage("bn-support", res.support);
        return res.support;
      }
    } catch (err) {
      console.warn("Failed to refresh support info:", err);
    }
  }, []);

  // Route listener (HTML5 History API with popstate & hash fallback)
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.hash) {
        const clean = window.location.hash.replace(/^#\/?/, "/");
        window.history.replaceState({}, "", clean === "/home" ? "/" : clean);
        setCurrentRoute(clean === "/home" ? "/" : clean);
      } else {
        const path = window.location.pathname + window.location.search;
        setCurrentRoute(path || "/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigate = useCallback((target) => {
    if (!target) return;
    let clean = target.replace(/^#\/?/, "");
    if (!clean.startsWith("/")) {
      clean = "/" + clean;
    }
    if (clean === "/home") clean = "/";

    window.history.pushState({}, "", clean);
    setCurrentRoute(clean);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const showToast = useCallback((message, type = "info") => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const addToCart = useCallback((bookId, quantity = 1) => {
    const book = books.find((b) => b.id === Number(bookId));
    if (!book) return;
    if (!book.stock) {
      showToast("Sorry, this book is currently out of stock.", "warning");
      return;
    }

    setCart((prev) => {
      const current = prev[bookId] || 0;
      return { ...prev, [bookId]: current + quantity };
    });
    showToast(`Added "${book.title}" to your book bag!`, "success");
  }, [books, showToast]);

  const removeFromCart = useCallback((bookId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    showToast("Removed from your book bag.", "info");
  }, [showToast]);

  const updateQuantity = useCallback((bookId, delta) => {
    setCart((prev) => {
      const current = prev[bookId] || 0;
      const nextQty = current + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[bookId];
        return next;
      }
      return { ...prev, [bookId]: nextQty };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const toggleWishlist = useCallback((bookId) => {
    const id = Number(bookId);
    setWishlist((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      showToast(exists ? "Removed from wishlist" : "Saved to your reading wishlist ♥", "info");
      return next;
    });
    // Async background sync with Flask backend if available
    api.toggleWishlist(bookId).catch(() => {});
  }, [showToast]);

  const isInWishlist = useCallback((bookId) => {
    return wishlist.includes(Number(bookId));
  }, [wishlist]);

  // Derived subtotal before discount
  const cartSubtotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const book = books.find((b) => b.id === Number(id));
      return sum + (book ? book.price * qty : 0);
    }, 0);
  }, [cart, books]);

  // Dynamic Coupon validation with Flask backend
  const applyCoupon = useCallback(async (code) => {
    const upper = (code || "").trim().toUpperCase();
    if (!upper) return { success: false, message: "Please enter a coupon code." };

    try {
      // Call Flask Backend to validate coupon in SQLite database
      const res = await api.validateCoupon(upper, cartSubtotal);
      if (res.valid) {
        setCouponCode(res.code);
        setAppliedDiscount(res.discount);
        showToast(`Discount applied: ${res.code} (−₹${res.discount})`, "success");
        return { success: true, message: res.message };
      } else {
        showToast(res.message || "Invalid coupon code.", "warning");
        return { success: false, message: res.message };
      }
    } catch (err) {
      // Offline fallback
      if (upper === "BOOK10") {
        const disc = Math.round(cartSubtotal * 0.1);
        setCouponCode("BOOK10");
        setAppliedDiscount(disc);
        showToast("Discount applied: BOOK10", "success");
        return { success: true, message: "10% off applied!" };
      } else if (upper === "WELCOME50" && cartSubtotal >= 499) {
        setCouponCode("WELCOME50");
        setAppliedDiscount(50);
        showToast("Discount applied: WELCOME50", "success");
        return { success: true, message: "₹50 off applied!" };
      }
      const msg = err.message || "Invalid promo code. Try BOOK10 or WELCOME50.";
      showToast(msg, "warning");
      return { success: false, message: msg };
    }
  }, [cartSubtotal, showToast]);

  const removeCoupon = useCallback(() => {
    setCouponCode("");
    setAppliedDiscount(0);
    showToast("Coupon removed.", "info");
  }, [showToast]);

  // Dynamic Order creation with Flask backend
  const placeOrder = useCallback(async (customerData, options = {}) => {
    const { skipNavigate = false } = options;
    const shipping = !cartSubtotal || cartSubtotal >= 799 ? 0 : 49;
    const itemsPayload = Object.entries(cart).map(([id, qty]) => ({
      id: Number(id),
      qty
    }));

    // Stock check against local catalog
    const outOfStockItems = itemsPayload
      .map((it) => books.find((b) => b.id === it.id))
      .filter((b) => b && (b.in_stock === false || b.stock === false));

    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map((b) => `'${b.title}'`).join(", ");
      const msg = `Sorry, ${names} ${outOfStockItems.length === 1 ? "is" : "are"} currently out of stock. Please remove from your bag to proceed.`;
      showToast(msg, "error");
      throw new Error(msg);
    }

    try {
      // POST to Flask Backend
      const res = await api.createOrder({
        customer: customerData,
        items: itemsPayload,
        coupon: couponCode
      });

      if (res && res.order) {
        const created = res.order;
        saveToStorage("bn-order", created);
        setLastOrder(created);
        clearCart();
        setCouponCode("");
        setAppliedDiscount(0);
        if (!skipNavigate) {
          navigate("/order-confirmation");
        }
        showToast(`Order #${created.order_code} placed successfully!`, "success");
        return created;
      }
    } catch (err) {
      if (err.message && (err.message.includes("out of stock") || err.message.includes("required") || err.message.includes("not found"))) {
        showToast(err.message, "error");
        throw err;
      }
      console.warn("Backend order creation error:", err);
      showToast(err.message || "Failed to place order. Please try again.", "error");
      throw err;
    }
  }, [cart, cartSubtotal, couponCode, books, clearCart, navigate, showToast]);

  // Derived values
  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }, [cart]);

  const wishlistCount = wishlist.length;
  const shippingFee = cartSubtotal === 0 || cartSubtotal >= 799 ? 0 : 49;
  const discountAmount = appliedDiscount;
  const cartTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);

  const value = {
    books,
    loadingBooks,
    backendOnline,
    backendStats,
    cart,
    wishlist,
    lastOrder,
    couponCode,
    toast,
    searchQuery,
    selectedCategory,
    sortBy,
    priceLimit,
    currentRoute,
    cartItemCount,
    wishlistCount,
    cartSubtotal,
    shippingFee,
    discountAmount,
    cartTotal,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    setPriceLimit,
    navigate,
    showToast,
    clearToast,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    applyCoupon,
    removeCoupon,
    placeOrder,
    refreshBooks,
    categories,
    categoryNames,
    categoryIconMap,
    loadingCategories,
    refreshCategories,
    setCategories,
    announcement,
    setAnnouncement,
    refreshAnnouncement,
    hero,
    setHero,
    refreshHero,
    supportInfo,
    setSupportInfo,
    refreshSupport
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export { ShopContext };
// oxlint-disable-next-line react/only-export-components, react-refresh/only-export-components
export { useShop } from "./useShop";
