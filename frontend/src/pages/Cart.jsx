import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { formatPrice } from "../data/booksData";
import { Trash2, Plus, Minus, ArrowRight, Tag, Sparkles } from "lucide-react";

export const Cart = () => {
  const {
    cart,
    books,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    shippingFee,
    discountAmount,
    cartTotal,
    couponCode,
    applyCoupon,
    removeCoupon,
    navigate
  } = useShop();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState("");

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const book = books.find((b) => b.id === Number(id));
      return { book, qty };
    })
    .filter((item) => Boolean(item.book));

  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await applyCoupon(inputCoupon);
      if (!res.success) {
        setCouponError(res.message);
      } else {
        setInputCoupon("");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const freeShippingThreshold = 799;
  const neededForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="cart-page">
      <div className="container page-heading">
        <nav className="breadcrumbs" aria-label="Breadcrumbs">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            Home
          </a>
          <span className="breadcrumb-sep">/</span>
          <span>Your Book Bag</span>
        </nav>
        <h1>Your book bag</h1>
        <p>Your next chapter could start right here.</p>
      </div>

      <div className="container cart-layout">
        {cartItems.length > 0 ? (
          <>
            {/* Cart Items List */}
            <div className="cart-items-wrapper">
              {/* Free shipping banner */}
              {neededForFreeShipping > 0 ? (
                <div className="free-shipping-bar">
                  <span>Add {formatPrice(neededForFreeShipping)} more to qualify for <strong>FREE Delivery</strong></span>
                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="free-shipping-bar qualified">
                  <Sparkles size={16} />
                  <span>Congratulations! You qualify for <strong>FREE Delivery</strong>.</span>
                </div>
              )}

              <div className="cart-items">
                {cartItems.map(({ book, qty }) => (
                  <div key={book.id} className="cart-item">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="cart-item-img"
                      onClick={() => navigate(`/book/${book.id}`)}
                    />
                    <div className="cart-item-details">
                      <h3>
                        <a
                          href={`/book/${book.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/book/${book.id}`);
                          }}
                        >
                          {book.title}
                        </a>
                      </h3>
                      <p className="cart-item-author">{book.author}</p>
                      <span className="cart-item-price">{formatPrice(book.price)}</span>

                      <div className="cart-qty">
                        <button
                          type="button"
                          onClick={() => updateQuantity(book.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(book.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>

                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeFromCart(book.id)}
                          aria-label={`Remove ${book.title} from cart`}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      <strong>{formatPrice(book.price * qty)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Aside */}
            <aside className="summary-card">
              <h2>Order summary</h2>

              <div className="summary-line">
                <span>Subtotal ({cartItems.reduce((a, b) => a + b.qty, 0)} items)</span>
                <strong>{formatPrice(cartSubtotal)}</strong>
              </div>

              <div className="summary-line">
                <span>Shipping</span>
                <strong>{shippingFee === 0 ? <span className="free-tag">FREE</span> : formatPrice(shippingFee)}</strong>
              </div>

              {discountAmount > 0 && (
                <div className="summary-line discount-line">
                  <span>Discount ({couponCode})</span>
                  <strong>−{formatPrice(discountAmount)}</strong>
                </div>
              )}

              {/* Coupon Row */}
              <div className="coupon-container">
                {couponCode ? (
                  <div className="applied-coupon-pill">
                    <Tag size={13} />
                    <span>Coupon: <strong>{couponCode}</strong> applied</span>
                    <button type="button" onClick={removeCoupon} aria-label="Remove promo code">
                      ×
                    </button>
                  </div>
                ) : (
                  <form className="coupon-row" onSubmit={handleApplyCoupon}>
                    <input
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      placeholder="Discount code (e.g. BOOK10)"
                      aria-label="Discount code"
                    />
                    <button type="submit" disabled={couponLoading}>
                      {couponLoading ? "Applying…" : "Apply"}
                    </button>
                  </form>
                )}
                {couponError && <p className="coupon-error">{couponError}</p>}
                <p className="coupon-hint">
                  Available promos: <code>BOOK10</code> (10% off) or <code>WELCOME50</code> (₹50 off ₹499+)
                </p>
              </div>

              <div className="summary-line total">
                <span>Total</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <button
                className="btn btn-primary full proceed-btn"
                onClick={() => navigate("/checkout")}
              >
                Proceed to checkout <ArrowRight size={15} />
              </button>

              <button
                className="btn btn-secondary full"
                onClick={() => navigate("/shop")}
              >
                Continue shopping
              </button>

              <p className="summary-note">
                ✓ Free delivery on orders over ₹799. Safe & secure checkout.
              </p>
            </aside>
          </>
        ) : (
          <div className="empty-state full-width">
            <div className="empty-icon">🛋️</div>
            <h3>Your book bag is taking a little nap.</h3>
            <p>You haven't added any books to your bag yet. Explore our shelves to find your next great read.</p>
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Discover Books →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
