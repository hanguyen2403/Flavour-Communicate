import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Taste from './Pages/Taste/Taste';
import Smell from './Pages/Smell/Smell';
import Home from './Pages/Home/Home';
import { SmellProvider } from './Context/SmellContext';
import { TasteProvider } from './Context/TasteContext';
import { SerialProvider } from './Context/SerialContext';

const App = () => {
  return (
    <SerialProvider>
      <SmellProvider>
        <TasteProvider>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/taste' element={<Taste />} />
            <Route path='/smell' element={<Smell />} />
          </Routes>
          </TasteProvider>
      </SmellProvider>
    </SerialProvider>
  );
};

export default App;
