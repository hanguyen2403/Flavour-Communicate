import React, { createContext, useState, useContext } from 'react';

const SmellContext = createContext();

export const useSmell = () => useContext(SmellContext);

export const SmellProvider = ({ children }) => {
  const [channels, setChannels] = useState(
    Array.from({ length: 6 }, () => ({
      isChannelEnabled: false,
      isDurationInf: false,
      duration: 1000,
      initialDuration: 1000,
      remainingTime: 0,
      isActivated: false,
      smellName: '',
    }))
  );

  return (
    <SmellContext.Provider value={{ channels, setChannels }}>
      {children}
    </SmellContext.Provider>
  );
};
