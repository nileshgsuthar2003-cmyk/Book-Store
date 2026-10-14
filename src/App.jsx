import React from "react";
import { useShop } from "./context/ShopContext";
import { Announcement } from "./components/Announcement";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toast } from "./components/Toast";
import { AuthModal } from "./components/AuthModal";

// Pages
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { BookDetail } from "./pages/BookDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { Wishlist } from "./pages/Wishlist";
import { About } from "./pages/About";
import { Profile } from "./pages/Profile";
import { AdminPanel } from "./pages/AdminPanel";

export const AppContent = () => {
  const { currentRoute } = useShop();

  const rawRoute = (currentRoute || "/").replace(/^[#/]+/, "");
  const [path] = rawRoute.split("?");

  const isAdminRoute = path === "admin" || path.startsWith("admin/");

  // Dedicated Complete Admin Portal (No storefront header, announcement, or footer)
  if (isAdminRoute) {
    return (
      <div className="admin-app-root">
        <AdminPanel currentPath={path} />
        <Toast />
      </div>
    );
  }

  const renderCurrentView = () => {
    if (path.startsWith("book/")) {
      const bookId = path.split("/")[1];
      return <BookDetail bookId={bookId} />;
    }

    switch (path) {
      case "shop":
      case "categories":
        return <Shop />;
      case "cart":
        return <Cart />;
      case "checkout":
        return <Checkout />;
      case "order-confirmation":
        return <OrderConfirmation />;
      case "wishlist":
        return <Wishlist />;
      case "about":
        return <About />;
      case "profile":
      case "account":
        return <Profile />;
      case "home":
      case "":
      default:
        return <Home />;
    }
  };

  return (
    <div className="site-app">
      <Announcement />
      <Header />
      <main id="app-main">{renderCurrentView()}</main>
      <Footer />
      <Toast />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
