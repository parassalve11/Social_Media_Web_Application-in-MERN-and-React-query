import { useDispatch, useSelector } from "react-redux";
import { clearUser, setUser } from "./userSlice";

export const useUser = () => {
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);

  return {
    ...userState,
    setUser: (data) => dispatch(setUser(data)),
    clearUser: () => dispatch(clearUser()),
  };
};
