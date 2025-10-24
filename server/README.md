# Drawing Board WebSocket Server

This is the real-time multiplayer WebSocket server for the Collaborative Drawing Board feature.

## Setup Instructions

### 1. Install Dependencies

From the project root directory:

```bash
npm install ws
```

### 2. Start the WebSocket Server

```bash
node server/drawingServer.js
```

The server will start on port 8080 by default. You can change this by setting the PORT environment variable:

```bash
PORT=3001 node server/drawingServer.js
```

### 3. Configure the Frontend

The frontend will automatically try to connect to the WebSocket server at `ws://localhost:8080` (or `wss://` for HTTPS).

To use a different WebSocket URL, set the `REACT_APP_WS_URL` environment variable in your `.env` file:

```
REACT_APP_WS_URL=ws://your-server-url:8080
```

## Features

- **Real-time Drawing Synchronization**: All drawing actions are broadcasted to connected users
- **User Presence**: See who's online (teachers and students)
- **Role-based Identification**: Teachers appear in purple, students in blue
- **Cursor Tracking**: See where other users are pointing on the canvas
- **Text Annotations**: Add and share text on the drawing board
- **Clear Canvas**: Clear the canvas for all users
- **Automatic Fallback**: If WebSocket connection fails, the app works in local-only mode

## Protocol

### Client → Server Messages

- `join`: User joins the session
  ```json
  {
    "type": "join",
    "username": "John",
    "role": "teacher" | "student"
  }
  ```

- `draw`: User draws on the canvas
  ```json
  {
    "type": "draw",
    "drawing": {
      "from": { "x": 100, "y": 100 },
      "to": { "x": 150, "y": 150 },
      "color": "#000000",
      "lineWidth": 3,
      "tool": "pen" | "eraser"
    }
  }
  ```

- `addText`: User adds text to the canvas
  ```json
  {
    "type": "addText",
    "text": {
      "text": "Hello",
      "x": 100,
      "y": 100,
      "color": "#000000",
      "fontSize": 15
    }
  }
  ```

- `clear`: User clears the canvas
  ```json
  {
    "type": "clear"
  }
  ```

- `cursorMove`: User moves their cursor
  ```json
  {
    "type": "cursorMove",
    "position": { "x": 100, "y": 100 }
  }
  ```

### Server → Client Messages

- `init`: Initial state when user joins
  ```json
  {
    "type": "init",
    "userId": "user_123",
    "users": [...],
    "canvasState": { "drawings": [], "texts": [] }
  }
  ```

- `userJoined`: A new user joined
  ```json
  {
    "type": "userJoined",
    "user": { "id": "user_123", "username": "John", "role": "teacher" }
  }
  ```

- `userLeft`: A user disconnected
  ```json
  {
    "type": "userLeft",
    "userId": "user_123"
  }
  ```

- Other messages are broadcasted as received from clients

## Deployment

For production deployment, consider:

1. Using a process manager like PM2
2. Setting up SSL/TLS for WSS (secure WebSocket)
3. Adding authentication/authorization
4. Implementing rate limiting
5. Adding persistent storage for canvas state
6. Scaling with Redis for multi-server deployments

## Production Deployment Example

```bash
# Install PM2
npm install -g pm2

# Start the server with PM2
pm2 start server/drawingServer.js --name drawing-server

# Save the PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```
