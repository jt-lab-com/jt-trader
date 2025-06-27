import { Typography } from "@mui/material";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { m } from "framer-motion";
import { FC, useEffect } from "react";
import { MotionContainer, varBounce, varFade } from "@/shared/ui/animate";
import { Image } from "@/shared/ui/image";

interface NotFoundPageProps {}

export const NotFoundPage: FC<NotFoundPageProps> = () => {
  useEffect(() => {
    document.title = "Not found";
  }, []);

  return (
    <Container component={MotionContainer} sx={{ height: "100%", width: "100%" }}>
      <Stack sx={{ height: "100%" }} alignItems={"center"} justifyContent={"center"}>
        <Stack direction={{ xs: "column-reverse", md: "row" }} gap={5}>
          <Stack
            component={m.div}
            variants={varFade().inLeft}
            sx={{ width: { xs: "100%", md: "400px" }, pt: { xs: 0, md: 10 } }}
            alignItems={{ xs: "center", md: "flex-start" }}
          >
            <Typography sx={{ mb: 1, color: "#1877F2" }} variant={"h3"}>
              Sorry, page not found!
            </Typography>
            <Typography sx={{ mb: 5 }} color={"text.secondary"} textAlign={{ xs: "center", md: "start" }}>
              Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL? Be sure to
              check your spelling.
            </Typography>
          </Stack>

          <Stack
            component={m.div}
            variants={varBounce().in}
            sx={{ width: { xs: "100%", md: "400px" } }}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Image width={400} height={380} src={"/assets/404.svg"} alt={"Page not found"} />
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
};
