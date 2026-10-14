// eslint-disable-next-line react-refresh/only-export-components
import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContextInstance";
import { api } from "../services/api";

const loadStoredUser = () => {
  try {
    const u = localStorage.getItem("bn-auth-user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("bn-auth-token") || "");
  const [user, setUser] = useState(loadStoredUser);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // 'login' or 'register'
  const [loadingUser, setLoadingUser] = useState(true);

  // Sync with /api/auth/me on mount if token exists
  useEffect(() => {
    let isMounted = true;
    async function verifyUser() {
      const storedToken = localStorage.getItem("bn-auth-token");
      if (!storedToken) {
        if (isMounted) setLoadingUser(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (isMounted && res.user) {
          setUser(res.user);
          localStorage.setItem("bn-auth-user", JSON.stringify(res.user));
        }
      } catch (err) {
        console.warn("Session expired or token invalid:", err);
        if (isMounted) {
          setToken("");
          setUser(null);
          localStorage.removeItem("bn-auth-token");
          localStorage.removeItem("bn-auth-user");
        }
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }

    verifyUser();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("bn-auth-token", res.token);
      localStorage.setItem("bn-auth-user", JSON.stringify(res.user));
      setAuthModalOpen(false);
      return res;
    }
    throw new Error(res.error || "Login failed");
  }, []);

  const register = useCallback(async (name, email, password, role = "user") => {
    const res = await api.register(name, email, password, role);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("bn-auth-token", res.token);
      localStorage.setItem("bn-auth-user", JSON.stringify(res.user));
      setAuthModalOpen(false);
      return res;
    }
    throw new Error(res.error || "Registration failed");
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    localStorage.removeItem("bn-auth-token");
    localStorage.removeItem("bn-auth-user");
    // If on admin page, redirect to home
    if (window.location.pathname.startsWith("/admin") || window.location.hash.startsWith("#admin")) {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(user && user.role === "admin");

  const updateUserProfile = useCallback(async (profileData) => {
    const res = await api.updateProfile(profileData);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem("bn-auth-user", JSON.stringify(res.user));
      if (res.token) {
        setToken(res.token);
        localStorage.setItem("bn-auth-token", res.token);
      }
      return res;
    }
    throw new Error(res.error || "Failed to update profile");
  }, []);

  const value = {
    user,
    token,
    loadingUser,
    isAuthenticated,
    isAdmin,
    authModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode,
    login,
    register,
    logout,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
// oxlint-disable-next-line react/only-export-components, react-refresh/only-export-components
export { useAuth } from "./useAuth";
