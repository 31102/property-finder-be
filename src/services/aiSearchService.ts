import axios from "axios";

export async function processAISearch(query: string) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct", // Free open-source model hosted by OpenRouter
        messages: [
          {
            role: "system",
            content:
              "You are a real estate assistant. Extract structured search filters from the natural language query. Return a JSON object with fields: propertyType, bedrooms, bathrooms, minPrice, maxPrice, location, features. Use null if a value is missing.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://yourwebsite.com",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const aiReply = response.data.choices[0].message.content;
    try {
      return JSON.parse(aiReply);
    } catch (e) {
      console.warn("Failed to parse AI response as JSON:", aiReply);
      return null;
    }
  } catch (error: any) {
    console.error("Error calling OpenRouter:", error.message);
    return null;
  }
}
