// src/components/ClassManagement.js - Student-only "My Classes" / join-by-code view

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Divider
} from '@mui/material';
import { ArrowLeft, BookOpen, KeyRound, School, Users } from 'lucide-react';
import { joinClassByCode, getStudentClasses } from '../utils/teacherUtils';

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

const ClassManagement = ({ userEmail, userRole, language = 'en', onClose }) => {
  const [codeInput, setCodeInput] = useState('');
  const [classes, setClasses] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isJoining, setIsJoining] = useState(false);

  const t = language === 'ar'
    ? {
        title: 'صفوفي',
        subtitle: 'انضم إلى صف باستخدام الرمز الذي شاركه معك معلمك',
        codeLabel: 'رمز الصف',
        codePlaceholder: 'ABC123',
        join: 'انضم',
        myClasses: 'الصفوف المسجلة',
        empty: 'لم تنضم إلى أي صف بعد',
        emptyHint: 'اطلب من معلمك رمز الصف',
        students: 'طلاب',
        teacherOnly: 'يدير المعلمون الصفوف من لوحة تحكم المعلم',
        back: 'رجوع'
      }
    : {
        title: 'My Classes',
        subtitle: 'Enter the code your teacher shared with you to join a class',
        codeLabel: 'Class code',
        codePlaceholder: 'ABC123',
        join: 'Join',
        myClasses: 'Joined classes',
        empty: 'You haven\'t joined any classes yet',
        emptyHint: 'Ask your teacher for the class code',
        students: 'students',
        teacherOnly: 'Teachers manage classes from the Teacher Dashboard',
        back: 'Back'
      };

  const reload = useCallback(() => {
    if (!userEmail) return;
    setClasses(getStudentClasses(userEmail));
  }, [userEmail]);

  useEffect(() => {
    reload();
  }, [reload]);

  const showSnackbar = (message, severity = 'info') =>
    setSnackbar({ open: true, message, severity });

  const handleJoin = () => {
    const code = codeInput.trim();
    if (!code) return;
    setIsJoining(true);
    const result = joinClassByCode(userEmail, code);
    setIsJoining(false);
    if (result.success) {
      setCodeInput('');
      reload();
      showSnackbar(`Joined "${result.className}"`, 'success');
    } else {
      showSnackbar(result.error || 'Could not join class', 'error');
    }
  };

  const isTeacher = userRole === 'teacher';

  return (
    <Box sx={{ minHeight: '100vh', background: BG, p: { xs: 2, md: 3 } }}>
      <Container maxWidth="md" disableGutters>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {onClose && (
            <IconButton onClick={onClose} sx={{ color: TEXT_MUTED }} aria-label={t.back}>
              <ArrowLeft size={20} />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" sx={{ color: TEXT, fontWeight: 600, lineHeight: 1.2 }}>
              {t.title}
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
              {t.subtitle}
            </Typography>
          </Box>
        </Box>

        {isTeacher ? (
          // Teachers shouldn't be here — guide them to the Teacher Dashboard
          <Card sx={cardSx}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <School size={40} color={ACCENT} style={{ marginBottom: 12 }} />
              <Typography variant="body1" sx={{ color: TEXT, fontWeight: 500, mb: 1 }}>
                {t.teacherOnly}
              </Typography>
              {onClose && (
                <Button onClick={onClose} variant="text" sx={{ color: ACCENT, textTransform: 'none' }}>
                  {t.back}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Join by code */}
            <Card sx={{ ...cardSx, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: TEXT }}>
                  <KeyRound size={18} color={ACCENT} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t.codeLabel}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                    placeholder={t.codePlaceholder}
                    inputProps={{ maxLength: 8, style: { letterSpacing: '0.25em', fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase' } }}
                    sx={{ flex: 1, minWidth: 220 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleJoin}
                    disabled={!codeInput.trim() || isJoining}
                    sx={{ background: ACCENT, '&:hover': { background: '#4338ca' }, textTransform: 'none', boxShadow: 'none', px: 3 }}
                  >
                    {t.join}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Joined classes */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: TEXT, fontWeight: 600 }}>
                {t.myClasses}
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {classes.length}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {classes.length === 0 ? (
              <Card sx={cardSx}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <BookOpen size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
                  <Typography variant="body1" sx={{ color: TEXT, fontWeight: 500 }}>
                    {t.empty}
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                    {t.emptyHint}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {classes.map(cls => {
                  const me = (cls.students || []).find(s =>
                    typeof s === 'string'
                      ? s.toLowerCase() === userEmail.toLowerCase()
                      : (s.email || '').toLowerCase() === userEmail.toLowerCase()
                  );
                  const myPoints = me && typeof me === 'object' ? (me.totalPoints || 0) : 0;
                  return (
                    <Grid item xs={12} sm={6} key={cls.id}>
                      <Card sx={cardSx}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ color: TEXT, fontWeight: 600 }}>
                            {cls.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, display: 'block', mb: 1.5 }}>
                            {cls.subject || ''}{cls.gradeLevel ? ` • Grade ${cls.gradeLevel}` : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: TEXT_MUTED, mb: 1.5 }}>
                            <Users size={14} />
                            <Typography variant="caption">
                              {(cls.students || []).length} {t.students}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${myPoints} pts`}
                            size="small"
                            sx={{ background: ACCENT_SOFT, color: ACCENT, fontWeight: 600, borderRadius: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        )}

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

export default ClassManagement;
