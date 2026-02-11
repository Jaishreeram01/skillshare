from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Union
from datetime import datetime
from enum import Enum

class SkillType(str, Enum):
    TEACH = "TEACH"
    LEARN = "LEARN"

class Skill(BaseModel):
    id: Optional[str] = None
    userId: str
    name: str
    type: SkillType
    proficiency: int = Field(default=1, ge=1, le=5)
    description: Optional[str] = None
    roadmap: Optional[str] = None

class Blueprint(BaseModel):
    id: Union[str, int]
    title: str
    duration: str
    description: str
    projects: int

class TeachingBlueprint(BaseModel):
    approach: Optional[str] = None
    differentiation: Optional[str] = None

class UserBadge(BaseModel):
    name: str
    level: str # gold, silver, bronze

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None # Mapped from 'about'
    avatar: Optional[str] = None
    country: Optional[str] = None
    location: Optional[str] = None
    languages: Optional[str] = None
    age: Optional[int] = None
    experienceLevel: Optional[str] = None
    availability: Optional[str] = None
    timezone: Optional[str] = None
    trustScore: float = 0.0
    sessions: int = 0
    xp: int = 0
    bonusXp: int = 0
    level: int = 1
    streak: int = 0
    totalHours: float = 0.0
    dailyGoalProgress: int = 0
    isVerified: bool = False
    
    # Project tracking
    projectStreak: int = 0
    lastProjectActivity: Optional[datetime] = None
    tasksCompleted: int = 0
    
    # Flexible lists
    skills: List[str] = []
    learning: List[str] = []
    badges: List[UserBadge] = []
    blueprints: List[Blueprint] = []
    teachingBlueprint: Optional[TeachingBlueprint] = None
    lastCheckIn: Optional[datetime] = None
    
    # Trust Score Ratings (internal storage for avg calculation)
    # List of { raterId: str, score: float }
    ratings: List[dict] = []

    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)

class SessionStatus(str, Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    MISSED = "MISSED"

class Session(BaseModel):
    id: Optional[str] = None
    teacherId: str
    learnerId: str
    topic: str
    scheduledAt: datetime
    duration: int # Minutes
    meetLink: Optional[str] = None
    status: SessionStatus = SessionStatus.SCHEDULED
    notes: Optional[str] = None
    rating: Optional[float] = None
    feedback: Optional[str] = None
    partnerName: Optional[str] = None
    partnerAvatar: Optional[str] = None
    role: Optional[str] = None

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    assignedBy: str
    assignedById: str
    assignedByAvatar: Optional[str] = None
    assignedToId: str
    dueDate: str
    status: TaskStatus = TaskStatus.PENDING
    createdAt: datetime = Field(default_factory=datetime.now)

class MatchStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class Match(BaseModel):
    id: Optional[str] = None
    user1Id: str
    user2Id: str
    score: float
    status: MatchStatus = MatchStatus.PENDING
    createdAt: datetime = Field(default_factory=datetime.now)

class Message(BaseModel):
    id: Optional[str] = None
    senderId: str
    receiverId: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    read: bool = False
    room: Optional[str] = None
    isRequest: bool = False
    type: Optional[str] = None # e.g., "project_invite"
    sessionId: Optional[str] = None
    projectId: Optional[str] = None

class Project(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    stack: List[str]
    type: str # Web App, Mobile App, etc.
    difficulty: str # Beginner, Intermediate, Advanced
    spots: int
    totalSpots: int
    repo: Optional[str] = None
    ownerId: str
    ownerName: str
    memberIds: List[str] = [] # User IDs of members
    pendingMemberIds: List[str] = [] # User IDs of invited members
    memberDetails: List[dict] = [] # Cached {id, name, avatar} for UI
    streak: int = 0
    createdAt: datetime = Field(default_factory=datetime.now)

class SavedMatch(BaseModel):
    id: Optional[str] = None
    userId: str  # User who saved the match
    matchedUserId: str  # User who was saved
    savedAt: datetime = Field(default_factory=datetime.now)
