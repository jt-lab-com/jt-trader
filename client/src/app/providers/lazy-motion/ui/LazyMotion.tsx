import { LazyMotion as Lazy, domAnimation } from "framer-motion";
import { FC, ReactNode } from "react";

interface LazyMotionProps {
  children: ReactNode;
}

export const LazyMotion: FC<LazyMotionProps> = (props) => {
  const { children } = props;

  return <Lazy features={domAnimation}>{children}</Lazy>;
};
