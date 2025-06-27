import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { LazyMotion } from "@/app/providers/lazy-motion";
import { LocalizationProvider } from "@/app/providers/localization";
import { NotificationProvider } from "@/app/providers/notification";
import { SettingsProvider } from "@/app/providers/settings";
import { SnackbarProvider } from "@/app/providers/snackbar";
import { StoreProvider } from "@/app/providers/store";
import { ThemeProvider } from "@/app/providers/theme";
import "@/app/styles/global.css";

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <LocalizationProvider>
      <SettingsProvider
        defaultSettings={{
          themeMode: "light",
          themeDirection: "ltr",
          themeContrast: "default",
          themeLayout: "vertical",
          themeColorPresets: "default",
        }}
      >
        <StoreProvider>
          <BrowserRouter>
            <LazyMotion>
              <ThemeProvider>
                <SnackbarProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </SnackbarProvider>
              </ThemeProvider>
            </LazyMotion>
          </BrowserRouter>
        </StoreProvider>
      </SettingsProvider>
    </LocalizationProvider>
  </React.StrictMode>
);
