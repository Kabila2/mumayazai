import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message, fullScreen = false }) => {
  const sizes = {
    small: '24px',
    medium: '48px',
    large: '64px'
  };

  const spinnerContent = (
    <div className="loading-spinner-container">
      <motion.div
        className={`loading-spinner loading-spinner-${size}`}
        style={{ width: sizes[size], height: sizes[size] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <div className="spinner-circle"></div>
      </motion.div>
      {message && (
        <motion.p
          className="loading-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        className="loading-spinner-fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {spinnerContent}
      </motion.div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
