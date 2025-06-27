import { useCallback } from "react";
import { useLocalStorage } from "@/shared/lib/hooks/useLocalStorage";

export const useAutoComplete = () => {
  const { updateBatch, state } = useLocalStorage("scenario-form-autocomplete", {
    scenarioName: [],
    symbols: [],
    spread: [],
    takerFee: [],
    makerFee: [],
    leverage: [],
    balance: [],
    startTime: [],
    endTime: [],
  });

  const updateAutoComplete = useCallback(
    (data: Record<string, string>) => {
      const updatedState = Object.entries(data).reduce(
        (acc, [key, value]) => {
          value = value.toString();
          if (!value.length) return acc;

          if (acc[key]?.includes(value)) {
            const index = acc[key].indexOf(value);
            if (index === 0) return acc;
            acc[key].splice(index, 1);
            acc[key].unshift(value);
            return acc;
          }

          acc[key] = acc[key] ? [value, ...acc[key]] : [value];

          if (acc[key].length > 10) {
            acc[key] = acc[key].slice(0, 10);
          }

          return acc;
        },
        { ...state }
      );

      updateBatch(updatedState);
    },
    [updateBatch, state]
  );

  return {
    completeOptions: state,
    updateAutoComplete,
  };
};
