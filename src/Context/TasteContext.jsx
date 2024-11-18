import React, { createContext, useState, useContext } from 'react';
import { useSerial } from './SerialContext';

const TasteContext = createContext();

export const useTaste = () => useContext(TasteContext);

export const TasteProvider = ({ children }) => {
  const { port, setPort, isConnected, setIsConnected, reader, setReader } = useSerial();
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

  return (
    <TasteContext.Provider value={{ channels, setChannels, port, setPort, isConnected, setIsConnected, reader, setReader }}>
      {children}
    </TasteContext.Provider>
  );
};
