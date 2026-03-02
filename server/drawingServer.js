const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Drawing Board WebSocket Server Running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected users and their info
const users = new Map();
const canvasState = {
  drawings: [],
  texts: []
};

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Generate unique ID for this connection
  const userId = generateUserId();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join':
          // User joins the session
          users.set(userId, {
            id: userId,
            username: data.username,
            role: data.role,
            ws: ws
          });

          // Send current users list to new user
          ws.send(JSON.stringify({
            type: 'init',
            userId: userId,
            users: Array.from(users.values()).map(u => ({
              id: u.id,
              username: u.username,
              role: u.role
            })),
            canvasState: canvasState
          }));

          // Broadcast new user to all other users
          broadcast({
            type: 'userJoined',
            user: {
              id: userId,
              username: data.username,
              role: data.role
            }
          }, userId);

          console.log(`User ${data.username} (${data.role}) joined`);
          break;

        case 'draw':
          // Persist drawing and broadcast to all other users
          canvasState.drawings.push(data.drawing);
          broadcast({
            type: 'draw',
            userId: userId,
            drawing: data.drawing
          }, userId);
          break;

        case 'addText':
          // Store text and broadcast
          canvasState.texts.push(data.text);
          broadcast({
            type: 'addText',
            userId: userId,
            text: data.text
          }, userId);
          break;

        case 'clear':
          // Clear canvas for everyone
          canvasState.drawings = [];
          canvasState.texts = [];
          broadcast({
            type: 'clear',
            userId: userId
          }, userId);
          break;

        case 'cursorMove':
          // Broadcast cursor position
          broadcast({
            type: 'cursorMove',
            userId: userId,
            username: users.get(userId)?.username,
            role: users.get(userId)?.role,
            position: data.position
          }, userId);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    const user = users.get(userId);
    if (user) {
      console.log(`User ${user.username} disconnected`);
      users.delete(userId);

      // Broadcast user left
      broadcast({
        type: 'userLeft',
        userId: userId
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast message to all connected clients except sender
function broadcast(message, excludeUserId = null) {
  const messageStr = JSON.stringify(message);
  users.forEach((user, id) => {
    if (id !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageStr);
    }
  });
}

// Generate unique user ID
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Drawing Board WebSocket Server running on port ${PORT}`);
});
