import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AppProviders } from "./app/providers";
import { ThemeSync } from "./app/ThemeSync";
import "./app/globals.css";

if (!localStorage.getItem("theme_mode")) {
  localStorage.setItem("theme_mode", "dark");
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <ThemeSync />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </React.StrictMode>
);