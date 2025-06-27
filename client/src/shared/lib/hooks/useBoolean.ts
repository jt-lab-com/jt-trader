import { Dispatch, SetStateAction, useCallback, useState } from "react";

interface ReturnType {
  value: boolean;
  onTrue: () => void;
  onFalse: () => void;
  onToggle: () => void;
  setValue: Dispatch<SetStateAction<boolean>>;
}

export const useBoolean = (defaultValue: boolean = false): ReturnType => {
  const [value, setValue] = useState(defaultValue);

  const onTrue = useCallback(() => {
    setValue(true);
  }, []);

  const onFalse = useCallback(() => {
    setValue(false);
  }, []);

  const onToggle = useCallback(() => {
    setValue((x) => !x);
  }, []);

  return { value, setValue, onTrue, onFalse, onToggle };
};
