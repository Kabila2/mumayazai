// src/components/ParentDashboard.js - Modern Parent Dashboard with Material-UI

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  Tab,
  Tabs,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Container
} from '@mui/material';
import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  Clock,
  MessageSquare,
  FileText,
  TrendingUp,
  Award,
  Target,
  Trash2,
  Calendar,
  Activity,
  BarChart3,
  Brain,
  Sparkles,
  Shield,
  Bell,
  Moon,
  Sun,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
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
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

const ParentDashboard = ({
  onSignOut,
  t = {},
  language = "en",
  reducedMotion = false
}) => {
  const [parentData, setParentData] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childStats, setChildStats] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Modern color palette
  const colors = {
    primary: ['#6366f1', '#8b5cf6', '#a855f7', '#c026d3'],
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    danger: ['#ef4444', '#dc2626'],
    info: ['#3b82f6', '#2563eb']
  };

  // Load parent data
  useEffect(() => {
    const loadData = () => {
      try {
        const data = getParentData();
        setParentData(data);

        if (data && data.children.length > 0) {
          const stats = {};
          data.children.forEach(child => {
            stats[child.email] = getChildStatistics(child.email);
          });
          setChildStats(stats);

          if (!selectedChild) {
            setSelectedChild(data.children[0]);
          }
        }
      } catch (error) {
        console.error('Error loading parent data:', error);
        showSnackbar('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedChild]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddChild = useCallback((childEmail, childName) => {
    if (!parentData) return;

    const result = linkChildToParent(childEmail, childName, parentData.email);
    if (result.success) {
      const updatedData = getParentData();
      setParentData(updatedData);
      setShowAddChild(false);

      const newStats = { ...childStats };
      newStats[childEmail] = getChildStatistics(childEmail);
      setChildStats(newStats);

      showSnackbar('Child added successfully!', 'success');
    } else {
      showSnackbar(result.error || 'Failed to add child', 'error');
    }
  }, [parentData, childStats]);

  const handleRemoveChild = useCallback((childEmail, childName) => {
    if (window.confirm(`Are you sure you want to remove ${childName} from your dashboard?`)) {
      const result = removeChildFromParent(childEmail);
      if (result.success) {
        const updatedData = getParentData();
        setParentData(updatedData);

        const newStats = { ...childStats };
        delete newStats[childEmail];
        setChildStats(newStats);

        if (selectedChild?.email === childEmail) {
          setSelectedChild(updatedData.children[0] || null);
        }

        showSnackbar('Child removed successfully', 'success');
      } else {
        showSnackbar('Failed to remove child', 'error');
      }
    }
  }, [childStats, selectedChild]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredChildren = parentData?.children.filter(child =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 3
        }}
      >
        <Container maxWidth="xl">
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
            </Grid>
            <Grid item xs={12} md={9}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!parentData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ maxWidth: 400, p: 4, textAlign: 'center' }}>
          <Shield size={64} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <Typography variant="h5" gutterBottom>Parent Account Not Found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We couldn't find your parent account. Please sign in again.
          </Typography>
          <Button
            variant="contained"
            startIcon={<LogOut />}
            onClick={onSignOut}
            fullWidth
          >
            Back to Sign In
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode
          ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        p: { xs: 2, md: 3 },
        transition: 'background 0.3s ease'
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    }}
                  >
                    <Users size={28} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Parent Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Welcome back, {parentData.name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="Refresh">
                    <IconButton onClick={() => window.location.reload()} color="primary">
                      <RefreshCw size={20} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
                    <IconButton onClick={() => setDarkMode(!darkMode)} color="primary">
                      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </IconButton>
                  </Tooltip>

                  <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={() => setShowAddChild(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
                    }}
                  >
                    Add Child
                  </Button>

                  <Tooltip title="Settings">
                    <IconButton
                      onClick={() => setShowSettings(true)}
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                      <Settings size={20} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Sign Out">
                    <IconButton
                      onClick={onSignOut}
                      sx={{
                        border: '1px solid',
                        borderColor: 'error.main',
                        color: 'error.main'
                      }}
                    >
                      <LogOut size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Sidebar - Children List */}
          <Grid item xs={12} md={3}>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  height: 'fit-content'
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      Your Children
                    </Typography>
                    <Chip
                      label={filteredChildren.length}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  {parentData.children.length > 3 && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search children..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <Search size={18} style={{ marginRight: 8, color: '#9ca3af' }} />
                      }}
                      sx={{ mb: 2 }}
                    />
                  )}

                  {parentData.children.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Users size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        No children added yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click "Add Child" to start monitoring
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {filteredChildren.map((child, index) => {
                        const stats = childStats[child.email] || {};
                        const isSelected = selectedChild?.id === child.id;

                        return (
                          <motion.div
                            key={child.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <ListItem
                              disablePadding
                              sx={{ mb: 1 }}
                            >
                              <ListItemButton
                                selected={isSelected}
                                onClick={() => setSelectedChild(child)}
                                sx={{
                                  borderRadius: 2,
                                  background: isSelected
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'transparent',
                                  color: isSelected ? 'white' : 'inherit',
                                  '&:hover': {
                                    background: isSelected
                                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                      : 'rgba(99, 102, 241, 0.08)'
                                  },
                                  '&.Mui-selected': {
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #5b5ef0, #7c4de5)'
                                    }
                                  }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar
                                    sx={{
                                      background: isSelected
                                        ? 'rgba(255, 255, 255, 0.2)'
                                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    }}
                                  >
                                    {child.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" fontWeight={600}>
                                      {child.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="caption" sx={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                                        {stats.totalSessions || 0} sessions
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                                        {formatTime(stats.totalTimeSpent || 0)}
                                      </Typography>
                                    </Box>
                                  }
                                />
                                <Badge
                                  variant="dot"
                                  sx={{
                                    '& .MuiBadge-dot': {
                                      backgroundColor: child.status === 'active' ? '#10b981' : '#9ca3af'
                                    }
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          </motion.div>
                        );
                      })}
                    </List>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Main Dashboard Area */}
          <Grid item xs={12} md={9}>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  {!selectedChild ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <BarChart3 size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                      <Typography variant="h5" gutterBottom>Select a Child</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Choose a child from the sidebar to view their learning progress
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Child Header */}
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="h5" fontWeight={700} gutterBottom>
                            {selectedChild.name}'s Progress
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Linked on {formatDate(selectedChild.linkedAt)}
                          </Typography>
                        </Box>

                        <Tooltip title="Remove Child">
                          <IconButton
                            onClick={() => handleRemoveChild(selectedChild.email, selectedChild.name)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': { background: 'rgba(239, 68, 68, 0.08)' }
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Divider sx={{ mb: 3 }} />

                      {/* Tabs */}
                      <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                      >
                        <Tab icon={<Activity size={18} />} label="Overview" iconPosition="start" />
                        <Tab icon={<Calendar size={18} />} label="Activity" iconPosition="start" />
                        <Tab icon={<TrendingUp size={18} />} label="Progress" iconPosition="start" />
                        <Tab icon={<Target size={18} />} label="Improvements" iconPosition="start" />
                        <Tab icon={<Award size={18} />} label="Achievements" iconPosition="start" />
                      </Tabs>

                      {/* Tab Content */}
                      <AnimatePresence mode="wait">
                        {activeTab === 0 && (
                          <OverviewTab
                            child={selectedChild}
                            stats={childStats[selectedChild.email]}
                            formatTime={formatTime}
                            colors={colors}
                          />
                        )}
                        {activeTab === 1 && (
                          <ActivityTab
                            child={selectedChild}
                            stats={childStats[selectedChild.email]}
                            formatTime={formatTime}
                            colors={colors}
                          />
                        )}
                        {activeTab === 2 && (
                          <ProgressTab
                            child={selectedChild}
                            stats={childStats[selectedChild.email]}
                            formatTime={formatTime}
                            colors={colors}
                          />
                        )}
                        {activeTab === 3 && (
                          <ImprovementsTab
                            child={selectedChild}
                            stats={childStats[selectedChild.email]}
                            colors={colors}
                          />
                        )}
                        {activeTab === 4 && (
                          <AchievementsTab
                            child={selectedChild}
                            colors={colors}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Modals */}
        <AddChildModal
          open={showAddChild}
          onClose={() => setShowAddChild(false)}
          onAddChild={handleAddChild}
          parentEmail={parentData.email}
        />

        <SettingsModal
          open={showSettings}
          onClose={() => setShowSettings(false)}
          parentData={parentData}
          onUpdateSettings={updateParentSettings}
          onSuccess={() => showSnackbar('Settings updated successfully', 'success')}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

// Overview Tab Component
const OverviewTab = ({ child, stats, formatTime, colors }) => (
  <motion.div
    key="overview-tab"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
    style={{ willChange: 'opacity, transform' }}
  >
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
            color: 'white'
          }}
        >
          <CardContent>
            <Clock size={32} style={{ marginBottom: 12 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {formatTime(stats?.totalTimeSpent || 0)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Learning Time
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${colors.success[0]}, ${colors.success[1]})`,
            color: 'white'
          }}
        >
          <CardContent>
            <MessageSquare size={32} style={{ marginBottom: 12 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {stats?.totalSessions || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Chat Sessions
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${colors.warning[0]}, ${colors.warning[1]})`,
            color: 'white'
          }}
        >
          <CardContent>
            <FileText size={32} style={{ marginBottom: 12 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {stats?.totalMessages || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Messages Sent
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${colors.info[0]}, ${colors.info[1]})`,
            color: 'white'
          }}
        >
          <CardContent>
            <Brain size={32} style={{ marginBottom: 12 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {stats?.topicsExplored?.length || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Topics Explored
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              <Activity size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Recent Activity
            </Typography>
            <Divider sx={{ my: 2 }} />
            {child.lastActivity ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge variant="dot" color="success" />
                <Typography variant="body2" color="text.secondary">
                  Last active: {new Date(child.lastActivity).toLocaleString()}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent activity recorded
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Stats */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Average Session
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary">
              {formatTime(stats?.averageSessionTime || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.averageMessagesPerSession || 0} messages per session
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Learning Streak
            </Typography>
            <Typography variant="h3" fontWeight={700} color="success.main">
              {stats?.totalSessions || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total sessions completed
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </motion.div>
);

// Activity Tab Component
const ActivityTab = ({ child, stats, formatTime, colors }) => {
  const hasData = stats && stats.dailyActivity && Array.isArray(stats.dailyActivity) && stats.dailyActivity.length > 0;
  const activityData = hasData ? stats.dailyActivity.slice(-7) : [];

  return (
    <motion.div
      key="activity-tab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{ willChange: 'opacity, transform' }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        7-Day Activity Overview
      </Typography>

      {hasData ? (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {activityData.map((day, index) => (
              <Grid item xs={12} sm={6} md key={day.date || index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      background: day.timeSpent > 0
                        ? `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`
                        : 'transparent',
                      color: day.timeSpent > 0 ? 'white' : 'text.secondary',
                      border: day.timeSpent === 0 ? '1px dashed' : 'none',
                      borderColor: 'divider',
                      textAlign: 'center'
                    }}
                  >
                    <CardContent>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : 'N/A'}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ my: 1 }}>
                        {formatTime(day.timeSpent || 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {day.sessions || 0} sessions
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Activity Chart */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Activity Trend
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary[0]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.primary[0]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        try {
                          return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        } catch (e) {
                          return date;
                        }
                      }}
                      stroke="#9ca3af"
                    />
                    <YAxis stroke="#9ca3af" />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="timeSpent"
                      stroke={colors.primary[0]}
                      fillOpacity={1}
                      fill="url(#colorTime)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Topics Explored */}
          {stats?.topicsExplored && stats.topicsExplored.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  <Sparkles size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Topics Explored
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {stats.topicsExplored.map((topic, index) => (
                    <Chip
                      key={index}
                      label={topic}
                      sx={{
                        background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Calendar size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
            <Typography variant="body1" color="text.secondary">
              No activity data available yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Activity will appear here once your child starts learning
            </Typography>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

// Progress Tab Component
const ProgressTab = ({ child, stats, formatTime, colors }) => {
  // Safely get insights - only if stats and dailyActivity exist
  const insights = (stats && stats.dailyActivity && stats.dailyActivity.length > 0)
    ? getLearningInsights(stats)
    : [];

  // Check if we have valid data
  const hasData = stats && stats.dailyActivity && Array.isArray(stats.dailyActivity) && stats.dailyActivity.length > 0;
  const chartData = hasData ? stats.dailyActivity.slice(-7) : [];

  return (
    <motion.div
      key="progress-tab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{ willChange: 'opacity, transform' }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        <BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Progress Analytics
      </Typography>

      {!hasData ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BarChart3 size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
            <Typography variant="body1" color="text.secondary">
              No progress data available yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Progress analytics will appear here once your child starts learning regularly
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Charts */}
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Daily Time Spent
                  </Typography>
                  <Box sx={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => {
                            try {
                              return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                            } catch (e) {
                              return date;
                            }
                          }}
                          stroke="#9ca3af"
                        />
                        <YAxis stroke="#9ca3af" />
                        <RechartsTooltip />
                        <Bar dataKey="timeSpent" fill={colors.primary[0]} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Sessions Completed
                  </Typography>
                  <Box sx={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => {
                            try {
                              return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                            } catch (e) {
                              return date;
                            }
                          }}
                          stroke="#9ca3af"
                        />
                        <YAxis stroke="#9ca3af" />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="sessions"
                          stroke={colors.success[0]}
                          strokeWidth={3}
                          dot={{ fill: colors.success[0], r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Learning Insights */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    <Brain size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    Learning Insights
                  </Typography>
                  {insights && insights.length > 0 ? (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {insights.map((insight, index) => (
                        <Grid item xs={12} key={index}>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                          >
                            <Alert
                              severity={
                                insight.type === 'positive' ? 'success' :
                                insight.type === 'concern' ? 'error' : 'info'
                              }
                              icon={<span style={{ fontSize: '1.5rem' }}>{insight.icon}</span>}
                            >
                              <Typography variant="subtitle2" fontWeight={600}>
                                {insight.title}
                              </Typography>
                              <Typography variant="body2">
                                {insight.description}
                              </Typography>
                            </Alert>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Keep tracking to see learning insights!
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </motion.div>
  );
};

// Improvements Tab Component
const ImprovementsTab = ({ child, stats, colors }) => {
  // Safely get improvements data
  const improvements = (stats && child) ? analyzeAreasForImprovement(stats, child) : [];
  const improvementScore = (stats && child) ? calculateImprovementScore(stats, child) : 0;
  const recommendations = (stats && child) ? generateLearningRecommendations(stats, child) : [];

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success[0];
    if (score >= 60) return colors.warning[0];
    return colors.danger[0];
  };

  return (
    <motion.div
      key="improvements-tab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{ willChange: 'opacity, transform' }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        <Target size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Areas for Improvement
      </Typography>

      {/* Improvement Score */}
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${getScoreColor(improvementScore)}, ${getScoreColor(improvementScore)}dd)`,
          color: 'white'
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h2" fontWeight={700} gutterBottom>
            {improvementScore}/100
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Learning Score
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {improvementScore >= 80 ? '🌟 Excellent progress! Keep it up!' :
             improvementScore >= 60 ? '📈 Good progress with room for improvement' :
             '🎯 Several areas need attention for better learning outcomes'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={improvementScore}
            sx={{
              mt: 2,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white'
              }
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Focus Areas */}
        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Focus Areas
              </Typography>
              {improvements.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {improvements.map((improvement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        variant="outlined"
                        sx={{
                          mb: 2,
                          borderLeft: `4px solid ${improvement.color}`,
                          '&:hover': { boxShadow: 2 }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ fontSize: '1.5rem' }}>{improvement.icon}</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight={600} color={improvement.color}>
                                {improvement.issue}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
                                {improvement.description}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                <Sparkles size={14} />
                                {improvement.suggestion}
                              </Typography>
                            </Box>
                            <Chip
                              label={improvement.severity}
                              size="small"
                              sx={{
                                backgroundColor: improvement.color,
                                color: 'white',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                fontSize: '0.65rem'
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Award size={48} color="#10b981" style={{ marginBottom: 16 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Great job!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No major areas for improvement detected
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Recommendations
              </Typography>
              {recommendations.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Alert
                        severity={
                          rec.priority === 'high' ? 'error' :
                          rec.priority === 'medium' ? 'warning' : 'info'
                        }
                        icon={<span style={{ fontSize: '1.2rem' }}>{rec.icon}</span>}
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {rec.title}
                        </Typography>
                        <Typography variant="body2">
                          {rec.description}
                        </Typography>
                      </Alert>
                    </motion.div>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Recommendations will appear as we gather more learning data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// Achievements Tab Component
const AchievementsTab = ({ child, colors }) => (
  <motion.div
    key="achievements-tab"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
    style={{ willChange: 'opacity, transform' }}
  >
    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
      <Award size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
      Achievements Unlocked
    </Typography>

    {child.progressData.achievements && child.progressData.achievements.length > 0 ? (
      <Grid container spacing={3}>
        {child.progressData.achievements.map((achievement, index) => (
          <Grid item xs={12} sm={6} md={4} key={achievement.id}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${colors.primary[index % colors.primary.length]}, ${colors.primary[(index + 1) % colors.primary.length]})`,
                  color: 'white',
                  textAlign: 'center',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ fontSize: '3rem', mb: 2 }}>
                    {achievement.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {achievement.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    {achievement.description}
                  </Typography>
                  <Chip
                    label={new Date(achievement.earnedAt).toLocaleDateString()}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    ) : (
      <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Award size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
          <Typography variant="h6" gutterBottom>
            No achievements yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Achievements will appear here as your child learns and explores!
          </Typography>
        </CardContent>
      </Card>
    )}
  </motion.div>
);

// Add Child Modal Component
const AddChildModal = ({ open, onClose, onAddChild, parentEmail }) => {
  const [childEmail, setChildEmail] = useState('');
  const [childName, setChildName] = useState('');

  const handleClose = () => {
    setChildEmail('');
    setChildName('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (childEmail.trim()) {
      // Use childName if provided, otherwise let the backend use the registered name
      onAddChild(childEmail.trim(), childName.trim() || childEmail.trim());
      setChildEmail('');
      setChildName('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UserPlus size={24} />
          Add Child to Dashboard
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              How to Add Your Child:
            </Typography>
            <Typography variant="caption" component="div">
              1. Make sure your child has already registered with a student account
            </Typography>
            <Typography variant="caption" component="div">
              2. Enter the email address your child used to sign up
            </Typography>
            <Typography variant="caption" component="div">
              3. Click "Add Child" to start tracking their progress
            </Typography>
          </Alert>

          <TextField
            margin="dense"
            label="Child's Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={childEmail}
            onChange={(e) => setChildEmail(e.target.value)}
            required
            autoFocus
            helperText="Enter the email address your child used to create their student account"
            placeholder="child@example.com"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Child's Name (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            helperText="Leave empty to automatically use the name from their account"
            placeholder="Will auto-fill from student account"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
            }}
          >
            Add Child
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Settings Modal Component
const SettingsModal = ({ open, onClose, parentData, onUpdateSettings, onSuccess }) => {
  const [settings, setSettings] = useState(parentData?.settings || {
    allowedHours: { start: "09:00", end: "21:00" },
    contentFilter: "moderate",
    notifications: true,
    weeklyReports: true
  });

  const handleSave = () => {
    const result = onUpdateSettings(settings);
    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings size={24} />
          Parent Settings
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Allowed Hours
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Set the time window when your child can use the learning platform
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Start Time"
              type="time"
              value={settings.allowedHours?.start}
              onChange={(e) => setSettings({
                ...settings,
                allowedHours: { ...settings.allowedHours, start: e.target.value }
              })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Time"
              type="time"
              value={settings.allowedHours?.end}
              onChange={(e) => setSettings({
                ...settings,
                allowedHours: { ...settings.allowedHours, end: e.target.value }
              })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          <Alert severity="info">
            <Typography variant="caption">
              Children can access the platform between the specified hours. This helps maintain healthy learning habits.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': { background: 'linear-gradient(135deg, #5b5ef0, #7c4de5)' }
          }}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ParentDashboard;
