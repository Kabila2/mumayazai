// src/components/TeacherDashboard.js - Modern Teacher Dashboard with ClassDojo-like Features

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
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ButtonGroup
} from '@mui/material';
import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  BookOpen,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  School,
  BarChart3,
  Star,
  Trophy,
  Sparkles,
  Target,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Gift,
  Zap
} from 'lucide-react';
import {
  getTeacherData,
  createClass,
  getTeacherClasses,
  getClass,
  enrollStudent,
  removeStudentFromClass,
  awardPoints,
  getClassLeaderboard,
  getStudentInClass,
  getClassStatistics,
  deleteClass,
  updateTeacherSettings
} from '../utils/teacherUtils';
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
  Cell
} from 'recharts';

const TeacherDashboard = ({
  onSignOut,
  t = {},
  language = "en",
  reducedMotion = false
}) => {
  const [teacherData, setTeacherData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Modals
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  // Load teacher data and classes
  useEffect(() => {
    const loadData = () => {
      try {
        const data = getTeacherData();
        setTeacherData(data);

        if (data) {
          const teacherClasses = getTeacherClasses(data.email);
          setClasses(teacherClasses);

          if (!selectedClass && teacherClasses.length > 0) {
            setSelectedClass(teacherClasses[0]);
          }
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
        showSnackbar('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedClass]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateClass = (className, subject, gradeLevel) => {
    if (!teacherData) return;

    const result = createClass(teacherData.email, className, subject, gradeLevel);
    if (result.success) {
      setClasses([...classes, result.class]);
      setShowCreateClass(false);
      showSnackbar('Class created successfully!', 'success');
    } else {
      showSnackbar(result.error || 'Failed to create class', 'error');
    }
  };

  const handleAddStudent = (studentEmail) => {
    if (!selectedClass) return;

    const result = enrollStudent(selectedClass.id, studentEmail);
    if (result.success) {
      // Reload class data
      const updatedClass = getClass(selectedClass.id);
      setSelectedClass(updatedClass);
      setShowAddStudent(false);
      showSnackbar('Student enrolled successfully!', 'success');
    } else {
      showSnackbar(result.error || 'Failed to enroll student', 'error');
    }
  };

  const handleAwardPoints = (studentEmail, points, reason, category) => {
    if (!selectedClass) return;

    const result = awardPoints(selectedClass.id, studentEmail, points, reason, category);
    if (result.success) {
      // Reload class data
      const updatedClass = getClass(selectedClass.id);
      setSelectedClass(updatedClass);
      setShowAwardPoints(false);
      setSelectedStudent(null);
      showSnackbar(`${points > 0 ? 'Awarded' : 'Deducted'} ${Math.abs(points)} points!`, 'success');
    } else {
      showSnackbar(result.error || 'Failed to award points', 'error');
    }
  };

  const handleRemoveStudent = (studentEmail, studentName) => {
    if (!selectedClass) return;

    if (window.confirm(`Remove ${studentName} from this class?`)) {
      const result = removeStudentFromClass(selectedClass.id, studentEmail);
      if (result.success) {
        const updatedClass = getClass(selectedClass.id);
        setSelectedClass(updatedClass);
        showSnackbar('Student removed from class', 'success');
      } else {
        showSnackbar('Failed to remove student', 'error');
      }
    }
  };

  const handleDeleteClass = (classId, className) => {
    if (!teacherData) return;

    if (window.confirm(`Delete class "${className}"? This action cannot be undone.`)) {
      const result = deleteClass(classId, teacherData.email);
      if (result.success) {
        setClasses(classes.filter(c => c.id !== classId));
        if (selectedClass?.id === classId) {
          setSelectedClass(null);
        }
        showSnackbar('Class deleted successfully', 'success');
      } else {
        showSnackbar(result.error || 'Failed to delete class', 'error');
      }
    }
  };

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

  if (!teacherData) {
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
          <School size={64} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <Typography variant="h5" gutterBottom>Teacher Account Not Found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We couldn't find your teacher account. Please sign in again.
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
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        p: { xs: 2, md: 3 }
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
                    <School size={28} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Teacher Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Welcome, {teacherData.name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => setShowCreateClass(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
                    }}
                  >
                    Create Class
                  </Button>

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
          {/* Sidebar - Class List */}
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
                      My Classes
                    </Typography>
                    <Chip
                      label={classes.length}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  {classes.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <BookOpen size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        No classes created yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click "Create Class" to get started
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {classes.map((cls, index) => {
                        const isSelected = selectedClass?.id === cls.id;

                        return (
                          <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <ListItem disablePadding sx={{ mb: 1 }}>
                              <ListItemButton
                                selected={isSelected}
                                onClick={() => setSelectedClass(cls)}
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
                                    <BookOpen size={20} />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" fontWeight={600}>
                                      {cls.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="caption" sx={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                                        {cls.subject} • Grade {cls.gradeLevel}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                                        {cls.totalStudents || 0} students
                                      </Typography>
                                    </Box>
                                  }
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
                  {!selectedClass ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <BarChart3 size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                      <Typography variant="h5" gutterBottom>Select a Class</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Choose a class from the sidebar to manage students and award points
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Class Header */}
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="h5" fontWeight={700} gutterBottom>
                            {selectedClass.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {selectedClass.subject} • Grade {selectedClass.gradeLevel} • {selectedClass.totalStudents || 0} Students
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Add Student">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<UserPlus size={16} />}
                              onClick={() => setShowAddStudent(true)}
                              sx={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
                              }}
                            >
                              Add Student
                            </Button>
                          </Tooltip>

                          <Tooltip title="Delete Class">
                            <IconButton
                              onClick={() => handleDeleteClass(selectedClass.id, selectedClass.name)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'error.main',
                                color: 'error.main',
                                '&:hover': { background: 'rgba(239, 68, 68, 0.08)' }
                              }}
                              size="small"
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
                        <Tab icon={<Users size={18} />} label="Students" iconPosition="start" />
                        <Tab icon={<Trophy size={18} />} label="Leaderboard" iconPosition="start" />
                        <Tab icon={<BarChart3 size={18} />} label="Analytics" iconPosition="start" />
                      </Tabs>

                      {/* Tab Content */}
                      <AnimatePresence mode="wait">
                        {activeTab === 0 && (
                          <StudentsTab
                            selectedClass={selectedClass}
                            onAwardPoints={(student) => {
                              setSelectedStudent(student);
                              setShowAwardPoints(true);
                            }}
                            onRemoveStudent={handleRemoveStudent}
                            colors={colors}
                          />
                        )}
                        {activeTab === 1 && (
                          <LeaderboardTab
                            selectedClass={selectedClass}
                            colors={colors}
                          />
                        )}
                        {activeTab === 2 && (
                          <AnalyticsTab
                            selectedClass={selectedClass}
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
        <CreateClassModal
          open={showCreateClass}
          onClose={() => setShowCreateClass(false)}
          onCreate={handleCreateClass}
        />

        <AddStudentModal
          open={showAddStudent}
          onClose={() => setShowAddStudent(false)}
          onAdd={handleAddStudent}
          className={selectedClass?.name}
        />

        <AwardPointsModal
          open={showAwardPoints}
          onClose={() => {
            setShowAwardPoints(false);
            setSelectedStudent(null);
          }}
          onAward={handleAwardPoints}
          student={selectedStudent}
          defaultPoints={teacherData?.settings?.defaultPointValues}
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

// Students Tab Component
const StudentsTab = ({ selectedClass, onAwardPoints, onRemoveStudent, colors }) => {
  const students = selectedClass.students || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {students.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Users size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              No Students Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add students to this class to start tracking their progress
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {students.map((student, index) => (
            <Grid item xs={12} sm={6} md={4} key={student.email}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  sx={{
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          mr: 2
                        }}
                      >
                        {student.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {student.name}
                        </Typography>
                        <Chip
                          label={`${student.totalPoints || 0} pts`}
                          size="small"
                          sx={{
                            background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveStudent(student.email, student.name)}
                        sx={{ color: 'error.main' }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => onAwardPoints(student)}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
                        }}
                      >
                        Points
                      </Button>
                    </Box>

                    {student.achievements && student.achievements.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Recent Achievements:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {student.achievements.slice(-3).map((ach, i) => (
                            <Tooltip key={i} title={ach.name}>
                              <span style={{ fontSize: '1.2rem' }}>{ach.icon}</span>
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
    </motion.div>
  );
};

// Leaderboard Tab Component
const LeaderboardTab = ({ selectedClass, colors }) => {
  const leaderboardResult = getClassLeaderboard(selectedClass.id);
  const leaderboard = leaderboardResult.success ? leaderboardResult.leaderboard : [];

  const getMedalColor = (rank) => {
    if (rank === 0) return '#FFD700'; // Gold
    if (rank === 1) return '#C0C0C0'; // Silver
    if (rank === 2) return '#CD7F32'; // Bronze
    return '#9ca3af';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        <Trophy size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Class Leaderboard
      </Typography>

      {leaderboard.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Trophy size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
            <Typography variant="body2" color="text.secondary">
              No leaderboard data yet. Award points to students to see rankings!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                <TableCell width={60}>Rank</TableCell>
                <TableCell>Student</TableCell>
                <TableCell align="center">Points</TableCell>
                <TableCell align="center">Achievements</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((student, index) => (
                <TableRow
                  key={student.email}
                  sx={{
                    background: index < 3 ? `linear-gradient(90deg, ${getMedalColor(index)}15, transparent)` : 'transparent',
                    '&:hover': { background: 'rgba(99, 102, 241, 0.05)' }
                  }}
                >
                  <TableCell>
                    <Chip
                      label={index + 1}
                      size="small"
                      sx={{
                        background: getMedalColor(index),
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 32
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`
                        }}
                      >
                        {student.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {student.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={student.totalPoints}
                      size="small"
                      sx={{
                        background: `linear-gradient(135deg, ${colors.success[0]}, ${colors.success[1]})`,
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={student.achievements}
                      size="small"
                      icon={<Award size={14} />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </motion.div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ selectedClass, colors }) => {
  const stats = getClassStatistics(selectedClass.id);

  if (!stats) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <BarChart3 size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
          <Typography variant="body2" color="text.secondary">
            No analytics data available yet
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        <BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Class Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`, color: 'white' }}>
            <CardContent>
              <Users size={24} style={{ marginBottom: 8 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.totalStudents}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${colors.success[0]}, ${colors.success[1]})`, color: 'white' }}>
            <CardContent>
              <ThumbsUp size={24} style={{ marginBottom: 8 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.totalPointsAwarded}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Points Awarded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${colors.warning[0]}, ${colors.warning[1]})`, color: 'white' }}>
            <CardContent>
              <ThumbsDown size={24} style={{ marginBottom: 8 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.totalPointsDeducted}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Points Deducted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: `linear-gradient(135deg, ${colors.info[0]}, ${colors.info[1]})`, color: 'white' }}>
            <CardContent>
              <Target size={24} style={{ marginBottom: 8 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.averagePoints}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Average Points
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Student */}
        {stats.topStudent && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  <Star size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Top Student
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)'
                    }}
                  >
                    <Trophy size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {stats.topStudent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.topStudent.totalPoints} points
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
};

// Create Class Modal
const CreateClassModal = ({ open, onClose, onCreate }) => {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (className.trim() && subject.trim() && gradeLevel.trim()) {
      onCreate(className.trim(), subject.trim(), gradeLevel.trim());
      setClassName('');
      setSubject('');
      setGradeLevel('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Plus size={24} />
          Create New Class
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Class Name"
            fullWidth
            variant="outlined"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Subject"
            fullWidth
            variant="outlined"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Grade Level"
            fullWidth
            variant="outlined"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            required
            placeholder="e.g., 5, 10-12, K-2"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
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
            Create Class
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Add Student Modal
const AddStudentModal = ({ open, onClose, onAdd, className }) => {
  const [studentEmail, setStudentEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (studentEmail.trim()) {
      onAdd(studentEmail.trim());
      setStudentEmail('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UserPlus size={24} />
          Add Student to {className}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="caption">
              Enter the email address of a registered student. They must have already created a student account.
            </Typography>
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Student Email"
            type="email"
            fullWidth
            variant="outlined"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
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
            Add Student
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Award Points Modal (ClassDojo-like)
const AwardPointsModal = ({ open, onClose, onAward, student, defaultPoints }) => {
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('custom');

  const pointPresets = [
    { label: 'Excellent Work', value: defaultPoints?.excellent || 5, color: '#10b981', icon: <Star size={20} />, category: 'excellent' },
    { label: 'Good Job', value: defaultPoints?.good || 3, color: '#3b82f6', icon: <ThumbsUp size={20} />, category: 'good' },
    { label: 'Participation', value: defaultPoints?.participation || 2, color: '#8b5cf6', icon: <Users size={20} />, category: 'participation' },
    { label: 'Homework Done', value: defaultPoints?.homework || 4, color: '#06b6d4', icon: <BookOpen size={20} />, category: 'homework' },
    { label: 'Helping Others', value: defaultPoints?.helpingOthers || 3, color: '#f59e0b', icon: <Gift size={20} />, category: 'helpingOthers' },
    { label: 'Late Work', value: defaultPoints?.lateWork || -2, color: '#f97316', icon: <Clock size={20} />, category: 'lateWork' },
    { label: 'Disruptive', value: defaultPoints?.disruptive || -3, color: '#ef4444', icon: <ThumbsDown size={20} />, category: 'disruptive' },
    { label: 'Incomplete', value: defaultPoints?.incomplete || -1, color: '#dc2626', icon: <Target size={20} />, category: 'incomplete' }
  ];

  const handlePresetClick = (preset) => {
    setPoints(preset.value);
    setReason(preset.label);
    setCategory(preset.category);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (student && points !== 0) {
      onAward(student.email, points, reason || (points > 0 ? 'Points awarded' : 'Points deducted'), category);
      setPoints(5);
      setReason('');
      setCategory('custom');
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Zap size={24} />
          Award Points to {student.name}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
            Quick Select:
          </Typography>
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {pointPresets.map((preset) => (
              <Grid item xs={6} sm={3} key={preset.label}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handlePresetClick(preset)}
                  sx={{
                    flexDirection: 'column',
                    py: 2,
                    borderColor: preset.color,
                    color: preset.color,
                    '&:hover': {
                      borderColor: preset.color,
                      background: `${preset.color}15`
                    }
                  }}
                >
                  {preset.icon}
                  <Typography variant="caption" sx={{ mt: 0.5 }}>
                    {preset.label}
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {preset.value > 0 ? '+' : ''}{preset.value}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <TextField
            margin="dense"
            label="Points"
            type="number"
            fullWidth
            variant="outlined"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Reason (optional)"
            fullWidth
            variant="outlined"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={points === 0}
            sx={{
              background: points > 0
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              '&:hover': {
                background: points > 0
                  ? 'linear-gradient(135deg, #059669, #047857)'
                  : 'linear-gradient(135deg, #dc2626, #b91c1c)'
              }
            }}
          >
            {points > 0 ? 'Award' : 'Deduct'} Points
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeacherDashboard;
