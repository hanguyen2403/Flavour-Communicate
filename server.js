const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const port = 5000;
const FILE_PATH = 'data.txt';
const SERIAL_PORT = 'COM9';
const BAUD_RATE = 9600;

app.use(bodyParser.json());

// Setup the serial port
const arduinoPort = new SerialPort(SERIAL_PORT, { baudRate: BAUD_RATE });
const parser = arduinoPort.pipe(new Readline({ delimiter: '\n' }));

arduinoPort.on('open', () => {
  console.log('Serial Port Opened');
});

arduinoPort.on('error', (err) => {
  console.error('Error: ', err.message);
});

// Endpoint to receive commands from the frontend
app.post('/write', (req, res) => {
  const { data } = req.body;

  // Write data to the text file
  fs.appendFile(FILE_PATH, data + '\n', (err) => {
    if (err) {
      console.error('Error writing to file', err);
      return res.status(500).send('Error writing to file');
    }

    console.log('Data written to file:', data);

    // Send the command to the Arduino
    arduinoPort.write(data + '\n', (err) => {
      if (err) {
        console.error('Error writing to serial port', err);
        return res.status(500).send('Error writing to serial port');
      }
      console.log('Data sent to Arduino:', data);
      res.status(200).send('Data written to file and sent to Arduino');
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
