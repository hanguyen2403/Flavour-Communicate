import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1>Welcome to the Home Page</h1>
            <div className="home-buttons">
                <button onClick={() => navigate('/taste')}>Taste</button>
                <button onClick={() => navigate('/smell')}>Smell</button>
            </div>
        </div>
    );
};

export default Home;
