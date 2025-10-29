import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PointNotification.css';
import {
  getPendingNotifications,
  clearNotifications,
  getMilestoneNotification,
  getThresholdNotification,
  getPointDescription
} from '../utils/pointsUtils';

const PointNotification = ({ userEmail, language = 'en' }) => {
  const [notifications, setNotifications] = useState([]);
  const [milestoneNotification, setMilestoneNotification] = useState(null);
  const [thresholdNotification, setThresholdNotification] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    const checkNotifications = () => {
      // Check for regular point notifications
      const pending = getPendingNotifications(userEmail);
      if (pending.length > 0) {
        // Group notifications that happened close together
        const groupedNotification = {
          id: Date.now(),
          totalPoints: pending.reduce((sum, n) => sum + n.points, 0),
          activities: pending.map(n => ({
            type: n.pointType,
            points: n.points,
            description: getPointDescription(n.pointType, language)
          })),
          timestamp: Date.now()
        };

        setNotifications(prev => [...prev, groupedNotification]);
        clearNotifications(userEmail);

        // Auto-remove after 4 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== groupedNotification.id));
        }, 4000);
      }

      // Check for milestone notification
      const milestone = getMilestoneNotification(userEmail);
      if (milestone) {
        setMilestoneNotification(milestone);
        setTimeout(() => setMilestoneNotification(null), 5000);
      }

      // Check for threshold notification
      const threshold = getThresholdNotification(userEmail);
      if (threshold) {
        setThresholdNotification(threshold);
        setTimeout(() => setThresholdNotification(null), 3000);
      }
    };

    // Check immediately
    checkNotifications();

    // Check periodically
    const interval = setInterval(checkNotifications, 500);

    return () => clearInterval(interval);
  }, [userEmail, language]);

  return (
    <div className="point-notifications-container">
      {/* Regular Point Notifications */}
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className="point-notification"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="notification-icon"
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1.2, 1.2, 1]
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              🪙
            </motion.div>

            <div className="notification-content">
              <div className="notification-points">
                +{notification.totalPoints} {language === 'ar' ? 'نقاط' : 'Points'}
              </div>

              {notification.activities.length === 1 ? (
                <div className="notification-description">
                  {notification.activities[0].description}
                </div>
              ) : (
                <div className="notification-description">
                  {notification.activities.length} {language === 'ar' ? 'أنشطة' : 'Activities'}
                </div>
              )}
            </div>

            <motion.div
              className="notification-sparkles"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              ✨
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Milestone Notification */}
      <AnimatePresence>
        {milestoneNotification && (
          <motion.div
            className="milestone-notification"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          >
            <motion.div
              className="milestone-icon"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 1, repeat: 2 }}
            >
              🎉
            </motion.div>

            <div className="milestone-content">
              <div className="milestone-title">
                {language === 'ar' ? 'معلم بارز!' : 'Milestone Reached!'}
              </div>
              <div className="milestone-points">
                {milestoneNotification.milestone} {language === 'ar' ? 'نقطة' : 'Points'}
              </div>
              <div className="milestone-message">
                {language === 'ar' ? 'عمل رائع!' : 'Amazing Progress!'}
              </div>
            </div>

            <div className="milestone-confetti">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="confetti-piece"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotate: 0
                  }}
                  animate={{
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                    opacity: 0,
                    scale: 0,
                    rotate: Math.random() * 720 - 360
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: "easeOut"
                  }}
                  style={{
                    background: `hsl(${Math.random() * 360}, 70%, 60%)`
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Threshold Notification */}
      <AnimatePresence>
        {thresholdNotification && (
          <motion.div
            className="threshold-notification"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="threshold-icon"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              ⭐
            </motion.div>

            <div className="threshold-content">
              <div className="threshold-text">
                {language === 'ar' ? 'مجموع نقاطك' : 'Total Points'}
              </div>
              <div className="threshold-points">
                {thresholdNotification.totalPoints}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PointNotification;
