import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Small pop-up notifications.
//   const toast = useToast();
//   toast.success("Saved");  toast.error("Oops");  toast.info("Hi", { title: "Heads up", to: "/chats/123" })
const ToastContext = createContext(null);
let nextId = 1;

const ICONS = { success: "✓", error: "!", info: "i" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message, opts = {}) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-3), { id, type, message, ...opts }]); // keep at most 4 on screen
      setTimeout(() => dismiss(id), opts.duration ?? (type === "error" ? 6500 : 4500));
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      info: (m, o) => push("info", m, o),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role={t.type === "error" ? "alert" : "status"}>
            <span className="toast__icon" aria-hidden="true">{ICONS[t.type]}</span>
            {t.to ? (
              <button
                className="toast__body toast__body--link"
                onClick={() => {
                  navigate(t.to);
                  dismiss(t.id);
                }}
              >
                {t.title && <strong className="toast__title">{t.title}</strong>}
                <span>{t.message}</span>
              </button>
            ) : (
              <div className="toast__body">
                {t.title && <strong className="toast__title">{t.title}</strong>}
                <span>{t.message}</span>
              </div>
            )}
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);