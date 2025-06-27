import { ConfigPage } from "@/pages/config";
import { ForbiddenPage } from "@/pages/forbidden";
import { LogsPage } from "@/pages/log";
import { LoginPage } from "@/pages/login";
import { NotFoundPage } from "@/pages/not-found";
import { PlaybackPage } from "@/pages/playback";
import { ReportPage } from "@/pages/report";
import { StrategyPage } from "@/pages/strategy";
import { StrategyFilesPage } from "@/pages/strategy-files";
import { TesterPage } from "@/pages/tester";
import { RoutePath } from "@/shared/const/router";
import { AppRouteProps, AppRoutes } from "@/shared/types/router";
import { Layout, ReportLayout } from "../../../layout";

export const routeConfig: Record<AppRoutes, AppRouteProps> = {
  [AppRoutes.STRATEGIES]: {
    path: RoutePath.strategies,
    layout: <Layout />,
    element: <StrategyPage title={"Runtime"} />,
  },
  [AppRoutes.TESTER]: {
    path: RoutePath.tester,
    layout: <Layout />,
    element: <TesterPage title={"Tester"} />,
  },
  [AppRoutes.STRATEGY_FILES]: {
    path: RoutePath.strategy_files,
    layout: <Layout />,
    element: <StrategyFilesPage title={"Strategy Files"} />,
  },
  [AppRoutes.CONFIG]: {
    path: RoutePath.config,
    layout: <Layout />,
    element: <ConfigPage title={"Config"} />,
  },
  [AppRoutes.LOGS]: {
    path: RoutePath.logs + ":artifactsId",
    layout: <ReportLayout />,
    element: <LogsPage title={"Logs"} />,
  },
  [AppRoutes.REPORT]: {
    path: RoutePath.report + ":artifactsId",
    layout: <ReportLayout />,
    element: <ReportPage title={"Report"} />,
  },
  [AppRoutes.PLAYBACK]: {
    path: RoutePath.playback + ":artifactsId",
    layout: <ReportLayout />,
    element: <PlaybackPage title={"Chart playback"} />,
  },

  [AppRoutes.LOGIN]: {
    path: RoutePath.login,
    layout: <ReportLayout />,
    element: <LoginPage title={"Login"} />,
    public: true,
  },
  [AppRoutes.FORBIDDEN]: {
    path: RoutePath.forbidden,
    element: <ForbiddenPage />,
    layout: <ReportLayout />,
    public: true,
  },

  // last
  [AppRoutes.NOT_FOUND]: {
    path: RoutePath.not_found,
    element: <NotFoundPage />,
    layout: <ReportLayout />,
    public: true,
  },
};
