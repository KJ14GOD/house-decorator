from typing import Optional, Dict, Any
from .neo4j import get_driver

class PreferenceEvolution:
    
    @staticmethod
    def get_existing_preference(user_id: str, item_name: str, item_color: Optional[str] = None) -> Optional[Dict[str, str]]:
        """Check if user already has a preference for this item"""
        driver = get_driver()
        
        with driver.session() as session:
            # Look for existing preferences for this item (with or without color)
            color_condition = "AND n.color = $itemColor" if item_color else ""
            query = f"""
                MATCH (u:User {{userId: $userId}})-[r]->(n)
                WHERE n.name = $itemName
                {color_condition}
                RETURN type(r) as relType, id(n) as nodeId, id(r) as relId
            """
            
            params = {
                'userId': user_id,
                'itemName': item_name
            }
            if item_color:
                params['itemColor'] = item_color
            
            result = session.run(query, params)
            record = result.single()
            
            if record:
                return {
                    'relationshipType': record['relType'],
                    'nodeId': str(record['nodeId']),
                    'relationshipId': str(record['relId'])
                }
            
            return None
    
    @staticmethod
    def update_preference(
        user_id: str, 
        item_name: str, 
        new_preference_type: str,
        item_color: Optional[str] = None,
        properties: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update or replace existing preference"""
        existing_pref = PreferenceEvolution.get_existing_preference(user_id, item_name, item_color)
        
        if not existing_pref:
            # No existing preference, this is handled by normal creation
            return False
        
        # If same preference type, just update properties
        if existing_pref['relationshipType'] == new_preference_type:
            return PreferenceEvolution.update_relationship_properties(
                existing_pref['relationshipId'], 
                properties or {}
            )
        
        # Different preference type - delete old and create new
        PreferenceEvolution.delete_relationship(existing_pref['relationshipId'])
        return True  # Signal that we deleted old preference
    
    @staticmethod
    def delete_relationship(relationship_id: str) -> bool:
        """Delete a specific relationship"""
        driver = get_driver()
        
        with driver.session() as session:
            try:
                session.run(
                    """
                    MATCH ()-[r]->()
                    WHERE id(r) = $relId
                    DELETE r
                    """, 
                    relId=int(relationship_id)
                )
                
                print(f'🗑️ Deleted old preference relationship: {relationship_id}')
                return True
            except Exception as error:
                print(f'Error deleting relationship: {error}')
                return False
    
    @staticmethod
    def update_relationship_properties(relationship_id: str, properties: Dict[str, Any]) -> bool:
        """Update relationship properties"""
        driver = get_driver()
        
        with driver.session() as session:
            try:
                session.run(
                    """
                    MATCH ()-[r]->()
                    WHERE id(r) = $relId
                    SET r += $props, r.lastUpdated = datetime()
                    """, 
                    relId=int(relationship_id),
                    props=properties
                )
                
                print(f'🔄 Updated preference relationship: {relationship_id}')
                return True
            except Exception as error:
                print(f'Error updating relationship: {error}')
                return False
    
    @staticmethod
    def cleanup_orphaned_nodes() -> None:
        """Clean up orphaned nodes (nodes with no relationships)"""
        driver = get_driver()
        
        with driver.session() as session:
            try:
                session.run(
                    """
                    MATCH (n)
                    WHERE NOT (n)--() AND NOT n:User
                    DELETE n
                    """
                )
                
                print('🧹 Cleaned up orphaned nodes')
            except Exception as error:
                print(f'Error cleaning up orphaned nodes: {error}')