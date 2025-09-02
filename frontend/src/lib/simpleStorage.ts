import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Lazy OpenAI client initialization
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

// Store individual message (legacy function - for backward compatibility)
export async function storeInPinecone(userId: string, message: string) {
  console.log(`storeInPinecone called - userId: ${userId}, message length: ${message.length}`);
  
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
  const indexName = 'house-decorator-chat';
  
  // Check if index exists, create only if it doesn't
  try {
    const existingIndexes = await pc.listIndexes();
    const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);
    
    if (!indexExists) {
      await pc.createIndexForModel({
        name: indexName,
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'llama-text-embed-v2',
          fieldMap: {text: 'chunk_text'}
        },
        waitUntilReady: true
      });
      console.log(`Created new Pinecone index: ${indexName}`);
    } else {
      console.log(`Using existing Pinecone index: ${indexName}`);
    }
  } catch (createError) {
    // If creation fails due to existing index, continue
    console.log('Index might already exist, continuing...');
  }

  const index = pc.index(indexName);
  const messageId = `msg_${userId}_${Date.now()}`;
  const embedding = await getOpenAIClient().embeddings.create({
    model: "text-embedding-3-small",
    input: message.trim(),
    dimensions: 1024, 
  })
  await index.upsert([{
    id: messageId,
    values: embedding.data[0].embedding,
    metadata: {
      userId,
      content: message,
      timestamp: Date.now()
    }
  }]);
  
  console.log(`Successfully stored message: ${messageId}`);
}

// Store conversation pair (user prompt + AI response together)
export async function storeConversationPair(userId: string, userPrompt: string, aiResponse: string) {
  
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
  const indexName = 'house-decorator-chat';
  
  // Check if index exists, create only if it doesn't
  try {
    const existingIndexes = await pc.listIndexes();
    const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);
    
    if (!indexExists) {
      await pc.createIndexForModel({
        name: indexName,
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'llama-text-embed-v2',
          fieldMap: {text: 'chunk_text'}
        },
        waitUntilReady: true
      });
      console.log(`Created new Pinecone index: ${indexName}`);
    } else {
      console.log(`Using existing Pinecone index: ${indexName}`);
    }
  } catch (createError) {
    // If creation fails due to existing index, continue
    console.log('Index might already exist, continuing...');
  }

  const index = pc.index(indexName);
  const conversationId = `${Date.now()}`;
  
  // Use the AI response for embedding since that's usually what we want to search
  const embedding = await getOpenAIClient().embeddings.create({
    model: "text-embedding-3-small",
    input: aiResponse.trim(),
    dimensions: 1024, 
  });
  
  await index.upsert([{
    id: conversationId,
    values: embedding.data[0].embedding,
    metadata: {
      userPrompt: userPrompt.trim(),
      aiResponse: aiResponse.trim(),
      timestamp: Date.now()
    }
  }]);
  
  console.log(`Successfully stored conversation pair: ${conversationId}`);
}
