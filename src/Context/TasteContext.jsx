import React, { createContext, useState, useContext } from 'react';

// Create Context
const TasteContext = createContext();

// Custom hook to use the TasteContext
export const useTaste = () => useContext(TasteContext);

// Provider Component
export const TasteProvider = ({ children }) => {
  const [channels, setChannels] = useState(
    Array.from({ length: 6 }, () => ({
      isChannelEnabled: false,
      isDurationInf: false,
      duration: 1000,
      initialDuration: 1000,
      remainingTime: 0,
      isActivated: false,
      tasteName: '',
      intensity: 100,
      direction: 1, // 1: push, 2: pull
    }))
  );
;

  return (
    <TasteContext.Provider value={{ channels, setChannels }}>
      {children}
    </TasteContext.Provider>
  );
};