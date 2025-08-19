import { StateSchema } from "@/shared/types/store";

export const isConfigInited = (state: StateSchema) => state.config.__inited;
export const getMainExchangeList = (state: StateSchema) => state.config.exchanges.main;
export const getAdditionalExchangeList = (state: StateSchema) => state.config.exchanges.additional;
export const getEngineVersion = (state: StateSchema) => state.config.engineVersion;
export const getEngineMode = (state: StateSchema) => state.config.engineMode;
export const getS3Host = (state: StateSchema) => state.config.s3Host;
export const getTesterDefaults = (state: StateSchema) => state.config.testerDefaults;
