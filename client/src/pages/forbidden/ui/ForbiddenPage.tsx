import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/entities/user";
import { RoutePath } from "@/shared/const/router";
import { Page } from "@/shared/ui/page/Page";

interface ForbiddenPageProps {}

const ForbiddenPage: FC<ForbiddenPageProps> = () => {
  const { isAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuth) {
      navigate(RoutePath.strategies, { replace: true });
    }
  }, [isAuth]);

  const handleLogin = () => {
    window.open(__AUTH_LINK__, "_self");
  };

  return (
    <Page title={"Forbidden"}>
      <Wrapper>
        <Stack justifyContent={"center"} alignItems={"center"}>
          <Typography sx={{ mb: 1 }} variant={"h3"}>
            Unauthorized
          </Typography>
          <Typography sx={{ mb: 5 }}>Please login</Typography>
          <Button
            sx={{ minWidth: 150 }}
            onClick={handleLogin}
            variant={"contained"}
            size={"large"}
            color={"primary"}
          >
            Login
          </Button>
        </Stack>
      </Wrapper>
    </Page>
  );
};

const Wrapper = styled(Box)(() => ({
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export default ForbiddenPage;
