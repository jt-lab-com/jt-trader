import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { WS_AUTH_ERROR_CODE } from "@packages/types";
import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AccessSecretForm, LoginForm } from "@/features/auth";
import { useAuth } from "@/entities/user";
import { RoutePath } from "@/shared/const/router";
import { Page } from "@/shared/ui/page";

interface LoginPageProps {
  title: string;
}

const LoginPage: FC<LoginPageProps> = (props) => {
  const { title } = props;

  const { isGuest, authData, errorCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authData) return;

    if (!isGuest) {
      navigate(RoutePath.strategies, { replace: true });
    }
  }, [isGuest, authData]);

  const renderForm = errorCode === WS_AUTH_ERROR_CODE.INVALID_SECRET ? <AccessSecretForm /> : <LoginForm />;

  return (
    <Page
      sx={{ height: "100vh", width: "100vw", justifyContent: "center", alignItems: "center" }}
      title={title}
    >
      <Container>
        <Grid container justifyContent={"center"} alignItems={"center"} height={"100%"}>
          <Grid item xs={12} sm={8} md={5}>
            <Card>
              <CardContent>{renderForm}</CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

export default LoginPage;
