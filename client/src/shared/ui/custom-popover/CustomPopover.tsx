import { menuItemClasses } from "@mui/material/MenuItem";
import MUIPopover, { PopoverOrigin, PopoverProps as MUIPopoverProps } from "@mui/material/Popover";
import { FC } from "react";
import { Arrow } from "./Arrow";
import { getArrowPosition } from "./utils";

export type MenuPopoverArrowValue =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "left-top"
  | "left-center"
  | "left-bottom"
  | "right-top"
  | "right-center"
  | "right-bottom";

interface CustomPopoverProps extends Omit<MUIPopoverProps, "open"> {
  open: HTMLElement | null;
  arrow?: MenuPopoverArrowValue;
  hiddenArrow?: boolean;
}

export const CustomPopover: FC<CustomPopoverProps> = (props) => {
  const { open, arrow = "top-right", hiddenArrow, sx, children, ...rest } = props;
  const { style, anchorOrigin, transformOrigin } = getArrowPosition(arrow);

  return (
    <MUIPopover
      open={Boolean(open)}
      anchorEl={open}
      anchorOrigin={anchorOrigin as PopoverOrigin}
      transformOrigin={transformOrigin as PopoverOrigin}
      slotProps={{
        paper: {
          sx: {
            width: "auto",
            overflow: "inherit",
            ...style,
            [`& .${menuItemClasses.root}`]: {
              "& svg": {
                mr: 2,
                flexShrink: 0,
              },
            },
            ...sx,
          },
        },
      }}
      {...rest}
    >
      {!hiddenArrow && <Arrow arrow={arrow} />}

      {children}
    </MUIPopover>
  );
};
