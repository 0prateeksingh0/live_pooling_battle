# 🎯 Live Poll Battle

A **real-time polling application** that enables users to create or join poll rooms and vote live. Results are instantly synchronized across all participants in a room, providing a fast and interactive experience.

![image](https://github.com/user-attachments/assets/1252abcb-fd31-4fcd-99e0-50051bcd281c)  
![image](https://github.com/user-attachments/assets/670f5eb5-dced-4fba-bce8-c78c6b2af02c)  
![image](https://github.com/user-attachments/assets/b0dee1ed-e9d2-430f-b6a3-956198ad0533)

---

## 🚀 Features

- ✅ Create or join poll rooms with unique room codes  
- 🔄 Real-time updates using **WebSockets (Socket.io)**  
- 👤 Lightweight user authentication (username only, no password)  
- ⏳ Synchronized 60-second countdown timer per poll  
- 🚫 Voting restrictions to prevent duplicate submissions  
- 🔄 Vote persistence across page refreshes  
- 🔀 Multi-room support with independent polling sessions  

---

## 🛠️ Tech Stack

| Layer      | Technology         |
|------------|--------------------|  
| Frontend   | React.js           |
| Backend    | Node.js, Socket.io |

---

## 📁 Project Structure
live-poll-battle/
├── client/ # React frontend application 
└── server/ # Node.js backend with Socket.io


---

## ⚙️ Setup Instructions

### ✅ Prerequisites

- **Node.js** (v14+)
- **npm** (v6+)

---

### 🧩 Backend Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```

The backend server will run at: http://localhost:5000

### 🎨 Frontend Setup

1. Navigate to the client folder:
   ```bash
   cd client
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run at: http://localhost:3000

---

## How It Works

### Room Management and Vote State Sharing

The application uses Socket.io for real-time communication between the server and clients. When a user creates a room, a unique room code is generated on the server. Users can join existing rooms using these codes.

The server maintains an in-memory store of all active rooms, including:
- Room information (code, creator, creation time)
- Poll question and options
- Current votes for each option
- Connected users and their voting status
- Timer state

When a user votes, the server updates the room state and broadcasts the new state to all connected clients in that room. This ensures all users see the same vote counts in real-time.

The countdown timer is synchronized across all clients, with the server being the source of truth for the remaining time. Once the timer expires, voting is disabled for that room.

Local storage is used on the client side to persist user information and votes, allowing users to maintain their session even after page refreshes.
