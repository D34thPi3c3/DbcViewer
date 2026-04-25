import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00695c',
      light: '#4db6ac',
      dark: '#004d40',
    },
    secondary: {
      main: '#ff7043',
    },
    background: {
      default: '#f4efe6',
      paper: '#fffaf4',
    },
    text: {
      primary: '#1c2526',
      secondary: '#556366',
    },
  },
  typography: {
    fontFamily: '"Manrope Variable", "Segoe UI", sans-serif',
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 16,
        },
      },
    },
  },
})
