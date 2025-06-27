import { AppRoutes } from "../types/router";

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.STRATEGIES]: "/",
  [AppRoutes.TESTER]: "/tester",
  [AppRoutes.STRATEGY_FILES]: "/strategy-files",
  [AppRoutes.LOGS]: "/logs/", // +:artifactsId
  [AppRoutes.REPORT]: "/report/", // +:artifactsId
  [AppRoutes.PLAYBACK]: "/playback/", // +:artifactsId
  [AppRoutes.CONFIG]: "/config",

  [AppRoutes.LOGIN]: "/login",
  [AppRoutes.FORBIDDEN]: "/forbidden",

  // last
  [AppRoutes.NOT_FOUND]: "*",
};
