import dayjs from "dayjs";
import * as yup from "yup";

declare module "yup" {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ObjectSchema<TType, TContext, TDefault, TFlags> {
    dayjs(message?: string): this;
  }
}

yup.addMethod(yup.object, "dayjs", function method(message) {
  return this.test("dayjs", message, (value: any) => {
    if (!value) return true;
    return dayjs.isDayjs(value);
  });
});

export default yup;
