import { ArrowDownIcon } from "../icons";

export const select = () => {
  return {
    MuiSelect: {
      styleOverrides: {
        icon: {
          right: 10,
          width: 18,
          height: 18,
          top: "calc(50% - 9px)",
        },
      },
      defaultProps: {
        IconComponent: ArrowDownIcon,
      },
    },
    MuiNativeSelect: {
      styleOverrides: {
        icon: {
          right: 10,
          width: 18,
          height: 18,
          top: "calc(50% - 9px)",
        },
      },
      defaultProps: {
        IconComponent: ArrowDownIcon,
      },
    },
  };
};
