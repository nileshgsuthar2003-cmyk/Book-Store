import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useShop } from "../context/useShop";
import { api } from "../services/api";
import { formatPrice } from "../data/booksData";
import {
  User,
  MapPin,
  Lock,
  Package,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  Home as HomeIcon,
  Eye
} from "lucide-react";
import { OrderDetailsModal } from "../components/OrderDetailsModal";

export const Profile = () => {
  const { user, isAuthenticated, updateUserProfile, openAuthModal } = useAuth();
  const { currentRoute, navigate, showToast } = useShop();

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("tab=orders") || window.location.hash.includes("orders")) {
        return "orders";
      }
    }
    return "profile";
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (currentRoute && (currentRoute.includes("tab=orders") || currentRoute.includes("orders"))) {
      setActiveTab("orders");
    }
  }, [currentRoute]);

  // Profile and Address Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });

  // Security / Password Form State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // User Orders
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sync form state when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        country: user.country || "India"
      });
    }
  }, [user]);

  // Load orders when orders tab is active
  useEffect(() => {
    if (activeTab === "orders" && isAuthenticated) {
      let isMounted = true;
      setLoadingOrders(true);
      api
        .getOrders()
        .then((res) => {
          if (isMounted && res.orders) {
            setUserOrders(res.orders);
          }
        })
        .catch((err) => {
          console.error("Failed to load user orders:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingOrders(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="container page-heading">
          <nav className="breadcrumbs">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>My Account</span>
          </nav>
          <h1>My Profile & Saved Address</h1>
        </div>
        <div className="container">
          <div className="empty-state profile-unauth-card">
            <div className="empty-icon">
              <User size={48} strokeWidth={1.5} />
            </div>
            <h3>Please sign in to access your profile</h3>
            <p>
              Sign in to manage your personal details, save your delivery addresses for quick 1-click checkout,
              and track all your book orders.
            </p>
            <div className="unauth-actions">
              <button className="btn btn-primary" onClick={() => openAuthModal("login")}>
                Sign In to Account
              </button>
              <button className="btn btn-secondary" onClick={() => openAuthModal("register")}>
                Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setSavingProfile(true);

    try {
      await updateUserProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country
      });

      setProfileMsg({
        type: "success",
        text: "Your profile details and delivery address have been updated successfully!"
      });
      showToast("Profile & address saved successfully!", "success");
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.message || "Failed to update profile. Please try again."
      });
      showToast(err.message || "Failed to update profile", "warning");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (securityData.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match. Please verify." });
      return;
    }

    setSavingPassword(true);
    try {
      await updateUserProfile({
        name: formData.name,
        current_password: securityData.currentPassword,
        new_password: securityData.newPassword
      });

      setPasswordMsg({
        type: "success",
        text: "Your password has been changed successfully!"
      });
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated successfully!", "success");
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.message || "Failed to update password. Check your current password."
      });
      showToast(err.message || "Failed to change password", "warning");
    } finally {
      setSavingPassword(false);
    }
  };

  const hasSavedAddress = Boolean(formData.address || formData.city || formData.pincode);

  return (
    <div className="profile-page">
      <div className="container page-heading">
        <nav className="breadcrumbs" aria-label="Breadcrumbs">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
          <span className="breadcrumb-sep">/</span>
          <span>My Profile & Account</span>
        </nav>
        <h1>Account Settings</h1>
        <p>Manage your personal profile, saved shipping addresses, and account security.</p>
      </div>

      <div className="container">
        <div className="profile-layout">
          {/* Left Sidebar Profile Summary */}
          <aside className="profile-sidebar">
            <div className="profile-user-card">
              <div className="profile-avatar-large">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h2 className="profile-user-name">{user?.name}</h2>
              <span className="profile-user-email">{user?.email}</span>
              <div className="profile-role-badge-wrap">
                <span className={`user-role-tag ${user?.role}`}>
                  {user?.role === "admin" ? "👑 Administrator" : "🛍️ BookNest Member"}
                </span>
              </div>

              {user?.role === "admin" && (
                <a
                  href="/admin"
                  className="profile-admin-shortcut-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin");
                  }}
                >
                  <Shield size={14} /> Open Admin Portal <ExternalLink size={12} />
                </a>
              )}
            </div>

            <nav className="profile-tabs-nav">
              <button
                className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User size={17} />
                <span>Personal Info & Address</span>
              </button>

              <button
                className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <Lock size={17} />
                <span>Security & Password</span>
              </button>

              <button
                className={`profile-tab-btn ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                <Package size={17} />
                <span>My Orders</span>
                {userOrders.length > 0 && <span className="tab-count-pill">{userOrders.length}</span>}
              </button>
            </nav>

            {hasSavedAddress && (
              <div className="profile-address-snippet">
                <div className="snippet-header">
                  <MapPin size={14} />
                  <strong>Current Delivery Address</strong>
                </div>
                <p>
                  {formData.address || "No street address"}
                  <br />
                  {formData.city && `${formData.city}, `}
                  {formData.state && `${formData.state} `}
                  {formData.pincode && `- ${formData.pincode}`}
                </p>
              </div>
            )}
          </aside>

          {/* Right Main Content */}
          <main className="profile-main">
            {/* TAB 1: Profile & Saved Address */}
            {activeTab === "profile" && (
              <div className="profile-tab-pane">
                {profileMsg.text && (
                  <div className={`profile-alert ${profileMsg.type}`}>
                    {profileMsg.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="profile-edit-form">
                  {/* Personal Information */}
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="icon-wrap">
                        <User size={20} />
                      </div>
                      <div>
                        <h3>Personal Details</h3>
                        <p>Update your public name and primary contact details</p>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="profName">Full Name *</label>
                        <div className="input-with-icon">
                          <User size={16} />
                          <input
                            id="profName"
                            name="name"
                            required
                            placeholder="e.g. Maya Sharma"
                            value={formData.name}
                            onChange={handleProfileChange}
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="profEmail">Email Address (Login ID)</label>
                        <div className="input-with-icon disabled">
                          <Mail size={16} />
                          <input
                            id="profEmail"
                            disabled
                            value={user?.email || ""}
                            title="Email address cannot be changed directly."
                          />
                        </div>
                        <small className="field-hint">Your unique BookNest account identifier.</small>
                      </div>

                      <div className="field full-field">
                        <label htmlFor="profPhone">Mobile / Phone Number</label>
                        <div className="input-with-icon">
                          <Phone size={16} />
                          <input
                            id="profPhone"
                            name="phone"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <small className="field-hint">Used for order shipment and delivery updates.</small>
                      </div>
                    </div>
                  </div>

                  {/* Saved Delivery Address Card */}
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="icon-wrap highlight">
                        <MapPin size={20} />
                      </div>
                      <div className="header-info">
                        <div className="title-row">
                          <h3>Saved Delivery Address</h3>
                          {hasSavedAddress && <span className="address-saved-pill">✓ Saved</span>}
                        </div>
                        <p>This address will automatically pre-fill your checkout bag for quick ordering.</p>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field full-field">
                        <label htmlFor="profAddress">Street Address / House / Flat / Area *</label>
                        <div className="input-with-icon">
                          <HomeIcon size={16} />
                          <input
                            id="profAddress"
                            name="address"
                            placeholder="Flat / House No., Apartment name, Street, Landmark"
                            value={formData.address}
                            onChange={handleProfileChange}
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="profCity">City *</label>
                        <input
                          id="profCity"
                          name="city"
                          placeholder="e.g. Mumbai, Bengaluru, Delhi"
                          value={formData.city}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="profState">State / Province *</label>
                        <input
                          id="profState"
                          name="state"
                          placeholder="e.g. Maharashtra, Karnataka"
                          value={formData.state}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="profPincode">PIN / Postal Code *</label>
                        <input
                          id="profPincode"
                          name="pincode"
                          placeholder="e.g. 400001"
                          value={formData.pincode}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="profCountry">Country</label>
                        <input
                          id="profCountry"
                          name="country"
                          value={formData.country}
                          onChange={handleProfileChange}
                          placeholder="India"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-actions">
                    <button type="submit" className="btn btn-primary save-btn" disabled={savingProfile}>
                      <Save size={16} />
                      <span>{savingProfile ? "Saving Details..." : "Save Profile & Address"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Security & Password */}
            {activeTab === "security" && (
              <div className="profile-tab-pane">
                {passwordMsg.text && (
                  <div className={`profile-alert ${passwordMsg.type}`}>
                    {passwordMsg.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="profile-card">
                  <div className="profile-card-header">
                    <div className="icon-wrap">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h3>Change Password</h3>
                      <p>Ensure your account is using a strong, unique password</p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePassword} className="security-form">
                    <div className="form-grid">
                      <div className="field full-field">
                        <label htmlFor="curPwd">Current Password *</label>
                        <div className="input-with-icon">
                          <Lock size={16} />
                          <input
                            id="curPwd"
                            type="password"
                            required
                            placeholder="Enter current password"
                            value={securityData.currentPassword}
                            onChange={handleSecurityChange}
                            name="currentPassword"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="newPwd">New Password *</label>
                        <div className="input-with-icon">
                          <Lock size={16} />
                          <input
                            id="newPwd"
                            type="password"
                            required
                            placeholder="At least 6 characters"
                            value={securityData.newPassword}
                            onChange={handleSecurityChange}
                            name="newPassword"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="confPwd">Confirm New Password *</label>
                        <div className="input-with-icon">
                          <Lock size={16} />
                          <input
                            id="confPwd"
                            type="password"
                            required
                            placeholder="Repeat new password"
                            value={securityData.confirmPassword}
                            onChange={handleSecurityChange}
                            name="confirmPassword"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="profile-form-actions">
                      <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                        <Lock size={16} />
                        <span>{savingPassword ? "Updating Password..." : "Update Password"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: My Orders */}
            {activeTab === "orders" && (
              <div className="profile-tab-pane">
                <div className="profile-card">
                  <div className="profile-card-header">
                    <div className="icon-wrap">
                      <Package size={20} />
                    </div>
                    <div>
                      <h3>My Order History</h3>
                      <p>View your past book purchases and shipping statuses</p>
                    </div>
                  </div>

                  {loadingOrders && (
                    <div className="orders-loading-state">
                      <Clock size={24} className="spin" />
                      <p>Loading your orders…</p>
                    </div>
                  )}

                  {!loadingOrders && userOrders.length === 0 && (
                    <div className="empty-orders-state">
                      <Package size={36} strokeWidth={1.5} />
                      <h4>No orders placed yet</h4>
                      <p>Explore our library and start your next reading journey today.</p>
                      <button className="btn btn-secondary" onClick={() => navigate("/shop")}>
                        Browse Books Catalog
                      </button>
                    </div>
                  )}

                  {!loadingOrders && userOrders.length > 0 && (
                    <div className="profile-orders-list">
                      {userOrders.map((ord) => (
                        <div key={ord.id} className="user-order-item">
                          <div className="order-item-top">
                            <div>
                              <strong className="order-code">{ord.order_code}</strong>
                              <span className="order-date">
                                {new Date(ord.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <div className="order-item-badges">
                              <span className={`status-pill ${ord.status.toLowerCase()}`}>
                                {ord.status}
                              </span>
                              <strong className="order-total">{formatPrice(ord.total)}</strong>
                            </div>
                          </div>

                          <div className="order-item-details">
                            <span className="shipping-to">
                              <MapPin size={13} /> {ord.delivery_address || ord.city}
                            </span>
                            <span className="payment-type">
                              Payment: {ord.payment_method || "COD"}
                            </span>
                          </div>

                          {ord.items && ord.items.length > 0 && (
                            <div className="order-books-preview">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="preview-book-chip">
                                  {it.cover_url && (
                                    <img src={it.cover_url} alt={it.title} className="chip-cover" />
                                  )}
                                  <span className="chip-title">
                                    {it.title} × {it.quantity || it.qty || 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="user-order-actions-bar">
                            <button
                              type="button"
                              className="btn-view-order-details"
                              onClick={() => setSelectedOrder(ord)}
                            >
                              <Eye size={13} />
                              <span>View Full Order Details & Receipt</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Full Order Details & Invoice Receipt Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
};
