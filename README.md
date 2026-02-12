# SkillShare - Technical Documentation

## Project Overview

**SkillShare** is a peer-to-peer skill exchange platform that connects learners and mentors for collaborative learning sessions. The platform enables users to teach what they know and learn what they need through structured sessions, projects, and real-time communication.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Features & Algorithms](#core-features--algorithms)
4. [Database Design](#database-design)
5. [Authentication & Security](#authentication--security)
6. [Real-Time Communication](#real-time-communication)
7. [Deployment Architecture](#deployment-architecture)
8. [API Documentation](#api-documentation)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Frontend │◄───────►│  FastAPI Backend │◄───────►│  Firebase DB    │
│  (Vercel)       │         │  (Render)        │         │  (Firestore)    │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │
        │                            │
        │                   ┌────────▼────────┐
        │                   │                 │
        └──────────────────►│  Socket.IO      │
                            │  (WebSockets)   │
                            │                 │
                            └─────────────────┘
```

### Architecture Layers

1. **Presentation Layer** (Frontend)
   - React with TypeScript
   - Vite build system
   - Responsive UI with Tailwind CSS
   - Client-side routing with React Router

2. **Application Layer** (Backend)
   - FastAPI REST API
   - Socket.IO for real-time events
   - JWT-based authentication
   - Business logic processing

3. **Data Layer**
   - Firebase Firestore (NoSQL)
   - Real-time data synchronization
   - Document-based storage

---

## Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Framer Motion** | Animations | 11.x |
| **Axios** | HTTP Client | 1.x |
| **Socket.IO Client** | WebSocket Client | 4.x |
| **React Router** | Client Routing | 6.x |
| **Sonner** | Toast Notifications | Latest |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Python** | Programming Language | 3.11.9 |
| **FastAPI** | Web Framework | Latest |
| **Uvicorn** | ASGI Server | Latest |
| **Socket.IO** | WebSocket Server | Latest |
| **Firebase Admin SDK** | Database & Auth | Latest |
| **Pydantic** | Data Validation | Latest |
| **SendGrid** | Email Service | Latest |

### Infrastructure & Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend Hosting |
| **Render** | Backend Hosting |
| **Firebase** | Database & Authentication |
| **GitHub** | Version Control & CI/CD |

---

## Core Features & Algorithms

### 1. User Matching Algorithm

**Purpose:** Match learners with mentors based on skills and interests.

**Algorithm Type:** Weighted Scoring System

**Implementation:**
```python
def calculate_match_score(user_skills, user_interests, target_user):
    score = 0
    
    # Skill-Interest Overlap (60% weight)
    skill_overlap = set(user_interests) & set(target_user.skills)
    score += len(skill_overlap) * 30
    
    # Interest-Skill Overlap (40% weight)
    interest_overlap = set(user_skills) & set(target_user.interests)
    score += len(interest_overlap) * 20
    
    # Trust Score Bonus (up to 20% boost)
    trust_multiplier = 1 + (target_user.trustScore / 500)
    score *= trust_multiplier
    
    return min(score, 100)  # Cap at 100
```

**Time Complexity:** O(n × m) where n = number of users, m = average skills per user

**Features:**
- Bidirectional matching (skills ↔ interests)
- Trust score weighting
- Real-time match notifications

---

### 2. Dynamic Trust Score System

**Purpose:** Calculate user reliability based on activity and ratings.

**Algorithm Type:** Multi-Factor Weighted Scoring

**Components:**

1. **Manual Ratings** (Base Score)
   - User-submitted ratings (0-100 scale)
   - Weighted average of all ratings

2. **Activity Bonuses:**
   - Completed sessions: +0.5 per session (max +10)
   - Projects joined: +1 per project (max +5)
   - Streak bonus: +0.2 per week (max +5)
   - Message activity: +0.1 per 10 messages (max +3)

**Formula:**
```
Trust Score = min(Base Trust + Activity Trust, 100)
```

**Implementation:**
```python
def calculate_trust_score(user_data, sessions, projects, messages):
    # Base trust from ratings
    ratings = user_data.get("ratings", [])
    base_trust = sum(r["score"] for r in ratings) / len(ratings) if ratings else 0
    
    # Activity bonuses
    activity_trust = 0
    completed_sessions = [s for s in sessions if s["status"] == "COMPLETED"]
    activity_trust += min(len(completed_sessions) * 0.5, 10)
    activity_trust += min(len(projects) * 1.0, 5)
    
    streak = user_data.get("streak", 0)
    activity_trust += min((streak // 7) * 0.2, 5)
    activity_trust += min((len(messages) // 10) * 0.1, 3)
    
    return min(base_trust + activity_trust, 100)
```

**Update Frequency:** Every 1 hour (cached)

---

### 3. XP & Leveling System

**Purpose:** Gamify user engagement and track progress.

**Algorithm Type:** Linear Progression with Milestones

**XP Calculation:**
```python
def calculate_xp(sessions, session_duration_minutes, bonus_xp):
    # Base XP per session completion
    base_xp = 50
    
    # Duration bonus: 10 XP per 30 minutes
    duration_xp = (session_duration_minutes // 30) * 10
    
    # Total XP
    total_xp = (base_xp + duration_xp) + bonus_xp
    
    return total_xp
```

**Level Calculation:**
```python
def calculate_level(xp):
    # Every 100 XP = 1 level
    return 1 + (xp // 100)
```

**XP Sources:**
- Session completion: 50 base XP
- Session duration: +10 XP per 30 minutes
- Daily check-in: +10 bonus XP
- Streak bonuses: Variable

---

### 4. Session Scheduling Algorithm

**Purpose:** Manage session lifecycle and prevent conflicts.

**States:**
- `PENDING` - Awaiting acceptance
- `SCHEDULED` - Confirmed and scheduled
- `COMPLETED` - Finished successfully
- `CANCELLED` - Cancelled by either party

**Conflict Detection:**
```python
def has_scheduling_conflict(user_id, proposed_time, duration):
    existing_sessions = get_user_sessions(user_id, status="SCHEDULED")
    
    proposed_start = proposed_time
    proposed_end = proposed_time + timedelta(minutes=duration)
    
    for session in existing_sessions:
        session_start = session["scheduledAt"]
        session_end = session_start + timedelta(minutes=session["duration"])
        
        # Check for overlap
        if (proposed_start < session_end and proposed_end > session_start):
            return True
    
    return False
```

---

### 5. Real-Time Messaging System

**Technology:** Socket.IO (WebSocket protocol)

**Architecture:**
```
Client A ──► Socket.IO Server ──► Client B
          (emit message)      (broadcast to room)
```

**Message Flow:**
1. Client sends message via Socket.IO
2. Server validates sender authentication
3. Message saved to Firestore
4. Server emits to recipient's room
5. Recipient receives real-time notification

**Implementation:**
```python
@sio.event
async def send_message(sid, data):
    sender_id = data["senderId"]
    receiver_id = data["receiverId"]
    content = data["content"]
    
    # Save to database
    message_ref = db.collection("messages").document()
    message_ref.set({
        "senderId": sender_id,
        "receiverId": receiver_id,
        "content": content,
        "timestamp": datetime.now(),
        "read": False
    })
    
    # Emit to receiver's room
    await sio.emit("receive_message", {
        "senderId": sender_id,
        "content": content,
        "timestamp": datetime.now().isoformat()
    }, room=receiver_id)
```

---

### 6. Daily Streak Tracking

**Purpose:** Encourage daily engagement.

**Algorithm:**
```python
def update_streak(user_data, current_date):
    last_check_in = user_data.get("lastCheckIn")
    
    if not last_check_in:
        return 1  # First check-in
    
    last_date = last_check_in.date()
    today = current_date.date()
    
    # Same day - no change
    if last_date == today:
        return user_data.get("streak", 0)
    
    # Consecutive day - increment
    if (today - last_date).days == 1:
        return user_data.get("streak", 0) + 1
    
    # Streak broken - reset
    return 1
```

**Features:**
- Daily check-in bonus: +10 XP
- Streak multiplier for trust score
- Visual streak counter in UI

---

## Database Design

### Firestore Collections

#### 1. **users** Collection

```typescript
interface User {
  id: string;                    // Firebase UID
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  headline?: string;
  
  // Skills & Interests
  skills: string[];              // What they can teach
  interests: string[];           // What they want to learn
  experienceLevel: string;       // Beginner/Intermediate/Advanced
  
  // Gamification
  xp: number;                    // Total experience points
  level: number;                 // Current level
  sessions: number;              // Total sessions completed
  totalHours: number;            // Total learning hours
  bonusXp: number;               // Bonus XP from activities
  
  // Engagement
  streak: number;                // Daily check-in streak
  lastCheckIn: Timestamp;        // Last check-in date
  dailyGoalProgress: number;     // Progress towards daily goal
  
  // Trust & Reputation
  trustScore: number;            // 0-100 trust score
  ratings: Array<{               // User ratings
    raterId: string;
    score: number;
  }>;
  
  // Metadata
  createdAt: Timestamp;
  lastCalculated: Timestamp;     // Last stats recalculation
  availability: string;
}
```

#### 2. **sessions** Collection

```typescript
interface Session {
  id: string;
  teacherId: string;             // Mentor user ID
  learnerId: string;             // Student user ID
  
  skill: string;                 // Skill being taught
  topic: string;                 // Session topic
  description?: string;
  
  // Scheduling
  scheduledAt: Timestamp;        // Session date/time
  duration: number;              // Duration in minutes
  
  // Status
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  
  // Session Details
  meetingLink?: string;          // Video call link
  notes?: string;                // Session notes
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 3. **projects** Collection

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;               // Project creator
  
  // Project Details
  type: string;                  // Web App, Mobile App, etc.
  stack: string[];               // Technologies used
  difficulty: string;            // Beginner/Intermediate/Advanced
  
  // Team
  memberIds: string[];           // Team member IDs
  totalSpots: number;            // Max team size
  
  // Repository
  githubRepo?: string;           // GitHub repository URL
  
  // Status
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4. **messages** Collection

```typescript
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  
  // Status
  read: boolean;
  
  // Metadata
  timestamp: Timestamp;
}
```

#### 5. **matches** Collection

```typescript
interface Match {
  id: string;
  userId: string;                // User who initiated
  matchedUserId: string;         // Matched user
  
  // Match Details
  matchScore: number;            // 0-100 match score
  commonSkills: string[];        // Overlapping skills
  
  // Status
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  
  // Metadata
  createdAt: Timestamp;
}
```

---

## Authentication & Security

### Firebase Authentication

**Flow:**
1. User registers/logs in via Firebase Auth
2. Firebase returns JWT token
3. Frontend stores token in memory
4. Token sent with every API request
5. Backend verifies token with Firebase Admin SDK

**Implementation:**

**Frontend (api.ts):**
```typescript
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

**Backend (main.py):**
```python
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split("Bearer ")[1]
    
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Security Features

1. **JWT Token Validation**
   - Every API request requires valid Firebase JWT
   - Tokens expire after 1 hour
   - Automatic token refresh on client

2. **CORS Protection**
   - Configured allowed origins
   - Credentials support enabled
   - Prevents unauthorized cross-origin requests

3. **Input Validation**
   - Pydantic models for request validation
   - Type checking on all inputs
   - SQL injection prevention (NoSQL database)

4. **Rate Limiting**
   - Implemented at infrastructure level (Render)
   - Prevents abuse and DDoS attacks

---

## Real-Time Communication

### Socket.IO Architecture

**Events:**

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_room` | Client → Server | Join user's personal room |
| `send_message` | Client → Server | Send chat message |
| `receive_message` | Server → Client | Receive chat message |
| `xp_update` | Server → Client | XP earned notification |
| `level_up` | Server → Client | Level up notification |
| `new_match` | Server → Client | New match notification |

**Room-Based Broadcasting:**
- Each user has a personal room (their UID)
- Server emits events to specific user rooms
- Ensures messages reach only intended recipients

**Connection Lifecycle:**
```
1. User logs in
2. Frontend establishes Socket.IO connection
3. Client emits join_room with user UID
4. Server adds client to room
5. Real-time events flow bidirectionally
6. On logout/disconnect, client leaves room
```

---

## Deployment Architecture

### Frontend Deployment (Vercel)

**Build Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Environment Variables:**
- `VITE_API_URL` - Backend API URL
- `VITE_FIREBASE_*` - Firebase configuration

**Features:**
- Automatic deployments on Git push
- Edge network CDN
- SPA routing with rewrites
- HTTPS by default

### Backend Deployment (Render)

**Configuration:**
```yaml
services:
  - type: web
    name: skillshare-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:socket_app --host 0.0.0.0 --port 10000
```

**Environment Variables:**
- `PYTHON_VERSION` - 3.11.9
- `FIREBASE_CREDENTIALS` - Service account JSON
- `SENDGRID_API_KEY` - Email service key
- `FRONTEND_URL` - CORS allowed origin

**Features:**
- Auto-deploy on Git push
- Health checks
- Auto-scaling
- HTTPS/SSL certificates

---

## API Documentation

### Authentication Endpoints

#### POST `/auth/register`
Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "firebase_uid"
}
```

---

### User Endpoints

#### GET `/users/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Response:**
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "xp": 250,
  "level": 3,
  "sessions": 5,
  "totalHours": 3.5,
  "trustScore": 85.5,
  "skills": ["React", "Python"],
  "interests": ["Machine Learning", "DevOps"]
}
```

#### PUT `/users/me`
Update user profile.

**Request:**
```json
{
  "bio": "Full-stack developer passionate about teaching",
  "skills": ["React", "Python", "Docker"],
  "interests": ["Kubernetes", "AI"]
}
```

---

### Session Endpoints

#### GET `/sessions`
Get user's sessions.

**Query Parameters:**
- `status` - Filter by status (optional)

**Response:**
```json
[
  {
    "id": "session123",
    "teacherId": "user456",
    "learnerId": "user789",
    "skill": "React",
    "topic": "React Hooks Deep Dive",
    "scheduledAt": "2026-02-15T14:00:00Z",
    "duration": 60,
    "status": "SCHEDULED"
  }
]
```

#### POST `/sessions`
Create new session request.

**Request:**
```json
{
  "teacherId": "user456",
  "skill": "Python",
  "topic": "FastAPI Basics",
  "scheduledAt": "2026-02-20T10:00:00Z",
  "duration": 90
}
```

#### PUT `/sessions/{session_id}`
Update session (accept/complete/cancel).

**Request:**
```json
{
  "status": "COMPLETED"
}
```

---

### Matching Endpoints

#### GET `/matches`
Get potential matches for current user.

**Response:**
```json
[
  {
    "id": "user123",
    "name": "Jane Smith",
    "avatar": "https://...",
    "matchScore": 85,
    "skills": ["Python", "Django"],
    "interests": ["React", "TypeScript"],
    "trustScore": 92
  }
]
```

#### POST `/matches`
Send match request.

**Request:**
```json
{
  "targetUserId": "user456"
}
```

---

### Project Endpoints

#### GET `/projects`
Get all active projects.

**Response:**
```json
[
  {
    "id": "proj123",
    "title": "E-commerce Platform",
    "description": "Building a full-stack e-commerce app",
    "type": "Web App",
    "stack": ["React", "Node.js", "MongoDB"],
    "difficulty": "Intermediate",
    "memberIds": ["user1", "user2"],
    "totalSpots": 4,
    "status": "ACTIVE"
  }
]
```

#### POST `/projects`
Create new project.

**Request:**
```json
{
  "title": "AI Chatbot",
  "description": "Building an AI-powered customer support bot",
  "type": "API",
  "stack": ["Python", "TensorFlow", "FastAPI"],
  "difficulty": "Advanced",
  "totalSpots": 3
}
```

---

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**
   - Lazy loading of dashboard pages
   - Reduces initial bundle size
   - Faster first contentful paint

2. **Memoization**
   - `useMemo` for expensive calculations
   - `React.memo` for component optimization
   - Prevents unnecessary re-renders

3. **Image Optimization**
   - Lazy loading images
   - Responsive image sizes
   - WebP format support

### Backend Optimizations

1. **Caching**
   - User profile caching (1 hour TTL)
   - Trust score calculation caching
   - Reduces database reads

2. **Query Optimization**
   - Indexed Firestore queries
   - Batch operations where possible
   - Pagination for large datasets

3. **Async Operations**
   - FastAPI async/await
   - Non-blocking I/O
   - Concurrent request handling

---

## Testing Strategy

### Frontend Testing
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright (planned)

### Backend Testing
- Unit tests with pytest
- API endpoint tests
- Integration tests with test database

---

## Future Enhancements

1. **Video Calling Integration**
   - WebRTC for peer-to-peer calls
   - Screen sharing capability
   - Recording sessions

2. **AI-Powered Recommendations**
   - Machine learning for better matching
   - Personalized learning paths
   - Content recommendations

3. **Mobile Application**
   - React Native app
   - Push notifications
   - Offline mode

4. **Analytics Dashboard**
   - Learning progress tracking
   - Session analytics
   - Performance metrics

---

## Conclusion

SkillShare is a comprehensive peer-to-peer learning platform built with modern web technologies. It leverages real-time communication, gamification, and intelligent matching algorithms to create an engaging learning experience. The system is designed to be scalable, secure, and maintainable, with a clear separation of concerns and robust architecture.

**Key Technical Achievements:**
- Real-time bidirectional communication with Socket.IO
- Secure JWT-based authentication
- Dynamic trust scoring system
- Intelligent user matching algorithm
- Responsive and accessible UI
- Cloud-native deployment architecture
- NoSQL database design with Firestore

This platform demonstrates proficiency in full-stack development, real-time systems, cloud deployment, and modern software engineering practices.
