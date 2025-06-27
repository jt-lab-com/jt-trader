import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { getJobList } from "../../model/selectors";
import { initJobs } from "../../model/services/init";

export const useJobs = () => {
  const dispatch = useAppDispatch();
  const jobs = useSelector(getJobList);

  useEffect(() => {
    dispatch(initJobs());
  }, []);

  return jobs;
};
