import { FC, useCallback, Suspense, useState, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@/widgets/page-loader";
import { useConfig } from "@/entities/config";
import { useAuth } from "@/entities/user";
import { RoutePath } from "@/shared/const/router";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { usePathname } from "@/shared/lib/hooks/usePathname";
import { AppRouteProps } from "@/shared/types/router";
import { routeConfig } from "../config/router-config";
import { Auth } from "./Auth";

export const AppRouter: FC = () => {
  const { authData, isLoading } = useAuth();
  const { engineMode } = useConfig();
  const inited = useBoolean();
  const [routes, setRoutes] = useState<AppRouteProps[]>([]);
  const pathname = usePathname();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.ym) {
      window.ym(__YANDEX_METRIKA_ID__, "hit", location.pathname + location.search);
    }
  }, [location]);

  useEffect(() => {
    if (inited.value) return;

    const allRoutes = Object.values(routeConfig);

    if (!authData && !isLoading) {
      setRoutes(allRoutes);
      inited.onTrue();
      return;
    }

    if (!authData) return;

    const { developerAccess } = authData;

    let routes = !developerAccess
      ? allRoutes.filter((route) => route.path !== RoutePath.strategy_files)
      : allRoutes;

    switch (engineMode) {
      case "realtime":
        routes = routes.filter(
          (route) => route.path !== RoutePath.tester && route.path !== RoutePath.strategy_files
        );
        break;
      case "tester":
        routes = routes.filter(
          (route) => route.path !== RoutePath.config && route.path !== RoutePath.strategies
        );
        break;
    }

    setRoutes(routes);
    inited.onTrue();
  }, [authData, engineMode, inited, routes]);

  useEffect(() => {
    if (!authData || !engineMode) return;

    if (engineMode === "tester" && pathname === "/") {
      return navigate(RoutePath.tester, { replace: true });
    }
  }, [authData, engineMode, pathname]);

  const renderWithWrapper = useCallback((route: AppRouteProps) => {
    const element = (
      <Suspense fallback={<PageLoader />}>
        {route.public ? route.element : <Auth>{route.element}</Auth>}
      </Suspense>
    );

    return (
      <Route key={route.path} element={route.layout}>
        <Route path={route.path} element={element} />
      </Route>
    );
  }, []);

  return <Routes>{routes.map(renderWithWrapper)}</Routes>;
};
