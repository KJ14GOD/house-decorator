import { MemoryQueryOperations, MemoryRelationshipOperations } from './operations';

interface UserMemoryContext {
  preferences: Array<{
    item: string;
    type: 'PREFERS' | 'AVOIDS_DUE_TO';
    strength: number;
    color?: string;
    reason?: string;
  }>;
  summary: string;
}

export class MemoryRetrieval {
  
  // Get user's memory context for a chat query
  static async getUserMemoryContext(userId: string, currentQuery: string): Promise<UserMemoryContext> {
    try {
      // Get all user relationships
      const relationships = await MemoryRelationshipOperations.getUserRelationships(userId);
      
      // Filter and format preferences
      const preferences = relationships
        .filter(rel => rel.relationshipType === 'PREFERS' || rel.relationshipType === 'AVOIDS_DUE_TO')
        .map(rel => ({
          item: rel.nodeProps.name,
          type: rel.relationshipType as 'PREFERS' | 'AVOIDS_DUE_TO',
          strength: rel.relationshipProps.strength || 5,
          color: rel.nodeProps.color,
          reason: rel.relationshipProps.reason
        }))
        .sort((a, b) => b.strength - a.strength); // Sort by strength (strongest first)
      
      // Create memory summary for AI
      const summary = this.createMemorySummary(preferences);
      
      return {
        preferences,
        summary
      };
      
    } catch (error) {
      console.error('Error retrieving user memory:', error);
      return {
        preferences: [],
        summary: ''
      };
    }
  }
  
  // Create human-readable memory summary
  static createMemorySummary(preferences: Array<{
    item: string;
    type: 'PREFERS' | 'AVOIDS_DUE_TO';
    strength: number;
    color?: string;
    reason?: string;
  }>): string {
    if (preferences.length === 0) {
      return '';
    }
    
    const likes = preferences.filter(p => p.type === 'PREFERS');
    const dislikes = preferences.filter(p => p.type === 'AVOIDS_DUE_TO');
    
    let summary = 'USER MEMORY - Consider these preferences:\n';
    
    if (likes.length > 0) {
      summary += 'PREFERENCES:\n';
      likes.forEach(pref => {
        summary += `- Likes ${pref.item}${pref.color ? ` in ${pref.color}` : ''} (strength: ${pref.strength}/10)\n`;
      });
    }
    
    if (dislikes.length > 0) {
      summary += 'AVOIDS:\n';
      dislikes.forEach(pref => {
        summary += `- Dislikes ${pref.item}${pref.color ? ` in ${pref.color}` : ''}${pref.reason ? ` (${pref.reason})` : ''} (strength: ${pref.strength}/10)\n`;
      });
    }
    
    summary += '\nWhen suggesting colors or design choices, respect these learned preferences.';
    
    return summary;
  }
  
  // Check if we should use memory for this query
  static shouldUseMemoryForQuery(query: string): boolean {
    const memoryTriggers = [
      'suggest', 'recommend', 'what color', 'which color', 'best color',
      'choose', 'pick', 'good', 'better', 'prefer', 'like',
      'design', 'style', 'looks', 'goes with', 'matches'
    ];
    
    const lowerQuery = query.toLowerCase();
    return memoryTriggers.some(trigger => lowerQuery.includes(trigger));
  }
  
  // Get memory-aware response context
  static async getMemoryAwareContext(userId: string, query: string): Promise<string> {
    // Only add memory context for relevant queries
    if (!this.shouldUseMemoryForQuery(query)) {
      return '';
    }
    
    const memoryContext = await this.getUserMemoryContext(userId, query);
    
    if (memoryContext.preferences.length === 0) {
      return '';
    }
    
    return `\n\n${memoryContext.summary}`;
  }
}