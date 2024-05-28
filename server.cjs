const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const path = require('path');

const app = express();
const PORT_NAME = 'COM9';
const BAUD_RATE = 9600;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/send-commands', (req, res) => {
  const { commands } = req.body;
  if (!commands || !Array.isArray(commands)) {
    res.status(400).send('No commands provided.');
    return;
  }

  writeToSerialPort(commands.join('\n'), () => {
    res.send(`Commands sent: ${commands.join(', ')}`);
  });
});

function writeToSerialPort(data, callback) {
  const port = new SerialPort({ path: PORT_NAME, baudRate: BAUD_RATE }, (err) => {
    if (err) {
      console.error('Failed to open port:', err.message);
      return;
    }

    port.write(data + '\n', (err) => {
      if (err) {
        console.error('An error occurred while writing to the serial port.', err);
      } else {
        console.log('Data written to the serial port:', data.trim());
        callback();
      }

      port.close((err) => {
        if (err) {
          console.error('An error occurred while closing the serial port.', err);
        }
      });
    });
  });
}

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
