/**
 * TrapSight - Chrome Extension Service Worker (Manifest V3)
 * 
 * Functions as a serverless, secure AI router that communicates directly with the
 * Google AI Studio Gemini API (gemini-3.1-flash-lite) using a Bring Your Own Key (BYOK)
 * architecture. It processes scraped checkout page texts for dark patterns and hidden fees.
 */

// Define standard storage keys and model identifier
const API_KEY_STORAGE_KEYS = ['GEMINI_API_KEY', 'geminiApiKey'];
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_API_VERSION = 'v1beta';

// Exact system prompt mandated by architectural instructions
const SYSTEM_PROMPT = `You are a raw API endpoint parsing checkout page structures for dark patterns and deceptive pricing. Evaluate the text provided and return ONLY raw, valid JSON matching the required schema. Do not include markdown formatting, backticks, or conversational prose.`;

// Exact JSON schema contract requested by the user
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    risk_level: {
      type: "string",
      enum: ["high", "medium", "low"]
    },
    hidden_fee: {
      type: "string",
      description: "Detected fee amount or 'none'"
    },
    summary: {
      type: "string",
      description: "Brief explanation of the risk, hidden fee, or deceptive practice"
    },
    line_content: {
      type: "string",
      description: "Exact string or sentence from the source text containing the trap to allow targeting"
    }
  },
  required: ["risk_level", "hidden_fee", "summary", "line_content"]
};

// CSS selectors of common checkout elements to scroll/highlight as a fallback
const FALLBACK_DOM_SELECTORS = [
  '.checkout-summary', '.order-summary', '.pricing-breakdown', '.cart-totals',
  '.subscription-details', '.billing-plan-details', '#plan-summary', '.checkout-bill',
  '.pricing-details', '#cart-total', '.checkout-summary-container', '.fees-breakdown'
].join(', ');

/**
 * Service Worker Message Router
 * Listens for scraped checkout page payloads sent from the content scripts.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Support both 'analyzeTerms' (sent by content.js) and 'analyze_checkout' (general integration compatibility)
  if (message.action === 'analyzeTerms' || message.action === 'analyze_checkout') {
    handleAnalyzeRequest(message.text || "")
      .then((responsePayload) => {
        sendResponse({ success: true, data: responsePayload });
      })
      .catch((error) => {
        console.error('[TrapSight Service Worker] Error during checkout analysis:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to keep the message response channel open for async execution
    return true;
  }
});

/**
 * Coordinates API key retrieval, Gemini API request, and response translation.
 * 
 * @param {string} textToAnalyze - Scraped checkout page text.
 * @returns {Promise<Object>} - Parsed and UI-compatible response object.
 */
async function handleAnalyzeRequest(textToAnalyze) {
  // 1. Pull the user's custom API key from chrome.storage.local (supporting BYOK constraints)
  const storageData = await new Promise((resolve) => {
    chrome.storage.local.get(API_KEY_STORAGE_KEYS, (result) => {
      resolve(result || {});
    });
  });

  const apiKey = storageData.GEMINI_API_KEY || storageData.geminiApiKey;

  // Throw clear error if no personal API key is configured
  if (!apiKey) {
    const missingKeyErrorMsg = 'Gemini API Key not found. Please click the extension icon to configure your personal Google AI Studio API Key.';
    console.error(`[TrapSight Service Worker] API Key Error: ${missingKeyErrorMsg}`);
    throw new Error(missingKeyErrorMsg);
  }

  // 2. Dispatch request directly to Google AI Studio developer API endpoint
  const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

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
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
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
    console.error(`[TrapSight Service Worker] API request failed with status ${response.status}:`, errorText);
    throw new Error(`Gemini API Request failed with status ${response.status}. Please check your key validity.`);
  }

  const responseJson = await response.json();

  // Validate response integrity
  if (
    !responseJson.candidates ||
    responseJson.candidates.length === 0 ||
    !responseJson.candidates[0].content ||
    !responseJson.candidates[0].content.parts ||
    responseJson.candidates[0].content.parts.length === 0
  ) {
    throw new Error("Invalid response format received from the Gemini API.");
  }

  const candidateText = responseJson.candidates[0].content.parts[0].text;
  
  try {
    const parsedData = JSON.parse(candidateText.trim());
    
    // 3. Map/Augment the strict schema back to the UI structure expected by content.js
    // This maintains perfect runtime compatibility while adhering strictly to the JSON contract.
    let uiCompatibleData = { ...parsedData };

    // If it adheres to the requested strict schema, augment with content.js rendering structures
    if (parsedData.risk_level && !parsedData.warnings) {
      const isFeeDetected = parsedData.hidden_fee && parsedData.hidden_fee.toLowerCase() !== 'none';
      
      uiCompatibleData.hasHiddenFees = isFeeDetected;
      
      uiCompatibleData.summaryMath = {
        basePrice: "Calculated at checkout",
        hiddenCharges: isFeeDetected ? [{ label: "Detected Hidden Fee", amount: parsedData.hidden_fee }] : [],
        totalFirstYearCost: isFeeDetected ? `Base + ${parsedData.hidden_fee}` : "Base Price Only"
      };

      uiCompatibleData.warnings = [
        {
          severity: parsedData.risk_level.toLowerCase(),
          message: parsedData.summary || "Potential pricing risk detected on this page.",
          domSelectorToHighlight: FALLBACK_DOM_SELECTORS
        }
      ];
    }

    return uiCompatibleData;
  } catch (err) {
    console.error("[TrapSight Service Worker] Failed to parse candidate text as JSON:", candidateText, err);
    throw new Error("Failed to parse dark pattern analysis as a valid JSON object.");
  }
}
