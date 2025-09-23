// src/components/ParentDashboard.js - Parent Dashboard for Child Monitoring and Management

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getParentData,
  getChildStatistics,
  updateParentSettings,
  removeChildFromParent,
  linkChildToParent
} from '../utils/parentTrackingUtils';
import {
  analyzeAreasForImprovement,
  calculateImprovementScore,
  generateLearningRecommendations,
  getLearningInsights
} from '../utils/improvementAnalysisUtils';
import {
  TimeSpentGraph,
  TasksCompletedGraph,
  LearningDistributionChart
} from './ProgressGraphs';

const ParentDashboard = ({
  onSignOut,
  t = {},
  language = "en",
  reducedMotion = false
}) => {
  const [parentData, setParentData] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childStats, setChildStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddChild, setShowAddChild] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load parent data
  useEffect(() => {
    const loadData = () => {
      try {
        const data = getParentData();
        setParentData(data);

        if (data && data.children.length > 0) {
          // Load statistics for all children
          const stats = {};
          data.children.forEach(child => {
            stats[child.email] = getChildStatistics(child.email);
          });
          setChildStats(stats);

          // Select first child by default
          if (!selectedChild) {
            setSelectedChild(data.children[0]);
          }
        }
      } catch (error) {
        console.error('Error loading parent data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedChild]);

  const handleAddChild = useCallback((childEmail, childName) => {
    if (!parentData) return;

    const result = linkChildToParent(childEmail, childName, parentData.email);
    if (result.success) {
      // Reload parent data
      const updatedData = getParentData();
      setParentData(updatedData);
      setShowAddChild(false);

      // Load stats for new child
      const newStats = { ...childStats };
      newStats[childEmail] = getChildStatistics(childEmail);
      setChildStats(newStats);
    } else {
      alert(result.error || 'Failed to add child');
    }
  }, [parentData, childStats]);

  const handleRemoveChild = useCallback((childEmail) => {
    if (window.confirm(`Are you sure you want to remove this child from your dashboard?`)) {
      const result = removeChildFromParent(childEmail);
      if (result.success) {
        const updatedData = getParentData();
        setParentData(updatedData);

        // Remove from stats and reset selection
        const newStats = { ...childStats };
        delete newStats[childEmail];
        setChildStats(newStats);

        if (selectedChild?.email === childEmail) {
          setSelectedChild(updatedData.children[0] || null);
        }
      }
    }
  }, [childStats, selectedChild]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍👩‍👧‍👦</div>
          <h2>Loading Parent Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!parentData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2>Parent Account Not Found</h2>
          <button
            onClick={onSignOut}
            style={{
              padding: '1rem 2rem',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '1rem'
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '2rem'
    }}>
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#333' }}>
            👨‍👩‍👧‍👦 Parent Dashboard
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Welcome, {parentData.name}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddChild(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ➕ Add Child
          </button>

          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
            title="Settings"
          >
            ⚙️
          </button>

          <button
            onClick={onSignOut}
            style={{
              padding: '0.75rem',
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#dc3545'
            }}
            title="Sign Out"
          >
            🚪
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Sidebar - Children List */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          style={{
            width: '300px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '2rem',
            height: 'fit-content',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>
            Your Children ({parentData.children.length})
          </h3>

          {parentData.children.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              padding: '2rem 1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👶</div>
              <p>No children added yet.</p>
              <p style={{ fontSize: '0.9rem' }}>
                Click "Add Child" to start monitoring your child's learning progress.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {parentData.children.map(child => {
                const stats = childStats[child.email] || {};
                const isSelected = selectedChild?.id === child.id;

                return (
                  <motion.div
                    key={child.id}
                    whileHover={!reducedMotion ? { scale: 1.02 } : {}}
                    onClick={() => setSelectedChild(child)}
                    style={{
                      padding: '1rem',
                      background: isSelected ?
                        'linear-gradient(135deg, #667eea, #764ba2)' :
                        'rgba(0, 0, 0, 0.05)',
                      color: isSelected ? 'white' : '#333',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelected ? 'none' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                          {child.name}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                          {stats.totalSessions || 0} sessions
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                          {formatTime(stats.totalTimeSpent || 0)}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                          {child.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Main Dashboard Area */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
          }}
        >
          {!selectedChild ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              padding: '4rem 2rem'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
              <h2>Select a Child</h2>
              <p>Choose a child from the sidebar to view their learning progress and activity.</p>
            </div>
          ) : (
            <>
              {/* Child Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                    {selectedChild.name}'s Progress
                  </h2>
                  <p style={{ margin: 0, color: '#666' }}>
                    Linked on {formatDate(selectedChild.linkedAt)}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveChild(selectedChild.email)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: '#dc3545'
                  }}
                  title="Remove Child"
                >
                  🗑️
                </button>
              </div>

              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {['overview', 'activity', 'progress', 'improvements', 'achievements'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: activeTab === tab ?
                        'linear-gradient(135deg, #667eea, #764ba2)' :
                        'rgba(0, 0, 0, 0.05)',
                      color: activeTab === tab ? 'white' : '#666',
                      border: activeTab === tab ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <OverviewTab
                    child={selectedChild}
                    stats={childStats[selectedChild.email]}
                    formatTime={formatTime}
                  />
                )}
                {activeTab === 'activity' && (
                  <ActivityTab
                    child={selectedChild}
                    stats={childStats[selectedChild.email]}
                    formatTime={formatTime}
                  />
                )}
                {activeTab === 'progress' && (
                  <ProgressTab
                    child={selectedChild}
                    stats={childStats[selectedChild.email]}
                    formatTime={formatTime}
                  />
                )}
                {activeTab === 'improvements' && (
                  <ImprovementsTab
                    child={selectedChild}
                    stats={childStats[selectedChild.email]}
                  />
                )}
                {activeTab === 'achievements' && (
                  <AchievementsTab
                    child={selectedChild}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={showAddChild}
        onClose={() => setShowAddChild(false)}
        onAddChild={handleAddChild}
        parentEmail={parentData.email}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        parentData={parentData}
        onUpdateSettings={updateParentSettings}
      />
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ child, stats, formatTime }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Total Time Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '16px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Learning Time</h3>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
          {formatTime(stats?.totalTimeSpent || 0)}
        </p>
      </div>

      {/* Sessions Card */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '16px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Chat Sessions</h3>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
          {stats?.totalSessions || 0}
        </p>
      </div>

      {/* Messages Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '16px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Messages Sent</h3>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
          {stats?.totalMessages || 0}
        </p>
      </div>
    </div>

    {/* Recent Activity */}
    <div style={{
      background: 'rgba(0, 0, 0, 0.02)',
      padding: '1.5rem',
      borderRadius: '16px',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Recent Activity</h3>
      {child.lastActivity ? (
        <p style={{ color: '#666' }}>
          Last active: {new Date(child.lastActivity).toLocaleString()}
        </p>
      ) : (
        <p style={{ color: '#666' }}>No recent activity</p>
      )}
    </div>
  </motion.div>
);

// Activity Tab Component
const ActivityTab = ({ child, stats, formatTime }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>7-Day Activity Overview</h3>

    {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {stats.dailyActivity.slice(-7).map((day, index) => (
          <div
            key={day.date}
            style={{
              background: day.timeSpent > 0 ?
                'linear-gradient(135deg, #667eea, #764ba2)' :
                'rgba(0, 0, 0, 0.05)',
              color: day.timeSpent > 0 ? 'white' : '#666',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: day.timeSpent === 0 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {formatTime(day.timeSpent)}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {day.sessions} sessions
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
        No activity data available yet.
      </p>
    )}

    {/* Topics Explored */}
    {stats?.topicsExplored && stats.topicsExplored.length > 0 && (
      <div style={{
        background: 'rgba(0, 0, 0, 0.02)',
        padding: '1.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Topics Explored</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {stats.topicsExplored.map((topic, index) => (
            <span
              key={index}
              style={{
                background: 'rgba(102, 126, 234, 0.2)',
                color: '#667eea',
                padding: '0.25rem 0.75rem',
                borderRadius: '16px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    )}
  </motion.div>
);

// Progress Tab Component
const ProgressTab = ({ child, stats, formatTime }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>📊 Progress Analytics</h3>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Time Spent Graph */}
      <TimeSpentGraph
        dailyActivity={stats?.dailyActivity}
        formatTime={formatTime}
      />

      {/* Tasks Completed Graph */}
      <TasksCompletedGraph
        dailyActivity={stats?.dailyActivity}
      />
    </div>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {/* Learning Distribution */}
      <LearningDistributionChart stats={stats} />

      {/* Learning Insights */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>💡 Learning Insights</h4>
        {getLearningInsights(stats).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {getLearningInsights(stats).map((insight, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  background: insight.type === 'positive' ? 'rgba(16, 185, 129, 0.1)' :
                            insight.type === 'concern' ? 'rgba(239, 68, 68, 0.1)' :
                            'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${insight.type === 'positive' ? 'rgba(16, 185, 129, 0.3)' :
                                     insight.type === 'concern' ? 'rgba(239, 68, 68, 0.3)' :
                                     'rgba(59, 130, 246, 0.3)'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{insight.icon}</span>
                <div>
                  <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
                    {insight.title}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', margin: 0 }}>
            Keep tracking to see learning insights!
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

// Improvements Tab Component
const ImprovementsTab = ({ child, stats }) => {
  const improvements = analyzeAreasForImprovement(stats, child);
  const improvementScore = calculateImprovementScore(stats, child);
  const recommendations = generateLearningRecommendations(stats, child);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>🎯 Areas for Improvement</h3>

      {/* Improvement Score */}
      <div style={{
        background: `linear-gradient(135deg, ${improvementScore >= 80 ? '#10b981' : improvementScore >= 60 ? '#f59e0b' : '#ef4444'}, ${improvementScore >= 80 ? '#059669' : improvementScore >= 60 ? '#d97706' : '#dc2626'})`,
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {improvementScore >= 80 ? '🌟' : improvementScore >= 60 ? '📈' : '🎯'}
        </div>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Learning Score: {improvementScore}/100</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          {improvementScore >= 80 ? 'Excellent progress! Keep it up!' :
           improvementScore >= 60 ? 'Good progress with room for improvement' :
           'Several areas need attention for better learning outcomes'}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Areas for Improvement */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>⚠️ Focus Areas</h4>
          {improvements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {improvements.map((improvement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: `2px solid ${improvement.color}20`,
                    borderLeft: `4px solid ${improvement.color}`,
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{improvement.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h5 style={{
                        margin: '0 0 0.25rem 0',
                        color: improvement.color,
                        fontSize: '1rem',
                        fontWeight: '600'
                      }}>
                        {improvement.issue}
                      </h5>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666' }}>
                        {improvement.description}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#333', fontWeight: '500' }}>
                        💡 {improvement.suggestion}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: improvement.color,
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {improvement.severity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h4>Great job!</h4>
              <p>No major areas for improvement detected. Keep up the excellent work!</p>
            </div>
          )}
        </div>

        {/* Learning Recommendations */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>🚀 Recommendations</h4>
          {recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  style={{
                    padding: '1rem',
                    background: rec.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' :
                              rec.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' :
                              'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${rec.priority === 'high' ? 'rgba(239, 68, 68, 0.3)' :
                                        rec.priority === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                                        'rgba(59, 130, 246, 0.3)'}`,
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{rec.icon}</span>
                    <div>
                      <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
                        {rec.title}
                      </h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', margin: 0 }}>
              Recommendations will appear as we gather more learning data.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Achievements Tab Component
const AchievementsTab = ({ child }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Achievements</h3>

    {child.progressData.achievements && child.progressData.achievements.length > 0 ? (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {child.progressData.achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {achievement.icon}
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>
              {achievement.name}
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
              {achievement.description}
            </p>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <div style={{
        textAlign: 'center',
        color: '#666',
        padding: '3rem'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
        <h4>No achievements yet</h4>
        <p>Achievements will appear here as your child learns and explores!</p>
      </div>
    )}
  </motion.div>
);

// Add Child Modal Component
const AddChildModal = ({ isOpen, onClose, onAddChild, parentEmail }) => {
  const [childEmail, setChildEmail] = useState('');
  const [childName, setChildName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (childEmail.trim() && childName.trim()) {
      onAddChild(childEmail.trim(), childName.trim());
      setChildEmail('');
      setChildName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px'
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem 0' }}>Add Child to Dashboard</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Child's Name
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Child's Email
            </label>
            <input
              type="email"
              value={childEmail}
              onChange={(e) => setChildEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
              required
            />
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0 0 0' }}>
              When your child signs up with this email and enters your email ({parentEmail}),
              they will be automatically added to your dashboard.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Add Child
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, parentData, onUpdateSettings }) => {
  const [settings, setSettings] = useState(parentData?.settings || {});

  const handleSave = () => {
    onUpdateSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem 0' }}>Parent Settings</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Daily Time Limit (minutes)
          </label>
          <input
            type="number"
            value={settings.dailyTimeLimit}
            onChange={(e) => setSettings({...settings, dailyTimeLimit: parseInt(e.target.value)})}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Allowed Hours
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="time"
              value={settings.allowedHours?.start}
              onChange={(e) => setSettings({
                ...settings,
                allowedHours: {...settings.allowedHours, start: e.target.value}
              })}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
            <span style={{ alignSelf: 'center' }}>to</span>
            <input
              type="time"
              value={settings.allowedHours?.end}
              onChange={(e) => setSettings({
                ...settings,
                allowedHours: {...settings.allowedHours, end: e.target.value}
              })}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentDashboard;