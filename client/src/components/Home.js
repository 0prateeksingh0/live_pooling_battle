import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const Home = () => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [action, setAction] = useState('join'); // 'join' or 'create'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  
  // Check for saved user data in localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);
  
  const handleCreateRoom = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Default poll question and options
    const pollData = {
      username,
      question: 'Which do you prefer?',
      options: ['Cats', 'Dogs']
    };
    
    socket.emit('create_room', pollData, (response) => {
      setLoading(false);
      
      if (response.success) {
        // Save user data to localStorage
        localStorage.setItem('username', username);
        localStorage.setItem('roomCode', response.roomCode);
        localStorage.setItem('userData', JSON.stringify({
          username,
          roomCode: response.roomCode,
          joinedAt: new Date().toISOString()
        }));
        
        // Navigate to the room
        navigate(`/room/${response.roomCode}`);
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  };
  
  const handleJoinRoom = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    socket.emit('join_room', { username, roomCode }, (response) => {
      setLoading(false);
      
      if (response.success) {
        // Save user data to localStorage
        localStorage.setItem('username', username);
        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('userData', JSON.stringify({
          username,
          roomCode,
          joinedAt: new Date().toISOString()
        }));
        
        // Navigate to the room
        navigate(`/room/${roomCode}`);
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === 'create') {
      handleCreateRoom(e);
    } else {
      handleJoinRoom(e);
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-center mb-2">
        {action === 'create' ? 'Create a New Poll Room' : 'Join an Existing Poll Room'}
      </h2>
      
      <div className="flex justify-between mb-2">
        <button 
          className={`btn ${action === 'join' ? '' : 'btn-secondary'}`}
          onClick={() => setAction('join')}
        >
          Join Room
        </button>
        <button 
          className={`btn ${action === 'create' ? '' : 'btn-secondary'}`}
          onClick={() => setAction('create')}
        >
          Create Room
        </button>
      </div>
      
      {error && <div className="error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Your Name:</label>
          <input
            type="text"
            id="username"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        
        {action === 'join' && (
          <div className="form-group">
            <label htmlFor="roomCode">Room Code:</label>
            <input
              type="text"
              id="roomCode"
              className="form-control"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              required
            />
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn" 
          style={{ width: '100%' }}
          disabled={loading || !connected}
        >
          {loading ? 'Loading...' : action === 'create' ? 'Create Room' : 'Join Room'}
        </button>
        
        {!connected && (
          <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>
            Connecting to server...
          </p>
        )}
      </form>
    </div>
  );
};

export default Home;
