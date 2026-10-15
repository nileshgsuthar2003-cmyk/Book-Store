// API Client for BookNest Flask Backend

const API_BASE = "/api";

function getAuthHeader() {
  const token = localStorage.getItem("bn-auth-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  sendOtp: ({ email, name = "Book Lover", purpose = "register" }) =>
    request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, name, purpose })
    }),

  register: (name, email, password, otp = "") =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, otp })
    }),

  getMe: () => request("/auth/me"),

  updateProfile: (profileData) =>
    request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData)
    }),

  // Health
  checkHealth: () => request("/health"),

  // Books (Public & Filtered)
  getBooks: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append("q", params.q);
    if (params.category) searchParams.append("category", params.category);
    if (params.sort) searchParams.append("sort", params.sort);
    if (params.max_price) searchParams.append("max_price", params.max_price);
    if (params.in_stock) searchParams.append("in_stock", "1");
    if (params.best) searchParams.append("best", "1");
    if (params.new) searchParams.append("new", "1");
    if (params.limit) searchParams.append("limit", params.limit);
    if (params.include_hidden) searchParams.append("include_hidden", "1");

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request(`/books${query}`);
  },

  getBookById: (id) => request(`/books/${id}`),

  // Admin Book Management
  createBook: (bookData) =>
    request("/books", {
      method: "POST",
      body: JSON.stringify(bookData)
    }),

  updateBook: (id, bookData) =>
    request(`/books/${id}`, {
      method: "PUT",
      body: JSON.stringify(bookData)
    }),

  toggleBookVisibility: (id, is_visible) =>
    request(`/books/${id}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ is_visible })
    }),

  toggleBookBestseller: (id, is_bestseller) =>
    request(`/books/${id}/bestseller`, {
      method: "PATCH",
      body: JSON.stringify({ is_bestseller })
    }),

  deleteBook: (id) =>
    request(`/books/${id}`, {
      method: "DELETE"
    }),

  // Admin Panel APIs
  getAdminStats: () => request("/admin/stats"),

  getAdminUsers: () => request("/admin/users"),

  updateUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role })
    }),

  deleteUser: (userId) =>
    request(`/admin/users/${userId}`, {
      method: "DELETE"
    }),

  // Categories
  getCategories: () => request("/categories"),

  // Coupons
  validateCoupon: (code, subtotal) =>
    request("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal })
    }),

  // Orders
  createOrder: ({ customer, items, coupon }) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify({ customer, items, coupon })
    }),

  getOrders: () => request("/orders"),

  getOrderByCode: (code) => request(`/orders/${encodeURIComponent(code)}`),

  updateOrderStatus: (orderId, status) =>
    request(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    }),

  // Newsletter
  subscribeNewsletter: (email) =>
    request("/newsletter", {
      method: "POST",
      body: JSON.stringify({ email })
    }),

  // Wishlist
  getWishlist: () => request("/wishlist"),

  toggleWishlist: (bookId) =>
    request("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ book_id: Number(bookId) })
    })
};
