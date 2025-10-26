const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: config.MAX_BUFFER_SIZE,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Very simple in-memory transfer mapping (restart=reset)
const transferSessions = new Map();
const activeConnections = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create-transfer', ({ transferId }) => {
    socket.join(transferId);
    transferSessions.set(transferId, {
      transferId,
      sender: socket.id,
      receiver: null,
      status: 'waiting'
    });
    activeConnections.set(socket.id, { role: 'sender', transferId });
    socket.emit('transfer-created', { transferId });
  });

  socket.on('join-transfer', ({ transferId }) => {
    const session = transferSessions.get(transferId);
    if (!session || session.receiver) return;
    socket.join(transferId);
    session.receiver = socket.id;
    session.status = 'connected';
    activeConnections.set(socket.id, { role: 'receiver', transferId });
    io.to(session.sender).emit('receiver-connected', { transferId });
    socket.emit('joined-transfer', { transferId });
  });

  socket.on('upload-chunk', (data) => {
    const session = transferSessions.get(data.transferId);
    if (session?.receiver) {
      io.to(session.receiver).emit('receive-chunk', data);
    }
    socket.emit('chunk-uploaded', { chunkIndex: data.chunkIndex });
  });

  socket.on('transfer-complete', ({ transferId }) => {
    const session = transferSessions.get(transferId);
    if (session?.receiver) {
      io.to(session.receiver).emit('transfer-complete', { transferId });
    }
  });

  socket.on('disconnect', () => {
    activeConnections.delete(socket.id);
    // Optionally, cleanup logic here
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = config.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
