import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Smell.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Smell = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState(
    Array.from({ length: 6 }, () => ({
      isChanelEnabled: false,
      isDurationInf: false,
      duration: 1000,
      isActivated: false,
      smellName: '',
      intensity: 100,
    }))
  );

  const [globalIntensity, setGlobalIntensity] = useState(100);

  const handleToggleChanel = (index) => {
    const newChannels = [...channels];
    newChannels[index].isChanelEnabled = !newChannels[index].isChanelEnabled;
    if (!newChannels[index].isChanelEnabled) {
      newChannels[index].isActivated = false;
      newChannels[index].smellName = '';
      newChannels[index].duration = 1000; // Reset duration
      newChannels[index].isDurationInf = false;
    }
    setChannels(newChannels);
  };

  const handleToggleDuration = (index) => {
    const newChannels = [...channels];
    newChannels[index].isDurationInf = !newChannels[index].isDurationInf;
    if (newChannels[index].isDurationInf) {
      newChannels[index].duration = '--';
    } else {
      newChannels[index].duration = 1000; // Default duration
    }
    setChannels(newChannels);
  };

  const handleDurationChange = (index, value) => {
    const newChannels = [...channels];
    newChannels[index].duration = value;
    setChannels(newChannels);
  };

  const handleSmellNameChange = (index, value) => {
    const newChannels = [...channels];
    newChannels[index].smellName = value;
    setChannels(newChannels);
  };

  const handleActivate = (index) => {
    const newChannels = [...channels];
    newChannels[index].isActivated = true;
    setChannels(newChannels);

    if (!newChannels[index].isDurationInf) {
      setTimeout(() => {
        const updatedChannels = [...channels];
        updatedChannels[index].isActivated = false;
        setChannels(updatedChannels);
      }, newChannels[index].duration);
    }
  };

  const handleDeactivate = (index) => {
    const newChannels = [...channels];
    newChannels[index].isActivated = false;
    setChannels(newChannels);
  };

  const handleActivateSelected = () => {
    const newChannels = [...channels];
    newChannels.forEach((channel, index) => {
      if (channel.isChanelEnabled && (channel.isDurationInf || channel.duration)) {
        newChannels[index].isActivated = true;
        if (!channel.isDurationInf) {
          setTimeout(() => {
            const updatedChannels = [...channels];
            updatedChannels[index].isActivated = false;
            setChannels(updatedChannels);
          }, channel.duration);
        }
      }
    });
    setChannels(newChannels);
  };

  const handleActivateAll = () => {
    const newChannels = channels.map((channel) => ({
      ...channel,
      isChanelEnabled: true,
      isActivated: true,
    }));

    newChannels.forEach((channel, index) => {
      if (!channel.isDurationInf) {
        setTimeout(() => {
          const updatedChannels = [...newChannels];
          updatedChannels[index].isActivated = false;
          setChannels(updatedChannels);
        }, channel.duration);
      }
    });
    setChannels(newChannels);
  };

  const handleDeactivateAll = () => {
    const newChannels = channels.map((channel) => ({
      ...channel,
      isChanelEnabled: false,
      isActivated: false,
    }));
    setChannels(newChannels);
  };

  const handleGlobalIntensityChange = (value) => {
    setGlobalIntensity(value);
    const newChannels = channels.map((channel) => ({
      ...channel,
      intensity: value,
    }));
    setChannels(newChannels);
  };

  /* 
   <div className="intensity">
                  <label>Intensity:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={channel.intensity}
                    onChange={(e) => handleIntensityChange(i, e.target.value)}
                  />
                </div> */

  return (
    <div className="container">
      <div className="container-background">
        <img className="circle1" src={circle1} alt="background" />
        <img className="circle2" src={circle2} alt="background" />
        <div className="color"></div>
      </div>

      <div className="container-header">
        <h1>Flavour Communication</h1>
      </div>

      <div className="container-body">
        <div className="test">
          <h3>Olfactory Interface</h3>
        </div>

        <div className="flex-container">
          <div className="box-test">
            {channels.map((channel, i) => (
              <div className="chanel" key={i}>
                <p>#{i + 1}</p>

                <div className="toggleChanel">
                  <input
                    type="checkbox"
                    id={`checkChanel${i + 1}`}
                    hidden
                    checked={channel.isChanelEnabled}
                    onChange={() => handleToggleChanel(i)}
                  />
                  <label htmlFor={`checkChanel${i + 1}`}></label>
                </div>

                <input
                  type="text"
                  id="smellName"
                  placeholder="Enter smell name"
                  value={channel.smellName}
                  onChange={(e) => handleSmellNameChange(i, e.target.value)}
                />

                <div className="duration">
                  <input
                    type="text"
                    id="duration"
                    value={channel.isDurationInf ? '--' : channel.duration}
                    disabled={!channel.isChanelEnabled || channel.isActivated || channel.isDurationInf}
                    onChange={(e) => handleDurationChange(i, e.target.value)}
                  />

                  <div className="toggleDuration">
                    <input
                      type="checkbox"
                      id={`checkDurationInf${i + 1}`}
                      hidden
                      checked={channel.isDurationInf}
                      onChange={() => handleToggleDuration(i)}
                      disabled={!channel.isChanelEnabled || channel.isActivated}
                    />
                    <label htmlFor={`checkDurationInf${i + 1}`}><p>Inf</p></label>
                  </div>
                </div>

                <div className="toggleDirection">
                  <input
                    type="checkbox"
                    id={`checkDirection${i + 1}`}
                    hidden
                  />
                  <label htmlFor={`checkDirection${i + 1}`}>
                    <p className="push">Push</p>
                    <p className="pull">Pull</p>
                  </label>
                </div>

                {!channel.isActivated ? (
                  <input
                    type="button"
                    id="activeButton"
                    value="Activate"
                    disabled={
                      !channel.isChanelEnabled ||
                      !channel.smellName ||
                      (!channel.isDurationInf && !channel.duration)
                    }
                    onClick={() => handleActivate(i)}
                  />
                ) : (
                  <input
                    type="button"
                    id="deactiveButton"
                    value="Deactivate"
                    onClick={() => handleDeactivate(i)}
                  />
                )}
                <label htmlFor="activeButton"></label>
                <label htmlFor="deactiveButton"></label>
              </div>
            ))}
          </div>

          <div className="box-button">
            <div className="global-intensity">
              <h3>Intensity for all:</h3>
              <input
                type="number"
                min="0"
                max="100"
                value={globalIntensity}
                onChange={(e) => handleGlobalIntensityChange(e.target.value)}
              />
            </div>
            <button onClick={handleActivateSelected}>Activate Selected</button>
            <button onClick={handleActivateAll}>Activate All</button>
            <button onClick={handleDeactivateAll}>Deactivate All</button>
          </div>
        </div>
      </div>

      {/* Button to switch to Taste page */}
      <div className="switch-page">
        <button onClick={() => navigate('/taste')}>Go to Taste</button>
      </div>
    </div>
  );
};

export default Smell;
