import React from 'react';
import Taste from './Pages/Taste/Taste';
import Smell from './Pages/Smell/Smell';
import Home from './Pages/Home/Home';
import { Route, Routes } from 'react-router-dom'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={ <Home /> } />
        <Route path='/taste' element={<Taste />} />
        <Route path='/smell' element={<Smell />} />
      </Routes>
    </div>
  );
};

export default App;
