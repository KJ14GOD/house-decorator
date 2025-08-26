import neo4j, { Driver } from 'neo4j-driver';

// Neo4j connection configuration
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://127.0.0.1:7687'; 
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

// Create driver instance
let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
      {
        encrypted: false,
        trust: 'TRUST_ALL_CERTIFICATES'
      }
    );
  }
  return driver;
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  console.log('Attempting to connect to Neo4j with URI:', NEO4J_URI);
  console.log('Username:', NEO4J_USERNAME);
  console.log('Password set:', NEO4J_PASSWORD);
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run('RETURN "Connection successful" as message');
    const record = result.records[0];
    console.log('Neo4j connection test:', record.get('message'));
    return true;
  } catch (error) {
    console.error('Neo4j connection failed:', error);
    return false;
  } finally {
    await session.close();
  }
}

// Close driver connection
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}