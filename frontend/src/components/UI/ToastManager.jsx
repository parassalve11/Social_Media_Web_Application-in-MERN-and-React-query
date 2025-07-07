import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import gsap from "gsap";
import { useGesture } from "@use-gesture/react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

const ToastContext = createContext();

const ToastManager = ({ children, theme = "light", position = "top-right" }) => {
  const [toasts, setToasts] = useState([]);
  const toastContainerRef = useRef(null);
  const toastRefs = useRef({});

  // Add a new toast with prioritization and subtitle
  const addToast = (message, options = {}) => {
    const id = Date.now().toString();
    const {
      type = "info",
      duration = 4000,
      persistent = false,
      priority = 0,
      onClose = () => {},
      actions = [],
      subtitle = "", // New optional subtitle
    } = options;

    const newToast = { id, message, type, duration, persistent, priority, onClose, actions, subtitle, animated: false };
    setToasts((prev) => {
      const updatedToasts = [...prev, newToast].sort((a, b) => b.priority - a.priority);
      if (persistent) {
        const storedToasts = JSON.parse(localStorage.getItem("persistentToasts") || "[]");
        localStorage.setItem(
          "persistentToasts",
          JSON.stringify([...storedToasts, { id, message, type, priority, subtitle }])
        );
      }
      return updatedToasts;
    });
  };

  // Remove a toast
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const storedToasts = JSON.parse(localStorage.getItem("persistentToasts") || "[]");
    localStorage.setItem(
      "persistentToasts",
      JSON.stringify(storedToasts.filter((t) => t.id !== id))
    );
  };

  // Load persistent toasts on mount
  useEffect(() => {
    const storedToasts = JSON.parse(localStorage.getItem("persistentToasts") || "[]");
    if (storedToasts.length > 0) {
      setToasts((prev) => [
        ...prev,
        ...storedToasts.map((t) => ({
          ...t,
          duration: 0,
          persistent: true,
          animated: false,
          actions: [],
        })),
      ]);
    }
  }, []);

  // Gesture handler for all toasts
  const bindGestures = useCallback((id) => ({
    onDrag: ({ active, movement: [mx], cancel }) => {
      if (active && Math.abs(mx) > 100) {
        cancel();
        removeToast(id);
      }
    },
    onDragEnd: () => {
      if (toastRefs.current[id]) {
        gsap.to(toastRefs.current[id], { x: 0, duration: 0.2, ease: "power2.out" });
      }
    },
  }), []);

  // Bind gestures to the container
  const bindContainerGestures = useGesture({
    onDrag: ({ active, event, target }) => {
      const toastId = target.closest("[data-toast-id]")?.getAttribute("data-toast-id");
      if (toastId && toastRefs.current[toastId]) {
        const bind = bindGestures(toastId);
        bind.onDrag({ active, movement: [event.movementX], cancel: () => {} });
        if (!active) bind.onDragEnd();
      }
    },
  });

  // Animation and gesture handling
  useEffect(() => {
    toasts.forEach((toast, index) => {
      const toastElement = toastContainerRef.current?.children[index];
      if (toastElement && !toast.animated) {
        toastRefs.current[toast.id] = toastElement;
        gsap.fromTo(
          toastElement,
          { y: 100, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "elastic.out(1, 0.5)",
            onComplete: () => {
              if (!toast.persistent) {
                setTimeout(() => removeToast(toast.id), toast.duration);
              }
              setToasts((prev) =>
                prev.map((t) => (t.id === toast.id ? { ...t, animated: true } : t))
              );
            },
          }
        );
      }
    });
  }, [toasts]);

  // Position styles
  const getPositionStyles = () => {
    const positions = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
    };
    return positions[position] || "top-right";
  };

  // Theme styles
  const getThemeStyles = () => (theme === "dark" ? "text-gray-100" : "text-gray-900");

  // Icon and background styles based on type
  const getToastStyles = (type) => {
    const base = "p-4 rounded-lg shadow-md flex items-center justify-between max-w-lg border-l-4 bg-white";
    const styles = {
      success: {
        border: "border-green-500",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
      },
      error: {
        border: "border-red-500",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
      },
      warning: {
        border: "border-yellow-500",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
      },
      info: {
        border: "border-blue-500",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
    };
    return { ...styles[type] || styles.info, base };
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        ref={toastContainerRef}
        className={`fixed ${getPositionStyles()} flex flex-col gap-3 z-50 ${getThemeStyles()}`}
        aria-live="polite"
        aria-atomic="true"
        {...bindContainerGestures()}
      >
        {toasts.map((toast) => {
          const { base, border, iconBg, iconColor } = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              data-toast-id={toast.id}
              className={`${base} ${border} relative`}
              role="alert"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBg} border-2 ${border}`}
                >
                  {toast.type === "success" && <FaCheckCircle className={`text-xl ${iconColor}`} />}
                  {toast.type === "error" && <FaExclamationCircle className={`text-xl ${iconColor}`} />}
                  {toast.type === "warning" && <FaExclamationTriangle className={`text-xl ${iconColor}`} />}
                  {toast.type === "info" && <FaInfoCircle className={`text-xl ${iconColor}`} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{toast.message}</p>
                  {toast.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{toast.subtitle}</p>
                  )}
                  {toast.actions.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {toast.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                          }}
                          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl focus:outline-none"
                aria-label="Close toast"
              >
                <FaTimes />
              </button>
              {!toast.persistent && (
                <div className="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-1000"
                    style={{
                      width: `${(toast.duration - (Date.now() - parseInt(toast.id))) / toast.duration * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastManager");
  }
  return context;
};

export { ToastManager, useToast };