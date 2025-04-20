import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PollRoom from './components/PollRoom';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="container">
          <div className="header">
            <h1>Live Poll Battle⚔️ </h1>
            <p>Create or join a poll room and vote in real-time!</p>
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomCode" element={<PollRoom />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
