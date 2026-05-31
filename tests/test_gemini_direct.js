/**
 * TrapSight - Direct Gemini API Pipeline Test Script
 * 
 * This standalone script tests the direct, client-side fetch pipeline of TrapSight
 * using Node.js without loading the Chrome Extension. It verifies system instructions,
 * schema enforcement, and the absence of markdown formatting.
 * 
 * Run instructions:
 * 1. Open your terminal in this workspace directory.
 * 2. Set your Gemini API Key as an environment variable or edit the variable below:
 *    export GEMINI_API_KEY="your_api_key_here"
 * 3. Run the script:
 *    node tests/test_gemini_direct.js
 */

const fs = require('fs');
const path = require('path');

// 1. Retrieve the Gemini API Key from environment or hardcode a fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";

// 2. The exact mock checkout text snippet containing traps
const MOCK_CHECKOUT_TEXT = "Subscription auto-renews at $99/year. Non-refundable close-out fee of $25 applies.";

// 3. Exact system prompt deployed in background.js
const SYSTEM_PROMPT = `You are an isolated API endpoint evaluating consumer checkout traps and dark patterns. Your task is to analyze the provided checkout page text and identify any potential risks, deceptive patterns, or hidden fees.

You MUST return ONLY a raw, valid JSON object matching the following schema. Do NOT wrap the JSON in markdown code blocks or backticks (e.g., do NOT use \`\`\`json or \`\`\$). Do NOT include any additional conversational text, preambles, or postscripts.

Returned JSON Schema:
{
  "risk_level": "high/medium/low",
  "hidden_fee": "detected fee amount or none",
  "summary": "brief explanation"
}`;

console.log('================================================================');
console.log('🔬 STARTING STANDALONE GEMINI 1.5 FLASH PIPELINE TEST');
console.log('================================================================\n');

if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE" || !GEMINI_API_KEY) {
  console.error("❌ ERROR: Gemini API Key is missing!");
  console.error("Please provide it by editing the GEMINI_API_KEY variable in this script");
  console.error("or by running the script with the environment variable set:");
  console.error("  export GEMINI_API_KEY=\"AIzaSy...\" && node tests/test_gemini_direct.js\n");
  process.exit(1);
}

console.log(`[Test Input] text: "${MOCK_CHECKOUT_TEXT}"`);
console.log(`[API Endpoint] Sending direct request to Gemini 1.5 Flash...\n`);

async function runDirectPipelineTest() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this checkout text:\n\n${MOCK_CHECKOUT_TEXT}`
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

  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const duration = Date.now() - startTime;
    console.log(`[API Response] Status: ${response.status} ${response.statusText} (took ${duration}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API REQUEST FAILED: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    
    // Assert 1: Basic structural response fields
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error("❌ FAIL: Invalid response payload structure from Gemini.");
      console.log(JSON.stringify(data, null, 2));
      process.exit(1);
    }
    console.log("✅ PASS: Gemini response contains valid candidate structure.");

    const rawText = data.candidates[0].content.parts[0].text;
    
    console.log("\n------------------ Raw AI Response Content ------------------");
    console.log(rawText);
    console.log("-------------------------------------------------------------\n");

    // Assert 2: Verify no markdown wrapping (backticks or markdown blocks)
    const hasMarkdownBlocks = rawText.includes("```") || rawText.includes("`json");
    if (hasMarkdownBlocks) {
      console.error("❌ FAIL: AI output contains forbidden markdown wrapper backticks!");
    } else {
      console.log("✅ PASS: No markdown backticks or code blocks detected in raw text.");
    }

    // Assert 3: JSON Parsing verification
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawText.trim());
      console.log("✅ PASS: AI response was successfully parsed into a JavaScript object.");
    } catch (parseErr) {
      console.error(`❌ FAIL: Response text could not be parsed as valid JSON: ${parseErr.message}`);
      process.exit(1);
    }

    // Assert 4: Strict JSON Contract Verification
    const requiredKeys = ["risk_level", "hidden_fee", "summary"];
    const missingKeys = requiredKeys.filter(k => !(k in parsedJson));
    if (missingKeys.length > 0) {
      console.error(`❌ FAIL: JSON is missing required schema keys: [${missingKeys.join(", ")}]`);
    } else {
      console.log("✅ PASS: JSON contains all requested contract keys: risk_level, hidden_fee, summary.");
    }

    // Assert 5: Value & Pattern verification
    const risk = parsedJson.risk_level;
    const fee = parsedJson.hidden_fee;
    const summary = parsedJson.summary;

    console.log("\n[Parsed Object Values]:");
    console.log(`- risk_level: "${risk}"`);
    console.log(`- hidden_fee: "${fee}"`);
    console.log(`- summary:    "${summary}"\n`);

    if (risk === "high" || risk === "medium") {
      console.log(`✅ PASS: risk_level is identified as "${risk}" (expected "high" or "medium").`);
    } else {
      console.warn(`⚠️ WARNING: risk_level is "${risk}" (expected "high" due to hidden non-refundable setup fees).`);
    }

    if (fee.includes("$25") || fee.toLowerCase().includes("25")) {
      console.log(`✅ PASS: hidden_fee accurately extracted the value "${fee}" (matched "$25").`);
    } else {
      console.warn(`⚠️ WARNING: hidden_fee is "${fee}" (could not match "$25" from text).`);
    }

    if (summary && summary.length > 10) {
      console.log("✅ PASS: summary field provides a descriptive analysis.");
    } else {
      console.error("❌ FAIL: summary field is empty or excessively short.");
    }

    console.log('\n================================================================');
    if (!hasMarkdownBlocks && missingKeys.length === 0) {
      console.log('⭐ PIPELINE PIPING VERIFICATION SUCCESSFUL!');
      console.log('================================================================');
    } else {
      console.log('❌ PIPELINE PIPING VERIFICATION FAILED!');
      console.log('================================================================');
    }

  } catch (error) {
    console.error("❌ PIPELINE EXCEPTION ERROR:", error);
  }
}

runDirectPipelineTest();
