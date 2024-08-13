import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
  res.send("server is up and running");
});

// Variable to store the hash of the last received data
let lastDataHash = null;

// Function to generate a hash for the data
function generateHash(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

wss.on("connection", (ws) => {
  console.log("A new WebSocket client connected.");

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const currentDataHash = generateHash(data);
    console.log(`Received: ${message}`);

    if (currentDataHash !== lastDataHash) {
      // Broadcast the new data to all clients except the sender
      console.log(
        "Broadcasting message to other clients:",
        JSON.stringify(data)
      );
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
          console.log("Broadcasting to client:", JSON.stringify(data));
        }
      });

      lastDataHash = currentDataHash;
    }
  });

  ws.on("close", () => {
    console.log("A WebSocket client disconnected.");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
