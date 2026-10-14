import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useShop } from "../context/useShop";
import { X, Lock, Mail, User, AlertCircle } from "lucide-react";

export const AuthModal = () => {
  const { authModalOpen, authModalMode, setAuthModalMode, closeAuthModal, login, register } = useAuth();
  const { showToast } = useShop();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!authModalOpen) return null;

  const isLogin = authModalMode === "login";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password);
        showToast(`Welcome back, ${res.user.name}!`, "success");
      } else {
        const res = await register(formData.name, formData.email, formData.password, formData.role);
        showToast(`Account created successfully! Welcome, ${res.user.name}.`, "success");
      }
      closeAuthModal();
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={closeAuthModal} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Lock size={20} />
          </div>
          <h2>{isLogin ? "Welcome to BookNest" : "Join the Reading Circle"}</h2>
          <p>
            {isLogin
              ? "Sign in to access your personal shelf, track orders, or manage the store."
              : "Create an account to save books, leave reviews, and enjoy swift checkout."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => {
              setAuthModalMode("login");
              setError("");
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setAuthModalMode("register");
              setError("");
            }}
            type="button"
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="authName">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  id="authName"
                  name="name"
                  required
                  placeholder="e.g. Maya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="authEmail">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                id="authEmail"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="authPassword">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                id="authPassword"
                name="password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary full auth-submit-btn" disabled={loading}>
            {loading ? "Processing…" : isLogin ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        {/* Footer info */}
        <div className="auth-footer-note">
          {isLogin ? (
            <span>
              Don't have an account yet?{" "}
              <button
                type="button"
                className="switch-link"
                onClick={() => {
                  setAuthModalMode("register");
                  setError("");
                }}
              >
                Sign up here
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="switch-link"
                onClick={() => {
                  setAuthModalMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
