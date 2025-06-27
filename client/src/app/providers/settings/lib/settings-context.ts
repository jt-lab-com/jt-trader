import { createContext } from "react";

export interface SettingsValueProps {
  // themeStretch: boolean;
  themeMode: "light" | "dark";
  themeDirection: "rtl" | "ltr";
  themeContrast: "default" | "bold";
  themeLayout: "vertical" | "horizontal" | "mini";
  themeColorPresets: "default" | "cyan" | "purple" | "blue" | "orange" | "red";
}

export interface SettingsContextProps extends SettingsValueProps {
  // Update
  onUpdate: (name: string, value: string | boolean) => void;
  // Direction by lang
  // onChangeDirectionByLang: (lang: string) => void;
  // Reset
  canReset: boolean;
  onReset: VoidFunction;
  // Drawer
  open: boolean;
  onToggle: VoidFunction;
  onClose: VoidFunction;
}
export const SettingsContext = createContext({} as SettingsContextProps);
