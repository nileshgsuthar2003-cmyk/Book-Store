import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { formatPrice } from "../data/booksData";
import { CheckCircle2, ArrowRight, Receipt, Printer, Eye } from "lucide-react";
import { OrderDetailsModal } from "../components/OrderDetailsModal";

export const OrderConfirmation = () => {
  const { lastOrder, navigate } = useShop();
  const [showModal, setShowModal] = useState(false);

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

  const customerName = lastOrder.customer_name || lastOrder.name || "Customer";
  const orderCode = lastOrder.order_code || `BN-${lastOrder.id}`;
  const phone = lastOrder.customer_phone || lastOrder.phone;
  const email = lastOrder.customer_email || lastOrder.email;
  const payment = lastOrder.payment_method || lastOrder.paymentMethod || "Cash on Delivery";

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="confirmation-icon">
            <CheckCircle2 size={42} strokeWidth={2.4} />
          </div>

          <h1>Your order is confirmed!</h1>
          <p className="confirmation-subtitle">
            Thank you, <strong>{customerName}</strong>. Your reading journey is on its way.
          </p>

          <div className="order-number-box">
            <span>Order Reference</span>
            <strong>#{orderCode}</strong>
          </div>

          {/* Details breakdown */}
          <div className="order-details-card">
            <div className="order-detail-header">
              <h3>Order Summary</h3>
              <span>{lastOrder.date || lastOrder.created_at}</span>
            </div>

            {lastOrder.items && lastOrder.items.length > 0 && (
              <div className="order-items-list">
                {lastOrder.items.map((item, index) => {
                  const qty = Number(item.qty || item.quantity) || 1;
                  const cover = item.cover || item.cover_url;
                  return (
                    <div key={index} className="order-item-row">
                      {cover && <img src={cover} alt={item.title} className="order-item-thumb" />}
                      <div className="order-item-info">
                        <strong>{item.title}</strong>
                        <span>Qty: {qty} × {formatPrice(item.price)}</span>
                      </div>
                      <span className="order-item-subtotal">{formatPrice(item.price * qty)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="order-meta-info">
              <div className="order-meta-col">
                <strong>Delivery Address:</strong>
                <p>{lastOrder.address}</p>
                <p>Contact: {phone ? phone : ""} {email ? `• ${email}` : ""}</p>
              </div>
              <div className="order-meta-col">
                <strong>Payment Method:</strong>
                <p>{payment}</p>
                <strong>Status:</strong>
                <p><span className={`status-pill ${lastOrder.status?.toLowerCase() || 'confirmed'}`}>{lastOrder.status || "Confirmed"}</span></p>
              </div>
            </div>

            <div className="order-total-row">
              <span>Total Amount Paid</span>
              <strong>{formatPrice(lastOrder.total)}</strong>
            </div>
          </div>

          <div className="confirmation-actions">
            <button
              type="button"
              className="btn btn-secondary btn-order-receipt-action"
              onClick={() => setShowModal(true)}
            >
              <Receipt size={16} /> View Full Order Details & Print Invoice
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Keep exploring books <ArrowRight size={15} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/")}>
              Return to Home
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <OrderDetailsModal
          order={lastOrder}
          onClose={() => setShowModal(false)}
          isAdmin={false}
        />
      )}
    </div>
  );
};
