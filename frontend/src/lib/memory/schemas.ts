// Node type definitions for the User Memory Graph
export interface UserNode {
  userId: string;
  name?: string;
  email?: string;
  createdAt: string;
  lastActive: string;
  lifestage?: 'young_professional' | 'family_planning' | 'new_parent' | 'empty_nester' | 'retired';
  livingSituation?: 'alone' | 'with_partner' | 'with_roommates' | 'with_family';
}

export interface EmotionNode {
  emotionId: string;
  name: string; // 'calm', 'energized', 'anxious', 'inspired', etc.
  category: 'positive' | 'negative' | 'neutral';
  intensity?: number; // 1-10 scale
  description?: string;
}

export interface FurnitureNode {
  furnitureId: string;
  name: string; // 'sofa', 'coffee_table', etc.
  category: 'seating' | 'storage' | 'lighting' | 'decor' | 'workspace' | 'sleeping';
  style?: string; // 'modern', 'traditional', 'rustic', etc.
  // material?: string; // 'wood', 'metal', 'fabric', etc.
  color?: string;
  // priceRange?: 'budget' | 'mid' | 'luxury'; not needed for now 
}

export interface SpaceNode {
  spaceId: string;
  name: string; // 'living_room', 'bedroom', 'kitchen', etc.
  purpose: string; // 'relaxation', 'work', 'cooking', 'sleeping', etc.
  size?: 'small' | 'medium' | 'large';
  lightingType?: 'natural' | 'artificial' | 'mixed';
}

export interface ActivityNode {
  activityId: string;
  name: string; // 'morning_coffee', 'work_from_home', 'hosting_guests', etc.
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'rarely';
  importance: number; // 1-10 scale
}

export interface LifeEventNode {
  eventId: string;
  name: string; // 'moved_in_together', 'got_pet', 'started_remote_work', etc.
  category: 'relationship' | 'work' | 'family' | 'health' | 'financial';
  timestamp: string;
  impact: 'major' | 'moderate' | 'minor';
}

export interface ConstraintNode {
  constraintId: string;
  type: 'budget' | 'space' | 'lifestyle' | 'maintenance' | 'aesthetic';
  description: string; // 'cat destroys fabric', 'limited storage space', etc.
  severity: 'flexible' | 'moderate' | 'strict';
  isTemporary: boolean;
}

// Node creation types (what we accept when creating nodes)
export type CreateUserNode = Omit<UserNode, 'createdAt' | 'lastActive'>;
export type CreateEmotionNode = Omit<EmotionNode, 'emotionId'>;
export type CreateFurnitureNode = Omit<FurnitureNode, 'furnitureId'>;
export type CreateSpaceNode = Omit<SpaceNode, 'spaceId'>;
export type CreateActivityNode = Omit<ActivityNode, 'activityId'>;
export type CreateLifeEventNode = Omit<LifeEventNode, 'eventId'>;
export type CreateConstraintNode = Omit<ConstraintNode, 'constraintId'>;
