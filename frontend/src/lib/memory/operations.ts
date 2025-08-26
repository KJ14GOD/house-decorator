import { getDriver } from './neo4j';
import { 
  UserNode, CreateUserNode, 
  EmotionNode, CreateEmotionNode,
  FurnitureNode, CreateFurnitureNode,
  SpaceNode, CreateSpaceNode,
  ActivityNode, CreateActivityNode,
  ConstraintNode, CreateConstraintNode
} from './schemas';
import { MemoryRelationship, RELATIONSHIP_TYPES } from './relationships';

// Helper function to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Node Operations
export class MemoryNodeOperations {
  
  // Create User Node
  static async createUser(userData: CreateUserNode): Promise<UserNode> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const userNode: UserNode = {
        ...userData,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      const result = await session.run(
        `CREATE (u:User $props) RETURN u`,
        { props: userNode }
      );
      
      return result.records[0].get('u').properties;
    } finally {
      await session.close();
    }
  }

  // Get User by ID
  static async getUser(userId: string): Promise<UserNode | null> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId}) RETURN u`,
        { userId }
      );
      
      if (result.records.length === 0) return null;
      return result.records[0].get('u').properties;
    } finally {
      await session.close();
    }
  }

  // Create Emotion Node
  static async createEmotion(emotionData: CreateEmotionNode): Promise<EmotionNode> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const emotionNode: EmotionNode = {
        ...emotionData,
        emotionId: generateId('emotion')
      };
      
      const result = await session.run(
        `CREATE (e:Emotion $props) RETURN e`,
        { props: emotionNode }
      );
      
      return result.records[0].get('e').properties;
    } finally {
      await session.close();
    }
  }

  // Create Furniture Node
  static async createFurniture(furnitureData: CreateFurnitureNode): Promise<FurnitureNode> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const furnitureNode: FurnitureNode = {
        ...furnitureData,
        furnitureId: generateId('furniture')
      };
      
      const result = await session.run(
        `CREATE (f:Furniture $props) RETURN f`,
        { props: furnitureNode }
      );
      
      return result.records[0].get('f').properties;
    } finally {
      await session.close();
    }
  }

  // Create Space Node  
  static async createSpace(spaceData: CreateSpaceNode): Promise<SpaceNode> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const spaceNode: SpaceNode = {
        ...spaceData,
        spaceId: generateId('space')
      };
      
      const result = await session.run(
        `CREATE (s:Space $props) RETURN s`,
        { props: spaceNode }
      );
      
      return result.records[0].get('s').properties;
    } finally {
      await session.close();
    }
  }

  // Create Activity Node
  static async createActivity(activityData: CreateActivityNode): Promise<ActivityNode> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const activityNode: ActivityNode = {
        ...activityData,
        activityId: generateId('activity')
      };
      
      const result = await session.run(
        `CREATE (a:Activity $props) RETURN a`,
        { props: activityNode }
      );
      
      return result.records[0].get('a').properties;
    } finally {
      await session.close();
    }
  }

  // Create Constraint Node
  static async createConstraint(constraintData: CreateConstraintNode): Promise<ConstraintNode> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const constraintNode: ConstraintNode = {
        ...constraintData,
        constraintId: generateId('constraint')
      };
      
      const result = await session.run(
        `CREATE (c:Constraint $props) RETURN c`,
        { props: constraintNode }
      );
      
      return result.records[0].get('c').properties;
    } finally {
      await session.close();
    }
  }
}

// Relationship Operations
export class MemoryRelationshipOperations {
  
  // Create a relationship between two nodes
  static async createRelationship(
    fromNodeId: string,
    fromNodeType: string,
    toNodeId: string, 
    toNodeType: string,
    relationshipType: keyof typeof RELATIONSHIP_TYPES,
    properties: Partial<MemoryRelationship>
  ): Promise<boolean> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const relationshipProps = {
        ...properties,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Dynamically build the query based on node types and IDs
      const query = `
        MATCH (from:${fromNodeType}), (to:${toNodeType})
        WHERE from.${fromNodeType.toLowerCase()}Id = $fromId AND to.${toNodeType.toLowerCase()}Id = $toId
        CREATE (from)-[r:${relationshipType} $props]->(to)
        RETURN r
      `;
      
      const result = await session.run(query, {
        fromId: fromNodeId,
        toId: toNodeId,
        props: relationshipProps
      });
      
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  // Get all relationships for a user
  static async getUserRelationships(userId: string): Promise<any[]> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[r]->(n) 
        RETURN type(r) as relationshipType, properties(r) as relationshipProps, 
               labels(n) as nodeLabels, properties(n) as nodeProps
        `,
        { userId }
      );
      
      return result.records.map(record => ({
        relationshipType: record.get('relationshipType'),
        relationshipProps: record.get('relationshipProps'),
        nodeLabels: record.get('nodeLabels'),
        nodeProps: record.get('nodeProps')
      }));
    } finally {
      await session.close();
    }
  }

  // Find nodes that trigger specific emotions for a user
  static async getEmotionalTriggers(userId: string, emotion: string): Promise<any[]> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[r]->(n)
        WHERE r.emotion = $emotion
        RETURN type(r) as relationshipType, properties(r) as relationshipProps,
               labels(n) as nodeLabels, properties(n) as nodeProps
        `,
        { userId, emotion }
      );
      
      return result.records.map(record => ({
        relationshipType: record.get('relationshipType'),
        relationshipProps: record.get('relationshipProps'),
        nodeLabels: record.get('nodeLabels'),
        nodeProps: record.get('nodeProps')
      }));
    } finally {
      await session.close();
    }
  }
}

// Query Operations - for the "telepathic" understanding
export class MemoryQueryOperations {
  
  // Get user's emotional patterns
  static async getEmotionalProfile(userId: string): Promise<any> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[r]->(n)
        WHERE r.emotion IS NOT NULL
        RETURN r.emotion as emotion, count(*) as frequency,
               collect(distinct labels(n)[0]) as triggeredBy
        ORDER BY frequency DESC
        `,
        { userId }
      );
      
      return result.records.map(record => ({
        emotion: record.get('emotion'),
        frequency: record.get('frequency').toNumber(),
        triggeredBy: record.get('triggeredBy')
      }));
    } finally {
      await session.close();
    }
  }

  // Find what user avoids and why
  static async getAvoidancePatterns(userId: string): Promise<any[]> {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[r:AVOIDS_DUE_TO]->(n)
        RETURN properties(n) as avoided, r.reason as reason, r.description as description
        `,
        { userId }
      );
      
      return result.records.map(record => ({
        avoided: record.get('avoided'),
        reason: record.get('reason'),
        description: record.get('description')
      }));
    } finally {
      await session.close();
    }
  }
}