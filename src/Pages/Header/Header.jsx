import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'; 

const Header = ({ disconnectSerial, isConnected }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-row justify-between items-center w-[80vw] px-11 gap-x-8 z-20 mt-2">
      {/* Left Section */}
      <div>
        <h1 className="text-2xl text-left font-semibold">Flavour Communication</h1>
      </div>

      {/* Right Section */}
      <div className="flex flex-row gap-x-8 items-center">
        <button
          className="text-black text-lg font-medium hover:text-blue-700 focus:outline-none focus:ring-0 border-0 bg-transparent cursor-pointer"
          onClick={() => navigate('/smell')}
        >
          Smell
          <span>
            <i className="ml-2 fa-solid fa-door-open"></i>
          </span>
        </button>
        <button
          className="text-black text-lg font-medium hover:text-blue-700 focus:outline-none focus:ring-0 border-0 bg-transparent cursor-pointer"
          onClick={() => navigate('/taste')}
        >
          Taste
          <span>
            <i className="ml-2 fa-solid fa-door-open"></i>
          </span>
        </button>
        <button
          className="text-black text-lg font-medium hover:text-blue-700 focus:outline-none focus:ring-0 border-0 bg-transparent cursor-pointer"
          onClick={disconnectSerial}
          disabled={!isConnected}
        >
          Disconnect Serial
          <span>
            <i className="ml-2 fa-solid fa-plug-circle-xmark"></i>
          </span>
        </button>
      </div>
    </div>
  );
};

Header.propTypes = {
    disconnectSerial: PropTypes.func.isRequired, // Validate that disconnectSerial is a required function
    isConnected: PropTypes.bool.isRequired, // Validate that isConnected is a required boolean
  };
  
export default Header;
