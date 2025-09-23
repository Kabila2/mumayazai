// src/components/MobileNavigation.js - Mobile-first navigation with hamburger menu

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../hooks/useResponsive';
import './MobileNavigation.css';

const MobileNavigation = ({
  buttons = [],
  title,
  centerContent,
  onMenuToggle,
  language = 'en',
  reducedMotion = false,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isMobile, isCompact, getSpacing, shouldUseHamburgerMenu } = useResponsive();

  // Close menu when screen size changes to desktop
  useEffect(() => {
    if (!shouldUseHamburgerMenu && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [shouldUseHamburgerMenu, isMenuOpen]);

  // Handle menu toggle
  const handleMenuToggle = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  // Close menu when clicking outside or on menu item
  const handleMenuItemClick = (buttonAction) => {
    setIsMenuOpen(false);
    onMenuToggle?.(false);
    buttonAction?.();
  };

  // Animation variants
  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: reducedMotion ? 0.1 : 0.6, ease: 'easeOut' }
    }
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reducedMotion ? 0.1 : 0.3,
        ease: 'easeOut',
        staggerChildren: reducedMotion ? 0 : 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: reducedMotion ? 0.1 : 0.2 }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reducedMotion ? 0.1 : 0.3 }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // Split buttons into priority groups
  const primaryButtons = buttons.filter(btn => btn.priority === 'primary' || !btn.priority);
  const secondaryButtons = buttons.filter(btn => btn.priority === 'secondary');
  const tertiaryButtons = buttons.filter(btn => btn.priority === 'tertiary');

  return (
    <>
      {/* Main Header */}
      <motion.header
        className={`mobile-nav-header ${className}`}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: isCompact ? '56px' : '64px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(25px) saturate(140%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${getSpacing(1, 1.5, 2)}`,
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          direction: language === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Left side - Primary action or hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {shouldUseHamburgerMenu ? (
            // Hamburger menu for mobile
            <motion.button
              className="hamburger-btn"
              onClick={handleMenuToggle}
              whileHover={!reducedMotion ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: isCompact ? '40px' : '44px',
                height: isCompact ? '40px' : '44px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                gap: '3px',
                padding: 0
              }}
            >
              {/* Hamburger lines */}
              <motion.div
                style={{
                  width: '18px',
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '1px'
                }}
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 8 : 0
                }}
                transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
              />
              <motion.div
                style={{
                  width: '18px',
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '1px'
                }}
                animate={{
                  opacity: isMenuOpen ? 0 : 1,
                  scale: isMenuOpen ? 0 : 1
                }}
                transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
              />
              <motion.div
                style={{
                  width: '18px',
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '1px'
                }}
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? -8 : 0
                }}
                transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
              />
            </motion.button>
          ) : (
            // Show primary buttons on desktop
            primaryButtons.slice(0, 2).map((button, index) => (
              <motion.button
                key={button.key || index}
                className={`nav-button ${button.className || ''}`}
                onClick={button.onClick}
                disabled={button.disabled}
                title={button.title}
                whileHover={!reducedMotion ? { scale: 1.05, y: -2 } : {}}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: button.variant === 'primary'
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: button.disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: button.disabled ? 0.5 : 1,
                  minHeight: '44px',
                  ...button.style
                }}
              >
                {button.icon && <span>{button.icon}</span>}
                {button.text && <span className="button-text">{button.text}</span>}
              </motion.button>
            ))
          )}
        </div>

        {/* Center - Title or custom content */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          maxWidth: '40%',
          overflow: 'hidden'
        }}>
          {centerContent || (title && (
            <h1 style={{
              margin: 0,
              fontSize: isCompact ? '1.1rem' : '1.3rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {title}
            </h1>
          ))}
        </div>

        {/* Right side - Secondary actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!shouldUseHamburgerMenu && secondaryButtons.slice(0, 2).map((button, index) => (
            <motion.button
              key={button.key || `secondary-${index}`}
              className={`nav-button secondary ${button.className || ''}`}
              onClick={button.onClick}
              disabled={button.disabled}
              title={button.title}
              whileHover={!reducedMotion ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isCompact ? '40px' : '44px',
                height: isCompact ? '40px' : '44px',
                background: button.variant === 'danger'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: button.variant === 'danger'
                  ? '#ef4444'
                  : 'rgba(255, 255, 255, 0.95)',
                fontSize: '1.1rem',
                cursor: button.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: button.disabled ? 0.5 : 1,
                ...button.style
              }}
            >
              {button.icon}
            </motion.button>
          ))}
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              className="menu-backdrop"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => handleMenuItemClick()}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1001,
                backdropFilter: 'blur(4px)'
              }}
            />

            {/* Mobile Menu */}
            <motion.div
              className="mobile-menu"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'fixed',
                top: isCompact ? '56px' : '64px',
                left: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(25px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                zIndex: 1002,
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                maxHeight: `calc(100vh - ${isCompact ? '76px' : '84px'})`,
                overflowY: 'auto',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}
            >
              {/* Primary Actions */}
              {primaryButtons.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {language === 'ar' ? 'الإجراءات الأساسية' : 'Main Actions'}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gap: '0.75rem'
                  }}>
                    {primaryButtons.map((button, index) => (
                      <motion.button
                        key={button.key || `primary-${index}`}
                        className={`mobile-menu-item ${button.className || ''}`}
                        variants={menuItemVariants}
                        onClick={() => handleMenuItemClick(button.onClick)}
                        disabled={button.disabled}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '1rem',
                          background: button.variant === 'primary'
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : 'rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '12px',
                          color: button.variant === 'primary' ? 'white' : '#333',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: button.disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: button.disabled ? 0.5 : 1,
                          textAlign: 'left',
                          width: '100%',
                          ...button.style
                        }}
                      >
                        {button.icon && (
                          <span style={{ fontSize: '1.2rem' }}>{button.icon}</span>
                        )}
                        <div style={{ flex: 1 }}>
                          {button.text && (
                            <div style={{ fontWeight: '600' }}>{button.text}</div>
                          )}
                          {button.description && (
                            <div style={{
                              fontSize: '0.85rem',
                              opacity: 0.8,
                              marginTop: '0.25rem'
                            }}>
                              {button.description}
                            </div>
                          )}
                        </div>
                        {button.badge && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#6366f1',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            {button.badge}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Actions */}
              {secondaryButtons.length > 0 && (
                <div style={{ marginBottom: tertiaryButtons.length > 0 ? '1.5rem' : '0' }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {language === 'ar' ? 'المزيد' : 'More Options'}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {secondaryButtons.map((button, index) => (
                      <motion.button
                        key={button.key || `secondary-${index}`}
                        className={`mobile-menu-item secondary ${button.className || ''}`}
                        variants={menuItemVariants}
                        onClick={() => handleMenuItemClick(button.onClick)}
                        disabled={button.disabled}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem 0.75rem',
                          background: button.variant === 'danger'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(255, 255, 255, 0.4)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '12px',
                          color: button.variant === 'danger' ? '#ef4444' : '#333',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: button.disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: button.disabled ? 0.5 : 1,
                          textAlign: 'center',
                          ...button.style
                        }}
                      >
                        {button.icon && (
                          <span style={{ fontSize: '1.5rem' }}>{button.icon}</span>
                        )}
                        {button.text && (
                          <span style={{ fontSize: '0.8rem' }}>{button.text}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tertiary Actions */}
              {tertiaryButtons.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center'
                  }}>
                    {tertiaryButtons.map((button, index) => (
                      <motion.button
                        key={button.key || `tertiary-${index}`}
                        className={`mobile-menu-item tertiary ${button.className || ''}`}
                        variants={menuItemVariants}
                        onClick={() => handleMenuItemClick(button.onClick)}
                        disabled={button.disabled}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(255, 255, 255, 0.3)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '20px',
                          color: '#666',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: button.disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: button.disabled ? 0.5 : 1,
                          ...button.style
                        }}
                      >
                        {button.icon && <span style={{ marginRight: '0.25rem' }}>{button.icon}</span>}
                        {button.text}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;