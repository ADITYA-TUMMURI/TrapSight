/**
 * TrapSight - Member 2: DOM Scraper Module
 * 
 * Exposes a global window.scrapeCheckoutData() function for Member 4 (Content Script)
 * to run when the user attempts to proceed to checkout.
 */
(function () {
  'use strict';

  // Config mapping for target domains and their respective pricing CSS selectors
  const SCRAPER_ROUTES = {
    'demo-store-1.com': {
      storeName: 'Demo Store 1 (e.g., General E-commerce)',
      selectors: [
        '.checkout-summary',
        '.order-summary',
        '.pricing-breakdown',
        '.cart-totals'
      ]
    },
    'demo-store-2.com': {
      storeName: 'Demo Store 2 (e.g., Subscription Service)',
      selectors: [
        '.subscription-details',
        '.billing-plan-details',
        '#plan-summary',
        '.checkout-bill'
      ]
    },
    'demo-store-3.com': {
      storeName: 'Demo Store 3 (e.g., SaaS Platform)',
      selectors: [
        '.pricing-details',
        '#cart-total',
        '.checkout-summary-container',
        '.fees-breakdown'
      ]
    }
  };

  /**
   * Identifies the target website, runs the appropriate CSS selectors to
   * extract checkout pricing details, and cleans up the resulting text.
   * 
   * @returns {Object|null} Scrape result object, or null if the page is out of scope.
   */
  function scrapeCheckoutData() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // 1. Routing Logic: Find matched configuration based on URL hostname
    let matchedDomain = null;
    for (const domain in SCRAPER_ROUTES) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        matchedDomain = domain;
        break;
      }
    }

    if (!matchedDomain) {
      console.log(`[TrapSight Scraper] Hostname "${hostname}" is out of scope. Skipping extraction.`);
      return null;
    }

    const config = SCRAPER_ROUTES[matchedDomain];
    let extractedText = '';
    let selectorUsed = '';

    // 2. Extraction Logic: Try selectors sequentially
    for (const selector of config.selectors) {
      const element = document.querySelector(selector);
        const rawText = element.innerText || element.textContent || '';
        extractedText = rawText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        selectorUsed = selector;
        break; // Stop at first successful match
      }
    }

    // 3. Prepare payload for Member 4
    if (!extractedText) {
      console.warn(`[TrapSight Scraper] Matched domain "${matchedDomain}" but failed to locate any pricing selector.`);
      return {
        success: false,
        domain: matchedDomain,
        storeName: config.storeName,
        url: url,
        error: 'Pricing container not found in DOM'
      };
    }

    console.log(`[TrapSight Scraper] Successfully extracted terms from "${matchedDomain}" using selector "${selectorUsed}".`);
    return {
      success: true,
      domain: matchedDomain,
      storeName: config.storeName,
      url: url,
      selectorUsed: selectorUsed,
      extractedText: extractedText,
      scrapedAt: new Date().toISOString()
    };
  }

  // Expose function globally to the content script environment
  window.scrapeCheckoutData = scrapeCheckoutData;
})();
