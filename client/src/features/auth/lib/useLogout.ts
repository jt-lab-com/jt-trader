import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { logout } from "../model/services/logout";

export const useLogout = () => {
  const dispatch = useAppDispatch();

  return () => {
    dispatch(logout());
  };
};
