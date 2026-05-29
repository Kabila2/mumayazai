// src/components/ParentDashboard.js - Clean, light parent dashboard

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
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
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Settings,
  Clock,
  MessageSquare,
  FileText,
  TrendingUp,
  Award,
  Trash2,
  Calendar,
  BarChart3,
  Brain,
  Sparkles,
  Shield,
  Search
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
  Area,
  AreaChart
} from 'recharts';

const ACCENT = '#4f46e5';
const ACCENT_SOFT = '#eef2ff';
const TEXT = '#111827';
const TEXT_MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const SURFACE = '#ffffff';
const BG = '#f9fafb';

const cardSx = {
  borderRadius: 2,
  border: `1px solid ${BORDER}`,
  boxShadow: 'none',
  background: SURFACE
};

const formatTime = (minutes) => {
  if (!minutes || minutes < 1) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const ParentDashboard = ({
  userEmail,
  onClose,
  onSignOut,
  language = 'en'
}) => {
  const [parentData, setParentData] = useState(null);
  const [childStats, setChildStats] = useState({});
  const [selectedChildEmail, setSelectedChildEmail] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');

  const selectedChildEmailRef = useRef(null);
  useEffect(() => { selectedChildEmailRef.current = selectedChildEmail; }, [selectedChildEmail]);

  const reload = useCallback(() => {
    if (!userEmail) return;
    const data = getParentData(userEmail);
    setParentData(data);
    if (!data) return;

    const stats = {};
    data.children.forEach(child => {
      stats[child.email] = getChildStatistics(child.email);
    });
    setChildStats(stats);

    if (!selectedChildEmailRef.current && data.children.length > 0) {
      setSelectedChildEmail(data.children[0].email);
    }
  }, [userEmail]);

  // Single interval, not re-created on every child selection
  useEffect(() => {
    reload();
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  const showSnackbar = (message, severity = 'info') =>
    setSnackbar({ open: true, message, severity });

  const handleAddChild = (childEmail, childName) => {
    if (!parentData) return;
    const result = linkChildToParent(childEmail, childName, parentData.email);
    if (result.success) {
      setShowAddChild(false);
      reload();
      showSnackbar('Child added', 'success');
    } else {
      showSnackbar(result.error || 'Failed to add child', 'error');
    }
  };

  const handleRemoveChild = (childEmail, childName) => {
    if (!window.confirm(`Remove ${childName} from your dashboard?`)) return;
    const result = removeChildFromParent(childEmail, userEmail);
    if (result.success) {
      if (selectedChildEmail === childEmail) setSelectedChildEmail(null);
      reload();
      showSnackbar('Child removed', 'success');
    } else {
      showSnackbar(result.error || 'Failed to remove child', 'error');
    }
  };

  const handleSaveSettings = (settings) => {
    const result = updateParentSettings(settings, userEmail);
    if (result.success) {
      setShowSettings(false);
      reload();
      showSnackbar('Settings saved', 'success');
    } else {
      showSnackbar(result.error || 'Failed to save settings', 'error');
    }
  };

  const filteredChildren = (parentData?.children || []).filter(child => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return child.name.toLowerCase().includes(q) || child.email.toLowerCase().includes(q);
  });

  const selectedChild = selectedChildEmail
    ? (parentData?.children || []).find(c => c.email === selectedChildEmail) || null
    : null;

  if (!parentData) {
    return (
      <Box sx={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ ...cardSx, maxWidth: 420, p: 4, textAlign: 'center' }}>
          <Shield size={40} color={ACCENT} style={{ margin: '0 auto 12px' }} />
          <Typography variant="h6" gutterBottom sx={{ color: TEXT }}>
            Parent account not found
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 3 }}>
            We couldn't load your parent data. Please sign in again.
          </Typography>
          <Button
            variant="contained"
            onClick={onSignOut || onClose}
            sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none' }}
            fullWidth
          >
            Back to Sign In
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: BG, p: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl" disableGutters>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {onClose && (
              <IconButton onClick={onClose} sx={{ color: TEXT_MUTED }} aria-label="Back to home">
                <ArrowLeft size={20} />
              </IconButton>
            )}
            <Box>
              <Typography variant="h6" sx={{ color: TEXT, fontWeight: 600, lineHeight: 1.2 }}>
                Parent Dashboard
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {parentData.name}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Settings">
              <IconButton onClick={() => setShowSettings(true)} sx={{ color: TEXT_MUTED }}>
                <Settings size={18} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<UserPlus size={16} />}
              onClick={() => setShowAddChild(true)}
              sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none' }}
            >
              Add child
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Card sx={cardSx}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600 }}>
                    Children
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                    {filteredChildren.length}
                  </Typography>
                </Box>

                {parentData.children.length > 3 && (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search size={16} color={TEXT_MUTED} /></InputAdornment>
                    }}
                    sx={{ mb: 1.5 }}
                  />
                )}
                <Divider sx={{ mb: 1.5 }} />

                {parentData.children.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Users size={36} color="#d1d5db" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                      No children added
                    </Typography>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                      Click "Add child" to start
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ p: 0 }}>
                    {filteredChildren.map(child => {
                      const stats = childStats[child.email] || {};
                      const isSelected = selectedChildEmail === child.email;
                      return (
                        <ListItem key={child.email} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            selected={isSelected}
                            onClick={() => setSelectedChildEmail(child.email)}
                            sx={{
                              borderRadius: 1.5,
                              '&.Mui-selected': {
                                background: ACCENT_SOFT,
                                '&:hover': { background: ACCENT_SOFT }
                              }
                            }}
                          >
                            <Avatar sx={{ width: 28, height: 28, background: ACCENT_SOFT, color: ACCENT, mr: 1.5, fontSize: 12, fontWeight: 600 }}>
                              {child.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ color: TEXT, fontWeight: isSelected ? 600 : 500 }}>
                                  {child.name}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                                  {stats.totalSessions || 0} sessions • {formatTime(stats.totalTimeSpent || 0)}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Main */}
          <Grid item xs={12} md={9}>
            <Card sx={cardSx}>
              <CardContent>
                {!selectedChild ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <BarChart3 size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
                    <Typography variant="body1" sx={{ color: TEXT, fontWeight: 500 }}>
                      Select a child
                    </Typography>
                    <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                      Choose a child from the sidebar to view progress
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: TEXT, fontWeight: 600 }}>
                          {selectedChild.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                          Linked {new Date(selectedChild.linkedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove from dashboard">
                        <IconButton
                          onClick={() => handleRemoveChild(selectedChild.email, selectedChild.name)}
                          size="small"
                          sx={{ color: TEXT_MUTED, '&:hover': { color: '#ef4444' } }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Tabs
                      value={activeTab}
                      onChange={(e, v) => setActiveTab(v)}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{
                        mb: 2,
                        borderBottom: `1px solid ${BORDER}`,
                        minHeight: 36,
                        '& .MuiTab-root': { minHeight: 36, textTransform: 'none', color: TEXT_MUTED },
                        '& .Mui-selected': { color: `${ACCENT} !important` },
                        '& .MuiTabs-indicator': { background: ACCENT }
                      }}
                    >
                      <Tab label="Overview" />
                      <Tab label="Activity" />
                      <Tab label="Progress" />
                      <Tab label="Improvements" />
                      <Tab label="Achievements" />
                    </Tabs>

                    {activeTab === 0 && <OverviewTab child={selectedChild} stats={childStats[selectedChild.email]} />}
                    {activeTab === 1 && <ActivityTab stats={childStats[selectedChild.email]} />}
                    {activeTab === 2 && <ProgressTab stats={childStats[selectedChild.email]} />}
                    {activeTab === 3 && <ImprovementsTab child={selectedChild} stats={childStats[selectedChild.email]} />}
                    {activeTab === 4 && <AchievementsTab child={selectedChild} />}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <AddChildModal open={showAddChild} onClose={() => setShowAddChild(false)} onAddChild={handleAddChild} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} parentData={parentData} onSave={handleSaveSettings} />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ borderRadius: 1.5 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

// Overview
const OverviewTab = ({ child, stats }) => {
  const Stat = ({ icon: Icon, label, value }) => (
    <Card sx={cardSx}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: TEXT_MUTED }}>
          <Icon size={16} />
          <Typography variant="caption">{label}</Typography>
        </Box>
        <Typography variant="h5" sx={{ color: TEXT, fontWeight: 700 }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <Stat icon={Clock} label="Learning time" value={formatTime(stats?.totalTimeSpent || 0)} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Stat icon={MessageSquare} label="Sessions" value={stats?.totalSessions || 0} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Stat icon={FileText} label="Messages" value={stats?.totalMessages || 0} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Stat icon={Brain} label="Topics" value={stats?.topicsExplored?.length || 0} />
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>Average session</Typography>
            <Typography variant="h4" sx={{ color: TEXT, fontWeight: 700, mt: 0.5 }}>
              {formatTime(stats?.averageSessionTime || 0)}
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
              {stats?.averageMessagesPerSession || 0} messages per session
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>Last activity</Typography>
            <Typography variant="body1" sx={{ color: TEXT, fontWeight: 600, mt: 0.5 }}>
              {child.lastActivity ? new Date(child.lastActivity).toLocaleString() : 'No activity yet'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Activity
const ActivityTab = ({ stats }) => {
  const hasData = stats?.dailyActivity?.length > 0;
  const data = hasData ? stats.dailyActivity.slice(-7) : [];

  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, border: `1px dashed ${BORDER}`, borderRadius: 2 }}>
        <Calendar size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>No activity data yet</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ ...cardSx, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1 }}>
            7-day activity
          </Typography>
          <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="parentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25}/>
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="date" stroke={TEXT_MUTED} fontSize={12} tickFormatter={(d) => { try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short' }); } catch { return d; } }} />
                <YAxis stroke={TEXT_MUTED} fontSize={12} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="timeSpent" stroke={ACCENT} strokeWidth={2} fill="url(#parentArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {stats.topicsExplored?.length > 0 && (
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Sparkles size={16} /> Topics explored
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {stats.topicsExplored.map((topic, i) => (
                <Chip
                  key={i}
                  label={topic}
                  size="small"
                  sx={{ background: ACCENT_SOFT, color: ACCENT, borderRadius: 1 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Progress
const ProgressTab = ({ stats }) => {
  const hasData = stats?.dailyActivity?.length > 0;
  const data = hasData ? stats.dailyActivity.slice(-7) : [];
  const insights = hasData ? getLearningInsights(stats) : [];

  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, border: `1px dashed ${BORDER}`, borderRadius: 2 }}>
        <TrendingUp size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>No progress data yet</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1 }}>
              Daily time
            </Typography>
            <Box sx={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="date" stroke={TEXT_MUTED} fontSize={12} tickFormatter={(d) => { try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short' }); } catch { return d; } }} />
                  <YAxis stroke={TEXT_MUTED} fontSize={12} />
                  <RechartsTooltip />
                  <Bar dataKey="timeSpent" fill={ACCENT} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1 }}>
              Sessions completed
            </Typography>
            <Box sx={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="date" stroke={TEXT_MUTED} fontSize={12} tickFormatter={(d) => { try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short' }); } catch { return d; } }} />
                  <YAxis stroke={TEXT_MUTED} fontSize={12} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="sessions" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {insights.length > 0 && (
        <Grid item xs={12}>
          <Card sx={cardSx}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Brain size={16} /> Insights
              </Typography>
              {insights.map((insight, i) => (
                <Alert
                  key={i}
                  severity={insight.type === 'positive' ? 'success' : insight.type === 'concern' ? 'error' : 'info'}
                  sx={{ mb: 1, borderRadius: 1.5 }}
                  icon={<span style={{ fontSize: '1.1rem' }}>{insight.icon}</span>}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{insight.title}</Typography>
                  <Typography variant="caption">{insight.description}</Typography>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// Improvements
const ImprovementsTab = ({ child, stats }) => {
  const improvements = stats ? analyzeAreasForImprovement(stats, child) : [];
  const score = stats ? calculateImprovementScore(stats, child) : 0;
  const recommendations = stats ? generateLearningRecommendations(stats, child) : [];

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <Box>
      <Card sx={{ ...cardSx, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>Learning score</Typography>
              <Typography variant="h3" sx={{ color: scoreColor, fontWeight: 700 }}>{score}<Typography component="span" variant="h6" sx={{ color: TEXT_MUTED }}>/100</Typography></Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 6,
              borderRadius: 3,
              background: '#f3f4f6',
              '& .MuiLinearProgress-bar': { background: scoreColor, borderRadius: 3 }
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1 }}>
            Focus areas
          </Typography>
          {improvements.length === 0 ? (
            <Card sx={cardSx}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Award size={32} color="#10b981" style={{ marginBottom: 8 }} />
                <Typography variant="body2" sx={{ color: TEXT_MUTED }}>Doing great — no concerns</Typography>
              </CardContent>
            </Card>
          ) : (
            improvements.map((imp, i) => (
              <Card key={i} sx={{ ...cardSx, mb: 1.5, borderLeft: `3px solid ${imp.color}` }}>
                <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ fontSize: '1.25rem' }}>{imp.icon}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: imp.color, fontWeight: 600 }}>{imp.issue}</Typography>
                      <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', my: 0.5 }}>{imp.description}</Typography>
                      <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Sparkles size={12} /> {imp.suggestion}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600, mb: 1 }}>
            Recommendations
          </Typography>
          {recommendations.length === 0 ? (
            <Card sx={cardSx}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                  Recommendations will appear as more data is gathered
                </Typography>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec, i) => (
              <Alert
                key={i}
                severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                sx={{ mb: 1, borderRadius: 1.5 }}
                icon={<span style={{ fontSize: '1.1rem' }}>{rec.icon}</span>}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{rec.title}</Typography>
                <Typography variant="caption">{rec.description}</Typography>
              </Alert>
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

// Achievements
const AchievementsTab = ({ child }) => {
  const achievements = child?.progressData?.achievements || [];
  if (achievements.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, border: `1px dashed ${BORDER}`, borderRadius: 2 }}>
        <Award size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>No achievements yet</Typography>
      </Box>
    );
  }
  return (
    <Grid container spacing={2}>
      {achievements.map((ach) => (
        <Grid item xs={12} sm={6} md={4} key={ach.id}>
          <Card sx={cardSx}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ fontSize: '2rem' }}>{ach.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: TEXT, fontWeight: 600 }}>{ach.name}</Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED }}>{ach.description}</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', mt: 1 }}>
                {new Date(ach.earnedAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Add Child modal
const AddChildModal = ({ open, onClose, onAddChild }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const reset = () => { setEmail(''); setName(''); };
  const handleClose = () => { reset(); onClose(); };
  const submit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onAddChild(email.trim(), name.trim() || email.trim());
      reset();
    }
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT, fontWeight: 600 }}>Add child</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
            Your child must already have a student account with this email.
          </Alert>
          <TextField margin="dense" autoFocus label="Child's email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField margin="dense" label="Display name (optional)" fullWidth value={name} onChange={(e) => setName(e.target.value)} helperText="Leave empty to use the name on their account" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: TEXT_MUTED }}>Cancel</Button>
          <Button type="submit" variant="contained" sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none' }}>Add</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Settings modal
const SettingsModal = ({ open, onClose, parentData, onSave }) => {
  const defaultSettings = { allowedHours: { start: '09:00', end: '21:00' } };
  const [settings, setSettings] = useState(parentData?.settings || defaultSettings);

  useEffect(() => {
    if (open) setSettings(parentData?.settings || defaultSettings);
    // defaultSettings is a stable literal — re-creating it would loop the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT, fontWeight: 600 }}>Settings</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ color: TEXT, mb: 0.5 }}>Allowed hours</Typography>
        <Typography variant="caption" sx={{ color: TEXT_MUTED, mb: 2, display: 'block' }}>
          Time window when your child can use the platform
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Start"
            type="time"
            fullWidth
            value={settings.allowedHours?.start || '09:00'}
            onChange={(e) => setSettings({ ...settings, allowedHours: { ...settings.allowedHours, start: e.target.value } })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End"
            type="time"
            fullWidth
            value={settings.allowedHours?.end || '21:00'}
            onChange={(e) => setSettings({ ...settings, allowedHours: { ...settings.allowedHours, end: e.target.value } })}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: TEXT_MUTED }}>Cancel</Button>
        <Button onClick={() => onSave(settings)} variant="contained" sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none' }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ParentDashboard;
