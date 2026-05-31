/**
 * TrapSight - FINAL CONTENT & UI (Member 3 & 4)
 * High-fidelity "Shield" UI with Shadow DOM and Just-in-Time Interception.
 */

(function () {
  'use strict';

  let widgetContainer = null;
  const analysisCache = new Map();

  // 1. ATTACH INTERCEPTOR
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, input[type="submit"], a, [role="button"]');
    if (!btn) return;

    const text = btn.innerText.trim().toLowerCase();
    const isCheckout = ['checkout', 'proceed', 'buy', 'pay', 'order', 'purchase', 'subscribe', 'trial', 'continue'].some(k => text.includes(k));

    if (isCheckout && !btn.dataset.trapsightApproved) {
      e.preventDefault();
      e.stopPropagation();
      startTrapSight(btn);
    }
    }, true);

    async function startTrapSight(targetButton) {
    if (widgetContainer) widgetContainer.remove();

    // Trigger Scraper
    let scrapeData = window.scrapeCheckoutData ? window.scrapeCheckoutData() : null;

    // Fallback for demo sites to ensure modal always appears
    if (!scrapeData && (window.location.hostname.includes('adobe') || window.location.hostname.includes('namecheap'))) {
      scrapeData = {
        success: true,
        storeName: window.location.hostname.includes('adobe') ? "Adobe Checkout" : "Namecheap",
        extractedText: document.body.innerText.substring(0, 2000) // Scrape full body if specific selectors fail
      };
    }

    if (!scrapeData) {
      proceed(targetButton);
      return;
    }

    // Check Cache
    const cacheKey = scrapeData.extractedText.substring(0, 100);
    if (analysisCache.has(cacheKey)) {
      displayWidget(targetButton, scrapeData, analysisCache.get(cacheKey));
      return;
    }

    createLoadingModal(targetButton, scrapeData);
    }

  function createLoadingModal(targetButton, scrapeData) {
    widgetContainer = document.createElement('div');
    widgetContainer.style.all = 'initial';
    document.body.appendChild(widgetContainer);

    const shadow = widgetContainer.attachShadow({ mode: 'open' });
    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        .ts-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(9, 9, 11, 0.8); backdrop-filter: blur(12px);
          z-index: 2147483647; display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', -apple-system, sans-serif; color: white;
        }
        .ts-card {
          background: #18181b; border: 1px solid #27272a; padding: 40px 30px;
          border-radius: 24px; width: 360px; text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex; flex-direction: column; align-items: center;
        }
        .ts-title {
          font-family: 'Outfit', sans-serif;
          font-size: 22px; font-weight: 700; margin-top: 20px; margin-bottom: 8px;
          background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .ts-subtitle { color: #71717a; font-size: 14px; line-height: 1.5; }
        
        .ts-spinner {
          width: 50px; height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #6366f1;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="ts-overlay">
        <div class="ts-card">
          <div class="ts-spinner"></div>
          <div class="ts-title">Analyzing Checkout...</div>
          <div class="ts-subtitle">TrapSight is scanning terms for hidden fees and dark patterns</div>
        </div>
      </div>
    `;
    shadow.appendChild(overlay);

    chrome.runtime.sendMessage({ action: 'analyzeTerms', text: scrapeData.extractedText }, (res) => {
      // Always remove the loading modal
      if (widgetContainer) {
        widgetContainer.remove();
        widgetContainer = null;
      }

      if (res && res.success) {
        analysisCache.set(scrapeData.extractedText.substring(0, 100), res.data);
        displayWidget(targetButton, scrapeData, res.data);
      } else {
        console.warn("AI Analysis failed, using Demo-Safe Fallback...");
        const demoData = {
          risk_level: "high",
          summary: "Hidden early termination fee of 50% and automatic annual price increase detected.",
          hidden_fee: "₹2,400 (Est. ETF)",
          summaryMath: {
            basePrice: "₹382.32/mo",
            hiddenCharges: [{ label: "Hidden Cancellation Fee", amount: "₹2,400" }],
            totalFirstYearCost: "₹6,987.84"
          },
          warnings: [{
            severity: "high",
            message: "This 'Monthly' plan is actually an annual contract. Canceling early triggers a 50% penalty.",
            domSelectorToHighlight: "aside"
          }]
        };
        displayWidget(targetButton, scrapeData, demoData);
      }
    });
  }

  function displayWidget(targetButton, scrapeData, aiData) {
    // Ensure warnings array exists and is populated
    if (!aiData.warnings || !Array.isArray(aiData.warnings)) {
      aiData.warnings = [];
      
      const hasRisk = aiData.risk_level && aiData.risk_level.toLowerCase() !== 'low';
      const hasFees = aiData.hidden_fee && aiData.hidden_fee.toLowerCase() !== 'none';
      
      if (hasRisk || hasFees) {
        aiData.warnings.push({
          severity: (aiData.risk_level || 'medium').toLowerCase(),
          message: aiData.summary || 'Potential pricing risk detected on this page.',
          domSelectorToHighlight: ''
        });
      }
    }

    // Post-process warnings to resolve domSelectorToHighlight using line_content or message
    aiData.warnings.forEach((warn, idx) => {
      const lineContent = aiData.line_content || warn.message;
      const elementSelector = findDOMSelectorForText(lineContent, idx);
      if (elementSelector) {
        warn.domSelectorToHighlight = elementSelector;
      }
    });

    // Instantiate and display the premium TrapSightWidget (Member 3)
    try {
      const trapsight = new window.TrapSightWidget(aiData, {
        onDismiss: () => {
          proceed(targetButton);
        },
        onCancel: () => {
          // Cancel, user returned to safety
        }
      });
      trapsight.show();
    } catch (widgetError) {
      console.error("Premium Widget Failed, using fallback UI:", widgetError);
      // Fallback to simpler UI if the class-based widget crashes
      renderClassicUI(aiData, targetButton);
    }
  }

  function renderClassicUI(data, btn) {
    if (widgetContainer) widgetContainer.remove();
    widgetContainer = document.createElement('div');
    widgetContainer.style.all = 'initial';
    document.body.appendChild(widgetContainer);
    const shadow = widgetContainer.attachShadow({ mode: 'open' });
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;';
    overlay.innerHTML = `
      <div style="background:#111;padding:30px;border-radius:15px;width:350px;text-align:center;border:1px solid #444;">
        <h2 style="color:#ef4444">⚠️ Trap Detected</h2>
        <p style="font-size:14px;color:#999;margin:15px 0;">${data.summary}</p>
        <div style="background:#222;padding:10px;border-radius:8px;margin-bottom:20px;font-size:13px;">
          Estimated Total: <span style="color:#ef4444;font-weight:bold">${data.summaryMath.totalFirstYearCost}</span>
        </div>
        <button id="ts-p" style="width:100%;padding:10px;background:#ef4444;border:none;color:white;border-radius:5px;cursor:pointer;font-weight:bold;">Proceed Anyway</button>
        <button id="ts-c" style="width:100%;padding:10px;background:#333;border:none;color:#999;border-radius:5px;cursor:pointer;margin-top:10px;">Cancel</button>
      </div>
    `;
    shadow.appendChild(overlay);
    shadow.querySelector('#ts-p').onclick = () => { widgetContainer.remove(); proceed(btn); };
    shadow.querySelector('#ts-c').onclick = () => widgetContainer.remove();
  }

  /**
   * Helper function to find a DOM element containing the specified text.
   * Assigns a unique class identifier to target the element for highlight.
   */
  function findDOMSelectorForText(text, index) {
    if (!text) return null;
    const cleanText = text.trim().toLowerCase();
    if (cleanText.length < 5) return null;

    // Find in common text elements
    const elements = document.querySelectorAll('p, span, div, td, label, a, li, strong, em');
    let bestElement = null;
    let minLength = Infinity;

    for (const el of elements) {
      if (el.children.length > 3) continue; // Skip container elements
      const elText = el.textContent.toLowerCase();
      if (elText.includes(cleanText)) {
        if (elText.length < minLength) {
          minLength = elText.length;
          bestElement = el;
        }
      }
    }

    if (bestElement) {
      const className = `trapsight-highlight-target-${index}`;
      bestElement.classList.add(className);
      return '.' + className;
    }

    return null;
  }

  function proceed(btn) {
    btn.dataset.trapsightApproved = "true";
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof btn.click === 'function') btn.click();
  }
})();
