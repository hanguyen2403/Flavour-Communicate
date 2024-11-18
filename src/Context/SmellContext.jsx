import React, { createContext, useState, useContext } from 'react';
import { useSerial } from './SerialContext';

const SmellContext = createContext();

export const useSmell = () => useContext(SmellContext);

export const SmellProvider = ({ children }) => {
  const { port, setPort, isConnected, setIsConnected, reader, setReader } = useSerial();
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
    <SmellContext.Provider value={{ channels, setChannels, port, setPort, isConnected, setIsConnected, reader, setReader }}>
      {children}
    </SmellContext.Provider>
  );
};
