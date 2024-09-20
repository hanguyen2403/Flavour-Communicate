import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaste } from '../../Context/TasteContext';
import './Taste.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Taste = () => {
  const navigate = useNavigate();
  const { channels, setChannels } = useTaste();
  const [localChannels, setLocalChannels] = useState([...channels]);
  const [globalIntensity, setGlobalIntensity] = useState(100);
  const [previousDuration, setPreviousDuration] = useState(1000); // Default duration

  useEffect(() => {
    setChannels(localChannels);
  }, [localChannels, setChannels]);

  // Toggle channel activation status
  const handleToggleChannel = (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].isChannelEnabled = !updatedChannels[index].isChannelEnabled;
    if (!updatedChannels[index].isChannelEnabled) {
      updatedChannels[index] = {
        ...updatedChannels[index],
        isActivated: false,
        isDurationInf: false,
        intensity: 100,
        direction: 1,
      };
    }
    setLocalChannels(updatedChannels);
  };

  // Toggle duration mode (infinite or specific duration)
  const handleToggleDuration = (index) => {
    if (!localChannels[index].isDurationInf){
      setPreviousDuration(localChannels[index].duration);
    }
    const updatedChannels = [...localChannels];
    updatedChannels[index].isDurationInf = !updatedChannels[index].isDurationInf;
    if (updatedChannels[index].isDurationInf) {
      updatedChannels[index].duration = '';
    } else {
      updatedChannels[index].duration =  previousDuration || 1000; // Default duration
    }
    setLocalChannels(updatedChannels);
  };

  // Update duration for a specific channel
  const handleDurationChange = (index, value) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].duration = value;
    setLocalChannels(updatedChannels);
  };

  // Update taste name for a specific channel
  const handleTasteNameChange = (index, value) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].tasteName = value;
    setLocalChannels(updatedChannels);
  };

  // Update global intensity for all channels
  const handleGlobalIntensityChange = (value) => {
    setGlobalIntensity(value);
    const updatedChannels = localChannels.map((channel) => ({
      ...channel,
      intensity: value,
    }));
    setLocalChannels(updatedChannels);
  };

  // Toggle direction (push or pull) for a specific channel
  const handleDirectionChange = (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].direction = updatedChannels[index].direction === 1 ? 2 : 1;
    setLocalChannels(updatedChannels);
  };

  // Send commands to Arduino via API
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

  // Activate a specific channel and send commands to Arduino
  const handleActivate = async (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].isActivated = true;
    setLocalChannels(updatedChannels);

    const command = `${index + 1} ${updatedChannels[index].direction} ${updatedChannels[index].isDurationInf ? 'inf' : updatedChannels[index].duration} ${updatedChannels[index].intensity}`;
    try {
      await sendCommandsToArduino([command]);
      if (!updatedChannels[index].isDurationInf) {
        setTimeout(async () => {
          const deactivateCommand = `${index + 1} 0 0 0`;
          await sendCommandsToArduino([deactivateCommand]);
          const updatedChannelsAfterDeactivation = [...localChannels];
          updatedChannelsAfterDeactivation[index].isActivated = false;
          setLocalChannels(updatedChannelsAfterDeactivation);
        }, parseInt(updatedChannels[index].duration));
      }
    } catch (error) {
      console.error('Error sending command to Arduino:', error);
    }
  };

  // Deactivate a specific channel and send deactivation command to Arduino
  const handleDeactivate = async (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].isActivated = false;
    setLocalChannels(updatedChannels);

    try {
      await sendCommandsToArduino([`${index + 1} 0 0 0`]); // Send deactivation command
    } catch (error) {
      console.error('Error sending deactivation command to Arduino:', error);
    }
  };

  // Activate all selected channels and send commands to Arduino
  const handleActivateSelected = async () => {
    const updatedChannels = [...localChannels];
    const activationCommands = [];
    const deactivationTimes = {};

    updatedChannels.forEach((channel, index) => {
      if (channel.isChannelEnabled && (channel.isDurationInf || channel.duration)) {
        activationCommands.push(`${index + 1} ${channel.direction} ${channel.isDurationInf ? 'inf' : channel.duration} ${channel.intensity}`);
        if (!channel.isDurationInf) {
          if (!deactivationTimes[channel.duration]) {
            deactivationTimes[channel.duration] = [];
          }
          deactivationTimes[channel.duration].push(index + 1);
        }
        updatedChannels[index].isActivated = true;
      }
    });

    if (activationCommands.length > 0) {
      try {
        await sendCommandsToArduino(activationCommands);
        setLocalChannels(updatedChannels);

        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updatedChannelsAfterDeactivation = [...localChannels];
            indices.forEach(index => {
              updatedChannelsAfterDeactivation[index - 1].isActivated = false;
            });
            setLocalChannels(updatedChannelsAfterDeactivation);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  // Activate all channels and send commands to Arduino
  const handleActivateAll = async () => {
    const updatedChannels = [...localChannels];
    const activationCommands = [];
    const deactivationTimes = {};

    updatedChannels.forEach((channel, index) => {
      if (channel.isDurationInf || channel.duration) {
        activationCommands.push(`${index + 1} ${channel.direction} ${channel.isDurationInf ? 'inf' : channel.duration} ${channel.intensity}`);
        if (!channel.isDurationInf) {
          if (!deactivationTimes[channel.duration]) {
            deactivationTimes[channel.duration] = [];
          }
          deactivationTimes[channel.duration].push(index + 1);
        }
        updatedChannels[index].isActivated = true;
        updatedChannels[index].isChannelEnabled = true; // Ensure channel is enabled
      }
    });

    if (activationCommands.length > 0) {
      try {
        await sendCommandsToArduino(activationCommands);
        setLocalChannels(updatedChannels);

        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updatedChannelsAfterDeactivation = [...localChannels];
            indices.forEach(index => {
              updatedChannelsAfterDeactivation[index - 1].isActivated = false;
              updatedChannelsAfterDeactivation[index - 1].isChannelEnabled = false; // Turn off channel when deactivated
            });
            setLocalChannels(updatedChannelsAfterDeactivation);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  // Deactivate all channels and send deactivation commands to Arduino
  const handleDeactivateAll = async () => {
    const activeChannels = localChannels.filter(channel => channel.isActivated);
    if (activeChannels.length > 0) {
      const updatedChannels = localChannels.map((channel) => ({
        ...channel,
        isChannelEnabled: false,
        isActivated: false,
      }));
      const deactivationCommands = updatedChannels.map((channel, index) => `${index + 1} 0 0 0`);
      try {
        await sendCommandsToArduino(deactivationCommands);
        setLocalChannels(updatedChannels);
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };


  return (
    <div className="taste">
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

              <div className="title">
                <h2 className="title-name">Taste Name</h2>
                <h2 className="title-duration">Duration: (ms)</h2>
                <h2 className="title-direction">Direction:</h2>
              </div>

              {localChannels.map((channel, i) => (
                <div className="channel" key={i}>
                  <p>#{i + 1}</p>

                  <div className="toggleChannel1">
                    <input
                      type="checkbox"
                      id={`checkChannel${i + 1}`}
                      hidden
                      checked={channel.isChannelEnabled}
                      disabled={channel.isActivated}
                      onChange={() => handleToggleChannel(i)}
                    />
                    <label htmlFor={`checkChannel${i + 1}`}></label>
                  </div>

                  <input
                    type="text"
                    id="tasteName"
                    className={!channel.isChannelEnabled ? 'off' : 'on'}
                    placeholder="Enter taste name"
                    value={channel.tasteName}
                    disabled={!channel.isChannelEnabled || channel.isActivated}
                    onChange={(e) => handleTasteNameChange(i, e.target.value)}
                  />

                  <div className="duration">
                    <input
                      type="text"
                      id="duration"
                      value={channel.isDurationInf ? '' : channel.duration}
                      disabled={!channel.isChannelEnabled || channel.isActivated || channel.isDurationInf}
                      onChange={(e) => handleDurationChange(i, e.target.value)}
                    />

                    <div className="toggleDuration">
                      <input
                        type="checkbox"
                        id={`checkDurationInf${i + 1}`}
                        hidden
                        checked={channel.isDurationInf}
                        disabled={!channel.isChannelEnabled || channel.isActivated}
                        onChange={() => handleToggleDuration(i)}
                      />
                      <label htmlFor={`checkDurationInf${i + 1}`}><p>Inf</p></label>
                    </div>
                  </div>

                  <div className="toggleDirection">
                    <input
                      type="checkbox"
                      id={`checkDirection${i + 1}`}
                      disabled={!channel.isChannelEnabled || channel.isActivated}
                      onChange={() => handleDirectionChange(i)}
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
                      id="activeButton1"
                      value="Activate"
                      disabled={!channel.isChannelEnabled || (!channel.isDurationInf && !channel.duration)}
                      onClick={() => handleActivate(i)}
                    />
                  ) : (
                    <input
                      type="button"
                      id="deactiveButton1"
                      value="Deactivate"
                      onClick={() => handleDeactivate(i)}
                    />
                  )}
                  <label htmlFor="activeButton1"></label>
                  <label htmlFor="deactiveButton1"></label>
                </div>
              ))}
            </div>

            <div className="box-button">
              <div className="global-intensity">
                <h3>Intensity for all:</h3>
                <h3 className='limit'>0 - 100</h3>
                <input
                  type="number"
                  id = "intensityNumber"
                  min="0"
                  max="100"
                  value={globalIntensity}
                  onChange={(e) => handleGlobalIntensityChange(e.target.value)}
                />
              </div>
              <button className='outsideButton ActivateSelected' onClick={handleActivateSelected}>Activate Selected</button>
              <button className='outsideButton ActivateAll' onClick={handleActivateAll}>Activate All</button>
              <button className='outsideButton DeactivateAll' onClick={handleDeactivateAll}>Deactivate All</button>
            </div>
          </div>
        </div>

        {/* Button to switch to Smell page */}
        <div className="switch-page">
          <button onClick={() => navigate('/smell')}>
            <span>Go to Smell </span>
            <span>
            <i class="fa-solid fa-door-open"></i>
            </span>
            </button>
        </div>
        <div className="check">CHECK</div>
      </div>
    </div>
  );
};

export default Taste;

