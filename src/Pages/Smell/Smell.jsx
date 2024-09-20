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
  const [previousDuration, setPreviousDuration] = useState(1000);

  // Sync local channels with global state
  useEffect(() => {
    setChannels(localChannels);
  }, [localChannels, setChannels]);

  // Toggle the enabled state of a channel
  const handleToggleChannel = (index) => {
    const updatedChannels = [...localChannels];
    const channel = updatedChannels[index];
    channel.isChannelEnabled = !channel.isChannelEnabled;
    if (!channel.isChannelEnabled) {
      channel.isActivated = false;
      channel.isDurationInf = false;
    }
    setLocalChannels(updatedChannels);
  };

  // Toggle between infinite duration and fixed duration
  const handleToggleDuration = (index) => {
    const updatedChannels = [...localChannels];
    const channel = updatedChannels[index];
    if (!localChannels[index].isDurationInf) {
      setPreviousDuration(localChannels[index].duration); // Save the previous duration
    }
    channel.isDurationInf = !channel.isDurationInf;
    channel.duration = channel.isDurationInf ? '' : previousDuration;
    setLocalChannels(updatedChannels);
  };

  // Update duration value
  const handleDurationChange = (index, value) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].duration = value;
    setLocalChannels(updatedChannels);
  };

  // Update smell name
  const handleSmellNameChange = (index, value) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].smellName = value;
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

  // Activate a single channel
  const handleActivate = async (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].isActivated = true;
    setLocalChannels(updatedChannels);

    const channel = updatedChannels[index];
    const command = channel.isDurationInf ? `${index + 1} 1 inf` : `${index + 1} 1 ${channel.duration}`;

    try {
      await sendCommandsToArduino([command]);
      if (!channel.isDurationInf) {
        setTimeout(async () => {
          const updated = [...localChannels];
          updated[index].isActivated = false;
          setLocalChannels(updated);
          await sendCommandsToArduino([`${index + 1} 0 0`]); // Deactivate after duration
        }, parseInt(channel.duration));
      }
    } catch (error) {
      console.error('Error sending command to Arduino:', error);
    }
  };

  // Deactivate a single channel
  const handleDeactivate = async (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].isActivated = false;
    setLocalChannels(updatedChannels);

    try {
      await sendCommandsToArduino([`${index + 1} 0 0`]); // Send deactivation command
    } catch (error) {
      console.error('Error sending deactivation command to Arduino:', error);
    }
  };

  // Activate selected channels
  const handleActivateSelected = async () => {
    const updatedChannels = [...localChannels];
    const activationCommands = [];
    const deactivationTimes = {};

    updatedChannels.forEach((channel, index) => {
      if (channel.isChannelEnabled && (channel.isDurationInf || channel.duration)) {
        activationCommands.push(`${index + 1} 1 ${channel.isDurationInf ? 'inf' : channel.duration}`);
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
            const deactivateCommands = indices.map(index => `${index} 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updated = [...localChannels];
            indices.forEach(index => {
              updated[index - 1].isActivated = false; // Correcting for zero-based indexing
            });
            setLocalChannels(updated);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  // Activate all channels
  const handleActivateAll = async () => {
    const updatedChannels = [...localChannels];
    const activationCommands = [];
    const deactivationTimes = {};

    updatedChannels.forEach((channel, index) => {
      if (channel.isDurationInf || channel.duration) {
        activationCommands.push(`${index + 1} 1 ${channel.isDurationInf ? 'inf' : channel.duration}`);
        if (!channel.isDurationInf) {
          if (!deactivationTimes[channel.duration]) {
            deactivationTimes[channel.duration] = [];
          }
          deactivationTimes[channel.duration].push(index + 1);
        }
        updatedChannels[index].isActivated = true;
        updatedChannels[index].isChannelEnabled = true; // Resetting isChannelEnabled to true
      }
    });

    if (activationCommands.length > 0) {
      try {
        await sendCommandsToArduino(activationCommands);
        setLocalChannels(updatedChannels);

        Object.entries(deactivationTimes).forEach(([duration, indices]) => {
          setTimeout(async () => {
            const deactivateCommands = indices.map(index => `${index} 0 0`);
            await sendCommandsToArduino(deactivateCommands);
            const updated = [...localChannels];
            indices.forEach(index => {
              updated[index - 1].isActivated = false;
              updated[index - 1].isChannelEnabled = false; // Turn off the channel when deactivated
            });
            setLocalChannels(updated);
          }, parseInt(duration));
        });
      } catch (error) {
        console.error('Error sending commands to Arduino:', error);
      }
    }
  };

  // Deactivate all channels
  const handleDeactivateAll = async () => {
    const activeChannels = localChannels.filter(channel => channel.isActivated);
    if (activeChannels.length > 0) {
      const updatedChannels = localChannels.map((channel) => ({
        ...channel,
        isChannelEnabled: false,
        isActivated: false,
      }));
      const deactivationCommands = updatedChannels.map((channel, index) => `${index + 1} 0 0`);
      try {
        await sendCommandsToArduino(deactivationCommands);
        setLocalChannels(updatedChannels);
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
                <div className="channel" key={i}>
                  <p>#{i + 1}</p>

                  <div className="toggleChannel">
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
                    id="smellName"
                    className={!channel.isChannelEnabled ? 'off' : 'on'}
                    placeholder="Enter smell name"
                    value={channel.smellName}
                    disabled={!channel.isChannelEnabled || channel.isActivated}
                    onChange={(e) => handleSmellNameChange(i, e.target.value)}
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

                  {!channel.isActivated ? (
                    <input
                      type="button"
                      id="activeButton2"
                      value="Activate"
                      disabled={
                        !channel.isChannelEnabled ||
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
              <button className='outsideButton DeactivateAll' onClick={handleDeactivateAll}>Deactivate All</button>
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
