from typing import List, Dict, Any
from dataclasses import dataclass
from .operations import MemoryQueryOperations, MemoryRelationshipOperations

@dataclass
class UserMemoryContext:
    preferences: List[Dict[str, Any]]
    summary: str

class MemoryRetrieval:
    
    @staticmethod
    def get_user_memory_context(user_id: str, current_query: str) -> UserMemoryContext:
        """Get user's memory context for a chat query"""
        try:
            # Get all user relationships
            relationships = MemoryRelationshipOperations.get_user_relationships(user_id)
            
            # Filter and format preferences
            preferences = []
            for rel in relationships:
                if rel['relationshipType'] in ['PREFERS', 'AVOIDS_DUE_TO']:
                    preferences.append({
                        'item': rel['nodeProps'].get('name', ''),
                        'type': rel['relationshipType'],
                        'strength': rel['relationshipProps'].get('strength', 5),
                        'color': rel['nodeProps'].get('color'),
                        'reason': rel['relationshipProps'].get('reason')
                    })
            
            # Sort by strength (strongest first)
            preferences.sort(key=lambda x: x['strength'], reverse=True)
            
            # Create memory summary for AI
            summary = MemoryRetrieval.create_memory_summary(preferences)
            
            return UserMemoryContext(
                preferences=preferences,
                summary=summary
            )
            
        except Exception as error:
            print(f'Error retrieving user memory: {error}')
            return UserMemoryContext(
                preferences=[],
                summary=''
            )
    
    @staticmethod
    def create_memory_summary(preferences: List[Dict[str, Any]]) -> str:
        """Create human-readable memory summary"""
        if not preferences:
            return ''
        
        likes = [p for p in preferences if p['type'] == 'PREFERS']
        dislikes = [p for p in preferences if p['type'] == 'AVOIDS_DUE_TO']
        
        summary = 'USER MEMORY - Consider these preferences:\n'
        
        if likes:
            summary += 'PREFERENCES:\n'
            for pref in likes:
                color_part = f" in {pref['color']}" if pref['color'] else ""
                summary += f"- Likes {pref['item']}{color_part} (strength: {pref['strength']}/10)\n"
        
        if dislikes:
            summary += 'AVOIDS:\n'
            for pref in dislikes:
                color_part = f" in {pref['color']}" if pref['color'] else ""
                reason_part = f" ({pref['reason']})" if pref['reason'] else ""
                summary += f"- Dislikes {pref['item']}{color_part}{reason_part} (strength: {pref['strength']}/10)\n"
        
        summary += '\nWhen suggesting colors or design choices, respect these learned preferences.'
        
        return summary
    
    @staticmethod
    def should_use_memory_for_query(query: str) -> bool:
        """Always use memory context when available - let agents decide relevance"""
        return True
    
    @staticmethod
    def get_memory_aware_context(user_id: str, query: str) -> str:
        """Get memory-aware response context"""
        # Only add memory context for relevant queries
        if not MemoryRetrieval.should_use_memory_for_query(query):
            return ''
        
        memory_context = MemoryRetrieval.get_user_memory_context(user_id, query)
        
        if not memory_context.preferences:
            return ''
        
        return f'\n\n{memory_context.summary}'