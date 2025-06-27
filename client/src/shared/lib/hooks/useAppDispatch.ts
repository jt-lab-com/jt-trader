import { useDispatch } from "react-redux";
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { AppDispatch } from "@/app/providers/store";

export const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();
