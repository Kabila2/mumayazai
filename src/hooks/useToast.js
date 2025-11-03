import { useState, useCallback } from 'react';

let globalAddToast = null;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Store the addToast function globally
  if (!globalAddToast) {
    globalAddToast = addToast;
  }

  return {
    toasts,
    addToast,
    removeToast,
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };
};

// Global toast function that can be used anywhere
export const toast = {
  success: (message, duration = 3000) => {
    if (globalAddToast) globalAddToast(message, 'success', duration);
  },
  error: (message, duration = 3000) => {
    if (globalAddToast) globalAddToast(message, 'error', duration);
  },
  warning: (message, duration = 3000) => {
    if (globalAddToast) globalAddToast(message, 'warning', duration);
  },
  info: (message, duration = 3000) => {
    if (globalAddToast) globalAddToast(message, 'info', duration);
  },
};
