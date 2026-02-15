const { GoogleGenerativeAI } = require("@google/generative-ai");

// This script requires the `GOOGLE_API_KEY` environment variable to be set.
// Usage: node --env-file=.env scripts/test-gemini-models.js
// OR: Set it in your terminal: $env:GOOGLE_API_KEY="your-api-key"; node scripts/test-gemini-models.js

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_API_KEY environment variable is not set.");
  console.error("Please create a .env file with GOOGLE_API_KEY=... or set usage environment variable.");
  process.exit(1);
}

async function listModels() {
  try {
      console.log("Listing models...");
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
      
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
