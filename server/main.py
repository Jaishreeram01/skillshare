from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio
from core.firebase_config import db
from core.deps import get_current_user
import skillshare_data_models
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import random
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
import time
from google.cloud.exceptions import GoogleCloudError
import os

# Import email service
try:
    from email_service import email_service
    logger_temp = logging.getLogger(__name__)
    logger_temp.info("Email service imported successfully")
except Exception as e:
    logger_temp = logging.getLogger(__name__)
    logger_temp.error(f"Failed to import email service: {e}")
    email_service = None

# Configure structured logging (console only for production compatibility)
import os
handlers = []
if os.path.exists('logs'):
    handlers.append(logging.FileHandler('logs/app.log'))
handlers.append(logging.StreamHandler())

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)

logger = logging.getLogger(__name__)
logger.info("SkillShare API starting up...")

app = FastAPI(title="SkillShare API", version="1.0.0")

# Thread pool for parallel database queries
executor = ThreadPoolExecutor(max_workers=10)

# PHASE 3: In-memory cache with TTL
# Cache structure: {key: (data, timestamp)}
user_profile_cache = {}
session_cache = {}
CACHE_TTL = 300  # 5 minutes in seconds

def get_cached_user(user_id: str):
    """Get user from cache or database with automatic cache refresh"""
    if user_id in user_profile_cache:
        cached_data, timestamp = user_profile_cache[user_id]
        # Check if cache is still valid
        if (datetime.now() - timestamp).total_seconds() < CACHE_TTL:
            return cached_data
    
    # Cache miss or expired - fetch from database
    user_doc = db.collection("users").document(user_id).get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        user_profile_cache[user_id] = (user_data, datetime.now())
        return user_data
    return None

def invalidate_user_cache(user_id: str):
    """Invalidate cache when user data is updated"""
    if user_id in user_profile_cache:
        del user_profile_cache[user_id]

def get_cached_sessions(user_id: str):
    """Get sessions from cache or database"""
    cache_key = f"sessions_{user_id}"
    if cache_key in session_cache:
        cached_data, timestamp = session_cache[cache_key]
        if (datetime.now() - timestamp).total_seconds() < CACHE_TTL:
            return cached_data
    return None

def set_cached_sessions(user_id: str, sessions_data):
    """Store sessions in cache"""
    cache_key = f"sessions_{user_id}"
    session_cache[cache_key] = (sessions_data, datetime.now())

def invalidate_session_cache(user_id: str):
    """Invalidate session cache when sessions are updated"""
    cache_key = f"sessions_{user_id}"
    if cache_key in session_cache:
        del session_cache[cache_key]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "https://skillshare-client.vercel.app") 
    ], # Vite frontend + Production URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log incoming request
    logger.info(f">> Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        
        # Log response
        duration = time.time() - start_time
        logger.info(
            f"<< Response: {request.method} {request.url.path} "
            f"- Status: {response.status_code} "
            f"- Duration: {duration:.3f}s"
        )
        
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"✗ Error: {request.method} {request.url.path} "
            f"- Duration: {duration:.3f}s - Error: {str(e)}",
            exc_info=True
        )
        raise

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": str(request.url.path),
            "timestamp": datetime.now().isoformat()
        }
    )

# HTTP Exception Handler (for proper error formatting)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code} on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "path": str(request.url.path),
            "timestamp": datetime.now().isoformat()
        }
    )

# Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Socket.IO Events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get("room")
    if room:
        sio.enter_room(sid, room)
        print(f"Client {sid} joined room {room}")

@sio.event
async def send_message(sid, data):
    # data: { senderId, receiverId, content, room }
    sender_id = data.get('senderId')
    receiver_id = data.get('receiverId')
    content = data.get('content')
    room = data.get('room')
    
    if not all([sender_id, receiver_id, content]):
        return

    # Save to Firestore
    message_data = {
        "senderId": sender_id,
        "receiverId": receiver_id,
        "content": content,
        "timestamp": datetime.now(),
        "read": False,
        "room": room or f"{min(sender_id, receiver_id)}_{max(sender_id, receiver_id)}"
    }
    db.collection("messages").add(message_data)
    
    print(f"Message from {sender_id}: {content}")
    # Broadcast to chat room
    await sio.emit("receive_message", data, room=room, skip_sid=sid)
    # Broadcast to receiver's personal room for notifications
    await sio.emit("receive_message", data, room=receiver_id, skip_sid=sid)

@app.get("/messages/contacts")
async def get_message_contacts(current_user_id: str = Depends(get_current_user)):
    """Get list of users who have exchanged messages with current user"""
    try:
        logger.info(f"Fetching message contacts for user: {current_user_id}")
        
        # Fetch sent and received messages
        try:
            sent_messages = list(db.collection("messages").where("senderId", "==", current_user_id).stream())
            received_messages = list(db.collection("messages").where("receiverId", "==", current_user_id).stream())
        except GoogleCloudError as e:
            logger.error(f"Firestore error fetching messages for {current_user_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable. Please try again later."
            )
        
        # Extract unique contact IDs and track last messages
        contact_ids = set()
        last_message_map = {}
        
        for msg in sent_messages:
            msg_data = msg.to_dict()
            receiver_id = msg_data.get("receiverId")
            if receiver_id and receiver_id != current_user_id:
                contact_ids.add(receiver_id)
                # Track last message timestamp
                timestamp = msg_data.get("timestamp")
                if receiver_id not in last_message_map or timestamp > last_message_map[receiver_id]["timestamp"]:
                    last_message_map[receiver_id] = {
                        "content": msg_data.get("content", ""),
                        "timestamp": timestamp,
                        "senderId": msg_data.get("senderId")
                    }
        
        for msg in received_messages:
            msg_data = msg.to_dict()
            sender_id = msg_data.get("senderId")
            if sender_id and sender_id != current_user_id:
                contact_ids.add(sender_id)
                # Track last message timestamp
                timestamp = msg_data.get("timestamp")
                if sender_id not in last_message_map or timestamp > last_message_map[sender_id]["timestamp"]:
                    last_message_map[sender_id] = {
                        "content": msg_data.get("content", ""),
                        "timestamp": timestamp,
                        "senderId": msg_data.get("senderId")
                    }
        
        
        # OPTIMIZATION: Use cache for user profiles (Phase 3)
        # Try cache first, then batch fetch missing users
        contact_data_map = {}
        missing_contact_ids = []
        
        for contact_id in contact_ids:
            cached_user = get_cached_user(contact_id)
            if cached_user:
                contact_data_map[contact_id] = cached_user
            else:
                missing_contact_ids.append(contact_id)
        
        # Batch fetch any users not in cache
        if missing_contact_ids:
            try:
                contact_refs = [db.collection("users").document(cid) for cid in missing_contact_ids]
                contact_docs = db.get_all(contact_refs)
                for doc in contact_docs:
                    if doc.exists:
                        user_data = doc.to_dict()
                        contact_data_map[doc.id] = user_data
                        # Add to cache for future requests
                        user_profile_cache[doc.id] = (user_data, datetime.now())
            except GoogleCloudError as e:
                logger.error(f"Firestore error fetching contact profiles: {e}", exc_info=True)
                # Continue with partial data
        
        # Build contacts list
        contacts = []
        for contact_id in contact_ids:
            user_data = contact_data_map.get(contact_id, {})
            if user_data:  # Only include if user data exists
                last_msg = last_message_map.get(contact_id, {})
                contacts.append({
                    "id": contact_id,
                    "name": user_data.get("name", "Unknown"),
                    "avatar": user_data.get("avatar"),
                    "lastMessage": last_msg.get("content", ""),
                    "lastMessageTime": last_msg.get("timestamp").isoformat() if last_msg.get("timestamp") else None,
                    "isOnline": False  # Can be enhanced with presence tracking
                })
        
        # Sort by last message time (most recent first)
        contacts.sort(key=lambda x: x.get("lastMessageTime") or "", reverse=True)
        
        logger.info(f"Successfully fetched {len(contacts)} contacts for user {current_user_id}")
        return contacts
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Unexpected error in /messages/contacts for {current_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch message contacts. Please try again later."
        )

