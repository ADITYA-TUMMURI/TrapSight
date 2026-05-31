/**
 * TrapSight - FINAL SCRAPER (Member 2 & 4)
 * Accurate selectors for the 3 Demo Sites.
 */
(function () {
  'use strict';

  const SCRAPER_ROUTES = {
    'namecheap.com': {
      storeName: 'Namecheap (Domain Checkout)',
      selectors: [
        '.checkout-summary', 
        '.cart-totals',      
        '.order-review'      
      ]
    },
    'adobe.com': {
      storeName: 'Adobe Checkout',
      selectors: [
        '.subscription-details', 
        '.billing-plan-details',
        '#plan-summary-container',
        '.order-summary',
        '.cart-summary',
        'aside',
        '[role="complementary"]'
      ]
    },
    'myshopify.com': {
      storeName: 'Shopify Checkout',
      selectors: [
        '.order-summary', 
        '.total-line-table',
        '[data-order-summary]' 
      ]
    }
  };

  function scrapeCheckoutData() {
    const hostname = window.location.hostname;
    let config = null;

    if (hostname.includes('namecheap')) config = SCRAPER_ROUTES['namecheap.com'];
    else if (hostname.includes('adobe')) config = SCRAPER_ROUTES['adobe.com'];
    else if (hostname.includes('myshopify')) config = SCRAPER_ROUTES['myshopify.com'];

    if (!config) return null;

    let extractedText = "";
    for (const selector of config.selectors) {
      const el = document.querySelector(selector);
      if (el) {
        extractedText += el.innerText + "\n";
      }
    }

    if (extractedText.length < 50) return null;

    return {
      success: true,
      storeName: config.storeName,
      extractedText: extractedText.trim(),
      scrapedAt: new Date().toISOString()
    };
  }

  window.scrapeCheckoutData = scrapeCheckoutData;
})();
