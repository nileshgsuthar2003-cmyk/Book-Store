import React, { useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const Toast = () => {
  const { toast, clearToast } = useShop();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 size={18} className="toast-icon success" />;
      case "warning":
        return <AlertCircle size={18} className="toast-icon warning" />;
      default:
        return <Info size={18} className="toast-icon info" />;
    }
  };

  return (
    <div className={`toast-container show ${toast.type || "info"}`} role="status" aria-live="polite">
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button className="toast-close" onClick={clearToast} aria-label="Close notification">
        <X size={15} />
      </button>
    </div>
  );
};
