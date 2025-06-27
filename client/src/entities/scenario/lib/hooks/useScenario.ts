import { Scenario } from "@packages/types";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { getScenarioList } from "../../model/selectors";
import { initScenario } from "../../model/services/init";

interface UseScenarioReturnParams {
  scenarioList: Scenario[];
}

export const useScenario = (): UseScenarioReturnParams => {
  const dispatch = useAppDispatch();
  const scenarioList = useSelector(getScenarioList);

  useEffect(() => {
    dispatch(initScenario());
  }, []);

  return {
    scenarioList,
  };
};
