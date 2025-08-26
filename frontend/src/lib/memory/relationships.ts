// Relationship type definitions for the User Memory Graph
// These relationships create the "telepathic" understanding

export interface BaseRelationship {
  strength: number; // 1-10 scale, how strong is this connection
  confidence: number; // 1-10 scale, how confident are we in this relationship
  createdAt: string;
  lastUpdated: string;
  source?: 'explicit' | 'inferred' | 'behavioral'; // How did we learn this
}

// Emotional relationships - the core of our memory system
export interface FeelsWithRelationship extends BaseRelationship {
  emotion: 'calm' | 'anxious' | 'energized' | 'overwhelmed' | 'inspired' | 'frustrated';
  context?: string; // "in the morning", "when working", "when hosting guests"
  trigger?: string; // What specifically causes this feeling
}

export interface AvoidsRelationship extends BaseRelationship {
  reason: 'anxiety' | 'bad_memory' | 'practical' | 'aesthetic' | 'partner_conflict';
  description?: string; // Why they avoid this
}

export interface AspiresRelationship extends BaseRelationship {
  aspiration: string; // "to feel sophisticated", "to be organized", "to impress guests"
  priority: number; // 1-10, how important is this aspiration
}

// Behavioral relationships
export interface UsesForRelationship extends BaseRelationship {
  activity: string; // "morning coffee", "work calls", "reading"
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface ConflictsWithRelationship extends BaseRelationship {
  conflictType: 'partner' | 'pet' | 'maintenance' | 'space' | 'budget';
  severity: 'minor' | 'moderate' | 'major';
  resolution?: string; // How they typically resolve this conflict
}

// Preference relationships
export interface PrefersRelationship extends BaseRelationship {
  preferenceType: 'style' | 'color' | 'layout' | 'lighting' | 'organization';
  intensity: number; // 1-10, how strong is this preference
  reasoning?: string; // Why they prefer this
}

export interface EvolvingTowardsRelationship extends BaseRelationship {
  direction: string; // "warmer colors", "more minimalist", "family-friendly"
  velocity: 'slow' | 'medium' | 'fast'; // How quickly they're changing
  predictedTimeline?: string; // When we expect this change to fully manifest
}

// Memory relationships
export interface TriggersMemoryRelationship extends BaseRelationship {
  memoryType: 'positive' | 'negative' | 'nostalgic' | 'traumatic';
  intensity: number; // 1-10, how strong is the memory association
  description?: string;
}

export interface EmotionallyAttachedToRelationship extends BaseRelationship {
  attachmentType: 'sentimental' | 'identity' | 'comfort' | 'status';
  replaceability: 'never' | 'reluctantly' | 'eventually' | 'easily';
  story?: string; // The story behind the attachment
}

// Constraint relationships  
export interface LimitedByRelationship extends BaseRelationship {
  limitationType: 'budget' | 'space' | 'time' | 'maintenance' | 'partner' | 'pet';
  flexibility: 'rigid' | 'negotiable' | 'flexible';
  workarounds?: string[]; // Known ways to work around this limitation
}

// Temporal relationships
export interface ChangedAfterRelationship extends BaseRelationship {
  lifeEvent: string; // "moved in together", "got cat", "started WFH"
  changeType: 'preference' | 'need' | 'constraint' | 'priority';
  description: string;
}

// Social relationships
export interface InfluencedByRelationship extends BaseRelationship {
  influencer: 'partner' | 'friend' | 'family' | 'social_media' | 'designer';
  influenceType: 'style' | 'preference' | 'decision' | 'constraint';
  direction: 'positive' | 'negative' | 'neutral';
}

// Union type for all relationship types
export type MemoryRelationship = 
  | FeelsWithRelationship
  | AvoidsRelationship  
  | AspiresRelationship
  | UsesForRelationship
  | ConflictsWithRelationship
  | PrefersRelationship
  | EvolvingTowardsRelationship
  | TriggersMemoryRelationship
  | EmotionallyAttachedToRelationship
  | LimitedByRelationship
  | ChangedAfterRelationship
  | InfluencedByRelationship;

// Relationship type names for Neo4j
export const RELATIONSHIP_TYPES = {
  FEELS_CALM_WITH: 'FEELS_CALM_WITH',
  FEELS_ANXIOUS_WITH: 'FEELS_ANXIOUS_WITH', 
  FEELS_ENERGIZED_WITH: 'FEELS_ENERGIZED_WITH',
  AVOIDS_DUE_TO: 'AVOIDS_DUE_TO',
  ASPIRES_TO_FEEL: 'ASPIRES_TO_FEEL',
  USES_FOR: 'USES_FOR',
  CONFLICTS_WITH: 'CONFLICTS_WITH',
  PREFERS: 'PREFERS',
  EVOLVING_TOWARDS: 'EVOLVING_TOWARDS',
  TRIGGERS_MEMORY: 'TRIGGERS_MEMORY',
  EMOTIONALLY_ATTACHED_TO: 'EMOTIONALLY_ATTACHED_TO',
  LIMITED_BY: 'LIMITED_BY',
  CHANGED_AFTER: 'CHANGED_AFTER',
  INFLUENCED_BY: 'INFLUENCED_BY'
} as const;