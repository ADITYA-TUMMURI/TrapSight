# TrustGuard Integration Contracts

This document defines the exact data structures and function signatures that all team members must follow.

## 1. AI Analysis Contract (Member 1 & Member 4)
**Action:** `analyzeTerms` / `analyze_checkout`
**Direction:** Content Script → Background Script

### Request Payload:
```json
{
  "action": "analyzeTerms",
  "text": "Extracted pricing text from the page..."
}
```

### Response Payload (JSON):
```json
{
  "success": true,
  "data": {
    "risk_level": "high | medium | low",
    "summary": "Brief explanation of the risk",
    "hidden_fee": "$XX.XX or 'none'",
    "line_content": "Exact text from source to highlight",
    "summaryMath": {
      "basePrice": "$XX.XX",
      "hiddenCharges": [
        { "label": "Fee Name", "amount": "$XX.XX" }
      ],
      "totalFirstYearCost": "$XX.XX"
    },
    "warnings": [
      {
        "severity": "high | medium | low",
        "message": "Human readable warning",
        "domSelectorToHighlight": "CSS selector (optional)"
      }
    ]
  }
}
```

## 2. Scraper Contract (Member 2 & Member 4)
**Function:** `window.scrapeCheckoutData()`
**Return Type:** Object or `null`

### Success Return:
```json
{
  "success": true,
  "domain": "example.com",
  "storeName": "Example Store",
  "extractedText": "Raw text content for AI",
  "scrapedAt": "ISO Timestamp"
}
```

## 3. UI Widget Contract (Member 3 & Member 4)
**Function:** `renderAlertWidget(card, overlay, aiData, targetButton, storeName)`
**Context:** Must operate within a **Shadow Root** to prevent CSS leaks.

### Requirements:
- Use `shadowRoot.appendChild()` instead of `document.body`.
- Handle "Proceed Anyway" by calling `targetButton.click()`.
- Handle "Read" by triggering scroll/highlight on `domSelectorToHighlight`.
