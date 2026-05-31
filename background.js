/**
 * TrapSight - FINAL AI ENGINE (Member 1)
 * Uses Gemini 1.5 Flash for rapid, accurate analysis.
 */

const API_KEY_STORAGE_KEYS = ['geminiApiKey'];
const GEMINI_MODEL = 'gemini-1.5-flash';

const SYSTEM_PROMPT = `You are a legal and pricing expert. Analyze the provided checkout text for hidden fees, auto-renewal traps, or predatory subscriptions. 
Return ONLY raw JSON. 
Structure: 
{
  "risk_level": "high|medium|low",
  "summary": "2 sentence explanation",
  "hidden_fee": "$ amount or 'none'",
  "line_content": "exact quote from text to highlight",
  "summaryMath": {
    "basePrice": "$ amount",
    "hiddenCharges": [{"label": "string", "amount": "$ amount"}],
    "totalFirstYearCost": "$ total"
  }
}`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeTerms' || message.action === 'analyze_checkout') {
    handleAnalysis(message.text)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleAnalysis(text) {
  const storage = await chrome.storage.local.get(API_KEY_STORAGE_KEYS);
  const apiKey = storage.GEMINI_API_KEY || storage.geminiApiKey;

  if (!apiKey) throw new Error("API Key missing. Click extension icon to set it.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Analyze this checkout text:\n\n${text}` }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { 
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);

  const json = await response.json();
  if (!json.candidates || !json.candidates[0].content) throw new Error("No response from AI.");
  
  return JSON.parse(json.candidates[0].content.parts[0].text);
}
