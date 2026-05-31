/**
 * TrapSight - Chrome Extension Service Worker (Manifest V3)
 * Senior Software Engineer resolved implementation connecting to Gemini 1.5 Flash API.
 */

const GEMINI_API_KEY = "AQ.Ab8RN6IPLYdUN7s8qT_wm5nYcwzb5x5-kK-vhRWmWph8Bu2MTA";

const SYSTEM_PROMPT = `You are an isolated API endpoint evaluating consumer checkout traps and dark patterns. Your task is to analyze the provided checkout page text and identify any potential risks, deceptive patterns, or hidden fees.

You MUST return ONLY a raw, valid JSON object matching the following schema. Do NOT wrap the JSON in markdown code blocks or backticks (e.g., do NOT use \`\`\`json or \`\`\`). Do NOT include any additional conversational text, preambles, or postscripts.

Returned JSON Schema:
{
  "risk_level": "high/medium/low",
  "hidden_fee": "detected fee amount or none",
  "summary": "brief explanation"
}`;

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyze_checkout") {
    // Execute the async flow immediately and return true to keep the channel open
    handleAnalyzeCheckout(message.text || "")
      .then((parsedData) => {
        sendResponse({ success: true, data: parsedData });
      })
      .catch((error) => {
        console.error("[TrapSight Background] Error during analysis:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep the runtime message channel open for asynchronous response
  }
});

/**
 * Sends a client-side POST request directly to the Gemini 1.5 Flash API to analyze checkout terms.
 * Enforces structured JSON responses using the generationConfig and systemInstruction.
 * 
 * @param {string} textToAnalyze 
 * @returns {Promise<object>} Parsed JSON content returned by Gemini API
 */
async function handleAnalyzeCheckout(textToAnalyze) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this checkout text:\n\n${textToAnalyze}`
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT
        }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TrapSight Background] Direct Gemini API request failed:", errorText);
    throw new Error(`Gemini API Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (
    !data.candidates ||
    data.candidates.length === 0 ||
    !data.candidates[0].content ||
    !data.candidates[0].content.parts ||
    data.candidates[0].content.parts.length === 0
  ) {
    throw new Error("Invalid response format or empty response from Gemini API");
  }

  const candidateText = data.candidates[0].content.parts[0].text;
  
  try {
    const parsedData = JSON.parse(candidateText.trim());
    return parsedData;
  } catch (err) {
    console.error("[TrapSight Background] Failed to parse candidate text as JSON:", candidateText, err);
    throw new Error("Failed to parse pricing analysis as valid JSON");
  }
}
