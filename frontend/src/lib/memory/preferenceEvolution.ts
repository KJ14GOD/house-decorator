import { getDriver } from './neo4j';

export class PreferenceEvolution {
  
  // Check if user already has a preference for this item
  static async getExistingPreference(userId: string, itemName: string, itemColor?: string): Promise<{
    relationshipType: string;
    nodeId: string;
    relationshipId?: string;
  } | null> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      // Look for existing preferences for this item (with or without color)
      const query = `
        MATCH (u:User {userId: $userId})-[r]->(n)
        WHERE n.name = $itemName
        ${itemColor ? 'AND n.color = $itemColor' : ''}
        RETURN type(r) as relType, id(n) as nodeId, id(r) as relId
      `;
      
      const result = await session.run(query, {
        userId,
        itemName,
        ...(itemColor && { itemColor })
      });
      
      if (result.records.length > 0) {
        const record = result.records[0];
        return {
          relationshipType: record.get('relType'),
          nodeId: record.get('nodeId').toString(),
          relationshipId: record.get('relId').toString()
        };
      }
      
      return null;
    } finally {
      await session.close();
    }
  }
  
  // Update or replace existing preference
  static async updatePreference(
    userId: string, 
    itemName: string, 
    newPreferenceType: 'PREFERS' | 'AVOIDS_DUE_TO',
    itemColor?: string,
    properties?: any
  ): Promise<boolean> {
    const existingPref = await this.getExistingPreference(userId, itemName, itemColor);
    
    if (!existingPref) {
      // No existing preference, this is handled by normal creation
      return false;
    }
    
    // If same preference type, just update properties
    if (existingPref.relationshipType === newPreferenceType) {
      return await this.updateRelationshipProperties(existingPref.relationshipId!, properties);
    }
    
    // Different preference type - delete old and create new
    await this.deleteRelationship(existingPref.relationshipId!);
    return true; // Signal that we deleted old preference
  }
  
  // Delete a specific relationship
  static async deleteRelationship(relationshipId: string): Promise<boolean> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(`
        MATCH ()-[r]->()
        WHERE id(r) = $relId
        DELETE r
      `, { relId: parseInt(relationshipId) });
      
      console.log(`🗑️ Deleted old preference relationship: ${relationshipId}`);
      return true;
    } catch (error) {
      console.error('Error deleting relationship:', error);
      return false;
    } finally {
      await session.close();
    }
  }
  
  // Update relationship properties
  static async updateRelationshipProperties(relationshipId: string, properties: any): Promise<boolean> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      await session.run(`
        MATCH ()-[r]->()
        WHERE id(r) = $relId
        SET r += $props, r.lastUpdated = datetime()
      `, { 
        relId: parseInt(relationshipId),
        props: properties
      });
      
      console.log(`🔄 Updated preference relationship: ${relationshipId}`);
      return true;
    } catch (error) {
      console.error('Error updating relationship:', error);
      return false;
    } finally {
      await session.close();
    }
  }
  
  // Clean up orphaned nodes (nodes with no relationships)
  static async cleanupOrphanedNodes(): Promise<void> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      await session.run(`
        MATCH (n)
        WHERE NOT (n)--() AND NOT n:User
        DELETE n
      `);
      
      console.log(`🧹 Cleaned up orphaned nodes`);
    } catch (error) {
      console.error('Error cleaning up orphaned nodes:', error);
    } finally {
      await session.close();
    }
  }
}