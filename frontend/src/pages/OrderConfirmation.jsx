import React from "react";
import { useShop } from "../context/ShopContext";
import { formatPrice } from "../data/booksData";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const OrderConfirmation = () => {
  const { lastOrder, navigate } = useShop();

  if (!lastOrder) {
    return (
      <div className="container empty-state-container">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Recent Orders</h3>
          <p>You haven't placed an order yet in this session.</p>
          <button className="btn btn-primary" onClick={() => navigate("/shop")}>
            Discover Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="confirmation-icon">
            <CheckCircle2 size={42} strokeWidth={2.4} />
          </div>

          <h1>Your demo order is in the books!</h1>
          <p className="confirmation-subtitle">
            Thank you, <strong>{lastOrder.name}</strong>. Your reading journey is on its way.
            (This is a prototype sandbox — no real charge was made).
          </p>

          <div className="order-number-box">
            <span>Demo Order Reference</span>
            <strong>#BN-{lastOrder.id}</strong>
          </div>

          {/* Details breakdown */}
          <div className="order-details-card">
            <div className="order-detail-header">
              <h3>Order Summary</h3>
              <span>{lastOrder.date}</span>
            </div>

            {lastOrder.items && lastOrder.items.length > 0 && (
              <div className="order-items-list">
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <img src={item.cover} alt={item.title} className="order-item-thumb" />
                    <div className="order-item-info">
                      <strong>{item.title}</strong>
                      <span>Qty: {item.qty} × {formatPrice(item.price)}</span>
                    </div>
                    <span className="order-item-subtotal">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="order-meta-info">
              <div className="order-meta-col">
                <strong>Delivery To:</strong>
                <p>{lastOrder.address}</p>
                <p>Contact: {lastOrder.phone} | {lastOrder.email}</p>
              </div>
              <div className="order-meta-col">
                <strong>Payment Mode:</strong>
                <p>{lastOrder.paymentMethod}</p>
              </div>
            </div>

            <div className="order-total-row">
              <span>Total Amount Paid</span>
              <strong>{formatPrice(lastOrder.total)}</strong>
            </div>
          </div>

          <div className="confirmation-actions">
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Keep exploring books <ArrowRight size={15} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/")}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
