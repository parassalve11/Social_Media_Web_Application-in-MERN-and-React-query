import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ReactQueryProvider from "../src/lib/ReactQueryProvider.jsx";
import { ToastManager } from "./components/UI/ToastManager.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/index.js";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <ReactQueryProvider>
              <ToastManager>
                <App />
              </ToastManager>
            </ReactQueryProvider>
          </GoogleOAuthProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
