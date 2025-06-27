import { StateSchema } from "@/shared/types/store";

export const isJobsInited = (state: StateSchema) => state.job.__inited;
export const getJobList = (state: StateSchema) => state.job.list;
