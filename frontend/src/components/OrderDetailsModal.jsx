import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "../data/booksData";
import {
  X,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  AlertTriangle,
  Receipt,
  BookOpen
} from "lucide-react";

export const OrderDetailsModal = ({
  order,
  onClose,
  isAdmin = false,
  onUpdateStatus
}) => {
  if (!order) return null;

  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add("printing-order-invoice");
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-order-invoice");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      document.body.classList.remove("printing-order-invoice");
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const items = order.items || [];
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.qty || it.quantity) || 1), 0);

  const statusSteps = [
    { key: "Confirmed", label: "Confirmed", icon: CheckCircle2 },
    { key: "Processing", label: "Processing", icon: Clock },
    { key: "Shipped", label: "Shipped", icon: Truck },
    { key: "Delivered", label: "Delivered", icon: Check }
  ];

  const currentStatusIndex = statusSteps.findIndex(
    (s) => s.key.toLowerCase() === (order.status || "").toLowerCase()
  );
  const isCancelled = (order.status || "").toLowerCase() === "cancelled";

  const handlePrint = () => {
    document.body.classList.add("printing-order-invoice");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-order-invoice");
    }, 1200);
  };

  const formattedDate = order.date || order.created_at
    ? new Date(order.date || order.created_at).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "—";

  const modalNode = (
    <div className="modal-backdrop order-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Official Store Print Header (visible exclusively in print) */}
        <div className="invoice-print-header only-print">
          <div className="invoice-print-header-top">
            <div className="invoice-print-brand">
              <div className="brand invoice-brand">
                <span className="brand-mark" aria-hidden="true">
                  <BookOpen size={22} strokeWidth={2.4} />
                </span>
                <span className="brand-text">
                  <span className="brand-title">book<span className="brand-accent">nest</span></span>
                  <small>FIND YOUR NEXT CHAPTER</small>
                </span>
              </div>
              <p className="invoice-doc-subtitle">Official Order Receipt & Tax Invoice</p>
            </div>
            <div className="invoice-print-meta">
              <div><strong>Invoice / Order #:</strong> #{order.order_code}</div>
              <div><strong>Date:</strong> {formattedDate}</div>
              <div><strong>Status:</strong> {order.status}</div>
            </div>
          </div>
        </div>

        {/* Modal Web Header */}
        <div className="order-modal-header no-print">
          <div className="order-modal-title-wrap">
            <span className="brand-mark modal-brand-mark" aria-hidden="true">
              <BookOpen size={20} strokeWidth={2.4} />
            </span>
            <div>
              <div className="order-code-row">
                <h2>Order #{order.order_code}</h2>
                <span className={`status-pill ${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <span className="order-timestamp">Placed on {formattedDate}</span>
            </div>
          </div>

          <div className="order-header-actions">
            <button
              type="button"
              className="btn-print-receipt no-print"
              onClick={handlePrint}
              title="Print Order Invoice"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              className="modal-close-btn no-print"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="order-modal-body">
          {/* Status Tracker or Cancellation Banner */}
          {isCancelled ? (
            <div className="order-cancelled-banner">
              <AlertTriangle size={18} />
              <div>
                <strong>Order Cancelled</strong>
                <p>This order has been marked as cancelled. No delivery will be dispatched.</p>
              </div>
            </div>
          ) : (
            <div className="order-stepper-wrap">
              <div className="order-stepper">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = currentStatusIndex >= idx;
                  const isCurrent = currentStatusIndex === idx;

                  return (
                    <div
                      key={step.key}
                      className={`stepper-step ${isCompleted ? "completed" : ""} ${
                        isCurrent ? "current" : ""
                      }`}
                    >
                      <div className="step-circle">
                        <Icon size={16} />
                      </div>
                      <span className="step-label">{step.label}</span>
                      {idx < statusSteps.length - 1 && (
                        <div
                          className={`step-line ${
                            currentStatusIndex > idx ? "completed" : ""
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Status Quick Updater */}
          {isAdmin && onUpdateStatus && (
            <div className="admin-status-control-box no-print">
              <div className="admin-control-label">
                <strong>Manage Order Status:</strong>
                <span>Update delivery stage in MySQL</span>
              </div>
              <div className="admin-status-dropdown-wrap">
                <select
                  className={`order-status-select ${order.status?.toLowerCase()}`}
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}

          {/* Customer & Shipping 2-Col Grid */}
          <div className="order-meta-grid">
            {/* Customer & Delivery Card */}
            <div className="order-info-card">
              <div className="order-info-card-header">
                <MapPin size={16} />
                <h3>Customer & Shipping Details</h3>
              </div>
              <div className="order-info-card-body">
                <div className="info-item">
                  <User size={14} className="info-icon" />
                  <div>
                    <span className="info-label">Customer Name</span>
                    <strong>{order.customer_name || "Guest Reader"}</strong>
                  </div>
                </div>

                {order.customer_phone && (
                  <div className="info-item">
                    <Phone size={14} className="info-icon" />
                    <div>
                      <span className="info-label">Phone / Mobile</span>
                      <a href={`tel:${order.customer_phone}`} className="info-link">
                        {order.customer_phone}
                      </a>
                    </div>
                  </div>
                )}

                {order.customer_email && (
                  <div className="info-item">
                    <Mail size={14} className="info-icon" />
                    <div>
                      <span className="info-label">Email Address</span>
                      <a href={`mailto:${order.customer_email}`} className="info-link">
                        {order.customer_email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="info-item full">
                  <MapPin size={14} className="info-icon" />
                  <div>
                    <span className="info-label">Delivery Address</span>
                    <address className="delivery-address-text">
                      {order.delivery_address || order.address || "Standard Address"}
                      {order.city && `, ${order.city}`}
                      {order.state && `, ${order.state}`}
                      {order.pincode && ` - ${order.pincode}`}
                    </address>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Order Overview Card */}
            <div className="order-info-card">
              <div className="order-info-card-header">
                <CreditCard size={16} />
                <h3>Payment & Order Summary</h3>
              </div>
              <div className="order-info-card-body">
                <div className="info-item">
                  <CreditCard size={14} className="info-icon" />
                  <div>
                    <span className="info-label">Payment Method</span>
                    <strong>{order.payment_method || "Cash on Delivery"}</strong>
                  </div>
                </div>

                <div className="info-item">
                  <Package size={14} className="info-icon" />
                  <div>
                    <span className="info-label">Total Books</span>
                    <strong>
                      {totalUnits} unit{totalUnits !== 1 ? "s" : ""} ({items.length} title
                      {items.length !== 1 ? "s" : ""})
                    </strong>
                  </div>
                </div>

                <div className="info-item">
                  <Calendar size={14} className="info-icon" />
                  <div>
                    <span className="info-label">Order Reference</span>
                    <span className="font-mono">#{order.order_code} (ID: {order.id})</span>
                  </div>
                </div>

                <div className="info-item">
                  <Clock size={14} className="info-icon" />
                  <div>
                    <span className="info-label">Fulfillment Status</span>
                    <span className={`status-pill ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Book Catalog Breakdown */}
          <div className="order-items-breakdown-card">
            <div className="order-info-card-header">
              <Package size={16} />
              <h3>Ordered Books ({items.length})</h3>
            </div>
            <div className="order-items-table-wrap">
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const price = Number(item.price) || 0;
                    const qty = Number(item.qty || item.quantity) || 1;
                    const lineTotal = price * qty;
                    const cover = item.cover || item.cover_url;

                    return (
                      <tr key={idx}>
                        <td className="item-title-cell">
                          {cover ? (
                            <img src={cover} alt={item.title} className="order-item-cover" />
                          ) : (
                            <div className="order-item-cover-placeholder">📚</div>
                          )}
                          <div className="order-item-meta">
                            <strong>{item.title}</strong>
                            <small className="order-item-sub">Book ID: #{item.id || item.book_id || "—"}</small>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="qty-tag">× {qty}</span>
                        </td>
                        <td className="text-right">{formatPrice(price)}</td>
                        <td className="text-right">
                          <strong>{formatPrice(lineTotal)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice / Pricing Breakdown */}
          <div className="order-invoice-summary-card">
            <div className="invoice-rows">
              <div className="invoice-row">
                <span>Items Subtotal</span>
                <span>{formatPrice(order.subtotal || 0)}</span>
              </div>

              <div className="invoice-row">
                <span>Shipping & Handling</span>
                <span>
                  {order.shipping === 0 || Number(order.shipping) === 0 ? (
                    <strong className="text-success">FREE</strong>
                  ) : (
                    formatPrice(order.shipping || 0)
                  )}
                </span>
              </div>

              {Number(order.discount) > 0 && (
                <div className="invoice-row discount-row">
                  <span>Coupon Discount Applied</span>
                  <span className="text-discount">- {formatPrice(order.discount)}</span>
                </div>
              )}

              <div className="invoice-row invoice-grand-total">
                <div>
                  <strong>Grand Total</strong>
                  <small>Inclusive of all applicable taxes</small>
                </div>
                <strong className="grand-total-amount">
                  {formatPrice(order.total || 0)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Official Store Print Footer (visible exclusively in print) */}
        <div className="invoice-print-footer only-print">
          <p>Thank you for choosing BookNest Bookstore!</p>
          <small>For customer support, order inquiries, or returns: support@booknest.com | www.booknest.com</small>
        </div>

        {/* Modal Footer */}
        <div className="order-modal-footer no-print">
          <div className="footer-left">
            <span className="order-summary-meta-hint">
              #{order.order_code} • {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalNode, document.body)
    : modalNode;
};
