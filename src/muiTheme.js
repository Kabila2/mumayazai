// Shared MUI theme for the Teacher & Parent dashboards.
// Aligns Material-UI's defaults (which otherwise leak blue focus rings, blue
// tab indicators and default button sizing) with the app's unified indigo
// "Calm Modern" design system, for a consistent, professional look.

import { createTheme } from '@mui/material/styles';

const INDIGO = '#4f46e5';
const INDIGO_DARK = '#4338ca';
const INDIGO_LIGHT = '#6366f1';
const BORDER = '#e5e7eb';

const stellarMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: INDIGO, dark: INDIGO_DARK, light: INDIGO_LIGHT, contrastText: '#ffffff' },
    secondary: { main: '#8b5cf6', contrastText: '#ffffff' },
    error: { main: '#dc2626' },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    info: { main: '#2563eb' },
    background: { default: '#f9fafb', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#6b7280' },
    divider: BORDER,
  },

  shape: { borderRadius: 10 },

  typography: {
    fontFamily: "'OpenDyslexic', 'Cairo', sans-serif",
    button: { textTransform: 'none', fontWeight: 600 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },

  components: {
    // Consistent, flat, evenly-sized buttons
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          minHeight: 40,
          paddingInline: 18,
          boxShadow: 'none',
        },
        sizeSmall: { minHeight: 34, paddingInline: 12 },
        sizeLarge: { minHeight: 48 },
        containedPrimary: { '&:hover': { backgroundColor: INDIGO_DARK } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 14 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 46, fontSize: '0.9rem' },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 3, borderRadius: 3 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: 'none' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: '0.78rem', backgroundColor: '#111827' },
      },
    },
  },
});

export default stellarMuiTheme;
