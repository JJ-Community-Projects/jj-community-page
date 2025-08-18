import {createContext, type ParentComponent, useContext} from "solid-js";
import type {User} from "../../../../../lib/auth/User.ts";

const useUserHook = (user: User) => {
  return {
    user,
  };
};

interface UserProviderProps {
  user: User
}

const UserContext = createContext<ReturnType<typeof useUserHook>>();

export const UserProvider: ParentComponent<UserProviderProps> = (props) => {
  const hook = useUserHook(props.user);
  return (
    <UserContext.Provider value={hook}>{props.children}</UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext)!;
