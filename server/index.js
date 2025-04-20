const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory storage for rooms
const rooms = new Map();

// Generate a unique 6-character room code
function generateRoomCode() {
  return nanoid(6);
}

// Helper to get room data in a clean format for clients
function getRoomData(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  
  return {
    roomCode: roomCode,
    question: room.question,
    options: room.options,
    votes: room.votes,
    createdBy: room.createdBy,
    createdAt: room.createdAt,
    timeRemaining: room.timeRemaining,
    isActive: room.isActive,
    users: Array.from(room.users.values()),
  };
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Create a new room
  socket.on('create_room', ({ username, question, options }, callback) => {
    const roomCode = generateRoomCode();
    const currentTime = Date.now();
    
    // Default to "Cats vs Dogs" if no question provided
    const pollQuestion = question || 'Which do you prefer?';
    const pollOptions = options || ['Cats', 'Dogs'];
    
    rooms.set(roomCode, {
      question: pollQuestion,
      options: pollOptions,
      votes: pollOptions.map(() => 0), // Initialize vote counts to 0
      createdBy: username,
      createdAt: currentTime,
      timeRemaining: 60, // 60 seconds timer
      isActive: true,
      users: new Map([[socket.id, { id: socket.id, username, hasVoted: false }]]),
      timer: null,
    });
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;
    
    // Start the countdown timer
    startRoomTimer(roomCode);
    
    callback({ success: true, roomCode, roomData: getRoomData(roomCode) });
    
    // Broadcast to all users in the room that a new user has joined
    io.to(roomCode).emit('room_update', getRoomData(roomCode));
    console.log(`Room created: ${roomCode} by ${username}`);
  });
  
  // Join an existing room
  socket.on('join_room', ({ username, roomCode }, callback) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    // Add user to the room
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;
    
    room.users.set(socket.id, { id: socket.id, username, hasVoted: false });
    
    callback({ success: true, roomData: getRoomData(roomCode) });
    
    // Broadcast to all users in the room that a new user has joined
    io.to(roomCode).emit('room_update', getRoomData(roomCode));
    console.log(`User ${username} joined room: ${roomCode}`);
  });
  
  // Handle user vote
  socket.on('submit_vote', ({ option }, callback) => {
    const roomCode = socket.roomCode;
    const room = rooms.get(roomCode);
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    if (!room.isActive) {
      callback({ success: false, error: 'Voting has ended for this room' });
      return;
    }
    
    const user = room.users.get(socket.id);
    
    if (!user) {
      callback({ success: false, error: 'User not found in room' });
      return;
    }
    
    if (user.hasVoted) {
      callback({ success: false, error: 'You have already voted' });
      return;
    }
    
    const optionIndex = room.options.indexOf(option);
    
    if (optionIndex === -1) {
      callback({ success: false, error: 'Invalid option' });
      return;
    }
    
    // Update vote count
    room.votes[optionIndex]++;
    
    // Mark user as voted
    user.hasVoted = true;
    user.votedOption = option;
    room.users.set(socket.id, user);
    
    callback({ success: true, roomData: getRoomData(roomCode) });
    
    // Broadcast updated room data to all users in the room
    io.to(roomCode).emit('room_update', getRoomData(roomCode));
    console.log(`User ${socket.username} voted for ${option} in room ${roomCode}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    
    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      
      // Remove user from the room
      room.users.delete(socket.id);
      
      // If room is empty, clean up
      if (room.users.size === 0) {
        clearInterval(room.timer);
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted (empty)`);
      } else {
        // Broadcast updated room data
        io.to(roomCode).emit('room_update', getRoomData(roomCode));
      }
    }
    
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Function to start the countdown timer for a room
function startRoomTimer(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  
  // Clear any existing timer
  if (room.timer) {
    clearInterval(room.timer);
  }
  
  room.timer = setInterval(() => {
    room.timeRemaining--;
    
    // Broadcast time update to all clients in the room
    io.to(roomCode).emit('time_update', { timeRemaining: room.timeRemaining });
    
    // If time is up, end the poll
    if (room.timeRemaining <= 0) {
      clearInterval(room.timer);
      room.isActive = false;
      io.to(roomCode).emit('poll_ended', getRoomData(roomCode));
      console.log(`Poll ended in room ${roomCode}`);
    }
  }, 1000);
}

// API endpoint to check if a room exists
app.get('/api/room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const roomExists = rooms.has(roomCode);
  
  res.json({ exists: roomExists });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
