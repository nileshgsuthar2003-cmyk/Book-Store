import React, { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/useAuth";
import { formatPrice } from "../data/booksData";
import { ShieldCheck, Lock, MapPin } from "lucide-react";

export const Checkout = () => {
  const { cartItemCount, cartSubtotal, shippingFee, discountAmount, cartTotal, placeOrder, navigate } = useShop();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    paymentMethod: "Cash on delivery (demo)",
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

  if (cartItemCount === 0) {
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
    setSubmitting(true);
    try {
      await placeOrder(formData);
    } finally {
      setSubmitting(false);
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
        <p>Demo checkout only — simulate your order without real payment.</p>
      </div>

      <div className="container">
        <form id="checkoutForm" className="checkout-layout" onSubmit={handleSubmit}>
          {/* Main Form Inputs */}
          <div className="checkout-main">
            <div className="notice">
              <ShieldCheck size={18} />
              <span>
                <strong>Prototype checkout:</strong> No real payment will be charged and no physical goods will be shipped.
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

            {/* Demo Payment */}
            <div className="form-card">
              <h2>3. Payment simulation</h2>
              <label className="radio-card">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on delivery (demo)"
                  checked={formData.paymentMethod === "Cash on delivery (demo)"}
                  onChange={handleChange}
                />
                <div>
                  <strong>Cash on delivery (demo simulation)</strong>
                  <p>Pay upon delivery in demo sandbox mode.</p>
                </div>
              </label>

              <label className="radio-card">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Card simulation"
                  checked={formData.paymentMethod === "Card simulation"}
                  onChange={handleChange}
                />
                <div>
                  <strong>Simulated Credit / Debit Card</strong>
                  <p>Fast test card authorization.</p>
                </div>
              </label>

              <label className="radio-card">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI / QR Simulation"
                  checked={formData.paymentMethod === "UPI / QR Simulation"}
                  onChange={handleChange}
                />
                <div>
                  <strong>UPI / QR Simulation (GPay, PhonePe, Paytm)</strong>
                  <p>Instant dummy verification.</p>
                </div>
              </label>
            </div>

            <button type="submit" className="btn btn-primary full place-order-btn" disabled={submitting}>
              {submitting ? "Confirming demo order…" : (
                <>
                  <Lock size={15} /> Place demo order ({formatPrice(cartTotal)}) →
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
              <span>Safe & encrypted demo test environment</span>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};
