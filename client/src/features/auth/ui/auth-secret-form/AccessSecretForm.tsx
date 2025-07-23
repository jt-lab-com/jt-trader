import { yupResolver } from "@hookform/resolvers/yup";
import LoadingButton from "@mui/lab/LoadingButton";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { LS_ACCESS_SECRET_KEY } from "@/shared/const/local-storage";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import yup from "@/shared/lib/utils/yup";
import { Iconify } from "@/shared/ui/iconify";
import { Logo } from "@/shared/ui/logo";
import { RHFTextField } from "@/shared/ui/rhf-textfield";
import { auth } from "../../model/services/auth";

interface AccessSecretFormProps {}

export const AccessSecretForm: FC<AccessSecretFormProps> = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const hidden = useBoolean();
  const methods = useForm<{ accessSecret: string }>({
    resolver: yupResolver(yup.object().shape({ accessSecret: yup.string().required() })),
    defaultValues: { accessSecret: "" },
  });
  const {
    formState: { isSubmitting },
  } = methods;

  const handleLogin = methods.handleSubmit(({ accessSecret }) => {
    localStorage.setItem(LS_ACCESS_SECRET_KEY, accessSecret);
    dispatch(
      auth({
        forceReconnect: true,
        onAuthFailure: () => {
          enqueueSnackbar({ message: "Invalid secret key", variant: "error" });
        },
      })
    );
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleLogin}>
        <Stack justifyContent={"center"}>
          <Stack direction={"column"} alignItems={"center"} mb={5}>
            <Logo width={80} height={80} />
            <Typography component={"h1"} variant={"h4"} mt={5}>
              Enter the secret code
            </Typography>
          </Stack>
          <Stack alignItems={"center"} mb={1}>
            <RHFTextField
              name={"accessSecret"}
              fullWidth
              variant={"outlined"}
              label={"Access secret code"}
              margin={"normal"}
              type={hidden.value ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position={"end"}>
                    <IconButton onClick={hidden.onToggle} edge={"end"}>
                      <Iconify icon={hidden.value ? "solar:eye-bold" : "solar:eye-closed-bold"} />
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
        </Stack>
      </form>
    </FormProvider>
  );
};
