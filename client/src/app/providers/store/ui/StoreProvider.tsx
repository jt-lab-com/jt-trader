import { FC, ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../config/store";

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: FC<StoreProviderProps> = (props) => {
  const { children } = props;

  return <Provider store={store}>{children}</Provider>;
};
