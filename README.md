<div align="center">

# 👁️ TrapSight

**Your financial firewall at the point of sale.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4f46e5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-10b981?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Serverless](https://img.shields.io/badge/Architecture-Serverless-6366f1?style=for-the-badge&logo=cloudflare&logoColor=white)](https://github.com/ADITYA-TUMMURI/TrapSight)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-ef4444?style=for-the-badge)](LICENSE)
[![Next Byte Hacks V2](https://img.shields.io/badge/Built%20at-Next%20Byte%20Hacks%20V2-f59e0b?style=for-the-badge)](https://github.com/ADITYA-TUMMURI/TrapSight)

> A serverless Manifest V3 Chrome Extension powered by **Gemini 1.5 Flash** that intercepts checkout clicks to expose predatory dark patterns, hidden fees, and deceptive subscription traps — before you click "Buy."

</div>

---

## 📌 Table of Contents

- [Inspiration & Problem Statement](#-inspiration--problem-statement)
- [Core Features](#-core-features)
- [Technical Architecture & Data Pipeline](#-technical-architecture--data-pipeline)
- [JSON Data Contract](#-json-data-contract)
- [Repository Structure](#-repository-structure)
- [Supported Sites](#-supported-sites)
- [Installation & Setup](#-installation--setup)
- [Team](#-team)

---

## 🔥 Inspiration & Problem Statement

Every year, billions of dollars are extracted from consumers not through outright fraud, but through **calculated design deception**. The mechanisms are well-documented: a "monthly" price that requires a full annual commitment, a free trial that converts to a $180/year charge with zero friction, a domain checkout that bundles $40 of optional add-ons in pre-checked boxes, or a cancellation penalty buried in a wall of fine print nobody reads.

These are not bugs. They are features — engineered by conversion-rate-optimization teams to exploit decision fatigue at the highest-intent moment in a user journey: **the checkout page**.

Existing solutions fall into two failure modes:

1. **Passive text highlighters** — tools that surface potentially suspicious words in DOM nodes are trivially defeated by obfuscated phrasing and do nothing to interrupt the user's forward momentum toward completing the purchase.
2. **Server-dependent analyzers** — tools that route page content through a centralized backend introduce unacceptable privacy risks, latency, and a single point of failure for every user.

**TrapSight rejects both models.** Instead, it enforces a single, inviolable design constraint: **just-in-time protective friction**. When a user moves to click any checkout, purchase, or subscribe button, TrapSight intercepts that event, extracts and analyzes the checkout text in real time against the Gemini AI, and presents a structured risk assessment — all before the original click is allowed to propagate. No server. No data retention. No compromise.

---

## ✨ Core Features

### 🛑 Just-in-Time Interception
TrapSight registers a capturing-phase `click` event listener on the `document` root. When the target matches a checkout-intent button (`checkout`, `buy`, `pay`, `subscribe`, `trial`, etc.), `e.preventDefault()` and `e.stopPropagation()` are called immediately, freezing the transaction. The original button click is only re-dispatched — via a clean `MouseEvent` with a `data-trapsight-approved` guard — **after** the user has reviewed the risk report and explicitly chosen to proceed.

```js
// content.js — Capturing-phase interceptor
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button, input[type="submit"], a, [role="button"]');
  const isCheckout = ['checkout', 'proceed', 'buy', 'pay', 'order',
                      'purchase', 'subscribe', 'trial', 'continue']
                      .some(k => btn.innerText.trim().toLowerCase().includes(k));

  if (isCheckout && !btn.dataset.trapsightApproved) {
    e.preventDefault();
    e.stopPropagation();
    startTrapSight(btn); // → triggers scraper → AI analysis → widget render
  }
}, true); // `true` = capturing phase, fires before any page handler
```

### 🛡️ Isolated Shadow DOM UI Rendering
The warning modal, loading spinner, and all associated CSS are mounted inside a **Shadow DOM** attached to a host element with `style.all = 'initial'`. This enforces a hard CSS isolation boundary: no host-page stylesheet — however aggressive its specificity — can bleed into or corrupt the TrapSight UI. The widget renders consistently and correctly on every supported domain.

```js
// content.js — Shadow root creation
widgetContainer = document.createElement('div');
widgetContainer.style.all = 'initial'; // Reset all inherited styles
document.body.appendChild(widgetContainer);
const shadow = widgetContainer.attachShadow({ mode: 'open' });
// All UI nodes are appended to `shadow`, never to `document.body` directly
```

### 🔗 Deep-Link DOM Highlighting
The AI response includes a `line_content` field: the exact verbatim string from the checkout page that triggered the risk flag. TrapSight's `findDOMSelectorForText()` function walks the live DOM to locate the smallest element whose text content contains this string, stamps it with a unique `trapsight-highlight-target-{n}` class, and returns the CSS selector. The widget's **"Read"** button uses this selector to auto-scroll the host page to the offending line and apply a visual highlight — linking the abstract warning directly to its source evidence.

### 💾 Analysis Caching
A `Map`-based in-memory cache keyed on the first 100 characters of the extracted text prevents redundant API calls during the same browser session. If the user closes and re-opens the widget on an unchanged page, the result is served instantly from cache.

### 🔑 BYOK — Bring Your Own Key
Zero telemetry. Zero backend. The user's Gemini API key is stored exclusively in `chrome.storage.local`, scoped to the extension's isolated storage partition. It never leaves the browser except as an `Authorization`-equivalent header on requests made directly to the Google AI Studio endpoint. The popup provides a real-time status indicator — green `● Key Configured` or red `● Key Not Configured` — so the user always knows the protection state at a glance.

---

## 🏗️ Technical Architecture & Data Pipeline

TrapSight enforces a **100% decentralized, serverless footprint**. There is no relay server, no logging endpoint, and no intermediary of any kind. The data flow is entirely local-to-API:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HOST CHECKOUT PAGE (DOM)                         │
│                                                                         │
│  User clicks "Checkout" button  ──►  e.preventDefault() fires          │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │  Checkout click intercepted
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  scraper.js  (Content Script, Layer 1)                                  │
│                                                                         │
│  Identifies domain → selects CSS route → queries pricing block nodes    │
│  window.scrapeCheckoutData() returns { storeName, extractedText, ... }  │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │  { extractedText: "..." }
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  content.js  (Content Script, Layer 2 — Point-of-Sale Controller)       │
│                                                                         │
│  Checks in-memory Map cache → on miss: renders Shadow DOM loading modal │
│  Sends chrome.runtime.sendMessage({ action: 'analyzeTerms', text })     │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │  chrome.runtime.sendMessage()
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  background.js  (MV3 Service Worker — Serverless AI Router)             │
│                                                                         │
│  1. chrome.storage.local.get() → retrieves geminiApiKey                 │
│  2. Constructs POST to Gemini 1.5 Flash API                             │
│  3. responseMimeType: "application/json" enforces strict schema output  │
│  4. Validates response → JSON.parse() → sendResponse()                  │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │  HTTPS fetch (direct, no relay)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Google AI Studio  ─  gemini-1.5-flash                                  │
│                                                                         │
│  Processes legal/pricing expert system prompt + extracted checkout text │
│  Returns constrained JSON object (responseMimeType enforced)            │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │  Strict JSON schema response
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  content.js  (UI Render Phase)                                          │
│                                                                         │
│  Validates & normalizes AI response → constructs warnings[]             │
│  findDOMSelectorForText() maps line_content → live DOM node selector    │
│  Instantiates TrapSightWidget (widget/widget.js) inside Shadow DOM      │
│  User chooses: [Proceed Anyway] → re-dispatch click │ [Cancel] → abort  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why a Service Worker as the AI Router?

Content scripts operate in a restricted context and cannot safely hold sensitive credentials. By delegating all API key retrieval and network requests to `background.js` (a MV3 Service Worker), TrapSight enforces a clean separation of concerns:

| Concern | Handled by |
|---|---|
| DOM parsing & text extraction | `scraper.js` |
| User interaction & UI rendering | `content.js` + `widget/` |
| API key storage & AI network calls | `background.js` |
| User key management | `popup.html` + `popup.js` |

---

## 📋 JSON Data Contract

`background.js` requests a response with `responseMimeType: "application/json"`, instructing Gemini to produce only valid, parseable JSON conforming to the following schema. This is the **invariant contract** shared across all four team members and documented in `INTEGRATION_CONTRACTS.md`.

**AI Response Payload (Full Schema):**

```json
{
  "risk_level": "high | medium | low",
  "summary": "2-sentence plain English breakdown of the risk",
  "hidden_fee": "$XX.XX or 'none'",
  "line_content": "Exact verbatim string from checkout text to highlight in DOM",
  "summaryMath": {
    "basePrice": "$XX.XX/period",
    "hiddenCharges": [
      { "label": "Human-readable fee name", "amount": "$XX.XX" }
    ],
    "totalFirstYearCost": "$XX.XX"
  },
  "warnings": [
    {
      "severity": "high | medium | low",
      "message": "Human-readable warning string",
      "domSelectorToHighlight": ".css-selector (resolved post-render)"
    }
  ]
}
```

**Message Bus Contract (Content Script → Service Worker):**

```json
{
  "action": "analyzeTerms",
  "text": "Raw extracted pricing text from the DOM..."
}
```

**Scraper Return Contract (`window.scrapeCheckoutData()`):**

```json
{
  "success": true,
  "storeName": "Adobe Checkout",
  "extractedText": "Raw pricing text...",
  "scrapedAt": "2026-05-31T16:27:00.000Z"
}
```

---

## 📁 Repository Structure

```
TrapSight-ext/
│
├── manifest.json               # MV3 configuration: permissions, host_permissions,
│                               # service worker declaration, and content script
│                               # injection order (widget.js → scraper.js → content.js)
│
├── background.js               # ★ Serverless AI Service Worker Router
│                               # Handles `analyzeTerms` messages; retrieves the
│                               # Gemini API key from chrome.storage.local; constructs
│                               # and executes the fetch() to Gemini 1.5 Flash;
│                               # enforces responseMimeType JSON contract; returns
│                               # parsed structured data to the content script.
│
├── scraper.js                  # ★ Domain-Aware DOM Parsing Engine
│                               # IIFE that exposes window.scrapeCheckoutData().
│                               # Maintains a routing table of CSS selectors keyed
│                               # by domain (Namecheap, Adobe, Shopify). Extracts
│                               # and returns raw pricing text for AI consumption.
│
├── content.js                  # ★ Point-of-Sale Interceptor & UI Controller
│                               # Registers the capturing-phase click interceptor;
│                               # manages the analysis cache; renders the Shadow DOM
│                               # loading modal; coordinates the scraper → AI →
│                               # widget pipeline; implements findDOMSelectorForText()
│                               # for deep-link DOM highlighting.
│
├── popup.html                  # Extension popup: premium dark-mode settings UI
│                               # with Indigo/Inter design system. Renders the API
│                               # key input, save button, and live status badge.
│
├── popup.js                    # Popup logic: reads/writes geminiApiKey to
│                               # chrome.storage.local; updates the live status
│                               # indicator between "Key Configured" and
│                               # "Key Not Configured" states.
│
├── widget/
│   ├── widget.js               # ★ Premium TrapSightWidget Class
│   │                           # Class-based, fully self-contained widget renderer.
│   │                           # Accepts the AI data object and renders the full
│   │                           # risk report card — risk badge, summaryMath breakdown,
│   │                           # warnings list, and action buttons — inside a
│   │                           # Shadow DOM context.
│   │
│   └── widget.css              # Widget stylesheet: scoped design tokens, risk-level
│                               # color semantics (red/amber/green), animations,
│                               # and premium glassmorphism card styles.
│
├── demo.html                   # Standalone browser demo simulating a checkout page
│                               # for local testing and presentation without requiring
│                               # a live e-commerce site.
│
└── INTEGRATION_CONTRACTS.md    # Formal cross-team data contracts defining the
                                # exact JSON schemas and function signatures for
                                # all inter-module communication boundaries.
```

---

## 🌐 Supported Sites

TrapSight is currently configured for three primary demo targets, reflecting common dark-pattern vectors:

| Domain | Store Context | Key Dark Pattern Risk |
|---|---|---|
| `namecheap.com` | Domain & Hosting Checkout | Pre-selected add-ons, privacy protection upsells |
| `adobe.com` | Creative Cloud Subscription | Annual plan disguised as monthly, early termination fees |
| `*.myshopify.com` | Generic E-commerce Checkout | Subscription traps, hidden processing fees |

> **Extending coverage** is straightforward: add a new entry to the `SCRAPER_ROUTES` object in `scraper.js` with the domain hostname and its relevant CSS selectors, then register the matching `matches` pattern and `host_permissions` URL in `manifest.json`.

---

## ⚡ Installation & Setup

TrapSight requires **no build step, no `npm install`, and no server**. Load it directly as an unpacked extension in under two minutes.

### Prerequisites

- Google Chrome (or any Chromium-based browser)
- A free **Google AI Studio** API key — get one at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/ADITYA-TUMMURI/TrapSight.git
cd TrapSight
```

### Step 2 — Load the Extension into Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer Mode** using the toggle in the top-right corner
3. Click **"Load unpacked"**
4. Select the root `TrapSight-ext/` directory (the folder containing `manifest.json`)

The TrapSight shield icon will appear in your Chrome toolbar.

### Step 3 — Configure Your API Key

1. Click the **TrapSight 👁️** icon in the Chrome toolbar to open the popup
2. Paste your Google AI Studio API key into the **"Gemini API Key"** field
3. Click **"Save API Key"**
4. The status badge will turn green: `● Key Configured`

Your key is stored exclusively in `chrome.storage.local` — it is never transmitted to any server other than `generativelanguage.googleapis.com` directly from your browser.

### Step 4 — Test the Extension

Navigate to any supported checkout page (e.g., a Shopify store checkout, Adobe.com plan selection, or Namecheap domain cart) and click any **"Checkout"**, **"Subscribe"**, or **"Buy Now"** button. TrapSight will intercept the click, analyze the page, and display its risk report before allowing the transaction to proceed.

For a quick local test without a live site, open `demo.html` directly in your browser.

---

## 👥 Team

Built in **72 hours** at **Next Byte Hacks V2** by a team of four engineers.

| Role | Focus Area |
|---|---|
| **Member 1** | Serverless AI Engine — `background.js`, Gemini API integration, JSON schema contract |
| **Member 2** | DOM Scraping Engine — `scraper.js`, CSS selector routing table, text extraction logic |
| **Member 3** | Widget UI System — `widget/widget.js`, `widget/widget.css`, Shadow DOM rendering |
| **Member 4** | Integration & Orchestration — `content.js`, cross-module contracts, `INTEGRATION_CONTRACTS.md` |

---

<div align="center">

**TrapSight** — *Read the fine print. We do it for you.*

[![GitHub](https://img.shields.io/badge/View%20on-GitHub-18181b?style=for-the-badge&logo=github)](https://github.com/ADITYA-TUMMURI/TrapSight)

</div>
