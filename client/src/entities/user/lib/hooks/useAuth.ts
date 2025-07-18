import { useSelector } from "react-redux";
import { getAuthData, getAuthErrorCode, isAuthLoadingSelector } from "../../model/selectors";

export const useAuth = () => {
  const authData = useSelector(getAuthData);
  const isLoading = useSelector(isAuthLoadingSelector);
  const errorCode = useSelector(getAuthErrorCode);
  const isGuest = !!authData && authData.email === "Incognito";

  return {
    authData,
    isAuth: !!authData,
    isGuest,
    isLoading,
    errorCode,
  };
};
