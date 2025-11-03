import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <motion.div
      className={`toast toast-${type}`}
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>✕</button>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
