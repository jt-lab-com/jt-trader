import { yupResolver } from "@hookform/resolvers/yup";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { RoutePath } from "@/shared/const/router";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { Logo } from "@/shared/ui/logo";
import { RHFTextField } from "@/shared/ui/rhf-textfield";
import { RouterLink } from "@/shared/ui/router-link";
import { loginDefaultValues, loginSchema } from "../../model/schema/login.schema";
import { login } from "../../model/services/login";

interface LoginFormProps {}

export const LoginForm: FC<LoginFormProps> = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const password = useBoolean();

  const methods = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaultValues,
  });

  const {
    formState: { isSubmitting },
  } = methods;

  const handleLogin = methods.handleSubmit(async (data) => {
    const result = await dispatch(login(data));
    if (result.meta.requestStatus === "rejected") {
      enqueueSnackbar({ message: result.payload ?? "", variant: "error" });
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleLogin}>
        <Stack justifyContent={"center"}>
          <Stack direction={"column"} alignItems={"center"} mb={5}>
            <Logo width={80} height={80} />
            <Typography component={"h1"} variant={"h4"} mt={5}>
              Log in to Your JT Lab Account
            </Typography>
          </Stack>
          <Stack alignItems={"center"} mb={1}>
            <RHFTextField
              name={"email"}
              type={"email"}
              margin={"normal"}
              fullWidth
              variant={"outlined"}
              label={"Email"}
            />
            <RHFTextField
              name={"password"}
              fullWidth
              variant={"outlined"}
              label={"Password"}
              margin={"normal"}
              type={password.value ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position={"end"}>
                    <IconButton onClick={password.onToggle} edge={"end"}>
                      <Iconify icon={password.value ? "solar:eye-bold" : "solar:eye-closed-bold"} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
          <Stack justifyContent={"center"} mt={5}>
            <LoadingButton
              loading={isSubmitting}
              fullWidth
              variant={"contained"}
              type={"submit"}
              size={"large"}
              onClick={handleLogin}
            >
              Login
            </LoadingButton>
          </Stack>
          <Stack justifyContent={"center"} my={2}>
            <Divider variant={"fullWidth"}>
              <Typography textTransform={"uppercase"} variant={"overline"} color={"text.disabled"}>
                or
              </Typography>
            </Divider>
          </Stack>
          <Stack justifyContent={"center"} mb={2}>
            <Button component={RouterLink} href={RoutePath.strategies}>
              Continue without login
            </Button>
          </Stack>
        </Stack>
      </form>
    </FormProvider>
  );
};
