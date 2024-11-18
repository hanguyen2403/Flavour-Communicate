import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmell } from '../../Context/SmellContext';
import './Smell.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Smell = () => {
  const navigate = useNavigate();
  const { channels, setChannels, port, setPort, isConnected, setIsConnected, reader, setReader } = useSmell();
  const [localChannels, setLocalChannels] = useState([...channels]);
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
  // Connect to the serial port
  const connectSerial = async () => {
    setIsLoading(true);
    try {
      if (!port) {
        const selectedPort = await navigator.serial.requestPort();
        await selectedPort.open({ baudRate: 9600 });
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
  

  // Send commands to Arduino (same as before)
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

  const handleDurationChange = (index, value) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].duration = value;
    setLocalChannels(updatedChannels);
  };

  const handleSmellNameChange = (index, value) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].smellName = value;
    setLocalChannels(updatedChannels);
  };

  const handleActivate = async (index) => {
    const updatedChannels = [...localChannels];
    updatedChannels[index].isActivated = true;
    setLocalChannels(updatedChannels);

    const channel = updatedChannels[index];
    const command = channel.isDurationInf
      ? `${index + 1} 1 inf`
      : `${index + 1} 1 ${channel.duration}`;

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
      {!isConnected ? (
        <div className="connection-prompt">
          <h1>Connect to Arduino</h1>
          <button className="connectButton ConnectButton" onClick={connectSerial} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect to Serial Port'}
          </button>
        </div>
      ) : (
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
                <button className='disconnectButton DisconnectSerial' 
                  onClick={disconnectSerial}
                  disabled={!isConnected}
                >
                  Disconnect Serial
                </button>
                <button className='outsideButton ActivateSelected' onClick={handleActivateSelected}>Activate Selected</button>
                <button className='outsideButton ActivateAll' onClick={handleActivateAll}>Activate All</button>
                <button className='outsideButton DeactivateAll' onClick={handleDeactivateAll}>Deactivate All</button>
              </div>
            </div>
          </div>
  
          <div className="switch-page">
            <button onClick={() => navigate('/taste')}>
              <span>Go to Taste</span>
              <span>
                <i className="fa-solid fa-door-open"></i>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );  
};

export default Smell;
