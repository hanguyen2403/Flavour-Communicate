package org.example;
import com.fazecast.jSerialComm.SerialPort;
import java.io.*;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Scanner;
public class Main {
    private static final String PORT_NAME = "COM9";
    private static final int BAUD_RATE = 9600;
    private static final int DATA_BITS = 8;
    private static final int STOP_BITS = 1;
    private static final int PARITY = 0;

    private static final String FILE_PATH = "src/data.txt";

    private static Queue<String> readFromFile(String path) {
        Queue<String> lines = new LinkedList<>();
        try {
            File file = new File(path);
            Scanner scanner = new Scanner(file);
            while (scanner.hasNextLine()) {
                String data = scanner.nextLine();
                lines.add(data);
                writeToSerialPort(data + "\n");
                deleteLineFromFile(FILE_PATH, lines);
            }
            scanner.close();
        } catch (FileNotFoundException e) {
            System.out.println("An error occurred.");
            e.printStackTrace();
        }
        return lines;
    }

    private static void deleteLineFromFile(String path, Queue<String> lines) {
        try {
            File file = new File(path);
            PrintWriter writer = new PrintWriter(file);
            lines.poll(); // remove the first line
            while (!lines.isEmpty()) {
                writer.println(lines.poll());
            }
            writer.close();
        } catch (FileNotFoundException e) {
            System.out.println("An error occurred.");
            e.printStackTrace();
        }
    }

    private static void writeToSerialPort(String data) {
        SerialPort comPort = SerialPort.getCommPort(PORT_NAME);
        if (!comPort.openPort()) {
            System.out.println("Failed to open port");
            return;
        }

        comPort.setComPortParameters(BAUD_RATE, DATA_BITS, STOP_BITS, PARITY);

        OutputStream out = comPort.getOutputStream();

        try {
            out.write(data.getBytes());
            out.flush();
            out.close();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            comPort.closePort();
        }
    }

    public static void main(String[] args) {
        Queue<String> lines = readFromFile(FILE_PATH);
    }
}


// SerialPort comPort = SerialPort.getCommPort("COM8");
// Open the port
//        if (!comPort.openPort()) {
//            System.out.println("Failed to open port");
//            return;
//        }
//
//        // Set port parameters if needed
//        comPort.setComPortParameters(9600, 8, 1, 0); // default parameters
//
//        // Get OutputStream from the port
//        OutputStream out = comPort.getOutputStream();
//
//        try {
//            // Write some data
//            String data = "Hello, COM8!\n";
//            out.write(data.getBytes()); // Write data to the port
//
//            // Always remember to flush and close the output stream
//            out.flush();
//            out.close();
//        } catch (Exception e) {
//            e.printStackTrace();
//        } finally {
//            // Close the port
//            comPort.closePort();
//        }


//    private static void readFromFile(String path) {
//        try {
//            File file = new File(path);
//            Scanner scanner = new Scanner(file);
//            while (scanner.hasNextLine()) {
//                String data = scanner.nextLine();
//                System.out.println(data);
//                writeToSerialPort(data + "\n");
//            }
//            scanner.close();
//        } catch (FileNotFoundException e) {
//            System.out.println("An error occurred.");
//            e.printStackTrace();
//        }
//    }