import Link, { LinkProps } from "@mui/material/Link";
import { forwardRef } from "react";
import { Link as RRLink, LinkProps as RRLinkProps } from "react-router-dom";

type RouterLinkProps = Omit<RRLinkProps, "to"> & LinkProps;

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(({ href, ...other }, ref) => (
  <Link
    component={RRLink}
    sx={{ "&:hover": { textDecoration: "none" } }}
    ref={ref}
    to={href ?? ""}
    {...other}
  />
));
