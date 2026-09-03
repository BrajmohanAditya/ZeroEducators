import React, { useEffect } from 'react';
import MainRoutes from './Routes/MainRoutes';
import { GetUserHook } from './hooks/User.hook';
import { useUserStore } from './store/user.store';

function App() {
  const { data, isLoading, isError } = GetUserHook();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setCheckingAuth = useUserStore((state) => state.setCheckingAuth);

  // Jab API se data aayega, ye usko permanently Zustand mein daal dega
  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    } else if (isError) {
      clearUser();
    } else if (!isLoading) {
      setCheckingAuth(false);
    }
  }, [data, isError, isLoading, setUser, clearUser, setCheckingAuth]);



  return (
    <>
      <div><MainRoutes /></div>
    </>
  );
}

export default App;
