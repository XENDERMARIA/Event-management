# 🎉 EventHub - Mini Event Platform

A full-stack MERN application for creating, managing, and RSVPing to events with robust concurrency handling and a beautiful responsive UI.

![EventHub](https://img.shields.io/badge/MERN-Stack-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-production-brightgreen)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Live Demo](#-live-demo)
- [Local Setup](#-local-setup)
- [Technical Deep Dive: RSVP Concurrency Handling](#-technical-deep-dive-rsvp-concurrency-handling)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)

---

## ✨ Features

### Core Features
- **User Authentication**: Secure registration and login with JWT tokens
- **Event Management**: Full CRUD operations for events
- **Image Upload**: Cloudinary integration for event images
- **RSVP System**: Join/leave events with strict capacity enforcement
- **Responsive Design**: Seamless experience across all devices

### Bonus Features
- **AI Description Generator**: Auto-generate event descriptions using AI
- **Search & Filtering**: Search by title, filter by category and date
- **User Dashboard**: View created events and RSVPs
- **Dark Mode**: Toggle between light and dark themes
- **Advanced Validation**: Real-time form validation with error feedback

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Router v6, Axios, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens), bcrypt |
| **Image Storage** | Cloudinary |
| **State Management** | React Context API |

---

## 🌐 Live Demo

- **Frontend**: [https://your-frontend-url.vercel.app](https://your-frontend-url.vercel.app)
- **Backend API**: [https://your-backend-url.onrender.com](https://your-backend-url.onrender.com)

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+ 
- MongoDB (local or Atlas connection string)
- Cloudinary account (for image uploads)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/event-platform.git
cd event-platform
```

#### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventplatform
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

#### 3. Frontend Setup
```bash
cd ../client
npm install
```

Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Start the client:
```bash
npm run dev
```

#### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🔒 Technical Deep Dive: RSVP Concurrency Handling

### The Problem
When multiple users attempt to RSVP simultaneously for the last available spot, we face a classic **race condition**:

1. User A checks capacity: 1 spot left ✓
2. User B checks capacity: 1 spot left ✓
3. User A RSVPs: Success (0 spots left)
4. User B RSVPs: Should fail, but naive implementation allows it → **Overbooking!**

### Our Solution: MongoDB Atomic Operations with Optimistic Concurrency

We use **atomic `findOneAndUpdate`** with conditional queries to ensure only one user can claim the last spot:

```javascript
// server/controllers/rsvpController.js

const joinEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // ATOMIC OPERATION: Only update if conditions are met
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        // Condition 1: User not already in attendees list
        attendees: { $ne: userId },
        // Condition 2: Current attendee count is less than capacity
        $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }
      },
      {
        // Atomic push - only executes if all conditions pass
        $addToSet: { attendees: userId }
      },
      {
        new: true,
        session,
        runValidators: true
      }
    );

    if (!event) {
      await session.abortTransaction();
      
      // Determine the specific reason for failure
      const existingEvent = await Event.findById(eventId);
      
      if (!existingEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      if (existingEvent.attendees.includes(userId)) {
        return res.status(400).json({ message: 'You have already RSVPed to this event' });
      }
      
      if (existingEvent.attendees.length >= existingEvent.capacity) {
        return res.status(400).json({ message: 'Event is at full capacity' });
      }
      
      return res.status(400).json({ message: 'Unable to RSVP. Please try again.' });
    }

    await session.commitTransaction();
    
    res.status(200).json({
      message: 'Successfully RSVPed to event',
      event,
      spotsRemaining: event.capacity - event.attendees.length
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};
```

### Why This Works

| Strategy | Description |
|----------|-------------|
| **Atomic `$addToSet`** | MongoDB executes the entire operation as a single atomic unit - no other operation can interleave |
| **Conditional Query** | The update ONLY executes if `$size(attendees) < capacity` at the exact moment of execution |
| **`$ne` Check** | Prevents duplicate RSVPs in the same atomic operation |
| **MongoDB Transactions** | Provides ACID guarantees for multi-document operations |

### Concurrency Test Scenario

```
Time    User A                     User B                    Database State
─────────────────────────────────────────────────────────────────────────────
T1      findOneAndUpdate()         -                         attendees: [], capacity: 1
T2      Query matches ✓            findOneAndUpdate()        attendees: [], capacity: 1
T3      $addToSet executes         Query waiting...          attendees: [A], capacity: 1
T4      Returns success            Query evaluates           attendees: [A], capacity: 1
T5      -                          Condition fails ✗         $size(1) < 1 = FALSE
T6      -                          Returns "full capacity"   attendees: [A], capacity: 1
```

**Result**: User A gets the spot, User B is correctly rejected. No overbooking! ✅

### Additional Safeguards

1. **Idempotency**: Using `$addToSet` instead of `$push` prevents duplicates even if the same request is sent twice
2. **Version Field**: Events have a `__v` version field for additional optimistic locking if needed
3. **Transaction Retry**: Failed transactions can be safely retried without side effects

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive JWT | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Event Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | Get all events | No |
| GET | `/api/events/:id` | Get single event | No |
| POST | `/api/events` | Create new event | Yes |
| PUT | `/api/events/:id` | Update event (owner only) | Yes |
| DELETE | `/api/events/:id` | Delete event (owner only) | Yes |

### RSVP Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/events/:id/rsvp` | RSVP to an event | Yes |
| DELETE | `/api/events/:id/rsvp` | Cancel RSVP | Yes |
| GET | `/api/users/my-rsvps` | Get user's RSVPs | Yes |

---

## 📁 Project Structure

```
event-platform/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── SearchFilter.jsx
│   │   │   └── ...
│   │   ├── pages/            # Route pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── CreateEvent.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ...
│   │   ├── context/          # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helper functions
│   │   ├── styles/           # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express Backend
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── rsvpController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── errorHandler.js
│   │   └── upload.js         # Multer + Cloudinary
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── aiDescription.js  # AI description generator
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 🔐 Environment Variables

### Server (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=development
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

## 🚢 Deployment Guide

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Frontend (Vercel)
1. Import project from GitHub
2. Framework preset: Vite
3. Add environment variables
4. Deploy

### Database (MongoDB Atlas)
1. Create a free cluster
2. Set up database user
3. Whitelist IP addresses (or allow all: 0.0.0.0/0)
4. Get connection string for your server

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built as part of a Full Stack Developer Intern assessment
- UI inspired by modern event platforms
- Icons from Heroicons and Lucide React

---

**Made with ❤️ using the MERN Stack**
# Event-management
