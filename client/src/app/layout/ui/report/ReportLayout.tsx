import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { FC } from "react";
import { Outlet } from "react-router";

interface ReportLayoutProps {}

export const ReportLayout: FC<ReportLayoutProps> = () => {
  return (
    <>
      {/*<Container disableGutters>*/}
      <Outlet />
      {/*</Container>*/}
    </>
  );
};
