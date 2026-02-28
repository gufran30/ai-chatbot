// Import the Pinecone library
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const indexName = "ai-chatbot"; // same as index that you made on PineCone
const chatBotVectorIndex = pc.index(indexName);

async function createVectorMemory({ vectors, metadata, messageId }) {
  try {
    const records = [
      {
        id: String(messageId),
        values: vectors,
        metadata,
      },
    ];
    await chatBotVectorIndex.upsert({ records });
  } catch (error) {
    console.error("Pinecone Upsert Error:", error);
    throw error;
  }
}

async function queryMemory({ queryVector, limit = 5, filter }) {
  try {
    const data = await chatBotVectorIndex.query({
      vector: queryVector,
      topK: limit,
      filter: filter,
      includeMetadata: true,
    });

    return data.matches;
  } catch (error) {
    console.error("Pinecone Query Error:", error);
    throw error;
  }
}

module.exports = { createVectorMemory, queryMemory };
