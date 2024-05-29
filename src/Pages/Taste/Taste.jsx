import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Taste.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Taste = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState(
    Array.from({ length: 6 }, () => ({
      isChanelEnabled: false,
      isDurationInf: false,
      duration: 1000,
      isActivated: false,
      tasteName: '',
      intensity: 100,
      direction: 1, // 1: push, 2: pull
    }))
  );

  const [globalIntensity, setGlobalIntensity] = useState(100);

  const handleToggleChanel = (index) => {
    const newChannels = [...channels];
    newChannels[index].isChanelEnabled = !newChannels[index].isChanelEnabled;
    if (!newChannels[index].isChanelEnabled) {
      newChannels[index].isActivated = false;
      newChannels[index].tasteName = '';
      newChannels[index].duration = 1000; // Reset duration
      newChannels[index].isDurationInf = false;
      newChannels[index].intensity = 100;
      newChannels[index].direction = 1; // Reset direction to push
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

  const handleTasteNameChange = (index, value) => {
    const newChannels = [...channels];
    newChannels[index].tasteName = value;
    setChannels(newChannels);
  };

  const handleIntensityChange = (index, value) => {
    const newChannels = [...channels];
    newChannels[index].intensity = value;
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

  const handleDirectionChange = (index) => {
    const newChannels = [...channels];
    newChannels[index].direction = newChannels[index].direction === 1 ? 2 : 1;
    setChannels(newChannels);
  };

  const sendCommandsToArduino = async (commands) => {
    try {
      const response = await fetch('http://localhost:3000/send-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commands }),
      });

      if (!response.ok) {
        throw new Error('Failed to send commands to Arduino');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleActivate = async (index) => {
    const newChannels = [...channels];
    newChannels[index].isActivated = true;
    setChannels(newChannels);

    if (!newChannels[index].isDurationInf) {
      try {
        const command = `${index + 1} ${newChannels[index].direction} ${newChannels[index].duration} ${newChannels[index].intensity}`;
        await sendCommandsToArduino([command]);
        setTimeout(async () => {
          const updatedChannels = [...channels];
          updatedChannels[index].isActivated = false;
          setChannels(updatedChannels);
          await sendCommandsToArduino([`${index + 1} 0 0 0`]); // Deactivate after duration
        }, parseInt(newChannels[index].duration));
      } catch (error) {
        console.error('Error sending command to Arduino:', error);
      }
    } else {
      try {
        await sendCommandsToArduino([`${index + 1} ${newChannels[index].direction} inf ${newChannels[index].intensity}`]);
      } catch (error) {
        console.error('Error sending command to Arduino:', error);
      }
    }
  };

  const handleDeactivate = async (index) => {
    const newChannels = [...channels];
    newChannels[index].isActivated = false;
    setChannels(newChannels);

    try {
      await sendCommandsToArduino([`${index + 1} 0 0 0`]); // Send deactivation command
    } catch (error) {
      console.error('Error sending deactivation command to Arduino:', error);
    }
  };

  const handleActivateSelected = async () => {
    const newChannels = [...channels];
    const activationCommands = [];
    const deactivationTimes = {};

    newChannels.forEach((channel, index) => {
      if (channel.isChanelEnabled && (channel.isDurationInf || channel.duration)) {
        activationCommands.push(`${index + 1} ${channel.direction} ${channel.isDurationInf ? 'inf' : channel.duration} ${channel.intensity}`);
        if (!channel.isDurationInf) {
          if (!deactivationTimes[channel.duration]) {
            deactivationTimes[channel.duration] = [];
          }
          deactivationTimes[channel.duration].push(index + 1);
        }
        newChannels[index].isActivated = true;
      }
    });

    if (activationCommands.length > 0) {
      try {
        await sendCommandsToArduino(activationCommands);
        setChannels(newChannels);

        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updatedChannels = [...channels];
            indices.forEach(index => {
              updatedChannels[index - 1].isActivated = false;
            });
            setChannels(updatedChannels);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  const handleActivateAll = async () => {
    const newChannels = [...channels];
    const activationCommands = [];
    const deactivationTimes = {};
  
    newChannels.forEach((channel, index) => {
      if (channel.isDurationInf || channel.duration) {
        activationCommands.push(`${index + 1} ${channel.direction} ${channel.isDurationInf ? 'inf' : channel.duration} ${channel.intensity}`);
        if (!channel.isDurationInf) {
          if (!deactivationTimes[channel.duration]) {
            deactivationTimes[channel.duration] = [];
          }
          deactivationTimes[channel.duration].push(index + 1);
        }
        newChannels[index].isActivated = true;
        newChannels[index].isChanelEnabled = true; // Resetting isChanelEnabled to true
      }
    });
  
    if (activationCommands.length > 0) {
      try {
        await sendCommandsToArduino(activationCommands);
        setChannels(newChannels);
  
        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updatedChannels = [...channels];
            indices.forEach(index => {
              updatedChannels[index - 1].isActivated = false;
              updatedChannels[index - 1].isChanelEnabled = false; // Turn off the channel when deactivated
            });
            setChannels(updatedChannels);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };
  
  

  const handleDeactivateAll = async () => {
    const activeChannels = channels.filter(channel => channel.isActivated);
    if (activeChannels.length > 0) {
      const newChannels = channels.map((channel) => ({
        ...channel,
        isChanelEnabled: false,
        isActivated: false,
      }));
      const deactivationCommands = newChannels.map((channel, index) => `${index + 1} 0 0 0`);
      try {
        await sendCommandsToArduino(deactivationCommands);
        setChannels(newChannels);
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };


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
          <h3>Gustatory Interface</h3>
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
                  id="tasteName"
                  placeholder="Enter taste name"
                  value={channel.tasteName}
                  onChange={(e) => handleTasteNameChange(i, e.target.value)}
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
                    />
                    <label htmlFor={`checkDurationInf${i + 1}`}><p>Inf</p></label>
                  </div>
                </div>

                <div className="toggleDirection">
                  <input
                    type="checkbox"
                    id={`checkDirection${i + 1}`}
                    hidden
                    onChange={() => handleDirectionChange(i)}
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
    disabled={!channel.isChanelEnabled || (!channel.isDurationInf && !channel.duration)}
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

      {/* Button to switch to Smell page */}
      <div className="switch-page">
        <button onClick={() => navigate('/smell')}>Go to Smell</button>
      </div>
    </div>
  );
};

export default Taste;

