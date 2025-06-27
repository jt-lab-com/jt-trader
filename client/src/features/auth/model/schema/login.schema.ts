import * as Yup from "yup";

export const loginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required(),
});

export const loginDefaultValues = {
  email: "",
  password: "",
};
