import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";
import { FC, ReactNode, useEffect } from "react";

interface PageProps {
  title: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const Page: FC<PageProps> = (props) => {
  const { title, sx, children } = props;

  useEffect(() => {
    document.title = `JT-Trader | ${title}`;
  }, [title]);

  return (
    <Box component={"main"} sx={{ py: 3, px: 1, display: "flex", flexDirection: "column", ...sx }}>
      {children}
    </Box>
  );
};
