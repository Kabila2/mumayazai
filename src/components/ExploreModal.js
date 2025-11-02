import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LeaderboardModal from './LeaderboardModal';
import DailyTasksModal from './DailyTasksModal';
import SavedChatsModal from './SavedChatsModal';
import "./ExploreModal.css";

export default function ExploreModal({ isOpen, onClose, currentUserEmail, t, language, onSignOut, onLoadVoiceChat }) {
  const [activeModal, setActiveModal] = useState(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const exploreItems = [
    {
      id: 'leaderboard',
      title: language === 'en' ? 'Leaderboard' : 'لوحة المتصدرين',
      description: language === 'en' ? 'See how you rank against other users' : 'شاهد ترتيبك مقارنة بالمستخدمين الآخرين',
      icon: '🏆',
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
    },
    {
      id: 'tasks',
      title: language === 'en' ? 'Daily Tasks' : 'المهام اليومية',
      description: language === 'en' ? 'Complete challenges and earn points' : 'أكمل التحديات واكسب النقاط',
      icon: '📋',
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
    },
    {
      id: 'savedChats',
      title: language === 'en' ? 'Saved Chats' : 'المحادثات المحفوظة',
      description: language === 'en' ? 'Access your saved text conversations' : 'الوصول إلى محادثاتك النصية المحفوظة',
      icon: '💬',
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
    },
    {
      id: 'savedVoiceChats',
      title: language === 'en' ? 'Saved Voice Chats' : 'المحادثات الصوتية المحفوظة',
      description: language === 'en' ? 'Access your saved voice conversations' : 'الوصول إلى محادثاتك الصوتية المحفوظة',
      icon: '🎤',
      color: '#8A2BE2',
      gradient: 'linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%)'
    }
  ];

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.3,
      y: 100,
      rotateX: -30,
      rotateY: 10,
      z: -200
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      z: 0,
      transition: {
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 0.2,
      y: -150,
      rotateX: 45,
      rotateY: -20,
      z: -300,
      transition: {
        duration: 0.7,
        ease: [0.76, 0, 0.24, 1],
        staggerChildren: 0.08,
        staggerDirection: -1
      }
    }
  };

  const overlayVariants = {
    hidden: {
      opacity: 0,
      backdropFilter: "blur(0px)"
    },
    visible: {
      opacity: 1,
      backdropFilter: "blur(8px)",
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      backdropFilter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: "easeIn",
        delay: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.7,
      rotateX: -20,
      filter: "blur(5px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    },
    exit: {
      opacity: 0,
      y: -40,
      scale: 0.6,
      rotateX: 30,
      filter: "blur(3px)",
      transition: {
        duration: 0.4,
        ease: [0.76, 0, 0.24, 1]
      }
    }
  };

  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -30,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.7,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const footerVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.6,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: 50,
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const handleItemClick = (itemId) => {
    setActiveModal(itemId);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = () => {
    if (onSignOut) {
      onSignOut();
    }
    setShowSignOutConfirm(false);
    onClose();
  };

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Explore Modal - Hide when sub-modal is active */}
      <AnimatePresence mode="wait">
        {!activeModal && isOpen && (
          <motion.div
            className="explore-overlay"
            onClick={onClose}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="explore-modal"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="explore-header"
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="explore-title">
                  <span className="explore-icon">🌟</span>
                  <h2>{language === 'en' ? 'Explore' : 'استكشف'}</h2>
                </div>
                <button className="explore-close" onClick={onClose}>×</button>
              </motion.div>

          <div className="explore-content">
            <p className="explore-subtitle">
              {language === 'en'
                ? 'Discover features, track progress, and enhance your experience'
                : 'اكتشف الميزات، وتتبع التقدم، وحسن تجربتك'
              }
            </p>

            <motion.div className="explore-grid">
              {exploreItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="explore-item"
                  onClick={() => handleItemClick(item.id)}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ delay: index * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: item.gradient,
                    '--item-color': item.color
                  }}
                >
                  <div className="explore-item-icon">{item.icon}</div>
                  <div className="explore-item-content">
                    <h3 className="explore-item-title">{item.title}</h3>
                    <p className="explore-item-description">{item.description}</p>
                  </div>
                  <div className="explore-item-arrow">→</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="explore-footer"
              variants={footerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="user-info">
                {currentUserEmail && (
                  <div className="current-user">
                    <span className="user-icon">👤</span>
                    <span className="user-email">{currentUserEmail}</span>
                  </div>
                )}
              </div>

              <div className="explore-actions">
                <motion.button
                  className="sign-out-button"
                  onClick={handleSignOutClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="sign-out-icon">🚪</span>
                  <span>{language === 'en' ? 'Sign Out' : 'تسجيل الخروج'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-modals */}
      <LeaderboardModal
        isOpen={activeModal === 'leaderboard'}
        onClose={handleModalClose}
        currentUserEmail={currentUserEmail}
        t={t}
        language={language}
      />

      <DailyTasksModal
        isOpen={activeModal === 'tasks'}
        onClose={handleModalClose}
        userEmail={currentUserEmail}
        t={t}
        language={language}
      />

      <SavedChatsModal
        isOpen={activeModal === 'savedChats'}
        onClose={handleModalClose}
        t={t}
        language={language}
        chatType="text"
      />

      <SavedChatsModal
        isOpen={activeModal === 'savedVoiceChats'}
        onClose={handleModalClose}
        t={t}
        language={language}
        chatType="voice"
        onLoadVoiceChat={onLoadVoiceChat}
      />

      {/* Sign Out Confirmation Dialog */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="confirm-overlay" onClick={handleSignOutCancel}>
            <motion.div
              className="confirm-dialog"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="confirm-header">
                <div className="confirm-icon">⚠️</div>
                <h3 className="confirm-title">
                  {language === 'en' ? 'Confirm Sign Out' : 'تأكيد تسجيل الخروج'}
                </h3>
              </div>

              <div className="confirm-content">
                <p className="confirm-message">
                  {language === 'en'
                    ? 'Are you sure you want to sign out? You will need to sign in again to continue using the app.'
                    : 'هل أنت متأكد من أنك تريد تسجيل الخروج؟ ستحتاج إلى تسجيل الدخول مرة أخرى لمواصلة استخدام التطبيق.'
                  }
                </p>
              </div>

              <div className="confirm-actions">
                <motion.button
                  className="confirm-button cancel"
                  onClick={handleSignOutCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{language === 'en' ? 'Cancel' : 'إلغاء'}</span>
                </motion.button>

                <motion.button
                  className="confirm-button confirm"
                  onClick={handleSignOutConfirm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="confirm-icon-small">🚪</span>
                  <span>{language === 'en' ? 'Sign Out' : 'تسجيل الخروج'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}