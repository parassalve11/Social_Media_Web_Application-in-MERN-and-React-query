import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ReactQueryProvider from "../src/lib/ReactQueryProvider.jsx";
import { ToastManager } from "./components/UI/ToastManager.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ReactQueryProvider>
          <ToastManager>
            <App />
          </ToastManager>
        </ReactQueryProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
