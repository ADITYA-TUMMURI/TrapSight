/**
 * TrapSight - Member 3 (UI Widget) & Member 4 (Content Script Integration)
 * 
 * Intercepts checkout button clicks, runs the Scraper (Member 2), queries the
 * Background Script (Member 1) for AI analysis, and renders the premium 
 * warning widget via Shadow DOM to prevent styling leaks.
 */
(function () {
  'use strict';

  // Inject highlight styles into the main host page header for the scroll highlight feature
  const style = document.createElement('style');
  style.textContent = `
    @keyframes trapsightPulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); outline: 3px solid rgba(239, 68, 68, 0.8); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); outline: 3px solid rgba(239, 68, 68, 0.2); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); outline: 3px solid rgba(239, 68, 68, 0); }
    }
    .trapsight-flash-highlight {
      animation: trapsightPulse 1.5s ease-out 3;
      border: 2px solid #ef4444 !important;
      border-radius: 4px;
      transition: border-color 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Global variables to track the active widget container and intercepted click target
  let widgetContainer = null;

  // Intercept all clicks at capture phase
  document.addEventListener('click', handlePageClick, true);

  /**
   * Evaluates if clicked element is a potential checkout button.
   */
  function isCheckoutButton(element) {
    if (!element) return false;

    // Resolve closest clickable element
    const clickable = element.closest('button, input[type="submit"], a, [role="button"]');
    if (!clickable) return false;

    // Skip if already approved by TrapSight
    if (clickable.dataset.trapsightApproved === 'true') {
      return false;
    }

    // Inspect tag, name, class names, or ID
    const matchesAttributes = ['checkout', 'proceed', 'payment', 'purchase', 'pay', 'order', 'buy'].some(keyword => {
      const classStr = clickable.className ? String(clickable.className) : '';
      const idStr = clickable.id ? String(clickable.id) : '';
      const nameStr = clickable.getAttribute('name') ? String(clickable.getAttribute('name')) : '';
      return classStr.toLowerCase().includes(keyword) || 
             idStr.toLowerCase().includes(keyword) || 
             nameStr.toLowerCase().includes(keyword);
    });

    // Inspect visible text content
    const textContent = clickable.textContent ? clickable.textContent.trim().toLowerCase() : '';
    const matchesText = ['check out', 'checkout', 'proceed', 'continue to payment', 'place order', 'buy now', 'purchase', 'pay now', 'complete checkout'].some(keyword => {
      return textContent.includes(keyword);
    });

    return matchesAttributes || matchesText;
  }

  /**
   * Main click handler
   */
  function handlePageClick(e) {
    const targetButton = e.target.closest('button, input[type="submit"], a, [role="button"]');
    if (!targetButton || !isCheckoutButton(targetButton)) {
      return;
    }

    // 1. Check if scraper function is available
    if (typeof window.scrapeCheckoutData !== 'function') {
      return;
    }

    // 2. Perform mock scrape to check if page is in scope
    const scrapeData = window.scrapeCheckoutData();
    if (!scrapeData) {
      // Out of scope page: let it proceed without interference
      return;
    }

    // 3. Page is in scope: Pause the click
    e.preventDefault();
    e.stopPropagation();

    // 4. Mount shadow DOM overlay and show loading state
    createShadowModal(targetButton, scrapeData);
  }

  /**
   * Creates the base overlay container and attaches the Shadow DOM
   */
  function createShadowModal(targetButton, scrapeData) {
    if (widgetContainer) {
      widgetContainer.remove();
    }

    widgetContainer = document.createElement('div');
    widgetContainer.id = 'trapsight-widget-container';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.top = '0';
    widgetContainer.style.left = '0';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';
    widgetContainer.style.zIndex = '2147483647'; // Max z-index
    document.body.appendChild(widgetContainer);

    const shadowRoot = widgetContainer.attachShadow({ mode: 'open' });

    // Styles for Shadow DOM UI
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
      :root {
        color-scheme: dark;
      }
      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(6, 9, 17, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #f3f4f6;
        animation: fadeIn 0.2s ease-out forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .card {
        background-color: #111827;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        width: 480px;
        max-width: 90vw;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo {
        background: linear-gradient(135deg, #ef4444 0%, #ec4899 100%);
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .logo-loading {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        animation: rotate 1.5s linear infinite;
      }

      @keyframes rotate {
        100% { transform: rotate(360deg); }
      }

      .title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .subtitle {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 2px;
      }

      .content-area {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .math-display {
        background-color: #1f2937;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .math-line {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #9ca3af;
      }

      .math-line.add {
        color: #fca5a5;
      }

      .math-line.total {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 10px;
        margin-top: 4px;
        font-size: 16px;
        font-weight: 700;
        color: #ffffff;
      }

      .math-line.total .price-gradient {
        background: linear-gradient(to right, #818cf8, #a78bfa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .warnings-title {
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: #9ca3af;
      }

      .warnings-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 180px;
        overflow-y: auto;
      }

      .warning-card {
        background-color: rgba(239, 68, 68, 0.05);
        border: 1px solid rgba(239, 68, 68, 0.15);
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .warning-card.medium {
        background-color: rgba(245, 158, 11, 0.05);
        border-color: rgba(245, 158, 11, 0.15);
      }

      .warning-card.low {
        background-color: rgba(99, 102, 241, 0.05);
        border-color: rgba(99, 102, 241, 0.15);
      }

      .warning-text {
        font-size: 12px;
        line-height: 1.4;
      }

      .warning-read-btn {
        background-color: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: #d1d5db;
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }

      .warning-read-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .footer-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      .btn {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        text-align: center;
        transition: all 0.2s ease;
      }

      .btn-cancel {
        background-color: #374151;
        color: #d1d5db;
      }

      .btn-cancel:hover {
        background-color: #4b5563;
        color: #ffffff;
      }

      .btn-proceed {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
      }

      .btn-proceed:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      }

      .btn-proceed-safe {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      }

      .btn-proceed-safe:hover {
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      }

      /* Loading & Error States */
      .loading-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        text-align: center;
      }

      .spinner {
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        border-top: 3px solid #6366f1;
        width: 36px;
        height: 36px;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .status-msg {
        font-size: 14px;
        font-weight: 500;
      }

      .status-sub {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 4px;
      }

      .error-details {
        font-size: 12px;
        color: #fca5a5;
        background-color: rgba(239, 68, 68, 0.05);
        border: 1px solid rgba(239, 68, 68, 0.15);
        padding: 12px;
        border-radius: 8px;
        max-height: 120px;
        overflow-y: auto;
      }
    `;

    shadowRoot.appendChild(widgetStyles);

    // Initial Loading State Structure
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const card = document.createElement('div');
    card.className = 'card';

    const loadingState = document.createElement('div');
    loadingState.className = 'loading-state';
    loadingState.innerHTML = `
      <div class="spinner"></div>
      <div>
        <div class="status-msg">Analyzing Checkout Terms...</div>
        <div class="status-sub">TrapSight AI (Gemini 1.5 Flash) is scanning for pricing traps.</div>
      </div>
    `;

    card.appendChild(loadingState);
    overlay.appendChild(card);
    shadowRoot.appendChild(overlay);

    // 5. Trigger background AI analysis
    triggerAIAnalysis(scrapeData, targetButton, card, overlay);
  }

  /**
   * Contacts background.js to hit Gemini API, handles results or error rendering
   */
  function triggerAIAnalysis(scrapeData, targetButton, card, overlay) {
    chrome.runtime.sendMessage(
      { action: 'analyzeTerms', text: scrapeData.extractedText },
      (response) => {
        if (chrome.runtime.lastError) {
          renderErrorState(card, overlay, 'Extension Message Channel Error: ' + chrome.runtime.lastError.message, targetButton);
          return;
        }

        if (!response || !response.success) {
          renderErrorState(card, overlay, response?.error || 'Unable to analyze text.', targetButton);
          return;
        }

        // Successfully analyzed terms
        renderAlertWidget(card, overlay, response.data, targetButton, scrapeData.storeName);
      }
    );
  }

  /**
   * Renders the premium results widget highlighting simple math + warnings
   */
  function renderAlertWidget(card, overlay, aiData, targetButton, storeName) {
    card.innerHTML = ''; // Clear loading spinner

    // 1. Header
    const header = document.createElement('div');
    header.className = 'header';
    const logoColorClass = aiData.warnings && aiData.warnings.length > 0 ? '' : 'logo-loading';
    header.innerHTML = `
      <div class="logo ${logoColorClass}">⚠️</div>
      <div>
        <div class="title">Pricing Analysis</div>
        <div class="subtitle">Scanned on ${storeName}</div>
      </div>
    `;
    card.appendChild(header);

    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';

    // 2. Math display
    const mathDiv = document.createElement('div');
    mathDiv.className = 'math-display';

    let hiddenChargesHTML = '';
    const charges = aiData.summaryMath?.hiddenCharges || [];
    if (charges.length > 0) {
      charges.forEach(charge => {
        hiddenChargesHTML += `
          <div class="math-line add">
            <span>+ ${charge.label}</span>
            <span>${charge.amount}</span>
          </div>
        `;
      });
    } else {
      hiddenChargesHTML = `
        <div class="math-line">
          <span>+ No hidden charges found</span>
          <span>$0.00</span>
        </div>
      `;
    }

    mathDiv.innerHTML = `
      <div class="math-line">
        <span>Base Pricing</span>
        <span>${aiData.summaryMath?.basePrice || 'N/A'}</span>
      </div>
      ${hiddenChargesHTML}
      <div class="math-line total">
        <span>Est. First Year Total</span>
        <span class="price-gradient">${aiData.summaryMath?.totalFirstYearCost || 'N/A'}</span>
      </div>
    `;
    contentArea.appendChild(mathDiv);

    // 3. Warnings
    const warnings = aiData.warnings || [];
    if (warnings.length > 0) {
      const warningsTitle = document.createElement('div');
      warningsTitle.className = 'warnings-title';
      warningsTitle.textContent = 'Pricing Warnings';
      contentArea.appendChild(warningsTitle);

      const warningsList = document.createElement('div');
      warningsList.className = 'warnings-list';

      warnings.forEach((warn, index) => {
        const warnCard = document.createElement('div');
        warnCard.className = `warning-card ${warn.severity}`;
        
        let highlightBtnHTML = '';
        if (warn.domSelectorToHighlight) {
          highlightBtnHTML = `
            <button class="warning-read-btn" data-selector="${warn.domSelectorToHighlight}">
              🔍 Read
            </button>
          `;
        }

        warnCard.innerHTML = `
          <div class="warning-text">${warn.message}</div>
          ${highlightBtnHTML}
        `;

        // Wire up "Read" button event to scroll and flash-highlight elements
        const readBtn = warnCard.querySelector('.warning-read-btn');
        if (readBtn) {
          readBtn.addEventListener('click', () => {
            const selector = readBtn.getAttribute('data-selector');
            closeWidget(); // Dismiss overlay first to let user view
            highlightTargetElement(selector);
          });
        }

        warningsList.appendChild(warnCard);
      });
      contentArea.appendChild(warningsList);
    } else {
      const cleanAlert = document.createElement('div');
      cleanAlert.className = 'warning-card low';
      cleanAlert.style.borderColor = 'rgba(16, 185, 129, 0.2)';
      cleanAlert.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
      cleanAlert.innerHTML = `<div class="warning-text" style="color: #10b981;">No pricing traps or subscription auto-renewals detected. Clean checkout terms.</div>`;
      contentArea.appendChild(cleanAlert);
    }

    card.appendChild(contentArea);

    // 4. Footer Actions
    const footer = document.createElement('div');
    footer.className = 'footer-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Cancel Checkout';
    cancelBtn.addEventListener('click', closeWidget);

    const proceedBtn = document.createElement('button');
    const isDangerous = warnings.length > 0;
    proceedBtn.className = `btn ${isDangerous ? 'btn-proceed' : 'btn-proceed-safe'}`;
    proceedBtn.textContent = isDangerous ? 'Proceed Anyway' : 'Accept & Proceed';
    
    proceedBtn.addEventListener('click', () => {
      closeWidget();
      // Mark original button as approved and programmatically submit
      targetButton.dataset.trapsightApproved = 'true';
      targetButton.click();
      
      // Cleanup safety flag after brief timeout
      setTimeout(() => {
        if (targetButton) {
          delete targetButton.dataset.trapsightApproved;
        }
      }, 1000);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(proceedBtn);
    card.appendChild(footer);
  }

  /**
   * Renders the error card structure when analysis fails
   */
  function renderErrorState(card, overlay, errorMessage, targetButton) {
    card.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
      <div class="logo" style="background: #ef4444">❌</div>
      <div>
        <div class="title">Analysis Failed</div>
        <div class="subtitle">TrapSight could not complete the pricing scan</div>
      </div>
    `;
    card.appendChild(header);

    const errorState = document.createElement('div');
    errorState.className = 'error-state';
    errorState.innerHTML = `
      <div class="error-details">${errorMessage}</div>
    `;
    card.appendChild(errorState);

    const footer = document.createElement('div');
    footer.className = 'footer-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeWidget);

    const bypassBtn = document.createElement('button');
    bypassBtn.className = 'btn btn-proceed-safe';
    bypassBtn.textContent = 'Proceed to Checkout';
    bypassBtn.addEventListener('click', () => {
      closeWidget();
      targetButton.dataset.trapsightApproved = 'true';
      targetButton.click();
      setTimeout(() => {
        if (targetButton) {
          delete targetButton.dataset.trapsightApproved;
        }
      }, 1000);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(bypassBtn);
    card.appendChild(footer);
  }

  /**
   * Closes and cleans up the active widget container
   */
  function closeWidget() {
    if (widgetContainer) {
      widgetContainer.remove();
      widgetContainer = null;
    }
  }

  /**
   * Handles scroll-and-pulse highlight action of warned DOM elements
   */
  function highlightTargetElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        // Smooth scroll to the target
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add visual pulse effect
        element.classList.add('trapsight-flash-highlight');
        
        // Remove class after animation finishes (1.5s * 3 cycles = 4.5s)
        setTimeout(() => {
          element.classList.remove('trapsight-flash-highlight');
        }, 4500);
      } else {
        console.warn(`[TrapSight Widget] Selector "${selector}" could not be found in DOM.`);
      }
    } catch (err) {
      console.error(`[TrapSight Widget] Error targeting element with selector "${selector}":`, err);
    }
  }
})();
