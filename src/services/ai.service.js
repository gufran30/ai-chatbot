const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse(content) {
  if (!content || content.trim() === "") {
    throw new Error("Content is empty or undefined!");
  }

  try {
    // Gemini expects an array of content objects
    const formattedContent = [
      {
        role: "user",
        parts: [{ text: content }], // 'content' here is the string from your controller
      },
    ];

    const response = await ai.models.generateContent({
      // model: "gemini-3-flash-preview",
      model: "gemini-2.5-flash",
      contents: formattedContent,
    });

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    // If you see the 400 error here, it means the 'contents' array was somehow malformed
    console.error("Gemini SDK Error:", error);
    throw error;
  }
}



module.exports = { generateResponse };
