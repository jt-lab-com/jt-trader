export const useSearchParams = () => {
  return new URLSearchParams(location.search);
};
