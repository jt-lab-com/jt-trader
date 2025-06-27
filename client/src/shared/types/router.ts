import { ReactNode } from "react";
import { RouteProps } from "react-router-dom";

export const enum AppRoutes {
  STRATEGIES = "strategies",
  TESTER = "tester",
  LOGS = "logs",
  REPORT = "report",
  CONFIG = "config",
  PLAYBACK = "playback",
  STRATEGY_FILES = "strategy_files",

  LOGIN = "login",

  FORBIDDEN = "forbidden",

  // last
  NOT_FOUND = "not_found",
}

export type AppRouteProps = RouteProps & { public?: boolean; layout: ReactNode };
