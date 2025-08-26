import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/memory/neo4j';

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    console.log('🔍 Debugging Neo4j connection and data...');
    
    // Test 1: Check if we can connect and what database we're on
    const dbInfo = await session.run('CALL db.info()');
    console.log('Database info:', dbInfo.records[0]?.keys);
    
    // Test 2: Count all nodes
    const nodeCount = await session.run('MATCH (n) RETURN count(n) as total');
    const totalNodes = nodeCount.records[0].get('total').toNumber();
    console.log(`Total nodes in database: ${totalNodes}`);
    
    // Test 3: Show all nodes and their types
    const allNodes = await session.run('MATCH (n) RETURN labels(n) as labels, properties(n) as props LIMIT 10');
    console.log(`Found ${allNodes.records.length} nodes:`);
    
    const nodes = allNodes.records.map(record => ({
      labels: record.get('labels'),
      properties: record.get('props')
    }));
    
    // Test 4: Show all relationships
    const allRels = await session.run('MATCH ()-[r]->() RETURN type(r) as relType, properties(r) as props LIMIT 10');
    const relationships = allRels.records.map(record => ({
      type: record.get('relType'),
      properties: record.get('props')
    }));
    
    await session.close();
    
    return NextResponse.json({
      status: 'success',
      debug: {
        totalNodes,
        nodes,
        relationships,
        connectionUri: process.env.NEO4J_URI,
        username: process.env.NEO4J_USERNAME
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}