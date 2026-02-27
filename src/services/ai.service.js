const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse(content) {
  try {
    const response = await ai.models.generateContent({
      // model: "gemini-3-flash-preview",
      model: "gemini-2.5-flash",
      contents: content,
    });

    return response.text;
  } catch (error) {
    // If you see the 400 error here, it means the 'contents' array was somehow malformed
    console.error("Gemini SDK Error:", error);
    throw error;
  }
}

module.exports = { generateResponse };
