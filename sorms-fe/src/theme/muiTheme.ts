import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#2563EB" },
    secondary: { main: "#06B6D4" },
    warning: { main: "#F59E0B" },
    success: { main: "#10B981" },
    error: { main: "#EF4444" },
    background: {
      default: "#0F172A",
      paper: "rgba(15, 23, 42, 0.72)"
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: ["Inter", "Poppins", "system-ui", "sans-serif"].join(",")
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.10)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600
        }
      }
    }
  }
});
