import { useContext } from "react";
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { SettingsContext } from "@/app/providers/settings";

export const useLayoutSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) throw new Error("useSettingsContext must be use inside SettingsProvider");

  return context;
};
