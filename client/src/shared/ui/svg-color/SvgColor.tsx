import Box, { BoxProps } from '@mui/material/Box';
import { forwardRef } from 'react';

export interface SvgColorProps extends BoxProps {
  size?: number;
  src: string;
}

export const SvgColor = forwardRef<HTMLSpanElement, SvgColorProps>((props, ref) => {
  const { src, sx, size = 24, ...other } = props;

  return (
    <Box
      component="span"
      className="svg-color"
      ref={ref}
      sx={{
        width: size,
        height: size,
        display: 'inline-block',
        bgcolor: 'currentColor',
        mask: `url(${src}) no-repeat center / contain`,
        WebkitMask: `url(${src}) no-repeat center / contain`,
        ...sx,
      }}
      {...other}
    />
  );
});
