import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmell } from '../../Context/SmellContext';
import './Smell.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Smell = () => {
  const navigate = useNavigate();
  const { channels, setChannels } = useSmell();
  const [localChannels, setLocalChannels] = useState([...channels]);

  useEffect(() => {
    setChannels(localChannels);
  }, [localChannels, setChannels]);

  const handleToggleChanel = (index) => {
    const newChannels = [...localChannels];
    newChannels[index].isChanelEnabled = !newChannels[index].isChanelEnabled;
    if (!newChannels[index].isChanelEnabled) {
      newChannels[index].isActivated = false;
      newChannels[index].duration = 1000;
      newChannels[index].isDurationInf = false;
    }
    setLocalChannels(newChannels);
  };

  const handleToggleDuration = (index) => {
    const newChannels = [...localChannels];
    newChannels[index].isDurationInf = !newChannels[index].isDurationInf;
    if (newChannels[index].isDurationInf) {
      newChannels[index].duration = '';
    } else {
      newChannels[index].duration = 1000;
    }
    setLocalChannels(newChannels);
  };

  const handleDurationChange = (index, value) => {
    const newChannels = [...localChannels];
    newChannels[index].duration = value;
    setLocalChannels(newChannels);
  };

  const handleSmellNameChange = (index, value) => {
    const newChannels = [...localChannels];
    newChannels[index].smellName = value;
    setLocalChannels(newChannels);
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
    const newChannels = [...localChannels];
    newChannels[index].isActivated = true;
    setLocalChannels(newChannels);

    if (!newChannels[index].isDurationInf) {
      try {
        const command = `${index + 1} 1 ${newChannels[index].duration}`;
        await sendCommandsToArduino([command]);
        setTimeout(async () => {
          const updatedChannels = [...localChannels];
          updatedChannels[index].isActivated = false;
          setLocalChannels(updatedChannels);
          await sendCommandsToArduino([`${index + 1} 0 0`]); // Deactivate after duration
        }, parseInt(newChannels[index].duration));
      } catch (error) {
        console.error('Error sending command to Arduino:', error);
      }
    } else {
      try {
        await sendCommandsToArduino([`${index + 1} 1 inf`]);
      } catch (error) {
        console.error('Error sending command to Arduino:', error);
      }
    }
  };

  const handleDeactivate = async (index) => {
    const newChannels = [...localChannels];
    newChannels[index].isActivated = false;
    setLocalChannels(newChannels);

    try {
      await sendCommandsToArduino([`${index + 1} 0 0`]); // Send deactivation command
    } catch (error) {
      console.error('Error sending deactivation command to Arduino:', error);
    }
  };

  const handleActivateSelected = async () => {
    const newChannels = [...localChannels];
    const activationCommands = [];
    const deactivationTimes = {};
  
    newChannels.forEach((channel, index) => {
      if (channel.isChanelEnabled && (channel.isDurationInf || channel.duration)) {
        activationCommands.push(`${index + 1} 1 ${channel.isDurationInf ? 'inf' : channel.duration}`);
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
        setLocalChannels(newChannels);
  
        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updatedChannels = [...localChannels];
            indices.forEach(index => {
              updatedChannels[index - 1].isActivated = false; // Correcting for zero-based indexing
            });
            setLocalChannels(updatedChannels);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };
  

  const handleActivateAll = async () => {
    const newChannels = [...localChannels];
    const activationCommands = [];
    const deactivationTimes = {};

    newChannels.forEach((channel, index) => {
      if (channel.isDurationInf || channel.duration) {
        activationCommands.push(`${index + 1} 1 ${channel.isDurationInf ? 'inf' : channel.duration}`);
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
        setLocalChannels(newChannels);

        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updatedChannels = [...localChannels];
            indices.forEach(index => {
              updatedChannels[index - 1].isActivated = false;
              updatedChannels[index - 1].isChanelEnabled = false; // Turn off the channel when deactivated
            });
            setLocalChannels(updatedChannels);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  const handleDeactivateAll = async () => {
    const activeChannels = localChannels.filter(channel => channel.isActivated);
    if (activeChannels.length > 0) {
      const newChannels = localChannels.map((channel) => ({
        ...channel,
        isChanelEnabled: false,
        isActivated: false,
      }));
      const deactivationCommands = newChannels.map((channel, index) => `${index + 1} 0 0`);
      try {
        await sendCommandsToArduino(deactivationCommands);
        setLocalChannels(newChannels);
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  return (
    <div className="smell">
      <div className="container1">
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
            <div className="box-test1">
              <div className="title">
                <h2 className="title-name">Smell Name:</h2>
                <h2 className="title-duration">Duration: (ms)</h2>
              </div>
              {localChannels.map((channel, i) => (
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
                    className={!channel.isChanelEnabled ? 'off' : 'on'}
                    placeholder="Enter smell name"
                    value={channel.smellName}
                    onChange={(e) => handleSmellNameChange(i, e.target.value)}
                  />

                  <div className="duration">
                    <input
                      type="text"
                      id="duration"
                      value={channel.isDurationInf ? '' : channel.duration}
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

                  {!channel.isActivated ? (
                    <input
                      type="button"
                      id="activeButton2"
                      value="Activate"
                      disabled={
                        !channel.isChanelEnabled ||
                        (!channel.isDurationInf && !channel.duration)
                      }
                      onClick={() => handleActivate(i)}
                    />
                  ) : (
                    <input
                      type="button"
                      id="deactiveButton2"
                      value="Deactivate"
                      onClick={() => handleDeactivate(i)}
                    />
                  )}
                  <label htmlFor="activeButton2"></label>
                  <label htmlFor="deactiveButton2"></label>
                </div>
              ))}
            </div>

            <div className="box-button">
              <button className='outsideButton ActivateSelected' onClick={handleActivateSelected}>Activate Selected</button>
              <button className='outsideButton ActivateAll' onClick={handleActivateAll}>Activate All</button>
              <button className='outsideButton DeactivateAll'onClick={handleDeactivateAll}>Deactivate All</button>
            </div>
          </div>
        </div>

        <div className="switch-page">
          <button onClick={() => navigate('/taste')}>
            <span>Go to Taste </span>
            <span>
              <i className="fa-solid fa-door-open"></i>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Smell;
