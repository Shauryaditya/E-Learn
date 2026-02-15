
const { GoogleGenerativeAI } = require("@google/generative-ai");
// require('dotenv').config({ path: '.env' });

const API_KEY = "AIzaSyC_X6OjCShKfT6g_E9EsQ_sNfy1lLSuLQM"; // Hardcoded for testing

async function listModels() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  try {
      console.log("Listing models...");
      const modelList = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; 
      // Actually accessing the model list requires a different call usually, 
      // but let's try to just generate content with a known model to see if key works, 
      // OR use the correct listModels endpoint if exposed by SDK.
      
      // better way with current SDK:
      // The SDK doesn't always expose listModels directly in the main class in all versions.
      // Let's try to just hit the API with a simple fetch.
      
      const key = API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.models) {
          console.log("Available Gemini models:");
          data.models.filter(m => m.name.includes("gemini")).forEach(m => {
              console.log(`- ${m.name}`);
          });
      } else {
          console.log("Error listing models:", data);
      }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
