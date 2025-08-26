import json
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from openai import OpenAI
from .operations import MemoryNodeOperations, MemoryRelationshipOperations
from .preference_evolution import PreferenceEvolution

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@dataclass
class ExtractedPreference:
    type: str  # 'like' | 'dislike'
    item: str  # 'wall_color', 'sofa', 'lighting', etc.
    value: Optional[str] = None  # 'blue', 'modern', etc.
    context: Optional[str] = None  # 'for the living room', 'in the morning', etc.
    confidence: int = 5  # 1-10

class ChatLearning:
    
    @staticmethod
    def extract_preferences(user_message: str) -> List[ExtractedPreference]:
        """Extract preferences from a chat message"""
        prompt = f"""
        Analyze this user message and extract any design preferences (likes/dislikes):
        
        User message: "{user_message}"

        Colors: Be specific about the color you are extracting.

        "blue walls" → wall_color: blue
        "light gray walls" → wall_color: light gray
        "sage green walls" → wall_color: sage green
        "navy blue walls" → wall_color: navy blue
        "pure white walls" → wall_color: pure white
        "charcoal walls" → wall_color: charcoal
        "soft pink walls" → wall_color: soft pink
        "terracotta walls" → wall_color: terracotta
        "mustard yellow walls" → wall_color: mustad yellow
        "forest green walls" → wall_color: forest green
        "sky blue walls" → wall_color: sky blue
        "cream walls" → wall_color: cream
        "lavender walls" → wall_color: lavender
        "matte black walls" → wall_color: matte black
        "dark brown furniture" → furniture_color: dark brown
        "oak furniture" → furniture_color: oak
        "whitewashed furniture" → furniture_color: whitewashed
        "black leather furniture" → furniture_color: black leather
        "red velvet furniture" → furniture_color: red velvet
        "teal fabric furniture" → furniture_color: teal fabric
        "walnut finish furniture" → furniture_color: walnut finish
        "metallic gold furniture" → furniture_color: metallic gold
        "navy upholstered furniture" → furniture_color: navy upholstery
        "rustic pine furniture" → furniture_color: rustic pine
        "light oak furniture" → furniture_color: light oak
        "gray fabric furniture" → furniture_color: gray fabric
        "cream linen furniture" → furniture_color: cream linen
        "blush pink furniture" → furniture_color: blush pink
        "polished chrome furniture" → furniture_color: polished chrome
        "warm colors" → color_palette: warm
        "cool tones" → color_palette: cool
        "pastel colors" → color_palette: pastel
        "earthy tones" → color_palette: earthy tones
        "monochrome look" → color_palette: monochrome
        "neutral palette" → color_palette: neutral
        "vibrant colors" → color_palette: vibrant
        "jewel tones" → color_palette: jewel tones
        "muted colors" → color_palette: muted
        "natural wood tones" → color_palette: natural wood tones
        
       
        
        Respond with JSON array:
        [
          {{
            "type": "like" | "dislike",
            "item": "wall_color" | "furniture_sofa" | "style_modern" | etc,
            "value": "blue" | "leather" | "bright" | etc (if mentioned),
            "context": "in the living room" | "for morning" | etc (if mentioned),
            "confidence": 1-10
          }}
        ]
        
        If no clear preferences found, return empty array [].
        """

        try:
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[{'role': 'user', 'content': prompt}],
                max_tokens=300,
                temperature=0.1
            )

            content = response.choices[0].message.content or '[]'
            
            # Clean up markdown code blocks if present
            content = content.replace('```json', '').replace('```', '').strip()
            
            result = json.loads(content)
            return [ExtractedPreference(**pref) for pref in result]
        
        except Exception as error:
            print(f'Error extracting preferences: {error}')
            return []

    @staticmethod
    def store_preferences(user_id: str, preferences: List[ExtractedPreference]) -> None:
        """Store extracted preferences in memory graph"""
        # First, ensure the User node exists
        try:
            existing_user = MemoryNodeOperations.get_user(user_id)
            if not existing_user:
                from .schemas import CreateUserNode
                MemoryNodeOperations.create_user(CreateUserNode(
                    userId=user_id,
                    name='User'  # We can update this later when we have more info
                ))
                print(f'👤 Created User node for: {user_id}')
        except Exception as error:
            print(f'Error creating user node: {error}')
            return

        for pref in preferences:
            try:
                # Create or find the item node
                item_node = None
                
                # Normalize values to lowercase to prevent duplicates
                normalized_value = pref.value.lower() if pref.value else None
                
                if pref.item.startswith('wall_color'):
                    from .schemas import CreateSpaceNode
                    item_node = MemoryNodeOperations.create_space(CreateSpaceNode(
                        name='wall_color',
                        purpose='aesthetics',
                        color=normalized_value
                    ))
                elif pref.item.startswith('furniture_'):
                    furniture_type = pref.item.replace('furniture_', '')
                    from .schemas import CreateFurnitureNode
                    item_node = MemoryNodeOperations.create_furniture(CreateFurnitureNode(
                        name=furniture_type,
                        category='seating',  # Default, we can make this smarter later
                        style=normalized_value
                    ))
                else:
                    # Generic item
                    from .schemas import CreateFurnitureNode
                    item_node = MemoryNodeOperations.create_furniture(CreateFurnitureNode(
                        name=pref.item,
                        category='decor',
                        style=normalized_value
                    ))

                # Check for existing preferences and handle evolution
                relationship_type = 'PREFERS' if pref.type == 'like' else 'AVOIDS_DUE_TO'
                item_color = normalized_value
                
                was_updated = PreferenceEvolution.update_preference(
                    user_id,
                    pref.item,
                    relationship_type,
                    item_color,
                    {
                        'strength': pref.confidence,
                        'confidence': pref.confidence,
                        'source': 'explicit',
                        'context': pref.context,
                        'reason': 'aesthetic' if pref.type == 'dislike' else None
                    }
                )
                
                # If no existing preference was updated, create new relationship
                if not was_updated:
                    # Determine node ID and type safely
                    if hasattr(item_node, 'furnitureId'):
                        node_id = item_node.furnitureId
                        node_type = 'Furniture'
                    else:
                        node_id = item_node.spaceId
                        node_type = 'Space'
                    
                    MemoryRelationshipOperations.create_relationship(
                        user_id,
                        'User',
                        node_id,
                        node_type,
                        relationship_type,
                        {
                            'strength': pref.confidence,
                            'confidence': pref.confidence,
                            'source': 'explicit',
                            'context': pref.context,
                            'reason': 'aesthetic' if pref.type == 'dislike' else None
                        }
                    )
                
                # Clean up orphaned nodes after updates
                PreferenceEvolution.cleanup_orphaned_nodes()

                print(f'💾 Stored preference: {user_id} {pref.type}s {pref.item}{f" ({pref.value})" if pref.value else ""}')
                
            except Exception as error:
                print(f'Error storing preference for {pref.item}: {error}')

    @staticmethod
    def learn_from_chat(user_id: str, user_message: str) -> List[ExtractedPreference]:
        """Complete workflow: extract and store preferences from chat"""
        preferences = ChatLearning.extract_preferences(user_message)
        
        if preferences:
            ChatLearning.store_preferences(user_id, preferences)
            print(f'🧠 Learned {len(preferences)} preferences from: "{user_message}"')
        
        return preferences