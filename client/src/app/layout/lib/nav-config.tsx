import { EngineMode } from "@/entities/config";
import { RoutePath } from "@/shared/const/router";
import { Iconify } from "@/shared/ui/iconify";

const iconSize = 16;

const menuItems = [
  {
    title: "Runtime",
    icon: <Iconify sx={{ mr: 1 }} width={iconSize} icon={"solar:skip-next-outline"} />,
    path: RoutePath.strategies,
    developerModeOnly: false,
  },
  {
    title: "Tester",
    icon: <Iconify sx={{ mr: 1 }} width={iconSize} icon={"solar:alt-arrow-right-linear"} />,
    path: RoutePath.tester,
    developerModeOnly: false,
  },
  {
    title: "Strategy Files",
    icon: <Iconify sx={{ mr: 1 }} width={iconSize} icon={"solar:code-2-linear"} />,
    path: RoutePath.strategy_files,
    developerModeOnly: false,
  },
  {
    title: "Config",
    icon: <Iconify sx={{ mr: 1 }} width={iconSize} icon={"solar:settings-linear"} />,
    path: RoutePath.config,
    developerModeOnly: false,
  },
];

export const getMenuItems = (mode: EngineMode | null, developerMode: boolean = false) => {
  if (!mode) return null;

  const filteredItems = developerMode ? menuItems : menuItems.filter((item) => !item.developerModeOnly);

  if (mode === "both") return filteredItems;

  if (mode === "realtime") {
    return filteredItems.filter(
      (item) => item.path !== RoutePath.tester && item.path !== RoutePath.strategy_files
    );
  }

  return filteredItems.filter((item) => item.path === RoutePath.tester);
};
