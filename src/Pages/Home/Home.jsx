import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container flex flex-col justify-center items-center min-h-screen gap-y-5">
            <h1 className="font-semibold">Welcome to the Home Page</h1>
            <div className="home-buttons flex gap-5">
                <button
                    className="text-xl font-medium px-6 py-2 rounded bg-[#b0d6f0] text-black hover:bg-[#9ec4df]"
                    onClick={() => navigate('/taste')}
                >
                    Taste
                </button>
                <button
                    className="text-xl font-medium px-6 py-2 rounded bg-[#b0d6f0] text-black hover:bg-[#9ec4df]"
                    onClick={() => navigate('/smell')}
                >
                    Smell
                </button>
            </div>
        </div>
    );
};

export default Home;
