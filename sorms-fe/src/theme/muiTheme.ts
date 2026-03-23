import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e" },
    secondary: { main: "#1d4ed8" },
    warning: { main: "#f59e0b" },
    success: { main: "#059669" },
    error: { main: "#dc2626" },
    background: {
      default: "#f4f7f6",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: ["Space Grotesk", "Sora", "system-ui", "sans-serif"].join(",")
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(148, 163, 184, 0.3)"
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
