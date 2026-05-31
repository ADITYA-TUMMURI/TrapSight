# TrapSight: Member 2 Documentation (DOM Targeting & Scraper)

This document details the design, implementation, and deliverables for **Member 2: DOM Targeting (The Scraper)** in the **TrapSight** project.

---

## 🎯 Role Overview
As Member 2, my primary responsibility is the secure and accurate extraction of checkout terms and pricing summaries from page DOM structures. 

The scraper forms the second step in the TrapSight extension pipeline:
1.  **Member 4 (Content Script)** intercepts the checkout/proceed action.
2.  **Member 2 (Scraper - *My Deliverable*)** extracts text content from the pricing elements.
3.  **Member 1 (Background & AI)** submits that text to Gemini 1.5 Flash.
4.  **Member 3 (UI Widget)** displays the parsed mathematical warning overlay.

---

## 🛠️ Technical Design & Implementations

### 1. File Structure & Delivery Method
To decouple the scraper logic from the main event listener and UI handling code, the scraper is implemented in a dedicated, isolated file:
*   **[scraper.js](file:///home/suzaykid/Projects/clearer-terms/scraper.js)**
*   It executes inside the extension content script environment and registers a single global function `window.scrapeCheckoutData()`.
*   This matches the API contract expected by **Member 4** and is registered in `manifest.json` to load immediately before `content.js`.

### 2. Domain Routing & Scope Restriction
In accordance with the roadmap, scraping actions are strictly restricted to the target demo websites to protect user privacy and optimize performance. 
*   Implemented a routing table using the `SCRAPER_ROUTES` config mapping.
*   Determines target matching based on `window.location.hostname` (including full subdomain wildcards like `*.demo-store-1.com`).
*   Immediately ignores and skips execution on out-of-scope websites, allowing checkout to proceed seamlessly.

### 3. Cascading CSS Selectors
Because pricing tables often vary in structure, the scraper uses a prioritized sequence of CSS selectors for each target site. It tests selectors in order (e.g., `.checkout-summary` -> `.order-summary` -> `#plan-summary`) and breaks on the first successful element match. This keeps selectors robust and guards against minor layout changes.

### 4. Text Sanitization
To minimize input tokens sent to the Gemini 1.5 Flash API (Member 1) and speed up response times:
*   Extracts plain text contents via `.innerText` with a safe fallback to `.textContent`.
*   Trims excess surrounding whitespace.
*   Filters out blank lines and double returns.
*   Normalizes content into clean, line-separated text blocks.

---

## 🧪 Testing and Verification

To ensure reliability, I have built a dedicated test suite located at:
*   **[tests/run_tests.js](file:///home/suzaykid/Projects/clearer-terms/tests/run_tests.js)**

This runner has zero external dependencies and mocks the browser DOM, Chrome storage, and Gemini API endpoints in Node.js. 

To run these tests locally, execute:
```bash
node tests/run_tests.js
```

### Scraper Unit Tests Cover:
1.  **Scope Restriction**: Ensuring out-of-scope hostnames immediately return `null`.
2.  **Selector Matching**: Confirming that target selectors successfully pull element contents.
3.  **Subdomain Routing**: Verifying that subdomains resolve to their parent domain rules (e.g., `checkout.demo-store-2.com` -> `demo-store-2.com`).
4.  **Graceful Failures**: Verifying that if selectors are missing on a target page, it returns a clean failure object instead of throwing runtime errors.

---

## 🤝 Collaboration Interface
Member 4 can execute my scraper within `content.js` as follows:

```javascript
// Check if the scraper script is loaded and run it
if (typeof window.scrapeCheckoutData === 'function') {
  const result = window.scrapeCheckoutData();
  
  if (result) {
    if (result.success) {
      console.log("Scraped text: ", result.extractedText);
      // Dispatch result.extractedText to Member 1's background worker...
    } else {
      console.warn("Target site matched but selector failed: ", result.error);
    }
  }
}
```
