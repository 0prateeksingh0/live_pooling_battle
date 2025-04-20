import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const PollRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  
  const [username, setUsername] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [pollEnded, setPollEnded] = useState(false);
  
  // Load user data from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    const savedRoomCode = localStorage.getItem('roomCode');
    const savedUserData = localStorage.getItem('userData');
    
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    // Check if user has voted before
    if (savedUserData) {
      const userData = JSON.parse(savedUserData);
      if (userData.roomCode === roomCode && userData.votedOption) {
        setSelectedOption(userData.votedOption);
        setHasVoted(true);
      }
    }
    
    // If no username or different room, redirect to home
    if (!savedUsername || (savedRoomCode && savedRoomCode !== roomCode)) {
      navigate('/');
    }
  }, [roomCode, navigate]);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Join the room
    socket.emit('join_room', { username, roomCode }, (response) => {
      setLoading(false);
      
      if (response.success) {
        setRoomData(response.roomData);
        setTimeRemaining(response.roomData.timeRemaining);
        
        if (!response.roomData.isActive) {
          setPollEnded(true);
        }
        
        // Check if user has already voted
        const user = response.roomData.users.find(u => u.username === username);
        if (user && user.hasVoted) {
          setHasVoted(true);
          setSelectedOption(user.votedOption);
          
          // Update localStorage
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          userData.votedOption = user.votedOption;
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
    
    // Listen for room updates
    socket.on('room_update', (updatedRoomData) => {
      setRoomData(updatedRoomData);
    });
    
    // Listen for time updates
    socket.on('time_update', ({ timeRemaining }) => {
      setTimeRemaining(timeRemaining);
    });
    
    // Listen for poll end
    socket.on('poll_ended', (finalRoomData) => {
      setRoomData(finalRoomData);
      setPollEnded(true);
    });
    
    return () => {
      socket.off('room_update');
      socket.off('time_update');
      socket.off('poll_ended');
    };
  }, [socket, connected, username, roomCode]);
  
  const handleVote = (option) => {
    if (hasVoted || pollEnded) return;
    
    setSelectedOption(option);
    
    socket.emit('submit_vote', { option }, (response) => {
      if (response.success) {
        setHasVoted(true);
        
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.votedOption = option;
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        setError(response.error || 'Failed to submit vote');
        setSelectedOption(null);
      }
    });
  };
  
  const getTotalVotes = () => {
    if (!roomData || !roomData.votes) return 0;
    return roomData.votes.reduce((sum, count) => sum + count, 0);
  };
  
  const getVotePercentage = (index) => {
    const totalVotes = getTotalVotes();
    if (totalVotes === 0) return 0;
    return Math.round((roomData.votes[index] / totalVotes) * 100);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (loading) {
    return <div className="card">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="card">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }
  
  if (!roomData) {
    return (
      <div className="card">
        <h2>Room Not Found</h2>
        <p>The poll room you're looking for doesn't exist or has expired.</p>
        <button className="btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="text-center mb-2">
        <h2>{roomData.question}</h2>
        <p>Room Code: <span className="room-code">{roomCode}</span></p>
        <p>Created by: {roomData.createdBy}</p>
        
        <div className={`timer ${timeRemaining <= 10 ? 'danger' : timeRemaining <= 30 ? 'warning' : ''}`}>
          {pollEnded ? (
            <span>Poll has ended</span>
          ) : (
            <span>Time remaining: {formatTime(timeRemaining)}</span>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        {roomData.options.map((option, index) => (
          <div key={index} className="mb-2">
            <button
              className={`option-btn ${selectedOption === option ? 'selected' : ''} ${hasVoted || pollEnded ? 'disabled' : ''}`}
              onClick={() => handleVote(option)}
              disabled={hasVoted || pollEnded}
            >
              {option}
              {(hasVoted || pollEnded) && (
                <span style={{ float: 'right' }}>
                  {roomData.votes[index]} votes ({getVotePercentage(index)}%)
                </span>
              )}
            </button>
            
            {(hasVoted || pollEnded) && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getVotePercentage(index)}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {hasVoted && (
        <p className="text-center">
          You voted for <strong>{selectedOption}</strong>
        </p>
      )}
      
      <div className="text-center">
        <p>Total votes: {getTotalVotes()}</p>
        <p>Users in room: {roomData.users.length}</p>
      </div>
      
      <button className="btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/')}>
        Exit Room
      </button>
    </div>
  );
};

export default PollRoom;
