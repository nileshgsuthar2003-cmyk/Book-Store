import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useShop } from "../context/useShop";
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";

export const AuthModal = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    register,
    sendOtp
  } = useAuth();
  const { showToast } = useShop();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  // 'form' = filling name, email, password; 'otp' = verifying 6-digit email code
  const [registerStep, setRegisterStep] = useState("form");
  const [otpCode, setOtpCode] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = authModalMode === "login";

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Reset internal step state when switching modes or closing
  const handleTabSwitch = (mode) => {
    setAuthModalMode(mode);
    setRegisterStep("form");
    setOtpCode("");
    setDemoOtp("");
    setError("");
  };

  const handleClose = () => {
    closeAuthModal();
    setRegisterStep("form");
    setOtpCode("");
    setDemoOtp("");
    setError("");
  };

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // Step 1: Request OTP during account creation
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please provide your name, email, and password.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp({
        email: formData.email,
        name: formData.name,
        purpose: "register"
      });

      setRegisterStep("otp");
      setResendTimer(60);
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
      }
      showToast(`Verification code sent to ${formData.email}!`, "info");
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize user creation
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        cleanOtp
      );

      showToast(`Email verified! Welcome to BookNest, ${res.user.name}.`, "success");
      handleClose();
    } catch (err) {
      setError(err.message || "Invalid or expired verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Standard Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(formData.email, formData.password);
      showToast(`Welcome back, ${res.user.name}!`, "success");
      handleClose();
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendTimer > 0 || sendingOtp) return;
    setError("");
    setSendingOtp(true);

    try {
      const res = await sendOtp({
        email: formData.email,
        name: formData.name,
        purpose: "register"
      });

      setResendTimer(60);
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
      }
      showToast(`New verification code sent to ${formData.email}!`, "success");
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            {registerStep === "otp" && !isLogin ? <KeyRound size={20} /> : <Lock size={20} />}
          </div>
          <h2>
            {isLogin
              ? "Welcome to BookNest"
              : registerStep === "otp"
              ? "Verify Your Email"
              : "Join the Reading Circle"}
          </h2>
          <p>
            {isLogin
              ? "Sign in to access your personal shelf, track orders, or manage the store."
              : registerStep === "otp"
              ? `Enter the 6-digit code sent to ${formData.email}`
              : "Create an account to save books, leave reviews, and enjoy swift checkout."}
          </p>
        </div>

        {/* Tab Switcher (Visible unless in OTP verification step) */}
        {registerStep !== "otp" && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "active" : ""}`}
              onClick={() => handleTabSwitch("login")}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? "active" : ""}`}
              onClick={() => handleTabSwitch("register")}
              type="button"
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: SIGN IN FORM
            ========================================================================= */}
        {isLogin && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
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
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary full auth-submit-btn" disabled={loading}>
              {loading ? "Authenticating…" : "Sign In →"}
            </button>
          </form>
        )}

        {/* =========================================================================
            VIEW 2: CREATE ACCOUNT - STEP 1 (DETAILS)
            ========================================================================= */}
        {!isLogin && registerStep === "form" && (
          <form className="auth-form" onSubmit={handleRequestOtp}>
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
              <small className="field-sub-note">We'll send a 6-digit verification code to this address.</small>
            </div>

            <div className="auth-field">
              <label htmlFor="authPassword">Create Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="authPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary full auth-submit-btn" disabled={loading}>
              {loading ? "Sending Verification Code…" : "Verify Email & Continue →"}
            </button>
          </form>
        )}

        {/* =========================================================================
            VIEW 3: CREATE ACCOUNT - STEP 2 (EMAIL OTP VERIFICATION)
            ========================================================================= */}
        {!isLogin && registerStep === "otp" && (
          <form className="auth-form otp-step-form" onSubmit={handleVerifyOtpAndRegister}>
            <div className="otp-email-pill">
              <Mail size={15} />
              <span className="otp-email-target">{formData.email}</span>
              <button
                type="button"
                className="otp-change-email-btn"
                onClick={() => {
                  setRegisterStep("form");
                  setError("");
                }}
                title="Change email address"
              >
                Edit
              </button>
            </div>

            <div className="auth-field otp-input-field">
              <label htmlFor="otpInput">Enter 6-Digit Code</label>
              <div className="otp-digit-wrapper">
                <input
                  id="otpInput"
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="otp-code-input"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {/* Quick Demo Fill Helper (Seamless local testing) */}
            {demoOtp && (
              <div
                className="otp-demo-card"
                onClick={() => setOtpCode(demoOtp)}
                title="Click to automatically fill code"
              >
                <div className="demo-chip-badge">
                  <Sparkles size={13} /> Demo Code
                </div>
                <strong>{demoOtp}</strong>
                <span className="click-fill-text">(Click to Auto-fill)</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary full auth-submit-btn"
              disabled={loading || otpCode.trim().length !== 6}
            >
              {loading ? "Verifying Code…" : "Verify & Create Account →"}
            </button>

            {/* Resend Timer / Action */}
            <div className="otp-resend-row">
              {resendTimer > 0 ? (
                <span className="timer-wait-text">
                  Resend code in <strong>{resendTimer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  className="resend-action-btn"
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                >
                  <RotateCcw size={13} className={sendingOtp ? "spin" : ""} />
                  <span>{sendingOtp ? "Sending code…" : "Resend Code"}</span>
                </button>
              )}
            </div>

            <div className="otp-back-link-wrap">
              <button
                type="button"
                className="back-step-btn"
                onClick={() => {
                  setRegisterStep("form");
                  setError("");
                }}
              >
                <ArrowLeft size={14} /> Back to details
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="auth-footer-note">
          {isLogin ? (
            <span>
              Don't have an account yet?{" "}
              <button
                type="button"
                className="switch-link"
                onClick={() => handleTabSwitch("register")}
              >
                Sign up here
              </button>
            </span>
          ) : registerStep === "form" ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="switch-link"
                onClick={() => handleTabSwitch("login")}
              >
                Sign in
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
