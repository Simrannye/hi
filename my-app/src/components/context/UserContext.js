// src/components/context/UserContext.js
import React, { createContext, useContext } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ value, children }) => {
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};
