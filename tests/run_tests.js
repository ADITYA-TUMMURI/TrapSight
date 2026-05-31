/**
 * TrapSight Test Suite
 * 
 * Runs unit tests for Member 2's DOM Scraper (scraper.js) and 
 * integration tests for the full Chrome extension pipeline.
 * 
 * Usage: node tests/run_tests.js
 */

const fs = require('fs');
const path = require('path');

console.log('==============================================');
console.log('🔬 STARTING TRAPSIGHT TEST SUITE');
console.log('==============================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// Mock browser environment helper
function setupMockGlobals() {
  global.window = {
    location: {
      href: '',
      hostname: ''
    }
  };
  global.document = {
    querySelector: null,
    head: { appendChild: () => {} },
    body: {
      appendChild: (el) => {
        global.document.body.children.push(el);
      },
      children: []
    },
    createElement: (tag) => new MockElement(tag),
    addEventListener: (event, handler) => {
      if (event === 'click') global.clickListeners.push(handler);
    }
  };
  global.clickListeners = [];
  global.chrome = {
    runtime: {
      lastError: null,
      onMessage: {
        addListener: (fn) => {
          global.messageListeners.push(fn);
        }
      },
      sendMessage: (message, callback) => {
        let sentResponse = false;
        const sendResponseWrapper = (response) => {
          sentResponse = true;
          setTimeout(() => callback(response), 0);
        };
        for (const listener of global.messageListeners) {
          const isAsync = listener(message, {}, sendResponseWrapper);
          if (isAsync) return;
        }
        if (!sentResponse) {
          setTimeout(() => callback(null), 0);
        }
      }
    },
    storage: {
      local: {
        get: (keys, callback) => {
          const result = {};
          keys.forEach(k => {
            result[k] = global.mockLocalStorage[k];
          });
          if (typeof callback === 'function') {
            setTimeout(() => callback(result), 0);
          } else {
            return Promise.resolve(result);
          }
        },
        set: (data, callback) => {
          Object.assign(global.mockLocalStorage, data);
          if (typeof callback === 'function') {
            setTimeout(() => callback(), 0);
          } else {
            return Promise.resolve();
          }
        }
      }
    }
  };
  global.messageListeners = [];
  global.mockLocalStorage = { geminiApiKey: 'test-key' };
}

class MockElement {
  constructor(tag, textContent = '', className = '', id = '') {
    this.tagName = tag.toUpperCase();
    this._textContent = textContent;
    this.className = className;
    this.id = id;
    this.dataset = {};
    this.children = [];
    this.shadowRoot = null;
    this.listeners = {};
    this.clicked = false;
    this.style = {};
  }

  get textContent() {
    if (this.children.length === 0) {
      return this._textContent || '';
    }
    return this.children.map(child => child.textContent).join(' ');
  }

  set textContent(val) {
    this._textContent = val;
  }

  set innerHTML(html) {
    this._innerHTML = html;
    // Regex to capture elements with class, id, and text content
    const elementRegex = /<([a-z0-9-]+)([^>]*?)>(.*?)<\/\1>/gi;
    let match;
    while ((match = elementRegex.exec(html)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      const content = match[3].replace(/<[^>]*>/g, '').trim(); // strip inner tags for text content

      // Extract class
      const classMatch = /class="([^"]+)"/i.exec(attrs);
      const className = classMatch ? classMatch[1].split(' ')[0] : '';

      // Extract id
      const idMatch = /id="([^"]+)"/i.exec(attrs);
      const idName = idMatch ? idMatch[1] : '';

      const child = new MockElement(tag, content, className, idName);
      
      // Recursive parsing for nested structure if any (e.g. total line price gradient)
      if (match[3].includes('<')) {
        child.innerHTML = match[3];
      }

      this.children.push(child);
    }
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  closest(selector) {
    if (selector.includes('button') && this.tagName === 'BUTTON') return this;
    return null;
  }

  getAttribute(name) {
    return this[name] || '';
  }

  attachShadow() {
    this.shadowRoot = new MockElement('shadowRoot');
    return this.shadowRoot;
  }

  appendChild(el) {
    this.children.push(el);
    return el;
  }

  remove() {
    const idx = global.document.body.children.indexOf(this);
    if (idx !== -1) {
      global.document.body.children.splice(idx, 1);
    }
  }

  click() {
    this.clicked = true;
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  trigger(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb());
    }
  }

  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        if (child.className && child.className.split(' ').includes(className)) {
          return child;
        }
      }
      if (selector.startsWith('#')) {
        const idName = selector.slice(1);
        if (child.id === idName) {
          return child;
        }
      }
      const deepMatch = child.querySelector(selector);
      if (deepMatch) return deepMatch;
    }
    return null;
  }
}

// Evaluate production scripts in global environment
function evaluateScript(filename) {
  const code = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  eval(code);
}

