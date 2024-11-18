import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaste } from '../../Context/TasteContext';
import './Taste.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Taste = () => {
  const navigate = useNavigate();
  const { channels, setChannels, port, setPort, isConnected, setIsConnected, reader, setReader } = useTaste();
  const [localChannels, setLocalChannels] = useState([...channels]);
  const [globalIntensity, setGlobalIntensity] = useState(100);
  const [previousDuration, setPreviousDuration] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [serialOutput, setSerialOutput] = useState(''); // Store serial output

  useEffect(() => {
    setChannels(localChannels);
  }, [localChannels, setChannels]);

  useEffect(() => {
    if (isConnected) {
      console.log('Serial port is already connected.');
    }
  }, [isConnected]);

  // Request and connect to the serial port
  const connectSerial = async () => {
    setIsLoading(true);
    try {
      if (!port) {
        const selectedPort = await navigator.serial.requestPort();
        await selectedPort.open({ baudRate: 115200 });
        setPort(selectedPort);
        setIsConnected(true);
        console.log('Connected to serial port!');
        startReadingFromSerialPort(selectedPort);
      }
    } catch (error) {
      console.error('Error connecting to serial port:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startReadingFromSerialPort = async (port) => {
    try {
      const readerInstance = port.readable.getReader();
      setReader(readerInstance); // Save the reader in context
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await readerInstance.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process messages by splitting on newlines
        const messages = buffer.split('\n');
        buffer = messages.pop(); // Retain incomplete message
        messages.forEach((message) => {
          console.log('Data from Serial:', message);
          setSerialOutput((prevOutput) => prevOutput + message + '\n');
        });
      }
    } catch (error) {
      console.error('Error reading from serial port:', error);
    } finally {
      // Ensure the reader is released properly
      if (reader) {
        await reader.cancel();
        reader.releaseLock();
        setReader(null);
      }
    }
  };

  // Send commands to Arduino
  const sendCommandsToArduino = async (commands) => {
    if (!port) {
      throw new Error('Serial port is not connected.');
    }

    const writer = port.writable.getWriter();
    try {
      for (const command of commands) {
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(`${command}\n`));
        console.log(`Command sent: ${command}`);
      }
    } catch (error) {
      console.error('Error writing to serial port:', error);
    } finally {
      writer.releaseLock();
    }
  };

  const disconnectSerial = async () => {
    if (!port) {
      console.log('No port to disconnect.');
      return;
    }

    try {
      if (reader) {
        console.log('Cancelling the current reader...');
        await reader.cancel();
        reader.releaseLock();
        setReader(null);
        console.log('Reader released.');
      }

      await port.close();
      setPort(null);
      setIsConnected(false);
      console.log('Serial port disconnected successfully.');
    } catch (error) {
      console.error('Error disconnecting from serial port:', error);
    }
  };

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
      {!isConnected ? (
        <div className="connection-prompt">
          <h1>Connect to Arduino</h1>
          <button className="connectButton ConnectButton" onClick={connectSerial} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect to Serial Port'}
          </button>
        </div>
      ) : (
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
              <button className='disconnectButton DisconnectSerial' 
                  onClick={disconnectSerial}
                  disabled={!isConnected}
                >
                  Disconnect Serial
              </button>
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
            <i className="fa-solid fa-door-open"></i>
            </span>
            </button>
        </div>
        <div className="check">CHECK</div>
      </div>
      )}
    </div>
  );
};

export default Taste;

