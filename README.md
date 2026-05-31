<div align="center">

# 👁️ TrapSight

**Read the fine print. We do it for you.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4f46e5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-10b981?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Serverless](https://img.shields.io/badge/Serverless-Zero%20Backend-6366f1?style=for-the-badge)](https://github.com/ADITYA-TUMMURI/TrapSight)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-ef4444?style=for-the-badge)](LICENSE)

A Chrome Extension that **intercepts checkout clicks** and uses **Gemini 1.5 Flash** to expose hidden fees, subscription traps, and dark patterns — before you pay.

</div>

---

## 🔥 The Problem

Hidden fees, auto-renewing subscriptions, and pre-checked add-ons cost consumers billions every year. These aren't accidents — they're designed to exploit decision fatigue at the moment you're most likely to click "Buy."

TrapSight stops that. When you click any checkout button, TrapSight **freezes the transaction**, analyzes the page with AI, and shows you what you're really signing up for. No servers, no data collection — everything runs locally in your browser.

---

## ✨ How It Works

1. **Click Interception** — A capturing-phase listener catches checkout buttons (`buy`, `subscribe`, `checkout`, etc.) and freezes the click before the page can process it.

2. **Smart Scraping** — `scraper.js` uses domain-specific CSS selectors to extract pricing text from the checkout page.

3. **AI Analysis** — The extracted text is sent to **Gemini 1.5 Flash** via the Google AI Studio API. The model returns structured JSON with risk levels, hidden fees, and exact quotes from the page.

4. **Risk Report** — A Shadow DOM widget overlays the page showing the breakdown: risk badge, fee math, warnings, and a "Read" button that scrolls to the exact line in the page that triggered the flag.

5. **Your Choice** — You decide: proceed with the purchase or cancel. The original click only goes through if you approve.

```
User clicks "Buy" → Click frozen → Page scraped → Gemini analyzes
    → Shadow DOM widget shows risk report → User decides to proceed or cancel
```

---

## 🔑 Key Features

| Feature | Details |
|---|---|
| **Just-in-Time Protection** | Intercepts checkout clicks before they fire |
| **Shadow DOM UI** | Widget renders in isolated Shadow DOM — immune to host page styles |
| **Deep-Link Highlighting** | AI identifies risky text → widget scrolls you to the exact line |
| **In-Memory Caching** | Same page re-analysis is instant (no redundant API calls) |
| **BYOK (Bring Your Own Key)** | Your Gemini API key stays in `chrome.storage.local` — never touches any server except Google's API |
| **Zero Backend** | No relay server, no telemetry, no data retention |

---

## 📁 Project Structure

```
TrapSight-ext/
├── manifest.json          # MV3 config: permissions, content scripts, service worker
├── background.js          # AI router — sends text to Gemini 1.5 Flash, returns JSON
├── scraper.js             # Domain-aware DOM scraper (Namecheap, Adobe, Shopify)
├── content.js             # Click interceptor, cache, Shadow DOM UI controller
├── popup.html / popup.js  # API key settings UI with live status indicator
├── widget/
│   ├── widget.js          # TrapSightWidget class — renders risk report card
│   └── widget.css         # Scoped styles with risk-level color semantics
├── demo.html              # Standalone test page (no live site needed)
└── INTEGRATION_CONTRACTS.md
```

---

## 🌐 Supported Sites

| Domain | What TrapSight Catches |
|---|---|
| `namecheap.com` | Pre-selected add-ons, privacy upsells |
| `adobe.com` | Annual plans disguised as monthly, termination fees |
| `*.myshopify.com` | Subscription traps, hidden processing fees |

> **Adding more sites?** Add a CSS selector entry in `scraper.js` and register the domain in `manifest.json`. That's it.

---

## ⚡ Setup (2 minutes, no build step)

**Prerequisites:** Chrome + a free [Google AI Studio API key](https://aistudio.google.com/app/apikey)

```bash
git clone https://github.com/ADITYA-TUMMURI/TrapSight.git
cd TrapSight
```

1. Go to `chrome://extensions` → enable **Developer Mode**
2. Click **Load unpacked** → select the project folder
3. Click the TrapSight icon → paste your API key → **Save**
4. Visit any supported checkout page and click a buy button

The status badge turns green when your key is configured. Open `demo.html` for a quick local test.

---

<div align="center">

**TrapSight** — *Stop paying for things you didn't agree to.*

[![GitHub](https://img.shields.io/badge/View%20on-GitHub-18181b?style=for-the-badge&logo=github)](https://github.com/ADITYA-TUMMURI/TrapSight)

</div>