// ==============================================
// 1. UNIT TESTS: scraper.js (Member 2)
// ==============================================
function runScraperUnitTests() {
  console.log('--- 🛡️ RUNNING UNIT TESTS: scraper.js ---');
  setupMockGlobals();
  evaluateScript('scraper.js');

  // Test Case A: Out of scope website
  global.window.location.hostname = 'randomwebsite.com';
  global.window.location.href = 'https://randomwebsite.com/cart';
  let result = global.window.scrapeCheckoutData();
  assert(result === null, 'Out of scope domains should return null');

  // Test Case B: In-scope domain - Selector Success
  global.window.location.hostname = 'demo-store-1.com';
  global.window.location.href = 'https://demo-store-1.com/checkout';
  
  // Mock element selector match
  const mockElement = new MockElement('div', 'Monthly fee: $19.99\nSetup charge: $10.00');
  global.document.querySelector = (selector) => {
    if (selector === '.checkout-summary') return mockElement;
    return null;
  };

  result = global.window.scrapeCheckoutData();
  assert(result !== null && result.success === true, 'In-scope domains with matching selectors should succeed');
  assert(result.domain === 'demo-store-1.com', 'Result should contain matched domain');
  assert(result.extractedText.includes('Monthly fee: $19.99'), 'Extracted text should preserve key information');
  assert(result.selectorUsed === '.checkout-summary', 'Result should indicate which CSS selector was matched');

  // Test Case C: Subdomain match
  global.window.location.hostname = 'checkout.demo-store-2.com';
  global.window.location.href = 'https://checkout.demo-store-2.com/pay';
  
  const subElement = new MockElement('div', 'Subscription details: $9.99/mo');
  global.document.querySelector = (selector) => {
    if (selector === '.subscription-details') return subElement;
    return null;
  };
  result = global.window.scrapeCheckoutData();
  assert(result !== null && result.success === true, 'Subdomain matching should resolve correctly to parent config');
  assert(result.domain === 'demo-store-2.com', 'Result domain should map back to parent target config');

  // Test Case D: Selector Missing on target site
  global.window.location.hostname = 'demo-store-3.com';
  global.document.querySelector = () => null;
  result = global.window.scrapeCheckoutData();
  assert(result !== null && result.success === false, 'Target sites with missing elements should return safe failure payload');
  assert(result.error === 'Pricing container not found in DOM', 'Failure payload should describe DOM issue');
  
  console.log();
}

// ==============================================
// 2. INTEGRATION TESTS: Scraper + UI + Routing
// ==============================================
async function runIntegrationTests() {
  console.log('--- 🔗 RUNNING INTEGRATION TESTS: scraper + content + background ---');
  setupMockGlobals();
  
  // Mock fetch call to Gemini API
  const mockGeminiJSON = {
    hasHiddenFees: true,
    summaryMath: {
      basePrice: "$19.99/mo",
      hiddenCharges: [{ label: "Regulatory Fee", amount: "$2.50/mo" }],
      totalFirstYearCost: "$269.88"
    },
    warnings: [{ severity: "high", message: "Deceptive auto-renewal", domSelectorToHighlight: ".terms-box" }]
  };

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(mockGeminiJSON) }] } }]
    })
  });

  // Load files
  evaluateScript('scraper.js');
  evaluateScript('background.js');
  evaluateScript('content.js');

  // Mock Target DOM Elements
  const summaryEl = new MockElement('div', 'Subtotal: $19.99/mo');
  global.document.querySelector = (selector) => {
    if (selector === '.checkout-summary') return summaryEl;
    return null;
  };

  const checkoutBtn = new MockElement('button', 'Checkout Now');
  const mockEvent = {
    target: checkoutBtn,
    preventDefault: () => { mockEvent.prevented = true; },
    stopPropagation: () => { mockEvent.stopped = true; }
  };

  // Trigger button click on in-scope site
  global.window.location.hostname = 'demo-store-1.com';
  const clickHandler = global.clickListeners[0];
  
  assert(typeof clickHandler === 'function', 'Content script should attach a document click event listener');
  
  clickHandler(mockEvent);
  assert(mockEvent.prevented && mockEvent.stopped, 'Click event should be intercepted and paused on target sites');

  // Confirm loading modal injection
  const widgetContainer = global.document.body.children[0];
  assert(widgetContainer !== undefined && widgetContainer.id === 'trapsight-widget-container', 'Glassmorphic loading widget container should be injected');
  
  const shadowRoot = widgetContainer.shadowRoot;
  assert(shadowRoot !== null && shadowRoot.querySelector('.spinner') !== null, 'Loading spinner should be mounted in shadow DOM');

  // Wait for background worker processing and state rendering
  await new Promise(resolve => setTimeout(resolve, 30));

  // Verify UI Alert widget components
  const mathDisplay = shadowRoot.querySelector('.math-display');
  assert(mathDisplay !== null, 'Mathematical pricing breakdown should be populated');

  const warnCard = shadowRoot.querySelector('.warning-card');
  assert(warnCard !== null && warnCard.textContent.includes('Deceptive auto-renewal'), 'High severity warning card should render message correctly');

  // Verify Proceed/Bypass logic
  const proceedBtn = shadowRoot.querySelector('.btn-proceed');
  assert(proceedBtn !== null, 'Bypass proceed button should be present in footer actions');
  
  proceedBtn.trigger('click');
  assert(checkoutBtn.clicked === true, 'Checkout action should be replayed upon clicking "Proceed"');
  assert(checkoutBtn.dataset.trapsightApproved === 'true', 'Replayed click should pass safety validation flag');
  assert(global.document.body.children.length === 0, 'Shadow DOM widget should be destroyed and removed after proceeding');
  
  console.log();
}

// Run everything
runScraperUnitTests();
runIntegrationTests().then(() => {
  console.log('==============================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log(`  Total Run: ${totalTests}`);
  console.log(`  Passed:    ${passedTests}`);
  console.log(`  Failed:    ${failedTests}`);
  console.log('==============================================');
  
  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('⭐ ALL TESTS COMPLETED SUCCESSFULLY! TRAPSIGHT READY TO SHIP.');
    process.exit(0);
  }
});
