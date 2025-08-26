import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/memory/neo4j';

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    console.log('🔍 Finding duplicate color nodes...');
    
    // Find nodes with similar colors (case-insensitive)
    const duplicatesQuery = `
      MATCH (n1), (n2)
      WHERE n1.name = 'wall_color' AND n2.name = 'wall_color' 
        AND id(n1) < id(n2)
        AND toLower(n1.color) = toLower(n2.color)
        AND n1.color <> n2.color
      RETURN n1.color as color1, n2.color as color2, 
             id(n1) as id1, id(n2) as id2
    `;
    
    const duplicates = await session.run(duplicatesQuery);
    
    if (duplicates.records.length === 0) {
      await session.close();
      return NextResponse.json({
        status: 'success',
        message: 'No duplicate color nodes found',
        duplicates: []
      });
    }
    
    console.log(`Found ${duplicates.records.length} duplicate pairs`);
    
    const duplicateInfo = duplicates.records.map(record => ({
      color1: record.get('color1'),
      color2: record.get('color2'),
      id1: record.get('id1').toNumber(),
      id2: record.get('id2').toNumber()
    }));
    
    await session.close();
    
    return NextResponse.json({
      status: 'success',
      message: `Found ${duplicates.records.length} duplicate color pairs`,
      duplicates: duplicateInfo,
      note: 'Use POST to this endpoint to merge duplicates'
    });
    
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    console.log('🧹 Cleaning up duplicate color nodes...');
    
    // Step 1: Find and merge relationships
    const moveRelationshipsQuery = `
      MATCH (n1), (n2)
      WHERE n1.name = 'wall_color' AND n2.name = 'wall_color' 
        AND id(n1) < id(n2)
        AND toLower(n1.color) = toLower(n2.color)
        AND n1.color <> n2.color
      WITH n1, n2,
           CASE WHEN n1.color = toLower(n1.color) THEN n1 ELSE n2 END as keepNode,
           CASE WHEN n1.color = toLower(n1.color) THEN n2 ELSE n1 END as deleteNode
      
      // Move PREFERS relationships
      OPTIONAL MATCH (u)-[r:PREFERS]->(deleteNode)
      WITH keepNode, deleteNode, u, r
      WHERE r IS NOT NULL
      CREATE (u)-[newR:PREFERS]->(keepNode)
      SET newR = properties(r)
      DELETE r
      
      RETURN count(r) as movedPrefers
    `;
    
    // Step 2: Move AVOIDS_DUE_TO relationships
    const moveAvoidsQuery = `
      MATCH (n1), (n2)
      WHERE n1.name = 'wall_color' AND n2.name = 'wall_color' 
        AND id(n1) < id(n2)
        AND toLower(n1.color) = toLower(n2.color)
        AND n1.color <> n2.color
      WITH n1, n2,
           CASE WHEN n1.color = toLower(n1.color) THEN n1 ELSE n2 END as keepNode,
           CASE WHEN n1.color = toLower(n1.color) THEN n2 ELSE n1 END as deleteNode
      
      // Move AVOIDS_DUE_TO relationships
      OPTIONAL MATCH (u)-[r:AVOIDS_DUE_TO]->(deleteNode)
      WITH keepNode, deleteNode, u, r
      WHERE r IS NOT NULL
      CREATE (u)-[newR:AVOIDS_DUE_TO]->(keepNode)
      SET newR = properties(r)
      DELETE r
      
      RETURN count(r) as movedAvoids
    `;
    
    // Step 3: Delete orphaned nodes
    const deleteOrphansQuery = `
      MATCH (n)
      WHERE n.name = 'wall_color' AND NOT (n)--()
      DELETE n
      RETURN count(n) as deletedCount
    `;
    
    // Execute the cleanup steps
    const result1 = await session.run(moveRelationshipsQuery);
    const movedPrefers = result1.records[0]?.get('movedPrefers').toNumber() || 0;
    
    const result2 = await session.run(moveAvoidsQuery);
    const movedAvoids = result2.records[0]?.get('movedAvoids').toNumber() || 0;
    
    const result3 = await session.run(deleteOrphansQuery);
    const deletedCount = result3.records[0]?.get('deletedCount').toNumber() || 0;
    
    await session.close();
    
    return NextResponse.json({
      status: 'success',
      message: `Successfully cleaned up duplicates`,
      details: {
        movedPrefers,
        movedAvoids,
        deletedNodes: deletedCount
      }
    });
    
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}