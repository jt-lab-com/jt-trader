import { FC, ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/entities/user";
import { RoutePath } from "@/shared/const/router";

interface AuthProps {
  children: ReactNode;
}

export const Auth: FC<AuthProps> = (props) => {
  const { children } = props;
  const { isAuth, isLoading } = useAuth();

  if (!isAuth && !isLoading) {
    return <Navigate to={RoutePath.login} />;
  }

  return children;
};
