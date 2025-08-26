from typing import Optional, Literal
from dataclasses import dataclass
from datetime import datetime

# Node type definitions for the User Memory Graph

@dataclass
class UserNode:
    userId: str
    name: Optional[str] = None
    email: Optional[str] = None
    createdAt: str = ""
    lastActive: str = ""
    lifestage: Optional[Literal['young_professional', 'family_planning', 'new_parent', 'empty_nester', 'retired']] = None
    livingSituation: Optional[Literal['alone', 'with_partner', 'with_roommates', 'with_family']] = None

@dataclass
class EmotionNode:
    emotionId: str
    name: str  # 'calm', 'energized', 'anxious', 'inspired', etc.
    category: Literal['positive', 'negative', 'neutral']
    intensity: Optional[int] = None  # 1-10 scale
    description: Optional[str] = None

@dataclass
class FurnitureNode:
    furnitureId: str
    name: str  # 'sofa', 'coffee_table', etc.
    category: Literal['seating', 'storage', 'lighting', 'decor', 'workspace', 'sleeping']
    style: Optional[str] = None  # 'modern', 'traditional', 'rustic', etc.
    color: Optional[str] = None

@dataclass
class SpaceNode:
    spaceId: str
    name: str  # 'living_room', 'bedroom', 'kitchen', etc.
    purpose: str  # 'relaxation', 'work', 'cooking', 'sleeping', etc.
    size: Optional[Literal['small', 'medium', 'large']] = None
    lightingType: Optional[Literal['natural', 'artificial', 'mixed']] = None
    color: Optional[str] = None  # Added for wall colors

@dataclass
class ActivityNode:
    activityId: str
    name: str  # 'morning_coffee', 'work_from_home', 'hosting_guests', etc.
    importance: int  # 1-10 scale
    timeOfDay: Optional[Literal['morning', 'afternoon', 'evening', 'night']] = None
    frequency: Optional[Literal['daily', 'weekly', 'monthly', 'rarely']] = None

@dataclass
class LifeEventNode:
    eventId: str
    name: str  # 'moved_in_together', 'got_pet', 'started_remote_work', etc.
    category: Literal['relationship', 'work', 'family', 'health', 'financial']
    timestamp: str
    impact: Literal['major', 'moderate', 'minor']

@dataclass
class ConstraintNode:
    constraintId: str
    type: Literal['budget', 'space', 'lifestyle', 'maintenance', 'aesthetic']
    description: str  # 'cat destroys fabric', 'limited storage space', etc.
    severity: Literal['flexible', 'moderate', 'strict']
    isTemporary: bool

# NEW: Dedicated preference nodes that make semantic sense


# Node creation types (what we accept when creating nodes)
@dataclass
class CreateUserNode:
    userId: str
    name: Optional[str] = None
    email: Optional[str] = None
    lifestage: Optional[Literal['young_professional', 'family_planning', 'new_parent', 'empty_nester', 'retired']] = None
    livingSituation: Optional[Literal['alone', 'with_partner', 'with_roommates', 'with_family']] = None

@dataclass
class CreateEmotionNode:
    name: str
    category: Literal['positive', 'negative', 'neutral']
    intensity: Optional[int] = None
    description: Optional[str] = None

@dataclass
class CreateFurnitureNode:
    name: str
    category: Literal['seating', 'storage', 'lighting', 'decor', 'workspace', 'sleeping']
    style: Optional[str] = None
    color: Optional[str] = None

@dataclass
class CreateSpaceNode:
    name: str
    purpose: str
    size: Optional[Literal['small', 'medium', 'large']] = None
    lightingType: Optional[Literal['natural', 'artificial', 'mixed']] = None
    color: Optional[str] = None

@dataclass
class CreateActivityNode:
    name: str
    importance: int
    timeOfDay: Optional[Literal['morning', 'afternoon', 'evening', 'night']] = None
    frequency: Optional[Literal['daily', 'weekly', 'monthly', 'rarely']] = None

@dataclass
class CreateLifeEventNode:
    name: str
    category: Literal['relationship', 'work', 'family', 'health', 'financial']
    timestamp: str
    impact: Literal['major', 'moderate', 'minor']

@dataclass
class CreateConstraintNode:
    type: Literal['budget', 'space', 'lifestyle', 'maintenance', 'aesthetic']
    description: str
    severity: Literal['flexible', 'moderate', 'strict']
    isTemporary: bool
