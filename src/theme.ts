import { createTheme } from '@mui/material';

/**
 * Workday Canvas palette. Blue carries action and selection, grey carries
 * everything else, and the single accent is used only to draw attention.
 */
const canvas = {
  blue: '#0875E1',
  blueDark: '#0B5CB0',
  blueTint: '#E7F1FB',
  navy: '#083A5E',
  accent: '#FF9800',
  green: '#008537',
  red: '#DE2E21',
  page: '#F0F1F2',
  surface: '#FFFFFF',
  hairline: '#DFE2E3',
  border: '#CED3D6',
  ink: '#1F2225',
  inkMuted: '#5F6A72',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: canvas.blue,
      dark: canvas.blueDark,
      light: canvas.blueTint,
      contrastText: '#FFFFFF',
    },
    secondary: { main: canvas.accent, contrastText: canvas.ink },
    success: { main: canvas.green },
    error: { main: canvas.red },
    warning: { main: canvas.accent },
    info: { main: canvas.blue },
    background: { default: canvas.page, paper: canvas.surface },
    text: { primary: canvas.ink, secondary: canvas.inkMuted },
    divider: canvas.hairline,
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // ERP screens are read as dense tables, not as prose
    fontSize: 14,
    h4: { fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1.0625rem', fontWeight: 500 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          // The one deliberately loud control in the system
          borderRadius: 999,
          paddingLeft: 20,
          paddingRight: 20,
        },
        outlined: { borderColor: canvas.border },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        colorPrimary: { backgroundColor: canvas.navy, color: '#FFFFFF' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${canvas.hairline}` },
      },
    },
    // Surfaces read as paper on a grey desk: bordered, not floating. Only the
    // default elevation is flattened, so menus and dialogs keep their shadow.
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: 'none', border: `1px solid ${canvas.hairline}` },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${canvas.hairline}` },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: canvas.page,
          fontWeight: 500,
          color: canvas.ink,
          borderBottom: `1px solid ${canvas.border}`,
        },
        root: { borderBottom: `1px solid ${canvas.hairline}` },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: canvas.border },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
  },
});

export default theme;
