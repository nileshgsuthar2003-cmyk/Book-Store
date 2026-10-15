import React, { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/useAuth";
import { formatPrice } from "../data/booksData";
import { api } from "../services/api";
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export const Checkout = () => {
  const {
    cart,
    books,
    cartItemCount,
    cartSubtotal,
    shippingFee,
    discountAmount,
    cartTotal,
    placeOrder,
    navigate,
    showToast
  } = useShop();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    paymentMethod: "Cash on Delivery",
    saveAddress: true
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
        city: prev.city || user.city || "",
        state: prev.state || user.state || "",
        pincode: prev.pincode || user.pincode || ""
      }));
    }
  }, [user]);

  const [submitting, setSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stockError, setStockError] = useState("");

  if (cartItemCount === 0 && !isProcessing) {
    return (
      <div className="checkout-page">
        <div className="container page-heading">
          <nav className="breadcrumbs">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Checkout</span>
          </nav>
          <h1>Checkout</h1>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <h3>Your book bag is currently empty</h3>
            <p>Please add at least one book to your bag before proceeding to checkout.</p>
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Explore Books
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStockError("");

    // 1. Client-side quick stock check
    const itemsPayload = Object.entries(cart).map(([id, qty]) => ({
      id: Number(id),
      qty
    }));

    const outOfStockClient = itemsPayload
      .map((it) => books.find((b) => b.id === it.id))
      .filter((b) => b && (b.in_stock === false || b.stock === false));

    if (outOfStockClient.length > 0) {
      const names = outOfStockClient.map((b) => `'${b.title}'`).join(", ");
      const msg = `Sorry, ${names} is currently out of stock. Please remove it from your bag to proceed.`;
      setStockError(msg);
      showToast(msg, "error");
      return;
    }

    setSubmitting(true);
    setIsProcessing(true);

    try {
      // 2. Real-time server stock verification against MySQL
      const stockRes = await api.checkStock(itemsPayload).catch((err) => {
        throw new Error(err.message || "Failed to verify real-time stock.");
      });

      if (!stockRes.valid) {
        const errorMsg = stockRes.error || "One or more books in your bag are out of stock.";
        setStockError(errorMsg);
        showToast(errorMsg, "error");
        setIsProcessing(false);
        setSubmitting(false);
        return;
      }

      // 3. Short delay before navigating to order confirmation
      await new Promise((res) => setTimeout(res, 1200));

      // 4. Place order in backend
      await placeOrder(formData, { skipNavigate: true });

      navigate("/order-confirmation");
    } catch (err) {
      setIsProcessing(false);
      setSubmitting(false);
      setStockError(err.message || "Unable to place order. Please try again.");
    }
  };

  return (
    <div className="checkout-page">
      <div className="container page-heading">
        <nav className="breadcrumbs" aria-label="Breadcrumbs">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
          <span className="breadcrumb-sep">/</span>
          <a href="/cart" onClick={(e) => { e.preventDefault(); navigate("/cart"); }}>Book Bag</a>
          <span className="breadcrumb-sep">/</span>
          <span>Checkout</span>
        </nav>
        <h1>One step closer to story time</h1>
        <p>Complete your shipping and payment details to finalize your order.</p>
      </div>

      <div className="container">
        {stockError && (
          <div className="checkout-stock-alert">
            <AlertTriangle size={20} className="stock-alert-icon" />
            <div className="stock-alert-body">
              <strong>Stock Notice</strong>
              <p>{stockError}</p>
            </div>
            <button
              type="button"
              className="btn-stock-alert-action"
              onClick={() => navigate("/cart")}
            >
              Modify Bag <ArrowRight size={14} />
            </button>
          </div>
        )}

        <form id="checkoutForm" className="checkout-layout" onSubmit={handleSubmit}>
          {/* Main Form Inputs */}
          <div className="checkout-main">
            <div className="notice">
              <ShieldCheck size={18} />
              <span>
                <strong>Safe & Secure Checkout:</strong> 100% authentic books with fast doorstep delivery.
              </span>
            </div>

            {/* Customer Details */}
            <div className="form-card">
              <h2>1. Contact details</h2>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="customerName">Full name *</label>
                  <input
                    id="customerName"
                    name="name"
                    required
                    placeholder="e.g. Maya Sharma"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="customerEmail">Email address *</label>
                  <input
                    id="customerEmail"
                    name="email"
                    type="email"
                    required
                    placeholder="maya@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="field full-field">
                  <label htmlFor="customerPhone">Phone number *</label>
                  <input
                    id="customerPhone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="form-card">
              <h2>2. Delivery address</h2>
              <div className="form-grid">
                <div className="field full-field">
                  <label htmlFor="customerAddress">Street address *</label>
                  <input
                    id="customerAddress"
                    name="address"
                    required
                    placeholder="House/Flat number, building, street, area"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="customerCity">City *</label>
                  <input
                    id="customerCity"
                    name="city"
                    required
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="customerState">State *</label>
                  <input
                    id="customerState"
                    name="state"
                    required
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="customerPincode">PIN code *</label>
                  <input
                    id="customerPincode"
                    name="pincode"
                    required
                    pattern="[0-9]{6}"
                    placeholder="6 digits (e.g. 560001)"
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>

                {isAuthenticated && (
                  <div className="field full-field save-address-wrap">
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        name="saveAddress"
                        checked={formData.saveAddress}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, saveAddress: e.target.checked }))
                        }
                      />
                      <span>Save / update this delivery address to my BookNest profile</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-card">
              <h2>3. Payment method</h2>
              <label className="radio-card">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={formData.paymentMethod === "Cash on Delivery"}
                  onChange={handleChange}
                />
                <div>
                  <strong>Cash on Delivery (COD)</strong>
                  <p>Pay with cash or UPI upon delivery at your doorstep.</p>
                </div>
              </label>

              <label className="radio-card">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Credit / Debit Card"
                  checked={formData.paymentMethod === "Credit / Debit Card"}
                  onChange={handleChange}
                />
                <div>
                  <strong>Credit / Debit Card</strong>
                  <p>Pay securely with Visa, MasterCard, RuPay.</p>
                </div>
              </label>

              <label className="radio-card">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI / QR (GPay, PhonePe, Paytm)"
                  checked={formData.paymentMethod === "UPI / QR (GPay, PhonePe, Paytm)"}
                  onChange={handleChange}
                />
                <div>
                  <strong>UPI / QR (Google Pay, PhonePe, Paytm)</strong>
                  <p>Instant and secure payment via any UPI app or QR code.</p>
                </div>
              </label>
            </div>

            <button type="submit" className="btn btn-primary full place-order-btn" disabled={submitting}>
              {submitting ? "Placing your order…" : (
                <>
                  <Lock size={15} /> Place Order ({formatPrice(cartTotal)}) →
                </>
              )}
            </button>
          </div>

          {/* Right Summary Sidebar */}
          <aside className="summary-card checkout-summary">
            <h2>Your order summary</h2>

            <div className="summary-line">
              <span>Items ({cartItemCount})</span>
              <strong>{formatPrice(cartSubtotal)}</strong>
            </div>

            <div className="summary-line">
              <span>Delivery</span>
              <strong>{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</strong>
            </div>

            {discountAmount > 0 && (
              <div className="summary-line discount-line">
                <span>Discount</span>
                <strong>−{formatPrice(discountAmount)}</strong>
              </div>
            )}

            <div className="summary-line total">
              <span>Estimated total</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <div className="checkout-guarantee">
              <ShieldCheck size={18} />
              <span>Safe & encrypted checkout • 100% genuine books</span>
            </div>
          </aside>
        </form>
      </div>

      {/* Simple Loading Modal */}
      {isProcessing && (
        <div className="modal-backdrop order-processing-backdrop" role="dialog" aria-modal="true">
          <div className="order-processing-card loading-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-loading-spinner" />
            <h3 className="processing-title">Loading…</h3>
            <p className="processing-subtitle">Placing your order, please wait…</p>
          </div>
        </div>
      )}
    </div>
  );
};
