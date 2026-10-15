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
  EyeOff,
  Phone
} from "lucide-react";

export const AuthModal = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    register,
    resetPassword,
    sendOtp
  } = useAuth();
  const { showToast } = useShop();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  // 'form' = filling name, email, password; 'otp' = verifying 6-digit email code
  const [registerStep, setRegisterStep] = useState("form");
  
  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState("email"); // 'email' | 'reset'
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = authModalMode === "login";
  const isForgot = authModalMode === "forgot";

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

  // Reset all fields when modal opens or closes
  useEffect(() => {
    if (authModalOpen) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: ""
      });
      setForgotEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpCode("");
      setError("");
      setRegisterStep("form");
      setForgotStep("email");
    }
  }, [authModalOpen]);

  // Reset internal step state and input fields when switching modes or closing
  const handleTabSwitch = (mode) => {
    setAuthModalMode(mode);
    setRegisterStep("form");
    setForgotStep("email");
    setOtpCode("");
    setError("");
    if (mode === "forgot") {
      setForgotEmail(formData.email || "");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleClose = () => {
    closeAuthModal();
    setRegisterStep("form");
    setForgotStep("email");
    setOtpCode("");
    setError("");
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: ""
    });
    setForgotEmail("");
    setNewPassword("");
    setConfirmPassword("");
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

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      setError("Please provide your name, mobile number, email, and password.");
      return;
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
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
        phone: formData.phone.trim(),
        purpose: "register"
      });

      setRegisterStep("otp");
      setResendTimer(60);
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
        cleanOtp,
        formData.phone.trim()
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

  // Resend OTP code for registration
  const handleResendOtp = async () => {
    if (resendTimer > 0 || sendingOtp) return;
    setError("");
    setSendingOtp(true);

    try {
      await sendOtp({
        email: formData.email,
        name: formData.name,
        phone: formData.phone.trim(),
        purpose: "register"
      });

      setResendTimer(60);
      showToast(`New verification code sent to ${formData.email}!`, "success");
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Forgot Password Step 1: Request OTP
  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    setError("");
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendOtp({
        email: cleanEmail,
        purpose: "forgot_password"
      });
      setForgotStep("reset");
      setResendTimer(60);
      showToast(`Verification code sent to ${cleanEmail}!`, "info");
    } catch (err) {
      setError(err.message || "No account found with this email address.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Resend OTP
  const handleResendForgotOtp = async () => {
    if (resendTimer > 0 || sendingOtp) return;
    setError("");
    setSendingOtp(true);

    try {
      await sendOtp({
        email: forgotEmail.trim().toLowerCase(),
        purpose: "forgot_password"
      });
      setResendTimer(60);
      showToast(`New verification code sent to ${forgotEmail}!`, "success");
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Forgot Password Step 2: Verify OTP and set new password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: cleanOtp,
        password: newPassword
      });

      showToast(res.message || "Password reset successfully! Please sign in.", "success");
      
      // Pre-populate email in login form and switch to sign in view
      setFormData((prev) => ({
        ...prev,
        email: forgotEmail.trim().toLowerCase(),
        password: ""
      }));
      setAuthModalMode("login");
      setForgotStep("email");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check the code and try again.");
    } finally {
      setLoading(false);
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
            {isForgot ? (
              <KeyRound size={20} />
            ) : registerStep === "otp" && !isLogin ? (
              <KeyRound size={20} />
            ) : (
              <Lock size={20} />
            )}
          </div>
          <h2>
            {isForgot
              ? forgotStep === "reset"
                ? "Set New Password"
                : "Reset Your Password"
              : isLogin
              ? "Welcome to BookNest"
              : registerStep === "otp"
              ? "Verify Your Email"
              : "Join the Reading Circle"}
          </h2>
          <p>
            {isForgot
              ? forgotStep === "reset"
                ? `Enter the 6-digit code sent to ${forgotEmail} and choose your new password.`
                : "Enter your registered email address and we'll send you an OTP to reset your password."
              : isLogin
              ? "Sign in to access your personal shelf, track orders, or manage the store."
              : registerStep === "otp"
              ? `Enter the 6-digit code sent to ${formData.email}`
              : "Create an account to save books, leave reviews, and enjoy swift checkout."}
          </p>
        </div>

        {/* Tab Switcher (Visible on login or initial register form) */}
        {!isForgot && registerStep !== "otp" && (
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
          <form className="auth-form" onSubmit={handleLoginSubmit} autoComplete="off">
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
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="field-label-row">
                <label htmlFor="authPassword">Password</label>
                <button
                  type="button"
                  className="forgot-link-btn"
                  onClick={() => handleTabSwitch("forgot")}
                >
                  Forgot password?
                </button>
              </div>
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
                  autoComplete="new-password"
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
        {!isLogin && !isForgot && registerStep === "form" && (
          <form className="auth-form" onSubmit={handleRequestOtp} autoComplete="off">
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
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="authPhone">Mobile Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="field-icon" />
                <input
                  id="authPhone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="off"
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
                  autoComplete="off"
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
                  autoComplete="new-password"
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
        {!isLogin && !isForgot && registerStep === "otp" && (
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

        {/* =========================================================================
            VIEW 4: FORGOT PASSWORD - STEP 1 (REQUEST OTP)
            ========================================================================= */}
        {isForgot && forgotStep === "email" && (
          <form className="auth-form" onSubmit={handleRequestForgotOtp} autoComplete="off">
            <div className="auth-field">
              <label htmlFor="forgotEmail">Registered Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  id="forgotEmail"
                  name="forgotEmail"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setError("");
                  }}
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <small className="field-sub-note">We'll send a 6-digit password reset code to this email.</small>
            </div>

            <button type="submit" className="btn btn-primary full auth-submit-btn" disabled={loading}>
              {loading ? "Sending Reset Code…" : "Send Reset Code →"}
            </button>

            <div className="otp-back-link-wrap">
              <button
                type="button"
                className="back-step-btn"
                onClick={() => handleTabSwitch("login")}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            VIEW 5: FORGOT PASSWORD - STEP 2 (VERIFY OTP & NEW PASSWORD)
            ========================================================================= */}
        {isForgot && forgotStep === "reset" && (
          <form className="auth-form otp-step-form" onSubmit={handleResetPasswordSubmit} autoComplete="off">
            <div className="otp-email-pill">
              <Mail size={15} />
              <span className="otp-email-target">{forgotEmail}</span>
              <button
                type="button"
                className="otp-change-email-btn"
                onClick={() => {
                  setForgotStep("email");
                  setError("");
                }}
                title="Change email address"
              >
                Edit
              </button>
            </div>

            <div className="auth-field otp-input-field">
              <label htmlFor="forgotOtpInput">Enter 6-Digit Reset Code</label>
              <div className="otp-digit-wrapper">
                <input
                  id="forgotOtpInput"
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

            <div className="auth-field">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary full auth-submit-btn"
              disabled={loading || otpCode.trim().length !== 6 || !newPassword || !confirmPassword}
            >
              {loading ? "Resetting Password…" : "Reset Password & Sign In →"}
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
                  onClick={handleResendForgotOtp}
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
                  setForgotStep("email");
                  setError("");
                }}
              >
                <ArrowLeft size={14} /> Back to email
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="auth-footer-note">
          {isForgot ? (
            <span>
              Remember your password?{" "}
              <button
                type="button"
                className="switch-link"
                onClick={() => handleTabSwitch("login")}
              >
                Back to sign in
              </button>
            </span>
          ) : isLogin ? (
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
