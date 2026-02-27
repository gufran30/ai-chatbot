const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse(input) {
  let formattedContent;

  if (Array.isArray(input)) {
    // If it's history, we use it directly
    formattedContent = input;
  } else if (typeof input === "string") {
    // If it's just a string, we wrap it as before
    if (!input.trim()) throw new Error("Content is empty!");
    formattedContent = [{ role: "user", parts: [{ text: input }] }];
  } else {
    throw new Error("Invalid input type provided to AI service");
  }

  try {
    const response = await ai.models.generateContent({
      // model: "gemini-3-flash-preview",
      model: "gemini-2.5-flash",
      contents: formattedContent,
    });

    return response.text;
  } catch (error) {
    // If you see the 400 error here, it means the 'contents' array was somehow malformed
    console.error("Gemini SDK Error:", error);
    throw error;
  }
}

module.exports = { generateResponse };
