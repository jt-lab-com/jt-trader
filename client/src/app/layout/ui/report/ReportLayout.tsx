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
