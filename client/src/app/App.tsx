import { useEffect } from "react";
import { auth } from "@/features/auth";
import { initConfig } from "@/entities/config";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { AppRouter } from "./providers/router";

let authRequested = false;

export const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (authRequested) return;
    authRequested = true;
    dispatch(auth());
    dispatch(initConfig());
  }, []);

  return <AppRouter />;
};
