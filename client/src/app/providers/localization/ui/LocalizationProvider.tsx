"use client";
import { LocalizationProvider as MUILocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FC, ReactNode } from "react";

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: FC<LocalizationProviderProps> = (props) => {
  const { children } = props;

  return <MUILocalizationProvider dateAdapter={AdapterDayjs}>{children}</MUILocalizationProvider>;
};
