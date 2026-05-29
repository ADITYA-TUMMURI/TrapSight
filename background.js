/**
 * TrapSight - Member 1: Background Script & AI Engine
 * 
 * Handles message routing from the Content Script (Member 4), connects to
 * the Gemini 1.5 Flash API, and manages API keys securely.
 */

// Fallback API Key for development purposes. Replace with your key,
// or configure it through the extension popup.
const DEFAULT_GEMINI_KEY = '';

const SYSTEM_PROMPT = `
You are an expert contract analysis AI specializing in exposing consumer checkout traps and dark patterns.
You will analyze the scraped checkout pricing terms and find:
1. Hidden fees (e.g., activation fees, service charges, recovery fees).
2. Deceptive subscription auto-renewals (e.g., free trials that renew at full cost).
3. Complex legal pricing terms that you will translate into simple math.

Analyze the input text and construct a valid JSON response matching this schema:
{
  "hasHiddenFees": boolean,
  "summaryMath": {
    "basePrice": "the upfront base cost or recurring base cost (e.g., '$19.99/mo', '$0.00')",
    "hiddenCharges": [
      {
        "label": "The name of the charge (e.g., 'Regulatory Fee')",
        "amount": "The amount (e.g., '$2.50/mo' or '$15.00 one-time')"
      }
    ],
    "totalFirstYearCost": "Calculate the estimated total cost for the first 12 months, including base price and all fees (e.g., '$284.88')"
  },
  "warnings": [
    {
      "severity": "high" | "medium" | "low",
      "message": "A concise explanation of the trap or warning (e.g., 'Auto-renews at full price after 3 months.')",
      "domSelectorToHighlight": "A generic, common CSS selector matching the pricing line in typical checkouts if mentioned, or empty string."
    }
  ]
}

CRITICAL RULES:
- Return ONLY the raw JSON string. Do NOT wrap it in markdown code blocks like \`\`\`json.
- If there are no hidden charges, set "hasHiddenFees" to false and leave "hiddenCharges" empty.
- Ensure all numbers are calculated correctly.
`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeTerms') {
    handleAnalysis(message.text)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for asynchronous reply
  }
});

async function handleAnalysis(textToAnalyze) {
  // 1. Get the API Key from local storage, with fallback to the local variable
  const storage = await chrome.storage.local.get(['geminiApiKey']);
  const apiKey = storage.geminiApiKey || DEFAULT_GEMINI_KEY;

  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please open the extension popup and enter your key.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TrapSight Background] API Error response:', errorText);
    throw new Error(`Gemini API Request failed with status ${response.status}`);
  }

  const jsonResponse = await response.json();
  
  // Extract and parse the generated content from response structure
  try {
    const candidateText = jsonResponse.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(candidateText.trim());
    return parsedData;
  } catch (err) {
    console.error('[TrapSight Background] Failed to parse AI output:', err, jsonResponse);
    throw new Error('Failed to parse AI pricing analysis output.');
  }
}
