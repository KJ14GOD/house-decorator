"""
Semantic learning module that properly categorizes user preferences
This replaces the basic keyword extraction with proper semantic understanding
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import re
from .operations import MemoryNodeOperations, MemoryRelationshipOperations
from .schemas import CreateFurnitureNode, CreateEmotionNode, CreateConstraintNode
from .relationships import RELATIONSHIP_TYPES

@dataclass
class SemanticPreference:
    """Represents a properly categorized user preference"""
    category: str  # 'color_family', 'specific_color', 'style', 'material', 'emotion', 'constraint'
    item: str      # The actual preference
    sentiment: str # 'positive', 'negative', 'neutral'
    strength: int  # 1-10
    context: Optional[str] = None  # Additional context

class SemanticLearning:
    """
    Proper semantic understanding of user preferences
    This is the beginning of the 'Soul Reader' agent
    """
    
    # Color families and their members
    COLOR_FAMILIES = {
        'warm_colors': ['red', 'orange', 'yellow', 'pink', 'coral', 'peach', 'gold', 'amber', 'terracotta', 'tan', 'brown'],
        'cool_colors': ['blue', 'green', 'purple', 'teal', 'aqua', 'cyan', 'navy', 'turquoise', 'mint'],
        'neutral_colors': ['white', 'black', 'gray', 'grey', 'beige', 'cream', 'off-white', 'ivory'],
        'earth_tones': ['brown', 'tan', 'beige', 'olive', 'rust', 'terracotta', 'ochre'],
        'pastel_colors': ['light pink', 'light blue', 'lavender', 'mint green', 'peach', 'cream'],
        'bold_colors': ['bright red', 'electric blue', 'neon green', 'hot pink', 'vibrant yellow']
    }
    
    # Style preferences
    STYLE_KEYWORDS = {
        'modern': ['modern', 'contemporary', 'sleek', 'minimalist', 'clean lines'],
        'traditional': ['traditional', 'classic', 'formal', 'elegant', 'timeless'],
        'rustic': ['rustic', 'farmhouse', 'country', 'wooden', 'natural'],
        'industrial': ['industrial', 'loft', 'metal', 'exposed brick', 'urban'],
        'bohemian': ['bohemian', 'boho', 'eclectic', 'artistic', 'colorful'],
        'scandinavian': ['scandinavian', 'nordic', 'light wood', 'cozy', 'hygge']
    }
    
    # Emotional preferences
    EMOTION_KEYWORDS = {
        'calm': ['calm', 'peaceful', 'serene', 'relaxing', 'soothing', 'tranquil'],
        'energizing': ['energizing', 'vibrant', 'lively', 'stimulating', 'exciting'],
        'cozy': ['cozy', 'warm', 'comfortable', 'inviting', 'snug', 'homey'],
        'sophisticated': ['sophisticated', 'elegant', 'classy', 'refined', 'upscale'],
        'creative': ['creative', 'inspiring', 'artistic', 'imaginative', 'expressive']
    }
    
    @staticmethod
    def extract_semantic_preferences(user_input: str) -> List[SemanticPreference]:
        """
        Extract properly categorized preferences from user input
        This replaces the basic keyword matching
        """
        preferences = []
        lower_input = user_input.lower()
        
        # Determine sentiment
        positive_words = ['love', 'like', 'want', 'prefer', 'beautiful', 'perfect', 'amazing', 'adore']
        negative_words = ['hate', 'dislike', 'avoid', 'never', 'ugly', 'awful', 'terrible']
        
        is_positive = any(word in lower_input for word in positive_words)
        is_negative = any(word in lower_input for word in negative_words)
        
        base_sentiment = 'positive' if is_positive else 'negative' if is_negative else 'neutral'
        base_strength = 8 if is_negative else 7 if is_positive else 5
        
        # 1. Extract Color Family Preferences
        for family, colors in SemanticLearning.COLOR_FAMILIES.items():
            family_phrase = family.replace('_', ' ')
            if family_phrase in lower_input:
                preferences.append(SemanticPreference(
                    category='color_family',
                    item=family_phrase,
                    sentiment=base_sentiment,
                    strength=base_strength,
                    context=f"User mentioned '{family_phrase}'"
                ))
        
        # 2. Extract Specific Colors
        for family, colors in SemanticLearning.COLOR_FAMILIES.items():
            for color in colors:
                if color in lower_input:
                    preferences.append(SemanticPreference(
                        category='specific_color',
                        item=color,
                        sentiment=base_sentiment,
                        strength=base_strength + 1,  # Specific colors get higher strength
                        context=f"Mentioned specific color: {color}"
                    ))
        
        # 3. Extract Style Preferences
        for style, keywords in SemanticLearning.STYLE_KEYWORDS.items():
            if any(keyword in lower_input for keyword in keywords):
                preferences.append(SemanticPreference(
                    category='design_style',
                    item=style,
                    sentiment=base_sentiment,
                    strength=base_strength,
                    context=f"Style preference detected"
                ))
        
        # 4. Extract Emotional Preferences (this is key for the North Star vision!)
        for emotion, keywords in SemanticLearning.EMOTION_KEYWORDS.items():
            if any(keyword in lower_input for keyword in keywords):
                preferences.append(SemanticPreference(
                    category='emotional_goal',
                    item=emotion,
                    sentiment='positive',  # Emotional goals are always positive
                    strength=9,  # High importance
                    context=f"User wants to feel {emotion}"
                ))
        
        return preferences
    
    @staticmethod
    def store_semantic_preferences(user_id: str, preferences: List[SemanticPreference]) -> int:
        """
        Store semantic preferences in the Neo4j graph with proper categorization
        """
        stored_count = 0
        
        for pref in preferences:
            try:
                if pref.category == 'color_family':
                    SemanticLearning._store_color_family_preference(user_id, pref)
                elif pref.category == 'specific_color':
                    SemanticLearning._store_specific_color_preference(user_id, pref)
                elif pref.category == 'design_style':
                    SemanticLearning._store_style_preference(user_id, pref)
                elif pref.category == 'emotional_goal':
                    SemanticLearning._store_emotional_preference(user_id, pref)
                
                stored_count += 1
                
            except Exception as e:
                print(f"Error storing preference {pref.item}: {e}")
        
        return stored_count
    
    @staticmethod
    def _store_color_family_preference(user_id: str, pref: SemanticPreference):
        """Store color family preference (e.g., 'warm colors')"""
        # Create a Color node with proper categorization
        color_node = MemoryNodeOperations.create_furniture(
            CreateFurnitureNode(
                name='color_family',
                category='decor',
                style=pref.item,  # 'warm colors', 'cool colors', etc.
                color=None
            )
        )
        
        # Create relationship with semantic meaning
        relationship_type = RELATIONSHIP_TYPES['PREFERS'] if pref.sentiment == 'positive' else RELATIONSHIP_TYPES['AVOIDS_DUE_TO']
        
        MemoryRelationshipOperations.create_relationship(
            from_node_id=user_id,
            from_node_type='User',
            to_node_id=color_node.furnitureId,
            to_node_type='Furniture',
            relationship_type=relationship_type,
            properties={
                'strength': pref.strength,
                'category': 'color_family',
                'learnedFrom': 'semantic_analysis',
                'context': pref.context,
                'confidence': 0.8
            }
        )
    
    @staticmethod
    def _store_specific_color_preference(user_id: str, pref: SemanticPreference):
        """Store specific color preference (e.g., 'blue')"""
        color_node = MemoryNodeOperations.create_furniture(
            CreateFurnitureNode(
                name='specific_color',
                category='decor',
                style=None,
                color=pref.item  # Store the actual color here
            )
        )
        
        relationship_type = RELATIONSHIP_TYPES['PREFERS'] if pref.sentiment == 'positive' else RELATIONSHIP_TYPES['AVOIDS_DUE_TO']
        
        MemoryRelationshipOperations.create_relationship(
            from_node_id=user_id,
            from_node_type='User',
            to_node_id=color_node.furnitureId,
            to_node_type='Furniture',
            relationship_type=relationship_type,
            properties={
                'strength': pref.strength,
                'category': 'specific_color',
                'learnedFrom': 'semantic_analysis',
                'context': pref.context,
                'confidence': 0.9
            }
        )
    
    @staticmethod
    def _store_style_preference(user_id: str, pref: SemanticPreference):
        """Store design style preference (e.g., 'modern')"""
        style_node = MemoryNodeOperations.create_furniture(
            CreateFurnitureNode(
                name='design_style',
                category='decor',
                style=pref.item,
                color=None
            )
        )
        
        relationship_type = RELATIONSHIP_TYPES['PREFERS'] if pref.sentiment == 'positive' else RELATIONSHIP_TYPES['AVOIDS_DUE_TO']
        
        MemoryRelationshipOperations.create_relationship(
            from_node_id=user_id,
            from_node_type='User',
            to_node_id=style_node.furnitureId,
            to_node_type='Furniture',
            relationship_type=relationship_type,
            properties={
                'strength': pref.strength,
                'category': 'design_style',
                'learnedFrom': 'semantic_analysis',
                'context': pref.context,
                'confidence': 0.8
            }
        )
    
    @staticmethod
    def _store_emotional_preference(user_id: str, pref: SemanticPreference):
        """
        Store emotional preference - this is KEY for the North Star vision!
        This is the beginning of understanding how users want to FEEL
        """
        emotion_node = MemoryNodeOperations.create_emotion(
            CreateEmotionNode(
                name=pref.item,  # 'calm', 'energizing', etc.
                category='positive',
                intensity=pref.strength,
                description=pref.context
            )
        )
        
        # User ASPIRES to feel this emotion
        MemoryRelationshipOperations.create_relationship(
            from_node_id=user_id,
            from_node_type='User',
            to_node_id=emotion_node.emotionId,
            to_node_type='Emotion',
            relationship_type=RELATIONSHIP_TYPES['ASPIRES_TO_FEEL'],
            properties={
                'strength': pref.strength,
                'category': 'emotional_goal',
                'learnedFrom': 'semantic_analysis',
                'context': pref.context,
                'confidence': 0.9,
                'importance': 10  # Emotional goals are highest importance
            }
        )
    
    @staticmethod
    def get_semantic_summary(user_id: str) -> str:
        """
        Create a human-readable summary of user preferences with semantic understanding
        This replaces the basic memory summary
        """
        try:
            relationships = MemoryRelationshipOperations.get_user_relationships(user_id)
            
            # Categorize preferences semantically
            color_families = []
            specific_colors = []
            styles = []
            emotions = []
            avoids = []
            
            for rel in relationships:
                category = rel['relationshipProps'].get('category', '')
                strength = rel['relationshipProps'].get('strength', 5)
                rel_type = rel['relationshipType']
                
                if rel_type == 'PREFERS':
                    if category == 'color_family':
                        style = rel['nodeProps'].get('style', '')
                        color_families.append(f"{style} (strength: {strength})")
                    elif category == 'specific_color':
                        color = rel['nodeProps'].get('color', '')
                        specific_colors.append(f"{color} (strength: {strength})")
                    elif category == 'design_style':
                        style = rel['nodeProps'].get('style', '')
                        styles.append(f"{style} (strength: {strength})")
                elif rel_type == 'ASPIRES_TO_FEEL':
                    emotion = rel['nodeProps'].get('name', '')
                    emotions.append(f"{emotion} (strength: {strength})")
                elif rel_type == 'AVOIDS_DUE_TO':
                    item = rel['nodeProps'].get('style') or rel['nodeProps'].get('color') or rel['nodeProps'].get('name')
                    reason = rel['relationshipProps'].get('context', '')
                    avoids.append(f"{item} {reason}")
            
            # Create semantic summary
            summary = 'USER MEMORY - Semantic Understanding:\n'
            
            if emotions:
                summary += 'EMOTIONAL GOALS (How they want to FEEL):\n'
                for emotion in emotions:
                    summary += f'- Wants to feel: {emotion}\n'
            
            if color_families:
                summary += 'COLOR FAMILY PREFERENCES:\n'
                for family in color_families:
                    summary += f'- Likes: {family}\n'
            
            if specific_colors:
                summary += 'SPECIFIC COLOR PREFERENCES:\n'
                for color in specific_colors:
                    summary += f'- Likes: {color}\n'
            
            if styles:
                summary += 'DESIGN STYLE PREFERENCES:\n'
                for style in styles:
                    summary += f'- Prefers: {style}\n'
            
            if avoids:
                summary += 'AVOIDS:\n'
                for avoid in avoids:
                    summary += f'- Dislikes: {avoid}\n'
            
            if emotions:
                summary += '\nIMPORTANT: Prioritize emotional goals when making suggestions. Design for how they want to FEEL.'
            
            return summary
            
        except Exception as e:
            print(f"Error creating semantic summary: {e}")
            return ""