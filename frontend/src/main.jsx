import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ShopProvider>
        <App />
      </ShopProvider>
    </AuthProvider>
  </StrictMode>
);
