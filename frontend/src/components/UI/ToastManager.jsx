import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";

import { bindToastApi } from "./toast";

const ToastContext = createContext();

const MAX_TOASTS = 5;

const ToastManager = ({ children, position = "top-right" }) => {
  const [toasts, setToasts] = useState([]);
  const paused = useRef(false);

  /* ------------------- CORE API ------------------- */

  const addToast = (message, options = {}) => {
    const id = options.id || crypto.randomUUID();

    const toast = {
      id,
      message,
      createdAt: Date.now(),
      duration: options.duration ?? 4000,
      type: options.type ?? "info",
      persistent: options.persistent ?? false,
      actions: options.actions ?? [],
      subtitle: options.subtitle,
      progress: 100,
    };

    setToasts((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      return [toast, ...filtered].slice(0, MAX_TOASTS);
    });

    return id;
  };

  const updateToast = (id, updates) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => setToasts([]);

  /* ------------------- TIMER ------------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      if (paused.current) return;

      setToasts((prev) =>
        prev
          .map((toast) => {
            if (toast.persistent) return toast;
            const elapsed = Date.now() - toast.createdAt;
            const progress = Math.max(
              0,
              100 - (elapsed / toast.duration) * 100
            );
            return { ...toast, progress };
          })
          .filter((toast) => toast.progress > 0)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  /* ------------------- GLOBAL API ------------------- */

  useEffect(() => {
    bindToastApi({
      addToast,
      updateToast,
      removeToast,
      clearAll,
      autoClose: removeToast,
    });
  }, []);

  /* ------------------- RENDER ------------------- */

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      <div
        className={`fixed z-50 ${position}`}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 mb-3 w-80"
          >
            <p className="font-medium">{toast.message}</p>
            {toast.subtitle && (
              <p className="text-xs opacity-70">{toast.subtitle}</p>
            )}

            {!toast.persistent && (
              <div className="h-1 bg-gray-200 mt-3">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${toast.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export { ToastManager };
