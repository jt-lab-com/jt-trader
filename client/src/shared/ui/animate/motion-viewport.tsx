import Box, { BoxProps } from "@mui/material/Box";
import { m, MotionProps } from "framer-motion";
import { FC, ReactNode } from "react";
import { useResponsive } from "../../lib/hooks/useResponsive";
import { varContainer } from "./variants";

type IProps = BoxProps & MotionProps;

interface MotionViewportProps extends IProps {
  children: ReactNode;
  disableAnimatedMobile?: boolean;
}

export const MotionViewport: FC<MotionViewportProps> = (props) => {
  const { children, disableAnimatedMobile = true, ...other } = props;

  const smDown = useResponsive("down", "sm");

  if (smDown && disableAnimatedMobile) {
    return <Box {...other}>{children}</Box>;
  }

  return (
    <Box
      component={m.div}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
      variants={varContainer()}
      {...other}
    >
      {children}
    </Box>
  );
};
