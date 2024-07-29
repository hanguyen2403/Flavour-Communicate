const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { Mutex } = require('async-mutex');

const app = express();
const PORT_NAME = 'COM16';
const BAUD_RATE = 115200;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mutex = new Mutex();

// Initialize the serial port once
const port = new SerialPort({ path: PORT_NAME, baudRate: BAUD_RATE }, (err) => {
  if (err) {
    console.error('Failed to open port:', err.message);
    return;
  }
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
parser.on('data', (data) => {
  console.log(data);
});

port.on('error', (err) => {
  console.error('Serial port error:', err.message);
});

async function writeToSerialPort(data) {
  return new Promise((resolve, reject) => {
    port.write(data + '\n', (err) => {
      if (err) {
        console.error('An error occurred while writing to the serial port.', err);
        reject(err);
      } else {
        console.log('Data written to the serial port:', data.trim());
        resolve();
      }
    });
  });
}

app.post('/send-commands', (req, res) => {
  const { commands } = req.body;
  if (!commands || !Array.isArray(commands)) {
    res.status(400).send('No commands provided.');
    return;
  }

  mutex.runExclusive(async () => {
    try {
      await writeToSerialPort(commands.join('\n'));
      res.send(`Commands sent: ${commands.join(', ')}`);
    } catch (error) {
      res.status(500).send('Failed to send commands.');
    }
  });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
