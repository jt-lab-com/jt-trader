import isEqual from "lodash/isEqual";
import { useMemo, ReactNode } from "react";
import { useLocalStorage } from "@/shared/lib/hooks/useLocalStorage";
import { SettingsContext, SettingsValueProps } from "../lib/settings-context";

const STORAGE_KEY = "settings";

type SettingsProviderProps = {
  children: ReactNode;
  defaultSettings: SettingsValueProps;
};

export function SettingsProvider({ children, defaultSettings }: SettingsProviderProps) {
  const { state, update, reset } = useLocalStorage(STORAGE_KEY, defaultSettings);

  const canReset = !isEqual(state, defaultSettings);

  const memoizedValue = useMemo(
    () => ({
      ...state,
      onUpdate: update,
      canReset,
      onReset: reset,
    }),
    [reset, update, state, canReset]
  );

  return <SettingsContext.Provider value={memoizedValue}>{children}</SettingsContext.Provider>;
}