@app.get("/messages/history/{other_user_id}")
async def get_message_history(other_user_id: str, current_user_id: str = Depends(get_current_user)):
    """Get message history between current user and another user"""
    room = "_".join(sorted([current_user_id, other_user_id]))
    
    # Fetch all messages in this room
    messages_ref = db.collection("messages").where("room", "==", room).order_by("timestamp").stream()
    
    messages = []
    for msg_doc in messages_ref:
        msg_data = msg_doc.to_dict()
        msg_data["id"] = msg_doc.id
        # Convert timestamp to ISO string for JSON serialization
        if "timestamp" in msg_data and msg_data["timestamp"]:
            msg_data["timestamp"] = msg_data["timestamp"].isoformat()
        messages.append(msg_data)
    
    return messages

@app.get("/")
async def root():
    return {"message": "SkillShare API is running with Firebase"}

# Public endpoint check
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/users/", response_model=skillshare_data_models.User)
async def create_user(user: skillshare_data_models.User, current_user_id: str = Depends(get_current_user)):
    # Force the user ID to match the authenticated token
    user.id = current_user_id
    doc_ref = db.collection("users").document(current_user_id)
    doc_ref.set(user.dict())
    
    # Send welcome email
    try:
        if email_service and user.email:
            email_service.send_welcome_email(user.email, user.name)
            logger.info(f"Welcome email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
        # Don't fail user creation if email fails
    
    return user

@app.get("/users/me", response_model=skillshare_data_models.User)
async def read_current_user(current_user_id: str = Depends(get_current_user)):
    try:
        logger.info(f"Fetching user data for user: {current_user_id}")
        
        # 1. Fetch user data first
        try:
            doc_ref = db.collection("users").document(current_user_id)
            doc = doc_ref.get()
        except GoogleCloudError as e:
            logger.error(f"Firestore error fetching user {current_user_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable. Please try again later."
            )
        
        if not doc.exists:
            logger.warning(f"User not found: {current_user_id}")
            raise HTTPException(status_code=404, detail="User profile not found")
            
        user_data = doc.to_dict()
        
        # PHASE 4 OPTIMIZATION: Only recalculate if needed
        # Check if we need to recalculate stats
        last_calculated = user_data.get("lastCalculated")
        recalculation_interval = 3600  # 1 hour in seconds
        should_recalculate = True
        
        if last_calculated:
            # Check if last calculation was recent
            try:
                if hasattr(last_calculated, "timestamp"):
                    last_calc_time = datetime.fromtimestamp(last_calculated.timestamp())
                elif isinstance(last_calculated, str):
                    last_calc_time = datetime.fromisoformat(last_calculated)
                else:
                    last_calc_time = last_calculated
                    
                time_since_calc = (datetime.now() - last_calc_time).total_seconds()
                should_recalculate = time_since_calc > recalculation_interval
                
                if not should_recalculate:
                    logger.info(f"Using cached stats for user {current_user_id} (age: {time_since_calc:.0f}s)")
            except Exception as e:
                logger.warning(f"Error parsing lastCalculated timestamp: {e}")
                should_recalculate = True
        
        # If stats are fresh, return cached values
        if not should_recalculate:
            user_data['id'] = current_user_id
            return skillshare_data_models.User(**user_data)
        
        logger.info(f"Recalculating stats for user {current_user_id}")
        
        # RECALCULATION NEEDED - Fetch data in parallel
        def fetch_sessions():
            try:
                sessions_ref = db.collection("sessions")
                teacher_sessions = sessions_ref.where("teacherId", "==", current_user_id).where("status", "in", ["SCHEDULED", "COMPLETED"]).stream()
                learner_sessions = sessions_ref.where("learnerId", "==", current_user_id).where("status", "in", ["SCHEDULED", "COMPLETED"]).stream()
                
                confirmed_sessions = list(teacher_sessions) + list(learner_sessions)
                unique_session_ids = set()
                valid_sessions = []
                for s in confirmed_sessions:
                    if s.id not in unique_session_ids:
                        unique_session_ids.add(s.id)
                        valid_sessions.append(s.to_dict())
                return valid_sessions
            except Exception as e:
                logger.error(f"Error fetching sessions: {e}", exc_info=True)
                return []
        
        def fetch_matches():
            try:
                matches_ref = db.collection("matches")
                m1 = matches_ref.where("user1Id", "==", current_user_id).stream()
                m2 = matches_ref.where("user2Id", "==", current_user_id).stream()
                return list(m1) + list(m2)
            except Exception as e:
                logger.error(f"Error fetching matches: {e}", exc_info=True)
                return []
        
        def fetch_projects():
            try:
                return list(db.collection("projects").stream())
            except Exception as e:
                logger.error(f"Error fetching projects: {e}", exc_info=True)
                return []
        
        def fetch_messages():
            try:
                return list(db.collection("messages").where("senderId", "==", current_user_id).stream())
            except Exception as e:
                logger.error(f"Error fetching messages: {e}", exc_info=True)
                return []
        
        # Execute all queries in parallel (3x faster!)
        try:
            loop = asyncio.get_event_loop()
            valid_sessions, matches_docs, projects_docs, messages_docs = await asyncio.gather(
                loop.run_in_executor(executor, fetch_sessions),
                loop.run_in_executor(executor, fetch_matches),
                loop.run_in_executor(executor, fetch_projects),
                loop.run_in_executor(executor, fetch_messages)
            )
        except Exception as e:
            logger.error(f"Error in parallel data fetching: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch user data. Please try again."
            )
        
        session_count = len(valid_sessions)
        # Add bonusMinutes (requested as "timing of like five hours")
        total_minutes = sum(s.get("duration", 0) for s in valid_sessions) + user_data.get("bonusMinutes", 0)
        total_hours = round(total_minutes / 60, 1)

        # Daily Goal Calculation
        today = datetime.now().date()
        daily_progress = 0
        
        # 1. Count Sessions scheduled for today
        for s in valid_sessions:
            if s.get('scheduledAt'):
                try:
                    s_date = s.get('scheduledAt')
                    if hasattr(s_date, "date"): # Handles datetime/Timestamp
                        s_date = s_date.date()
                    elif isinstance(s_date, str):
                        s_date = datetime.fromisoformat(s_date).date()
                    if s_date == today:
                        daily_progress += 1
                except:
                    pass

        # 2. Count Mutual Matches made today
        seen_match_ids = set()
        for m in matches_docs:
            if m.id not in seen_match_ids:
                seen_match_ids.add(m.id)
                m_data = m.to_dict()
                m_created = m_data.get("createdAt")
                try:
                    if hasattr(m_created, "date"):
                        m_created = m_created.date()
                    elif isinstance(m_created, str):
                        m_created = datetime.fromisoformat(m_created).date()
                    
                    if m_created == today:
                        daily_progress += 1
                except:
                    pass
        
        bonus_xp = user_data.get("bonusXp", 0)
        # XP Calculation: 100 per session + 2 per minute + bonus actions
        xp = (session_count * 100) + (total_minutes * 2) + bonus_xp
        
        # Level Calculation: 1 + floor(xp / 500)
        level = 1 + (xp // 500)

        # Calculate Dynamic Trust Score
        base_trust = 0.0
        
        # 1. Manual ratings (weighted average)
        ratings = user_data.get("ratings", [])
        if ratings:
            avg_rating = sum(r.get("score", 0) for r in ratings) / len(ratings)
            base_trust = avg_rating  # Ratings are 0-100
        
        # 2. Activity bonuses
        activity_trust = 0.0
        
        # Completed sessions: +0.5 per session (max +10)
        completed_sessions = [s for s in valid_sessions if s.get("status") == "COMPLETED"]
        activity_trust += min(len(completed_sessions) * 0.5, 10)
        
        # Projects joined: +1 per project (max +5)
        user_projects_count = 0
        for p in projects_docs:
            p_data = p.to_dict()
            if current_user_id in p_data.get("memberIds", []):
                user_projects_count += 1
        activity_trust += min(user_projects_count * 1.0, 5)
        
        # Streak bonus: +0.2 per week of streak (max +5)
        streak = user_data.get("streak", 0)
        weeks_streak = streak // 7
        activity_trust += min(weeks_streak * 0.2, 5)
        
        # Message activity: +0.1 per 10 messages (max +3)
        message_count = len(messages_docs)
        activity_trust += min((message_count // 10) * 0.1, 3)
        
        # Calculate final trust score (0-100 scale)
        dynamic_trust_score = min(base_trust + activity_trust, 100.0)

        # Emit notifications for XP/Level changes
        old_xp = user_data.get("xp", 0)
        if xp > old_xp:
            await sio.emit("xp_update", {"amount": xp - old_xp, "reason": "Dynamic Progress"}, room=current_user_id)
            
        old_level = user_data.get("level", 1)
        if level > old_level:
            await sio.emit("level_up", {"level": level}, room=current_user_id)

        # PHASE 4: Update only trust score and daily progress (NOT xp/sessions/totalHours/level)
        # Those are now updated in real-time when sessions complete
        updates = {
            "dailyGoalProgress": daily_progress,
            "trustScore": dynamic_trust_score,
            "lastCalculated": datetime.now()  # Track when we last calculated
        }
        
        try:
            doc_ref.update(updates)
            user_data.update(updates)
            logger.info(f"Successfully updated stats for user {current_user_id}")
        except GoogleCloudError as e:
            logger.error(f"Error updating user stats: {e}", exc_info=True)
            # Continue anyway with calculated values
        
        # Invalidate cache since we updated user data
        invalidate_user_cache(current_user_id)
            
        user_data['id'] = current_user_id
        return skillshare_data_models.User(**user_data)
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Unexpected error in /users/me for {current_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user profile. Please try again later."
        )

@app.post("/users/{user_id}/trust")
async def rate_user(user_id: str, score: float, current_user_id: str = Depends(get_current_user)):
    """Submit a trust score (0-100) for a user."""
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot rate yourself")
    
    # 1. Verify user exists
    target_ref = db.collection("users").document(user_id)
    target_doc = target_ref.get()
    if not target_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_data = target_doc.to_dict()
    ratings = target_data.get("ratings", [])
    
    # 2. Update or add rating
    found = False
    for r in ratings:
        if r.get("raterId") == current_user_id:
            r["score"] = score
            found = True
            break
    
    if not found:
        ratings.append({"raterId": current_user_id, "score": score})
    
    # 3. Calculate new average trust score
    avg_score = sum(r.get("score", 0) for r in ratings) / len(ratings)
    
    target_ref.update({
        "ratings": ratings,
        "trustScore": round(avg_score, 1)
    })
    
    return {"message": "Rating submitted successfully", "trustScore": avg_score}

@app.post("/users/check-in")
async def daily_check_in(current_user_id: str = Depends(get_current_user)):
    """Award XP for daily login and update streak."""
    doc_ref = db.collection("users").document(current_user_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = doc.to_dict()
    last_check_in = user_data.get("lastCheckIn")
    now = datetime.now()
    today = now.date()
    
    if last_check_in:
        if isinstance(last_check_in, str):
            last_date = datetime.fromisoformat(last_check_in).date()
        else:
            last_date = last_check_in.date()
            
        if last_date == today:
            return {"message": "Already checked in today", "bonusXp": 0}
        
        # Update streak
        if last_date == today - timedelta(days=1):
            streak = user_data.get("streak", 0) + 1
        else:
            streak = 1
    else:
        streak = 1
        
    bonus_xp = user_data.get("bonusXp", 0) + 10
    
    updates = {
        "bonusXp": bonus_xp,
        "streak": streak,
        "lastCheckIn": now
    }
    doc_ref.update(updates)
    return {"message": "Daily check-in successful!", "bonusXp": 10, "streak": streak}

@app.put("/users/me", response_model=skillshare_data_models.User)
async def update_current_user(updates: dict, current_user_id: str = Depends(get_current_user)):
    """
    Update current user's profile.
    Allows updating: name, headline, age, country, location, languages, 
    experienceLevel, availability, about, skills, learning, badges, blueprints, avatar
    """
    doc_ref = db.collection("users").document(current_user_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="skillshare_data_models.User profile not found")
    
    # Filter out fields that shouldn't be updated directly (calculated fields)
    protected_fields = {'id', 'xp', 'level', 'sessions', 'totalHours', 'dailyGoalProgress', 'trustScore'}
    safe_updates = {k: v for k, v in updates.items() if k not in protected_fields}
    
    if safe_updates:
        doc_ref.update(safe_updates)
    
    # Fetch and return updated user
    updated_doc = doc_ref.get()
    return skillshare_data_models.User(**updated_doc.to_dict())

@app.get("/users/{user_id}", response_model=skillshare_data_models.User)
async def read_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id)
    doc = doc_ref.get()
    if doc.exists:
        return skillshare_data_models.User(**doc.to_dict())
    raise HTTPException(status_code=404, detail="skillshare_data_models.User not found")

@app.get("/users/", response_model=List[skillshare_data_models.User])
async def read_users(skip: int = 0, limit: int = 100, current_user_id: str = Depends(get_current_user)):
    users_ref = db.collection("users")
    docs = users_ref.limit(limit).stream()
    return [skillshare_data_models.User(**doc.to_dict()) for doc in docs]

@app.post("/sessions/", response_model=skillshare_data_models.Session)
async def create_session(session: skillshare_data_models.Session, current_user_id: str = Depends(get_current_user)):
    try:
        print(f"[DEBUG] Entering create_session for user {current_user_id}")
        doc_ref = db.collection("sessions").document()
        session.id = doc_ref.id
        doc_ref.set(session.dict())
        print(f"[DEBUG] Session created with ID: {session.id}")
    
        # Send automated chat message
        other_user_id = session.teacherId if current_user_id == session.learnerId else session.learnerId
        
        # Format message content
        schedule_time = session.scheduledAt.strftime("%Y-%m-%d %H:%M")
        
        # Get caller name
        current_user_doc = db.collection("users").document(current_user_id).get()
        caller_name = current_user_doc.to_dict().get("name", "Someone") if current_user_doc.exists else "Someone"

        content = f"🗓️ Session Request!\n**{caller_name}** sent a request.\n**Topic:** {session.topic}\n**Time:** {schedule_time}\n**Duration:** {session.duration} min\n[SESSION_ID:{session.id}]"
        if session.meetLink:
            content += f"\n**Link:** {session.meetLink}"
        
        room = "_".join(sorted([current_user_id, other_user_id]))
        
        message_data = {
            "senderId": current_user_id,
            "receiverId": other_user_id,
            "content": content,
            "timestamp": datetime.now(),
            "read": False,
            "room": room,
            "isRequest": True, # Extra metadata
            "sessionId": session.id
        }
        db.collection("messages").add(message_data)
        print(f"[DEBUG] Automated message saved to Firestore for room {room}")
        
        # Real-time emission to chat room
        await sio.emit("receive_message", {
            "senderId": current_user_id,
            "receiverId": other_user_id,
            "content": content,
            "room": room,
            "timestamp": message_data["timestamp"].isoformat(),
            "isRequest": True,
            "sessionId": session.id
        }, room=room)
        print(f"[DEBUG] Emitted to room {room}")
        
        # Real-time emission to receiver's personal room
        await sio.emit("receive_message", {
            "senderId": current_user_id,
            "receiverId": other_user_id,
            "content": content,
            "room": room,
            "timestamp": message_data["timestamp"].isoformat(),
            "isRequest": True,
            "sessionId": session.id
        }, room=other_user_id)
        print(f"[DEBUG] Emitted to personal room {other_user_id}")
        
        return session

    except Exception as e:
        import traceback
        error_msg = f"ERROR in create_session: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        with open("backend_debug.log", "a", encoding="utf-8") as f:
            f.write(f"\n[{datetime.now()}] {error_msg}\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/", response_model=List[skillshare_data_models.Session])
async def read_sessions(current_user_id: str = Depends(get_current_user)):
    # Fetch sessions where user is teacher or learner
    sessions_ref = db.collection("sessions")
    
    # Firestore limitation: cannot do OR query on different fields easily without complex setup.
    # We fetch both and merge them.
    teacher_docs = sessions_ref.where("teacherId", "==", current_user_id).stream()
    learner_docs = sessions_ref.where("learnerId", "==", current_user_id).stream()
    
    raw_sessions = list(teacher_docs) + list(learner_docs)
    unique_sessions = []
    seen_ids = set()
    partner_ids = set()

    for doc in raw_sessions:
        if doc.id not in seen_ids:
            s_data = doc.to_dict()
            s_data['id'] = doc.id
            # Identify partner ID
            partner_id = s_data.get('teacherId') if current_user_id == s_data.get('learnerId') else s_data.get('learnerId')
            s_data['_partnerId'] = partner_id
            partner_ids.add(partner_id)
            unique_sessions.append(s_data)
            seen_ids.add(doc.id)

    # Batch fetch partner user profiles
    user_names = {}
    if partner_ids:
        users_ref = db.collection("users")
        partner_refs = [users_ref.document(pid) for pid in partner_ids]
        partner_docs = db.get_all(partner_refs)
        for u_doc in partner_docs:
            if u_doc.exists:
                u_data = u_doc.to_dict()
                user_names[u_doc.id] = {
                    "name": u_data.get("name", "Unknown"),
                    "avatar": u_data.get("avatar")
                }

    # Finalize session data
    all_sessions = []
    for s in unique_sessions:
        pid = s.get('_partnerId')
        p_info = user_names.get(pid, {"name": "Unknown", "avatar": None})
        s['partnerName'] = p_info["name"]
        s['partnerAvatar'] = p_info["avatar"]
        s['role'] = "Teacher" if current_user_id == s.get('teacherId') else "Learner"
        all_sessions.append(s)
            
    return all_sessions

@app.put("/sessions/{session_id}", response_model=skillshare_data_models.Session)
async def update_session(session_id: str, updates: dict, current_user_id: str = Depends(get_current_user)):
    """Update an existing session (e.g., set meetLink, change status)."""
    doc_ref = db.collection("sessions").document(session_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = doc.to_dict()
    # Basic security check: only teacher or learner can update
    if session_data.get("teacherId") != current_user_id and session_data.get("learnerId") != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
        
    doc_ref.update(updates)
    
    # If session is completed, award XP to both users
    if updates.get("status") == skillshare_data_models.SessionStatus.COMPLETED.value:
        teacher_id = session_data.get("teacherId")
        learner_id = session_data.get("learnerId")
        duration = session_data.get("duration", 0)
        
        # Award XP and update stats for teacher and learner
        for uid in [teacher_id, learner_id]:
            u_ref = db.collection("users").document(uid)
            u_snap = u_ref.get()
            if u_snap.exists:
                u_doc = u_snap.to_dict()
                
                # Calculate XP gain (50 base + duration bonus)
                xp_gain = 50 + (duration // 30) * 10  # 10 XP per 30 min
                
                # Update all user stats
                new_xp = u_doc.get("xp", 0) + xp_gain
                new_sessions = u_doc.get("sessions", 0) + 1
                new_total_hours = u_doc.get("totalHours", 0.0) + (duration / 60.0)
                
                # Calculate new level (every 100 XP = 1 level)
                new_level = (new_xp // 100) + 1
                
                u_ref.update({
                    "xp": new_xp,
                    "sessions": new_sessions,
                    "totalHours": new_total_hours,
                    "level": new_level,
                    "bonusXp": u_doc.get("bonusXp", 0) + xp_gain
                })

    # If status becomes SCHEDULED (Accepted from PENDING)
    if updates.get("status") == "SCHEDULED" and session_data.get("status") == "PENDING":
        other_user_id = session_data.get("teacherId") if current_user_id == session_data.get("learnerId") else session_data.get("learnerId")
        
        # Get caller name
        current_user_doc = db.collection("users").document(current_user_id).get()
        caller_name = current_user_doc.to_dict().get("name", "User") if current_user_doc.exists else "User"
        
        content = f"✅ Session Confirmed!\n**{caller_name}** accepted your request for **{session_data.get('topic')}**."
        room = "_".join(sorted([current_user_id, other_user_id]))
        
        message_data = {
            "senderId": current_user_id,
            "receiverId": other_user_id,
            "content": content,
            "timestamp": datetime.now(),
            "read": False,
            "room": room
        }
        db.collection("messages").add(message_data)
        
        # Real-time emission to chat room
        await sio.emit("receive_message", {
            "senderId": current_user_id,
            "receiverId": other_user_id,
            "content": content,
            "room": room,
            "timestamp": message_data["timestamp"].isoformat()
        }, room=room)

        # Real-time emission to receiver's personal room
        await sio.emit("receive_message", {
            "senderId": current_user_id,
            "receiverId": other_user_id,
            "content": content,
            "room": room,
            "timestamp": message_data["timestamp"].isoformat()
        }, room=other_user_id)
        
        # Send session confirmation emails
        if email_service:
            try:
                # Get user emails
                teacher_doc = db.collection("users").document(session_data.get("teacherId")).get()
                learner_doc = db.collection("users").document(session_data.get("learnerId")).get()
                
                if teacher_doc.exists and learner_doc.exists:
                    teacher_data = teacher_doc.to_dict()
                    learner_data = learner_doc.to_dict()
                    
                    # Prepare session data for email
                    email_session_data = {
                        "topic": session_data.get("topic"),
                        "scheduledAt": session_data.get("scheduledAt"),
                        "duration": session_data.get("duration", 60),
                        "meetLink": session_data.get("meetLink"),
                        "partnerName": learner_data.get("name") if current_user_id == session_data.get("teacherId") else teacher_data.get("name")
                    }
                    
                    # Send to teacher
                    if teacher_data.get("email"):
                        email_session_data["partnerName"] = learner_data.get("name")
                        email_service.send_session_confirmation(
                            email_session_data,
                            teacher_data.get("email"),
                            teacher_data.get("name"),
                            is_teacher=True
                        )
                        logger.info(f"Session confirmation email sent to teacher: {teacher_data.get('email')}")
                    
                    # Send to learner
                    if learner_data.get("email"):
                        email_session_data["partnerName"] = teacher_data.get("name")
                        email_service.send_session_confirmation(
                            email_session_data,
                            learner_data.get("email"),
                            learner_data.get("name"),
                            is_teacher=False
                        )
                        logger.info(f"Session confirmation email sent to learner: {learner_data.get('email')}")
            except Exception as e:
                logger.error(f"Failed to send session confirmation emails: {e}")
                # Don't fail session update if email fails

    session_data.update(updates)
    return skillshare_data_models.Session(**session_data)

@app.post("/tasks/", response_model=skillshare_data_models.Task)
async def create_task(task: skillshare_data_models.Task, current_user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("tasks").document()
    task.id = doc_ref.id
    task.assignedById = current_user_id # Force current user as assigner
    doc_ref.set(task.dict())
    return task

@app.get("/tasks/", response_model=List[skillshare_data_models.Task])
async def read_tasks(current_user_id: str = Depends(get_current_user)):
    tasks_ref = db.collection("tasks")
    # Filter by assignedToId == current_user_id
    docs = tasks_ref.where("assignedToId", "==", current_user_id).stream()
    return [skillshare_data_models.Task(**doc.to_dict()) for doc in docs]
def calculate_match_score(wants_to_learn: set, user_teaches: set, target_skills: set, target_learning: set) -> int:
    """Calculate match score (0-100) between two users."""
    # Intersection of (User Wants) AND (Target Teaches)
    forward_matches = wants_to_learn.intersection(target_skills)
    # Intersection of (User Teaches) AND (Target Wants)
    reciprocal_matches = user_teaches.intersection(target_learning)
    
    # 25 points per skill match, max 100
    match_percentage = min(100, (len(forward_matches) + len(reciprocal_matches)) * 25)
    return match_percentage

@app.get("/matches/suggestions", response_model=List[skillshare_data_models.User])
async def get_match_suggestions(
    teach: str = None,  # Optional: comma-separated skills user can teach
    learn: str = None,  # Optional: comma-separated skills user wants to learn
    limit: int = 15, 
    current_user_id: str = Depends(get_current_user)
):
    """
    Get match suggestions based on skill overlap.
    If teach/learn params provided, use those for custom search.
    Otherwise, use current user's profile skills/learning.
    """
    # 1. Get current user profile
    current_user_ref = db.collection("users").document(current_user_id)
    current_user_doc = current_user_ref.get()
    if not current_user_doc.exists:
        raise HTTPException(status_code=404, detail="skillshare_data_models.User not found")
    
    current_user = current_user_doc.to_dict()
    
    # Use custom search params if provided, otherwise use profile
    if learn:
        wants_to_learn = set([s.strip().lower() for s in learn.split(",")])
    else:
        wants_to_learn = set([s.lower() for s in current_user.get("learning", [])])
    
    if teach:
        user_teaches = set([s.strip().lower() for s in teach.split(",")])
    else:
        user_teaches = set([s.lower() for s in current_user.get("skills", [])])
    
    # 2. Get all other users
    users_ref = db.collection("users")
    docs = users_ref.stream()
    
    suggestions = []
    
    for doc in docs:
        if doc.id == current_user_id:
            continue
            
        user_data = doc.to_dict()
        user_skills = set([s.lower() for s in user_data.get("skills", [])])
        other_wants = set([s.lower() for s in user_data.get("learning", [])])
        
        # 3. Calculate match score
        match_percentage = calculate_match_score(wants_to_learn, user_teaches, user_skills, other_wants)
        
        if match_percentage > 0:
            # Store ID explicitly
            user_data['id'] = doc.id
            # Store match score properly
            user_data['trustScore'] = match_percentage
            user_data['matchScore'] = match_percentage
            suggestions.append(user_data)
            
    # Sort by match score descending
    suggestions.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
    
    return [skillshare_data_models.User(**s) for s in suggestions[:limit]]


# --- Saved Matches ---
@app.post("/matches/saved")
async def save_match(matchedUserId: str, current_user_id: str = Depends(get_current_user)):
    """Save a match for later reference."""
    # Check if already saved
    saved_ref = db.collection("savedMatches")
    existing = saved_ref.where("userId", "==", current_user_id).where("matchedUserId", "==", matchedUserId).limit(1).stream()
    
    if list(existing):
        raise HTTPException(status_code=400, detail="Match already saved")
    
    # Create saved match
    saved_match = skillshare_data_models.SavedMatch(
        id=str(uuid.uuid4()),
        userId=current_user_id,
        matchedUserId=matchedUserId
    )
    
    doc_ref = db.collection("savedMatches").document(saved_match.id)
    doc_ref.set(saved_match.dict())
    
    # --- Mutual Matching Logic ---
    # Check if the other user has already saved the current user
    reciprocal = saved_ref.where("userId", "==", matchedUserId).where("matchedUserId", "==", current_user_id).limit(1).stream()
    is_mutual = False
    
    if list(reciprocal):
        is_mutual = True
        # Create a Match record
        match_id = f"{min(current_user_id, matchedUserId)}_{max(current_user_id, matchedUserId)}"
        match_data = skillshare_data_models.Match(
            id=match_id,
            user1Id=current_user_id,
            user2Id=matchedUserId,
            score=100.0, # Target 100 on mutual
            status=skillshare_data_models.MatchStatus.ACCEPTED
        )
        db.collection("matches").document(match_id).set(match_data.dict())
        
        # Create an initial Session
        session_id = str(uuid.uuid4())
        new_session = skillshare_data_models.Session(
            id=session_id,
            teacherId=matchedUserId, # For now assuming the 'saved' one is teacher
            learnerId=current_user_id,
            topic="Introductory Session",
            scheduledAt=datetime.now(),
            duration=30,
            status=skillshare_data_models.SessionStatus.SCHEDULED
        )
        db.collection("sessions").document(session_id).set(new_session.dict())

        # Emit Mutual Match notifications
        await sio.emit("new_match", {"partnerId": matchedUserId}, room=current_user_id)
        await sio.emit("new_match", {"partnerId": current_user_id}, room=matchedUserId)

        # Send Automated "Match Confirmed" Message
        room = "_".join(sorted([current_user_id, matchedUserId]))
        match_msg = {
            "senderId": "system",
            "receiverId": matchedUserId,
            "content": "✨ **It's a Match!**\nYou both liked each other's profiles. Start chatting now and collaborate on amazing projects!",
            "timestamp": datetime.now(),
            "read": False,
            "room": room,
            "type": "match_confirmation"
        }
        db.collection("messages").add(match_msg)
        
        # Broadcast to room and individuals
        await sio.emit("receive_message", {
            **match_msg,
            "timestamp": match_msg["timestamp"].isoformat()
        }, room=room)
        await sio.emit("receive_message", {
            **match_msg,
            "timestamp": match_msg["timestamp"].isoformat()
        }, room=current_user_id)
        await sio.emit("receive_message", {
            **match_msg,
            "timestamp": match_msg["timestamp"].isoformat()
        }, room=matchedUserId)

    # Award XP for connecting
    user_ref = db.collection("users").document(current_user_id)
    user_doc_snap = user_ref.get()
    user_doc = user_doc_snap.to_dict()
    
    # Check role of matched user to decide XP
    matched_user_doc_snap = db.collection("users").document(matchedUserId).get()
    xp_to_add = 20 # Default "learn" connect
    streak_bonus = 0
    
    if matched_user_doc_snap.exists:
        m_data = matched_user_doc_snap.to_dict()
        if m_data.get("skills"):
            xp_to_add = 30
            streak_bonus = random.randint(1, 3)
    
    # Bonus XP for mutual match
    if is_mutual:
        xp_to_add += 50
    
    new_bonus_xp = user_doc.get("bonusXp", 0) + xp_to_add
    new_streak = user_doc.get("streak", 0) + streak_bonus
    
    user_ref.update({
        "bonusXp": new_bonus_xp,
        "streak": new_streak
    })
    
    return {
        "message": "Match saved successfully", 
        "id": saved_match.id, 
        "is_mutual": is_mutual,
        "xpAwarded": xp_to_add,
        "streakBonus": streak_bonus
    }


@app.get("/matches/saved", response_model=List[skillshare_data_models.User])
async def get_saved_matches(current_user_id: str = Depends(get_current_user)):
    """Get all saved matches for the current user with full user data."""
    # Get saved match records
    saved_ref = db.collection("savedMatches")
    saved_docs = saved_ref.where("userId", "==", current_user_id).stream()
    
    matched_user_ids = [doc.to_dict().get("matchedUserId") for doc in saved_docs]
    
    if not matched_user_ids:
        return []
    
    # 2. Fetch full user data in BATCH for efficiency (Zero N+1)
    users_ref = db.collection("users")
    user_refs = [users_ref.document(uid) for uid in matched_user_ids]
    user_docs = db.get_all(user_refs)
    
    saved_users = []
    
    # Fetch current user once for score calculation
    current_user_doc = users_ref.document(current_user_id).get()
    current_user = current_user_doc.to_dict() if current_user_doc.exists else {}
    wants_to_learn = set([s.lower() for s in current_user.get("learning", [])])
    user_teaches_set = set([s.lower() for s in current_user.get("skills", [])])

    for user_doc in user_docs:
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_skills = set([s.lower() for s in user_data.get("skills", [])])
            other_wants = set([s.lower() for s in user_data.get("learning", [])])
            
            # Use helper
            match_percentage = calculate_match_score(wants_to_learn, user_teaches_set, user_skills, other_wants)
            
            user_data['id'] = user_doc.id # Add missing ID!
            user_data['trustScore'] = match_percentage
            user_data['matchScore'] = match_percentage
            saved_users.append(user_data)
    
    return [skillshare_data_models.User(**u) for u in saved_users]


@app.delete("/matches/saved/{matchedUserId}")
async def unsave_match(matchedUserId: str, current_user_id: str = Depends(get_current_user)):
    """Remove a saved match."""
    saved_ref = db.collection("savedMatches")
    docs = saved_ref.where("userId", "==", current_user_id).where("matchedUserId", "==", matchedUserId).stream()
    
    deleted = False
    for doc in docs:
        doc.reference.delete()
        deleted = True
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved match not found")
    
    return {"message": "Match removed successfully"}


# --- Leaderboard ---
@app.get("/leaderboard")
async def get_leaderboard(sortBy: str = "xp", current_user_id: str = Depends(get_current_user)):
    """
    Get leaderboard rankings sorted by XP or streak.
    Returns top 50 users and current user's rank.
    """
    # Validate sortBy parameter
    if sortBy not in ["xp", "streak"]:
        raise HTTPException(status_code=400, detail="sortBy must be 'xp' or 'streak'")
    
    # Fetch all users
    users_ref = db.collection("users")
    docs = users_ref.stream()
    
    all_users = []
    current_user_data = None
    
    for doc in docs:
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        
        # Store current user separately
        if doc.id == current_user_id:
            current_user_data = user_data
        
        all_users.append(user_data)
    
    # Sort by the specified metric (descending)
    sort_key = "xp" if sortBy == "xp" else "streak"
    all_users.sort(key=lambda x: x.get(sort_key, 0), reverse=True)
    
    # Assign ranks
    for index, user in enumerate(all_users):
        user['rank'] = index + 1
    
    # Get top 50 leaders
    top_leaders = all_users[:50]
    
    # Format leaders for response
    leaders = []
    for user in top_leaders:
        leaders.append({
            "rank": user['rank'],
            "id": user['id'],
            "name": user.get('name', 'Unknown'),
            "avatar": user.get('avatar'),
            "country": user.get('location') or user.get('country', ''),
            "xp": user.get('xp', 0),
            "matches": user.get('sessions', 0),  # Using sessions as matches
            "streak": user.get('streak', 0)
        })
    
    # Find current user's rank
    current_user_rank = None
    if current_user_data:
        # Find user in sorted list
        for user in all_users:
            if user['id'] == current_user_id:
                current_user_rank = {
                    "rank": user['rank'],
                    "id": user['id'],
                    "name": user.get('name', 'You'),
                    "avatar": user.get('avatar'),
                    "country": user.get('location') or user.get('country', ''),
                    "xp": user.get('xp', 0),
                    "matches": user.get('sessions', 0),
                    "streak": user.get('streak', 0)
                }
                break
    
    return {
        "leaders": leaders,
        "currentUser": current_user_rank
    }


# --- Messages & Contacts ---
@app.get("/messages/history/{other_user_id}")
async def get_chat_history(other_user_id: str, current_user_id: str = Depends(get_current_user)):
    """Fetch message history between current user and another user."""
    # Room name is typically sorted IDs
    room = "_".join(sorted([current_user_id, other_user_id]))
    
    messages_ref = db.collection("messages")
    print(f"[DEBUG] Fetching history for room {room}")
    # Query messages where room matches (sorting in memory to avoid index requirement)
    query = messages_ref.where("room", "==", room).stream()
    
    history = []
    for doc in query:
        msg = doc.to_dict()
        msg['id'] = doc.id
        history.append(msg)
    
    # Sort in memory by timestamp
    history.sort(key=lambda x: x.get('timestamp') or datetime.min)
    
    # Convert timestamps to ISO for JSON
    for msg in history:
        if isinstance(msg.get('timestamp'), datetime):
             msg['timestamp'] = msg['timestamp'].isoformat()
             
    return history

@app.get("/messages/contacts")
async def get_chat_contacts(current_user_id: str = Depends(get_current_user)):
    """Fetch list of users the current user has a MUTUAL match with."""
    matches_ref = db.collection("matches")
    
    # Query for accepted matches where the current user is either user1 or user2
    m1 = matches_ref.where("user1Id", "==", current_user_id).where("status", "==", "ACCEPTED").stream()
    m2 = matches_ref.where("user2Id", "==", current_user_id).where("status", "==", "ACCEPTED").stream()
    
    contact_ids = set()
    for m in list(m1) + list(m2):
        m_data = m.to_dict()
        u1 = m_data.get("user1Id")
        u2 = m_data.get("user2Id")
        contact_ids.add(u1 if u1 != current_user_id else u2)
        
    contacts = []
    for uid in contact_ids:
        if not uid: continue
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            u_data = user_doc.to_dict()
            contacts.append({
                "id": uid,
                "name": u_data.get("name", "Unknown"),
                "avatar": u_data.get("avatar") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={uid}",
                "status": "online",
                "role": u_data.get("experienceLevel", "Student")
            })
            
    return contacts

# --- skillshare_data_models.Projects ---
@app.get("/projects", response_model=List[skillshare_data_models.Project])
async def get_projects():
    projects_ref = db.collection("projects")
    docs = projects_ref.stream()
    projects = []
    for doc in docs:
        p_data = doc.to_dict()
        p_data['id'] = doc.id # Ensure ID is present for frontend
        projects.append(skillshare_data_models.Project(**p_data))
    return projects

@app.post("/projects", response_model=skillshare_data_models.Project)
async def create_project(project: skillshare_data_models.Project, current_user_id: str = Depends(get_current_user)):
    # Override owner with current user
    user_ref = db.collection("users").document(current_user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    u_data = user_doc.to_dict()
    project.ownerName = u_data.get("name", "Unknown")
    project.ownerId = current_user_id
    project.id = str(uuid.uuid4())
    
    # Store initial invited members as pending
    invited_ids = project.memberIds
    project.memberIds = [current_user_id]
    project.pendingMemberIds = [uid for uid in invited_ids if uid != current_user_id]
    
    # Fetch owner details for memberDetails
    project.memberDetails = [{
        "id": current_user_id,
        "name": u_data.get("name", "User"),
        "avatar": u_data.get("avatar")
    }]
    
    # Send invitations via Chat
    for invitee_id in project.pendingMemberIds:
        room = "_".join(sorted([current_user_id, invitee_id]))
        invite_msg = {
            "senderId": current_user_id,
            "receiverId": invitee_id,
            "content": f"🚀 **Project Invite!**\nI've invited you to join my project: **{project.title}**.",
            "timestamp": datetime.now(),
            "read": False,
            "room": room,
            "type": "project_invite",
            "isRequest": True,
            "projectId": project.id
        }
        print(f"[PROJECT INVITE] Creating invitation for {invitee_id} in room {room}")
        print(f"[PROJECT INVITE] Message data: type={invite_msg.get('type')}, isRequest={invite_msg.get('isRequest')}, projectId={invite_msg.get('projectId')}")
        db.collection("messages").add(invite_msg)
        
        # Real-time notification to the room (so sender sees it)
        print(f"[PROJECT INVITE] Emitting to room: {room}")
        await sio.emit("receive_message", {
            **invite_msg,
            "timestamp": invite_msg["timestamp"].isoformat()
        }, room=room)
        
        # Real-time notification to invitee's personal room
        print(f"[PROJECT INVITE] Emitting to personal room: {invitee_id}")
        await sio.emit("receive_message", {
            **invite_msg,
            "timestamp": invite_msg["timestamp"].isoformat()
        }, room=invitee_id)
        
        # Send project invitation email
        if email_service:
            try:
                invitee_doc = db.collection("users").document(invitee_id).get()
                if invitee_doc.exists:
                    invitee_data = invitee_doc.to_dict()
                    if invitee_data.get("email"):
                        email_project_data = {
                            "title": project.title,
                            "description": project.description,
                            "stack": project.stack,
                            "difficulty": project.difficulty,
                            "type": project.type
                        }
                        email_service.send_project_invitation(
                            email_project_data,
                            invitee_data.get("email"),
                            invitee_data.get("name"),
                            u_data.get("name")
                        )
                        logger.info(f"Project invitation email sent to: {invitee_data.get('email')}")
            except Exception as e:
                logger.error(f"Failed to send project invitation email: {e}")
                # Don't fail project creation if email fails

    # Adjust spots (only confirmed members count)
    project.spots = max(0, project.totalSpots - len(project.memberIds))
    
    doc_ref = db.collection("projects").document(project.id)
    doc_ref.set(project.dict())
    
    return project

@app.get("/projects", response_model=List[skillshare_data_models.Project])
async def get_projects(current_user_id: str = Depends(get_current_user)):
    """Get all projects"""
    try:
        logger.info(f"Fetching all projects for user: {current_user_id}")
        
        projects_ref = db.collection("projects")
        projects = []
        
        try:
            for doc in projects_ref.stream():
                project_data = doc.to_dict()
                project_data['id'] = doc.id
                projects.append(skillshare_data_models.Project(**project_data))
                logger.info(f"Found project: {doc.id} - {project_data.get('title')}")
        except GoogleCloudError as e:
            logger.error(f"Firestore error fetching projects: {e}", exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable. Please try again later."
            )
        
        logger.info(f"Successfully fetched {len(projects)} projects")
        return projects
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching projects: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch projects. Please try again later."
        )

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a project - only the project owner can delete"""
    try:
        logger.info(f"User {current_user_id} attempting to delete project {project_id}")
        
        # Get project
        try:
            project_ref = db.collection("projects").document(project_id)
            project_doc = project_ref.get()
            logger.info(f"Project document exists: {project_doc.exists}")
        except GoogleCloudError as e:
            logger.error(f"Firestore error fetching project {project_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable. Please try again later."
            )
        
        if not project_doc.exists:
            logger.warning(f"Project not found: {project_id}")
            # List all projects to debug
            all_projects = list(db.collection("projects").stream())
            logger.info(f"Total projects in database: {len(all_projects)}")
            for p in all_projects[:5]:  # Log first 5 projects
                logger.info(f"  - Project ID: {p.id}, Title: {p.to_dict().get('title')}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_data = project_doc.to_dict()
        logger.info(f"Project found. Owner: {project_data.get('ownerId')}, Current user: {current_user_id}")
        
        # Check if current user is the owner
        if project_data.get("ownerId") != current_user_id:
            logger.warning(f"User {current_user_id} is not owner of project {project_id}")
            raise HTTPException(
                status_code=403,
                detail="Only the project owner can delete this project"
            )
        
        # Delete the project
        try:
            project_ref.delete()
            logger.info(f"Successfully deleted project {project_id} by owner {current_user_id}")
        except GoogleCloudError as e:
            logger.error(f"Firestore error deleting project {project_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Failed to delete project. Please try again later."
            )
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete project. Please try again later."
        )

@app.post("/projects/{project_id}/accept-invite")
async def accept_project_invite(project_id: str, current_user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("projects").document(project_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project_data = doc.to_dict()
    pending = project_data.get("pendingMemberIds", [])
    members = project_data.get("memberIds", [])
    
    if current_user_id not in pending:
        raise HTTPException(status_code=400, detail="No pending invitation found")
        
    if project_data.get("spots", 0) <= 0:
        raise HTTPException(status_code=400, detail="Project is now full")

    # Move from pending to confirmed
    pending.remove(current_user_id)
    members.append(current_user_id)
    
    # Update memberDetails
    user_doc = db.collection("users").document(current_user_id).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    
    member_details = project_data.get("memberDetails", [])
    member_details.append({
        "id": current_user_id,
        "name": user_data.get("name", "User"),
        "avatar": user_data.get("avatar")
    })
    
    updates = {
        "memberIds": members,
        "pendingMemberIds": pending,
        "memberDetails": member_details,
        "spots": project_data.get("totalSpots", 4) - len(members)
    }
    
    doc_ref.update(updates)
    
    # Send confirmation message
    owner_id = project_data.get("ownerId")
    room = "_".join(sorted([current_user_id, owner_id]))
    confirm_msg = {
        "senderId": current_user_id,
        "receiverId": owner_id,
        "content": f"✅ I've joined the project: **{project_data.get('title')}**!",
        "timestamp": datetime.now(),
        "read": False,
        "room": room
    }
    db.collection("messages").add(confirm_msg)
    await sio.emit("receive_message", {
        **confirm_msg,
        "timestamp": confirm_msg["timestamp"].isoformat()
    }, room=owner_id)

    return {"message": "Joined project successfully"}

@app.post("/projects/{project_id}/join")
async def join_project(project_id: str, current_user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("projects").document(project_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project_data = doc.to_dict()
    
    if project_data.get("spots", 0) <= 0:
        raise HTTPException(status_code=400, detail="Project is full")
        
    member_ids = project_data.get("memberIds", [])
    pending_ids = project_data.get("pendingMemberIds", [])
    
    if current_user_id in member_ids:
        raise HTTPException(status_code=400, detail="Already a member")
        
    # Check if user is a "mutual contact" of the owner (has messaged OR is invited)
    owner_id = project_data.get("ownerId")
    room = "_".join(sorted([current_user_id, owner_id]))
    
    is_invited = current_user_id in pending_ids
    
    if not is_invited:
        msg_check = db.collection("messages").where("room", "==", room).limit(1).stream()
        if not list(msg_check):
            raise HTTPException(status_code=403, detail="Only mutual contacts (people you've messaged) can join")

    # Add member and remove from pending if present
    member_ids.append(current_user_id)
    if is_invited:
        pending_ids.remove(current_user_id)
    
    # Fetch user details
    user_doc = db.collection("users").document(current_user_id).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    
    member_details = project_data.get("memberDetails", [])
    member_details.append({
        "id": current_user_id,
        "name": user_data.get("name", "User"),
        "avatar": user_data.get("avatar")
    })
    
    updates = {
        "memberIds": member_ids,
        "pendingMemberIds": pending_ids,
        "memberDetails": member_details,
        "spots": project_data.get("totalSpots", 4) - len(member_ids)
    }
    
    doc_ref.update(updates)
    
    # Send confirmation if they joined via general "Join" button but were invited
    if is_invited:
         confirm_msg = {
            "senderId": current_user_id,
            "receiverId": owner_id,
            "content": f"✅ I've joined the project: **{project_data.get('title')}**!",
            "timestamp": datetime.now(),
            "read": False,
            "room": room
        }
         db.collection("messages").add(confirm_msg)
         await sio.emit("receive_message", {
            **confirm_msg,
            "timestamp": confirm_msg["timestamp"].isoformat()
        }, room=owner_id)

    return {"message": "Joined project successfully"}

@app.post("/test/set-my-stats")
async def test_set_stats(current_user_id: str = Depends(get_current_user)):
    """TEST ENDPOINT: Manually set user stats to verify display is working"""
    doc_ref = db.collection("users").document(current_user_id)
    
    updates = {
        "xp": 250,
        "sessions": 5,
        "totalHours": 3.5,
        "level": 3
    }
    
    doc_ref.update(updates)
    
    return {
        "message": "✅ Test stats set successfully! Refresh your dashboard to see changes.",
        "stats": updates
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)

