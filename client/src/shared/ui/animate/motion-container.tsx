import Box, { BoxProps } from "@mui/material/Box";
import { m, MotionProps } from "framer-motion";
import { FC } from "react";
import { varContainer } from "./variants";

type IProps = BoxProps & MotionProps;

interface MotionContainerProps extends IProps {
  animate?: boolean;
  action?: boolean;
}

export const MotionContainer: FC<MotionContainerProps> = (props) => {
  const { animate, action = false, children, ...other } = props;

  if (action) {
    return (
      <Box
        component={m.div}
        initial={false}
        animate={animate ? "animate" : "exit"}
        variants={varContainer()}
        {...other}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      component={m.div}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={varContainer()}
      {...other}
    >
      {children}
    </Box>
  );
};
