// src/components/TeacherDashboard.js - Clean, light teacher dashboard

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Tooltip,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment
} from '@mui/material';
import {
  Users,
  UserPlus,
  ArrowLeft,
  BookOpen,
  Award,
  Plus,
  Trash2,
  School,
  BarChart3,
  Star,
  Trophy,
  Target,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Gift,
  Zap,
  Copy,
  Check,
  Search
} from 'lucide-react';
import {
  getTeacherData,
  createClass,
  getTeacherClasses,
  enrollStudent,
  removeStudentFromClass,
  awardPoints,
  getClassLeaderboard,
  getClassStatistics,
  deleteClass
} from '../utils/teacherUtils';

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

const TeacherDashboard = ({
  onClose,
  onSignOut,
  language = 'en'
}) => {
  const [teacherData, setTeacherData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const selectedClassIdRef = useRef(null);

  // Keep ref in sync so the interval reads the latest selected id without re-running
  useEffect(() => {
    selectedClassIdRef.current = selectedClassId;
  }, [selectedClassId]);

  const reload = useCallback(() => {
    const data = getTeacherData();
    setTeacherData(data);
    if (!data) return;
    const list = getTeacherClasses(data.email);
    setClasses(list);
    // Auto-select first class if none selected
    if (!selectedClassIdRef.current && list.length > 0) {
      setSelectedClassId(list[0].id);
    }
  }, []);

  // Initial load + light auto-refresh (30s). Does NOT depend on selected class
  // so the interval is created once and selecting a class doesn't kill it.
  useEffect(() => {
    reload();
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  const selectedClass = selectedClassId
    ? classes.find(c => c.id === selectedClassId) || null
    : null;

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateClass = (className, subject, gradeLevel) => {
    if (!teacherData) return;
    const result = createClass(teacherData.email, className, subject, gradeLevel);
    if (result.success) {
      setShowCreateClass(false);
      setSelectedClassId(result.classId);
      reload();
      showSnackbar('Class created', 'success');
    } else {
      showSnackbar(result.error || 'Failed to create class', 'error');
    }
  };

  const handleAddStudent = (studentEmail) => {
    if (!selectedClass) return;
    const result = enrollStudent(selectedClass.id, studentEmail);
    if (result.success) {
      setShowAddStudent(false);
      reload();
      showSnackbar('Student enrolled', 'success');
    } else {
      showSnackbar(result.error || 'Failed to enroll student', 'error');
    }
  };

  const handleAwardPoints = (studentEmail, points, reason, category) => {
    if (!selectedClass) return;
    const result = awardPoints(selectedClass.id, studentEmail, points, reason, category);
    if (result.success) {
      setShowAwardPoints(false);
      setSelectedStudent(null);
      reload();
      showSnackbar(`${points > 0 ? '+' : ''}${points} points`, points > 0 ? 'success' : 'warning');
    } else {
      showSnackbar(result.error || 'Failed to award points', 'error');
    }
  };

  const handleRemoveStudent = (studentEmail, studentName) => {
    if (!selectedClass) return;
    if (!window.confirm(`Remove ${studentName} from this class?`)) return;
    const result = removeStudentFromClass(selectedClass.id, studentEmail);
    if (result.success) {
      reload();
      showSnackbar('Student removed', 'success');
    } else {
      showSnackbar('Failed to remove student', 'error');
    }
  };

  const handleDeleteClass = (classId, className) => {
    if (!teacherData) return;
    if (!window.confirm(`Delete class "${className}"? This cannot be undone.`)) return;
    const result = deleteClass(classId, teacherData.email);
    if (result.success) {
      if (selectedClassId === classId) {
        setSelectedClassId(null);
      }
      reload();
      showSnackbar('Class deleted', 'success');
    } else {
      showSnackbar(result.error || 'Failed to delete class', 'error');
    }
  };

  const handleCopyCode = () => {
    if (!selectedClass?.classCode) return;
    navigator.clipboard?.writeText(selectedClass.classCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  if (!teacherData) {
    return (
      <Box sx={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ ...cardSx, maxWidth: 420, p: 4, textAlign: 'center' }}>
          <School size={40} color={ACCENT} style={{ margin: '0 auto 12px' }} />
          <Typography variant="h6" gutterBottom sx={{ color: TEXT }}>Teacher account not found</Typography>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 3 }}>
            We couldn't load your teacher data. Please sign in again.
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
                Teacher Dashboard
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {teacherData.name}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={() => setShowCreateClass(true)}
              sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none' }}
            >
              New Class
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
                    Classes
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                    {classes.length}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                {classes.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <BookOpen size={36} color="#d1d5db" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                      No classes yet
                    </Typography>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                      Click "New Class" to start
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ p: 0 }}>
                    {classes.map(cls => {
                      const isSelected = selectedClassId === cls.id;
                      return (
                        <ListItem key={cls.id} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            selected={isSelected}
                            onClick={() => setSelectedClassId(cls.id)}
                            sx={{
                              borderRadius: 1.5,
                              '&.Mui-selected': {
                                background: ACCENT_SOFT,
                                '&:hover': { background: ACCENT_SOFT }
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ color: TEXT, fontWeight: isSelected ? 600 : 500 }}>
                                  {cls.name}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                                  {(cls.totalStudents || cls.students?.length || 0)} students
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
                {!selectedClass ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <BarChart3 size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
                    <Typography variant="body1" sx={{ color: TEXT, fontWeight: 500 }}>
                      Select a class
                    </Typography>
                    <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                      Choose a class from the sidebar, or create your first one
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Class header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: TEXT, fontWeight: 600 }}>
                          {selectedClass.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                          {selectedClass.subject || '—'} • Grade {selectedClass.gradeLevel || '—'} • {(selectedClass.totalStudents || selectedClass.students?.length || 0)} students
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {selectedClass.classCode && (
                          <Tooltip title={codeCopied ? 'Copied!' : 'Click to copy join code'}>
                            <Chip
                              icon={codeCopied ? <Check size={14} /> : <Copy size={14} />}
                              label={selectedClass.classCode}
                              onClick={handleCopyCode}
                              size="small"
                              sx={{ borderRadius: 1, background: ACCENT_SOFT, color: ACCENT, fontFamily: 'monospace', fontWeight: 600 }}
                            />
                          </Tooltip>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UserPlus size={16} />}
                          onClick={() => setShowAddStudent(true)}
                          sx={{ textTransform: 'none', borderColor: BORDER, color: TEXT }}
                        >
                          Add student
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClass(selectedClass.id, selectedClass.name)}
                          sx={{ color: '#ef4444' }}
                          aria-label="Delete class"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Tabs
                      value={activeTab}
                      onChange={(e, v) => setActiveTab(v)}
                      sx={{
                        mb: 2,
                        borderBottom: `1px solid ${BORDER}`,
                        minHeight: 36,
                        '& .MuiTab-root': { minHeight: 36, textTransform: 'none', color: TEXT_MUTED },
                        '& .Mui-selected': { color: `${ACCENT} !important` },
                        '& .MuiTabs-indicator': { background: ACCENT }
                      }}
                    >
                      <Tab label="Students" />
                      <Tab label="Leaderboard" />
                      <Tab label="Analytics" />
                    </Tabs>

                    {activeTab === 0 && (
                      <StudentsTab
                        selectedClass={selectedClass}
                        onAwardPoints={s => { setSelectedStudent(s); setShowAwardPoints(true); }}
                        onRemoveStudent={handleRemoveStudent}
                      />
                    )}
                    {activeTab === 1 && (
                      <LeaderboardTab selectedClass={selectedClass} />
                    )}
                    {activeTab === 2 && (
                      <AnalyticsTab selectedClass={selectedClass} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
          onClose={() => { setShowAwardPoints(false); setSelectedStudent(null); }}
          onAward={handleAwardPoints}
          student={selectedStudent}
          defaultPoints={teacherData?.settings?.defaultPointValues}
        />

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

// Students
const StudentsTab = ({ selectedClass, onAwardPoints, onRemoveStudent }) => {
  const [search, setSearch] = useState('');
  const students = (selectedClass.students || []).filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  if ((selectedClass.students || []).length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, border: `1px dashed ${BORDER}`, borderRadius: 2 }}>
        <Users size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
        <Typography variant="body1" sx={{ color: TEXT, fontWeight: 500 }}>No students yet</Typography>
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
          Add students by email, or share the class code with them
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search students..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} color={TEXT_MUTED} />
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />
      <Grid container spacing={1.5}>
        {students.map(student => (
          <Grid item xs={12} sm={6} md={4} key={student.email}>
            <Card sx={{ ...cardSx, '&:hover': { borderColor: ACCENT } }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, background: ACCENT_SOFT, color: ACCENT, fontSize: 14, fontWeight: 600 }}>
                    {(student.name || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.email}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => onRemoveStudent(student.email, student.name)} sx={{ color: TEXT_MUTED, '&:hover': { color: '#ef4444' } }}>
                    <Trash2 size={14} />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip label={`${student.totalPoints || 0} pts`} size="small" sx={{ background: ACCENT_SOFT, color: ACCENT, fontWeight: 600, borderRadius: 1 }} />
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Zap size={14} />}
                    onClick={() => onAwardPoints(student)}
                    sx={{ textTransform: 'none', color: ACCENT }}
                  >
                    Award
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Leaderboard
const LeaderboardTab = ({ selectedClass }) => {
  const result = getClassLeaderboard(selectedClass.id);
  const leaderboard = result.success ? result.leaderboard : [];

  if (leaderboard.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, border: `1px dashed ${BORDER}`, borderRadius: 2 }}>
        <Trophy size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
          No leaderboard data yet. Award points to see rankings.
        </Typography>
      </Box>
    );
  }

  const medal = (rank) => {
    if (rank === 0) return '#fbbf24';
    if (rank === 1) return '#9ca3af';
    if (rank === 2) return '#d97706';
    return TEXT_MUTED;
  };

  return (
    <TableContainer component={Paper} sx={{ ...cardSx, boxShadow: 'none' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: TEXT_MUTED, fontWeight: 600, width: 60 }}>#</TableCell>
            <TableCell sx={{ color: TEXT_MUTED, fontWeight: 600 }}>Student</TableCell>
            <TableCell sx={{ color: TEXT_MUTED, fontWeight: 600 }} align="right">Points</TableCell>
            <TableCell sx={{ color: TEXT_MUTED, fontWeight: 600 }} align="right">Badges</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaderboard.map((student, i) => (
            <TableRow key={student.email} hover>
              <TableCell sx={{ color: medal(i), fontWeight: 700 }}>{i + 1}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, background: ACCENT_SOFT, color: ACCENT, fontSize: 12, fontWeight: 600 }}>
                    {(student.name || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: TEXT }}>{student.name}</Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: TEXT, fontWeight: 600 }}>{student.totalPoints}</TableCell>
              <TableCell align="right" sx={{ color: TEXT_MUTED }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Award size={14} /> {student.achievements}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Analytics
const AnalyticsTab = ({ selectedClass }) => {
  const stats = getClassStatistics(selectedClass.id);
  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, border: `1px dashed ${BORDER}`, borderRadius: 2 }}>
        <BarChart3 size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>No analytics yet</Typography>
      </Box>
    );
  }

  const Stat = ({ icon: Icon, label, value }) => (
    <Card sx={cardSx}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: TEXT_MUTED }}>
          <Icon size={16} />
          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>{label}</Typography>
        </Box>
        <Typography variant="h5" sx={{ color: TEXT, fontWeight: 700 }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <Stat icon={Users} label="Students" value={stats.totalStudents} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Stat icon={ThumbsUp} label="Points awarded" value={stats.totalPointsAwarded} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Stat icon={ThumbsDown} label="Points deducted" value={stats.totalPointsDeducted} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Stat icon={Target} label="Average points" value={stats.averagePoints} />
      </Grid>
      {stats.topStudent && (
        <Grid item xs={12}>
          <Card sx={cardSx}>
            <CardContent>
              <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Star size={14} /> Top student
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ background: ACCENT_SOFT, color: ACCENT, fontWeight: 700 }}>
                  {(stats.topStudent.name || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: TEXT, fontWeight: 600 }}>
                    {stats.topStudent.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                    {stats.topStudent.totalPoints} points
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// Create Class modal
const CreateClassModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const reset = () => { setName(''); setSubject(''); setGradeLevel(''); };
  const handleClose = () => { reset(); onClose(); };
  const submit = (e) => {
    e.preventDefault();
    if (name.trim() && subject.trim() && gradeLevel.trim()) {
      onCreate(name.trim(), subject.trim(), gradeLevel.trim());
      reset();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT, fontWeight: 600 }}>New class</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Class name" fullWidth value={name} onChange={e => setName(e.target.value)} required sx={{ mb: 2 }} />
          <TextField margin="dense" label="Subject" fullWidth value={subject} onChange={e => setSubject(e.target.value)} required sx={{ mb: 2 }} />
          <TextField margin="dense" label="Grade" fullWidth value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required placeholder="e.g. 5, K-2, 10-12" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: TEXT_MUTED }}>Cancel</Button>
          <Button type="submit" variant="contained" sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none' }}>Create</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Add Student modal
const AddStudentModal = ({ open, onClose, onAdd, className }) => {
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (email.trim()) { onAdd(email.trim()); setEmail(''); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT, fontWeight: 600 }}>Add student{className ? ` to ${className}` : ''}</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
            The student must have already created a student account with this email.
          </Alert>
          <TextField autoFocus margin="dense" label="Student email" type="email" fullWidth value={email} onChange={e => setEmail(e.target.value)} required />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', color: TEXT_MUTED }}>Cancel</Button>
          <Button type="submit" variant="contained" sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none' }}>Add</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Award Points modal
const AwardPointsModal = ({ open, onClose, onAward, student, defaultPoints }) => {
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('custom');

  useEffect(() => {
    if (open) { setPoints(5); setReason(''); setCategory('custom'); }
  }, [open]);

  const presets = [
    { label: 'Excellent', value: defaultPoints?.excellent ?? 5, icon: <Star size={16} />, category: 'excellent' },
    { label: 'Good job', value: defaultPoints?.good ?? 3, icon: <ThumbsUp size={16} />, category: 'good' },
    { label: 'Participation', value: defaultPoints?.participation ?? 2, icon: <Users size={16} />, category: 'participation' },
    { label: 'Homework', value: defaultPoints?.homework ?? 4, icon: <BookOpen size={16} />, category: 'homework' },
    { label: 'Helped others', value: defaultPoints?.helpingOthers ?? 3, icon: <Gift size={16} />, category: 'helpingOthers' },
    { label: 'Late work', value: defaultPoints?.lateWork ?? -2, icon: <Clock size={16} />, category: 'lateWork' },
    { label: 'Disruptive', value: defaultPoints?.disruptive ?? -3, icon: <ThumbsDown size={16} />, category: 'disruptive' },
    { label: 'Incomplete', value: defaultPoints?.incomplete ?? -1, icon: <Target size={16} />, category: 'incomplete' }
  ];

  const submit = (e) => {
    e.preventDefault();
    if (student && points !== 0) {
      onAward(student.email, points, reason || (points > 0 ? 'Points awarded' : 'Points deducted'), category);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT, fontWeight: 600 }}>
        Award points to {student.name}
      </DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <Typography variant="caption" sx={{ color: TEXT_MUTED, mb: 1, display: 'block' }}>Quick presets</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {presets.map(p => {
              const positive = p.value > 0;
              return (
                <Grid item xs={6} sm={3} key={p.label}>
                  <Button
                    fullWidth
                    onClick={() => { setPoints(p.value); setReason(p.label); setCategory(p.category); }}
                    sx={{
                      flexDirection: 'column',
                      py: 1.5,
                      textTransform: 'none',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 1.5,
                      color: positive ? ACCENT : '#ef4444',
                      '&:hover': { borderColor: positive ? ACCENT : '#ef4444', background: positive ? ACCENT_SOFT : '#fef2f2' }
                    }}
                  >
                    {p.icon}
                    <Typography variant="caption" sx={{ mt: 0.5 }}>{p.label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{p.value > 0 ? '+' : ''}{p.value}</Typography>
                  </Button>
                </Grid>
              );
            })}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <TextField
            margin="dense"
            label="Points"
            type="number"
            fullWidth
            value={points}
            onChange={e => setPoints(parseInt(e.target.value, 10) || 0)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Reason (optional)"
            fullWidth
            value={reason}
            onChange={e => setReason(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', color: TEXT_MUTED }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={points === 0}
            sx={{
              background: points >= 0 ? ACCENT : '#ef4444',
              '&:hover': { background: points >= 0 ? '#4338ca' : '#dc2626' },
              textTransform: 'none',
              boxShadow: 'none'
            }}
          >
            {points >= 0 ? 'Award' : 'Deduct'} {Math.abs(points)} pts
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeacherDashboard;
