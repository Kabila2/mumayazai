import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLeaderboardData, formatDuration, formatRelativeTime, getUserRank } from "../utils/leaderboardUtils";
import "./LeaderboardModal.css";

export default function LeaderboardModal({ isOpen, onClose, currentUserEmail, t, language }) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [activeTab, setActiveTab] = useState("time");
  const [userRanks, setUserRanks] = useState({});

  useEffect(() => {
    if (isOpen) {
      const data = getLeaderboardData();
      setLeaderboardData(data);

      // Get current user's ranks
      if (currentUserEmail) {
        const ranks = {
          time: getUserRank(currentUserEmail, "totalTimeSpent"),
          chats: getUserRank(currentUserEmail, "totalChats"),
          messages: getUserRank(currentUserEmail, "totalMessages")
        };
        setUserRanks(ranks);
      }
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen || !leaderboardData) return null;

  const tabs = [
    { id: "time", label: language === "en" ? "Most Active" : "الأكثر نشاطاً", icon: "⏱️" },
    { id: "chats", label: language === "en" ? "Most Chats" : "أكثر محادثات", icon: "💬" },
    { id: "messages", label: language === "en" ? "Most Messages" : "أكثر رسائل", icon: "📝" },
    { id: "recent", label: language === "en" ? "Recently Active" : "نشاط حديث", icon: "🔥" }
  ];

  const getCurrentList = () => {
    switch (activeTab) {
      case "time": return leaderboardData.mostActiveUsers;
      case "chats": return leaderboardData.mostChats;
      case "messages": return leaderboardData.mostMessages;
      case "recent": return leaderboardData.recentlyActive;
      default: return [];
    }
  };

  const getStatValue = (user, tab) => {
    switch (tab) {
      case "time": return formatDuration(user.totalTimeSpent);
      case "chats": return user.totalChats.toLocaleString();
      case "messages": return user.totalMessages.toLocaleString();
      case "recent": return formatRelativeTime(user.lastActive);
      default: return "N/A";
    }
  };

  const getStatLabel = (tab) => {
    switch (tab) {
      case "time": return language === "en" ? "Time Spent" : "الوقت المستغرق";
      case "chats": return language === "en" ? "Chats" : "محادثات";
      case "messages": return language === "en" ? "Messages" : "رسائل";
      case "recent": return language === "en" ? "Last Active" : "آخر نشاط";
      default: return "";
    }
  };

  const getRankEmoji = (index) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return "🏅";
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <motion.div
        className="leaderboard-modal"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="leaderboard-header">
          <h2>
            🏆 {language === "en" ? "Leaderboard" : "لوحة المتصدرين"}
          </h2>
          <button className="leaderboard-close" onClick={onClose}>×</button>
        </div>

        {currentUserEmail && (
          <div className="user-stats-summary">
            <h3>{language === "en" ? "Your Rankings" : "ترتيبك"}</h3>
            <div className="user-ranks">
              <div className="rank-item">
                <span className="rank-label">{language === "en" ? "Activity" : "النشاط"}:</span>
                <span className="rank-value">#{userRanks.time || "N/A"}</span>
              </div>
              <div className="rank-item">
                <span className="rank-label">{language === "en" ? "Chats" : "المحادثات"}:</span>
                <span className="rank-value">#{userRanks.chats || "N/A"}</span>
              </div>
              <div className="rank-item">
                <span className="rank-label">{language === "en" ? "Messages" : "الرسائل"}:</span>
                <span className="rank-value">#{userRanks.messages || "N/A"}</span>
              </div>
            </div>
          </div>
        )}

        <div className="leaderboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="leaderboard-content">
          <div className="stats-header">
            <span className="rank-column">{language === "en" ? "Rank" : "الترتيب"}</span>
            <span className="name-column">{language === "en" ? "User" : "المستخدم"}</span>
            <span className="stat-column">{getStatLabel(activeTab)}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="leaderboard-list"
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {getCurrentList().map((user, index) => (
                <motion.div
                  key={user.email}
                  className={`leaderboard-item ${user.email === currentUserEmail?.toLowerCase() ? "current-user" : ""}`}
                  variants={itemVariants}
                >
                  <div className="rank-display">
                    <span className="rank-emoji">{getRankEmoji(index)}</span>
                    <span className="rank-number">#{index + 1}</span>
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    {user.email === currentUserEmail?.toLowerCase() && (
                      <div className="you-badge">{language === "en" ? "You" : "أنت"}</div>
                    )}
                  </div>
                  <div className="stat-value">
                    {getStatValue(user, activeTab)}
                  </div>
                </motion.div>
              ))}

              {getCurrentList().length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <div className="empty-text">
                    {language === "en" ? "No data available yet" : "لا توجد بيانات متاحة حتى الآن"}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="leaderboard-footer">
          <div className="total-users">
            {language === "en" ? "Total Users" : "إجمالي المستخدمين"}: {leaderboardData.totalUsers}
          </div>
        </div>
      </motion.div>
    </div>
  );
}