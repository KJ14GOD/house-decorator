import OpenAI from 'openai';
import { MemoryNodeOperations, MemoryRelationshipOperations } from './operations';
import { PreferenceEvolution } from './preferenceEvolution';

// Lazy OpenAI client initialization
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

interface ExtractedPreference {
  type: 'like' | 'dislike';
  item: string; // 'wall_color', 'sofa', 'lighting', etc.
  value?: string; // 'blue', 'modern', etc.
  context?: string; // 'for the living room', 'in the morning', etc.
  confidence: number; // 1-10
}

export class ChatLearning {
  
  // Extract preferences from a chat message
  static async extractPreferences(userMessage: string): Promise<ExtractedPreference[]> {
    const prompt = `
    Analyze this user message and extract any design preferences (likes/dislikes):
    
    User message: "${userMessage}"
    
    Extract ONLY clear preferences about:
    - Colors (wall colors, furniture colors)
    - Furniture items (sofa, chair, table, etc.)
    - Styles (modern, traditional, minimalist)
    - Lighting preferences
    
    Respond with JSON array:
    [
      {
        "type": "like" | "dislike",
        "item": "wall_color" | "furniture_sofa" | "style_modern" | etc,
        "value": "blue" | "leather" | "bright" | etc (if mentioned),
        "context": "in the living room" | "for morning" | etc (if mentioned),
        "confidence": 1-10
      }
    ]
    
    If no clear preferences found, return empty array [].
    `;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1
      });

      let content = response.choices[0].message.content || '[]';
      
      // Clean up markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error('Error extracting preferences:', error);
      return [];
    }
  }

  // Store extracted preferences in memory graph
  static async storePreferences(userId: string, preferences: ExtractedPreference[]): Promise<void> {
    // First, ensure the User node exists
    try {
      const existingUser = await MemoryNodeOperations.getUser(userId);
      if (!existingUser) {
        await MemoryNodeOperations.createUser({
          userId,
          name: 'User', // We can update this later when we have more info
        });
        console.log(`👤 Created User node for: ${userId}`);
      }
    } catch (error) {
      console.error('Error creating user node:', error);
      return;
    }

    for (const pref of preferences) {
      try {
        // Create or find the item node
        let itemNode;
        
        // Normalize values to lowercase to prevent duplicates
        const normalizedValue = pref.value ? pref.value.toLowerCase() : undefined;
        
        if (pref.item.startsWith('wall_color')) {
          itemNode = await MemoryNodeOperations.createSpace({
            name: 'wall_color',
            purpose: 'aesthetics',
            ...(normalizedValue && { color: normalizedValue })
          });
        } else if (pref.item.startsWith('furniture_')) {
          const furnitureType = pref.item.replace('furniture_', '');
          itemNode = await MemoryNodeOperations.createFurniture({
            name: furnitureType,
            category: 'seating', // Default, we can make this smarter later
            ...(normalizedValue && { style: normalizedValue })
          });
        } else {
          // Generic item
          itemNode = await MemoryNodeOperations.createFurniture({
            name: pref.item,
            category: 'decor',
            ...(normalizedValue && { style: normalizedValue })
          });
        }

        // Check for existing preferences and handle evolution
        const relationshipType = pref.type === 'like' ? 'PREFERS' : 'AVOIDS_DUE_TO';
        const itemColor = normalizedValue;
        
        const wasUpdated = await PreferenceEvolution.updatePreference(
          userId,
          pref.item,
          relationshipType,
          itemColor,
          {
            strength: pref.confidence,
            confidence: pref.confidence,
            source: 'explicit',
            ...(pref.context && { context: pref.context }),
            ...(pref.type === 'dislike' && { reason: 'aesthetic' })
          }
        );
        
        // If no existing preference was updated, create new relationship
        if (!wasUpdated) {
          // Determine node ID and type safely
          const nodeId = 'furnitureId' in itemNode ? itemNode.furnitureId : itemNode.spaceId;
          const nodeType = 'furnitureId' in itemNode ? 'Furniture' : 'Space';
          
          await MemoryRelationshipOperations.createRelationship(
            userId,
            'User',
            nodeId,
            nodeType,
            relationshipType,
            {
              strength: pref.confidence,
              confidence: pref.confidence,
              source: 'explicit',
              ...(pref.context && { context: pref.context }),
              ...(pref.type === 'dislike' && { reason: 'aesthetic' })
            }
          );
        }
        
        // Clean up orphaned nodes after updates
        await PreferenceEvolution.cleanupOrphanedNodes();

        console.log(`💾 Stored preference: ${userId} ${pref.type}s ${pref.item}${pref.value ? ` (${pref.value})` : ''}`);
        
      } catch (error) {
        console.error(`Error storing preference for ${pref.item}:`, error);
      }
    }
  }

  // Complete workflow: extract and store preferences from chat
  static async learnFromChat(userId: string, userMessage: string): Promise<ExtractedPreference[]> {
    const preferences = await this.extractPreferences(userMessage);
    
    if (preferences.length > 0) {
      await this.storePreferences(userId, preferences);
      console.log(`🧠 Learned ${preferences.length} preferences from: "${userMessage}"`);
    }
    
    return preferences;
  }
}