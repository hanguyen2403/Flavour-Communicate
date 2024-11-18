import React, { createContext, useState, useContext } from 'react';

const SerialContext = createContext();

export const useSerial = () => useContext(SerialContext);

export const SerialProvider = ({ children }) => {
  const [port, setPort] = useState(null);
  const [reader, setReader] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <SerialContext.Provider value={{ port, setPort, isConnected, setIsConnected, reader, setReader }}>
      {children}
    </SerialContext.Provider>
  );
};
