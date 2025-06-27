import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/features/auth";
import { useAuth } from "@/entities/user";
import { RoutePath } from "@/shared/const/router";
import { Page } from "@/shared/ui/page";

interface LoginPageProps {
  title: string;
}

const LoginPage: FC<LoginPageProps> = (props) => {
  const { title } = props;

  const { isGuest, authData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authData) return;

    if (!isGuest) {
      navigate(RoutePath.strategies, { replace: true });
    }
  }, [isGuest, authData]);

  return (
    <Page
      sx={{ height: "100vh", width: "100vw", justifyContent: "center", alignItems: "center" }}
      title={title}
    >
      <Stack justifyContent={"center"} alignItems={"center"}>
        <Card>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </Stack>
    </Page>
  );
};

export default LoginPage;
