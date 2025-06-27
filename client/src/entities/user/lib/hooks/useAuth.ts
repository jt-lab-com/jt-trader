import { useSelector } from "react-redux";
import { getAuthData, isAuthLoadingSelector } from "../../model/selectors";

export const useAuth = () => {
  const authData = useSelector(getAuthData);
  const isLoading = useSelector(isAuthLoadingSelector);
  const isGuest = !!authData && authData.email === "Incognito";

  return {
    authData,
    isAuth: !!authData,
    isGuest,
    isLoading,
  };
};
