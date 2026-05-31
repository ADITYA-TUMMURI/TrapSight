// TrapSight UI Widget - Member 3 Injected Component

const WIDGET_CSS = `
:host {
  --font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
  --bg-backdrop: rgba(10, 15, 30, 0.7);
  --bg-card: rgba(17, 24, 39, 0.95);
  --border-color: rgba(255, 255, 255, 0.08);
  --border-glow: rgba(99, 102, 241, 0.15);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  --color-high: #ef4444;
  --color-high-glow: rgba(239, 68, 68, 0.2);
  --color-medium: #f59e0b;
  --color-medium-glow: rgba(245, 158, 11, 0.2);
  --color-safe: #10b981;
  --color-safe-glow: rgba(16, 185, 129, 0.2);
  
  --color-brand: #6366f1;
  --color-brand-hover: #4f46e5;
  --color-brand-glow: rgba(99, 102, 241, 0.4);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.trapsight-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-backdrop);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  z-index: 2147483647;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--font-family);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.trapsight-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.trapsight-modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
              0 0 40px var(--border-glow);
  width: 90%;
  max-width: 580px;
  border-radius: 20px;
  padding: 28px;
  color: var(--text-primary);
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
  overflow: hidden;
  position: relative;
}

.trapsight-overlay.active .trapsight-modal {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.trapsight-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-brand), var(--color-high), var(--color-medium));
}

.trapsight-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.trapsight-logo-container {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-brand);
  position: relative;
  box-shadow: 0 0 15px var(--color-brand-glow);
  animation: pulse-logo 2.5s infinite ease-in-out;
}

@keyframes pulse-logo {
  0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
}

.trapsight-logo-container svg {
  width: 24px;
  height: 24px;
}

.trapsight-title-block h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #ffffff 60%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.trapsight-title-block p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Mathematical Visualization Dashboard */
.trapsight-math-dashboard {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.trapsight-math-equation {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trapsight-math-step {
  display: grid;
  grid-template-columns: 1.5fr 1.2fr 0.8fr;
  align-items: center;
  gap: 12px;
  font-size: 13.5px;
  color: var(--text-secondary);
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
}

.trapsight-math-step:last-of-type {
  border-bottom: none;
}

.trapsight-step-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trapsight-step-title {
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.trapsight-step-op {
  font-family: monospace;
  font-weight: bold;
  color: var(--text-muted);
  margin-right: 4px;
}

.trapsight-step-raw {
  font-size: 11px;
  color: var(--text-muted);
}

.trapsight-step-formula {
  font-family: monospace;
  font-size: 11px;
  color: var(--color-brand);
  background: rgba(99, 102, 241, 0.08);
  border: 1px dashed rgba(99, 102, 241, 0.25);
  padding: 3px 6px;
  border-radius: 6px;
  text-align: center;
  white-space: nowrap;
}

.trapsight-step-formula.one-time {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
}

.trapsight-step-impact {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
  font-size: 14px;
}

.trapsight-math-divider {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

.trapsight-math-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 0 0;
}

.trapsight-result-label-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trapsight-result-label {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
}

.trapsight-result-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.trapsight-result-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-medium);
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 0 0 15px var(--color-medium-glow);
}

/* Markup warning message */
.trapsight-markup-badge {
  margin-top: 14px;
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-medium);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Warning alert card */
.trapsight-warnings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.trapsight-warning-card {
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease, border-color 0.2s ease;
  align-items: flex-start;
}

.trapsight-warning-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.15);
}

.trapsight-warning-card.severity-high {
  background: rgba(239, 68, 68, 0.04);
  border-left: 4px solid var(--color-high);
}

.trapsight-warning-card.severity-medium {
  background: rgba(245, 158, 11, 0.04);
  border-left: 4px solid var(--color-medium);
}

.trapsight-warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.trapsight-warning-card.severity-high .trapsight-warning-icon {
  color: var(--color-high);
}

.trapsight-warning-card.severity-medium .trapsight-warning-icon {
  color: var(--color-medium);
}

.trapsight-warning-content {
  flex-grow: 1;
}

.trapsight-warning-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.trapsight-warning-severity {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
}

.trapsight-warning-card.severity-high .trapsight-warning-severity {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-high);
}

.trapsight-warning-card.severity-medium .trapsight-warning-severity {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-medium);
}

.trapsight-warning-msg {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.trapsight-warning-action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.trapsight-warning-action-btn:hover {
  background: var(--color-brand);
  border-color: var(--color-brand);
  box-shadow: 0 0 10px var(--color-brand-glow);
}

/* Footer Buttons */
.trapsight-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.trapsight-btn {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
}

.trapsight-btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.trapsight-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.trapsight-btn-primary {
  background: var(--color-brand);
  border: 1px solid var(--color-brand);
  color: #ffffff;
  box-shadow: 0 4px 14px var(--color-brand-glow);
}

.trapsight-btn-primary:hover {
  background: var(--color-brand-hover);
  border-color: var(--color-brand-hover);
  transform: translateY(-1px);
}

/* Minimized Floating FAB */
.trapsight-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 
              0 0 20px var(--color-medium-glow);
  padding: 12px 18px;
  border-radius: 30px;
  z-index: 2147483647;
  font-family: var(--font-family);
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translateY(100px);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  color: var(--text-primary);
}

.trapsight-fab.active {
  transform: translateY(0);
  opacity: 1;
}

.trapsight-fab-pill {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--color-medium);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trapsight-fab-text {
  font-size: 13px;
  font-weight: 600;
}

.trapsight-fab-actions {
  display: flex;
  gap: 6px;
}

.trapsight-fab-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trapsight-fab-btn:hover {
  background: var(--color-brand);
  border-color: var(--color-brand);
}

.trapsight-fab-btn svg {
  width: 14px;
  height: 14px;
}

/* Animations */
@keyframes trapsight-slide-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.trapsight-animate-in {
  opacity: 0;
  animation: trapsight-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

const EYE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

const WARNING_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
  <line x1="12" y1="9" x2="12" y2="13"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</svg>`;

const SEARCH_ICON_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
</svg>`;

const RESTORE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
</svg>`;

const CLOSE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

class TrapSightWidget {
  constructor(data, options = {}) {
    this.data = data;
    this.onDismiss = options.onDismiss || (() => {});
    this.onCancel = options.onCancel || (() => {});
    
    this.rootElement = null;
    this.shadowRoot = null;
    this.overlay = null;
    this.fab = null;
    this.lastHighlightedElement = null;
    
    // Inject the host styles for pulsing highlights
    this.injectHostStyles();
  }
  
  injectHostStyles() {
    if (document.getElementById('trapsight-host-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'trapsight-host-styles';
    style.textContent = `
      @keyframes trapsight-pulse-glow-high {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8); outline: 3px solid rgba(239, 68, 68, 0.8); }
        70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); outline: 3px solid rgba(239, 68, 68, 0.8); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); outline: 3px solid rgba(239, 68, 68, 0); }
      }
      @keyframes trapsight-pulse-glow-medium {
        0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.8); outline: 3px solid rgba(245, 158, 11, 0.8); }
        70% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); outline: 3px solid rgba(245, 158, 11, 0.8); }
        100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); outline: 3px solid rgba(245, 158, 11, 0); }
      }
      .trapsight-highlight-high {
        outline-offset: 4px !important;
        animation: trapsight-pulse-glow-high 1.5s infinite !important;
        transition: outline 0.3s ease, box-shadow 0.3s ease !important;
      }
      .trapsight-highlight-medium {
        outline-offset: 4px !important;
        animation: trapsight-pulse-glow-medium 1.5s infinite !important;
        transition: outline 0.3s ease, box-shadow 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  init() {
    if (document.getElementById('trapsight-widget-root')) {
      document.getElementById('trapsight-widget-root').remove();
    }
    
    this.rootElement = document.createElement('div');
    this.rootElement.id = 'trapsight-widget-root';
    
    // Attach closed shadow root to completely encapsulate CSS
    this.shadowRoot = this.rootElement.attachShadow({ mode: 'closed' });
    
    // Append Outfit font link and styling
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
    this.shadowRoot.appendChild(fontLink);
    
    const styleElement = document.createElement('style');
    styleElement.textContent = WIDGET_CSS;
    this.shadowRoot.appendChild(styleElement);
    
    // Build Overlay and Modal Structure
    this.overlay = document.createElement('div');
    this.overlay.className = 'trapsight-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'trapsight-modal';
    
    // 1. Header
    const header = document.createElement('div');
    header.className = 'trapsight-header';
    header.innerHTML = `
      <div class="trapsight-logo-container">${EYE_ICON_SVG}</div>
      <div class="trapsight-title-block">
        <h2>Deceptive Billing Warning</h2>
        <p>TrustGuard has intercepted billing traps on this checkout page.</p>
      </div>
    `;
    modal.appendChild(header);
    
    // 2. Math Dashboard Visualization
    const mathDashboard = this.buildMathDashboard();
    modal.appendChild(mathDashboard);
    
    // 3. Warnings List
    const warningsSection = this.buildWarningsSection();
    modal.appendChild(warningsSection);
    
    // 4. Footer
    const footer = document.createElement('div');
    footer.className = 'trapsight-footer';
    
    const btnSecondary = document.createElement('button');
    btnSecondary.className = 'trapsight-btn trapsight-btn-secondary';
    btnSecondary.innerHTML = `Dismiss & Proceed`;
    btnSecondary.addEventListener('click', () => this.handleProceed());
    
    const btnPrimary = document.createElement('button');
    btnPrimary.className = 'trapsight-btn trapsight-btn-primary';
    btnPrimary.innerHTML = `Cancel Checkout`;
    btnPrimary.addEventListener('click', () => this.handleCancel());
    
    footer.appendChild(btnSecondary);
    footer.appendChild(btnPrimary);
    modal.appendChild(footer);
    
    this.overlay.appendChild(modal);
    this.shadowRoot.appendChild(this.overlay);
    
    // Build Minimized FAB
    this.buildFAB();
    
    document.body.appendChild(this.rootElement);
  }
  
  parsePriceInfo(amountStr) {
    const cleaned = amountStr.trim();
    const isMonthly = cleaned.toLowerCase().endsWith('/mo') || cleaned.toLowerCase().includes('/mo');
    const isYearly = cleaned.toLowerCase().endsWith('/yr') || cleaned.toLowerCase().includes('/yr') || cleaned.toLowerCase().includes('year');
    
    const numMatch = cleaned.replace(/,/g, '').match(/\d+(\.\d+)?/);
    const num = numMatch ? parseFloat(numMatch[0]) : 0;
    const currency = cleaned.startsWith('$') ? '$' : '';
    
    let formula = '';
    let annualizedVal = 0;
    
    if (isMonthly) {
      formula = `${currency}${num.toFixed(2)} × 12 mos`;
      annualizedVal = num * 12;
    } else if (isYearly) {
      formula = `${currency}${num.toFixed(2)} × 1 yr`;
      annualizedVal = num;
    } else {
      formula = `one-time fee`;
      annualizedVal = num;
    }
    
    return {
      isMonthly,
      isYearly,
      value: num,
      formula,
      annualizedStr: `${currency}${annualizedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  }

  buildMathDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'trapsight-math-dashboard trapsight-animate-in';
    dashboard.style.animationDelay = '0.1s';
    
    const math = this.data.summaryMath;
    const baseInfo = this.parsePriceInfo(math.basePrice);
    
    let hiddenChargesHTML = '';
    math.hiddenCharges.forEach((charge) => {
      const chargeInfo = this.parsePriceInfo(charge.amount);
      hiddenChargesHTML += `
        <div class="trapsight-math-step">
          <div class="trapsight-step-info">
            <span class="trapsight-step-title">
              <span class="trapsight-step-op">+</span>${charge.label}
            </span>
            <span class="trapsight-step-raw">Original term: ${charge.amount}</span>
          </div>
          <div class="trapsight-step-formula ${chargeInfo.isMonthly ? '' : 'one-time'}">
            ${chargeInfo.formula}
          </div>
          <div class="trapsight-step-impact">${chargeInfo.annualizedStr}</div>
        </div>
      `;
    });
    
    dashboard.innerHTML = `
      <div class="trapsight-math-equation">
        <div class="trapsight-math-step">
          <div class="trapsight-step-info">
            <span class="trapsight-step-title">Advertised Base Price</span>
            <span class="trapsight-step-raw">Original term: ${math.basePrice}</span>
          </div>
          <div class="trapsight-step-formula ${baseInfo.isMonthly ? '' : 'one-time'}">
            ${baseInfo.formula}
          </div>
          <div class="trapsight-step-impact">${baseInfo.annualizedStr}</div>
        </div>
        ${hiddenChargesHTML}
        <div class="trapsight-math-divider"></div>
        <div class="trapsight-math-result">
          <div class="trapsight-result-label-group">
            <span class="trapsight-result-label">True First-Year Cost</span>
            <span class="trapsight-result-sub">(Sum of annualized charges)</span>
          </div>
          <span class="trapsight-result-value">${math.totalFirstYearCost}</span>
        </div>
      </div>
      <div class="trapsight-markup-badge">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>This pricing includes contract traps that inflate your initial base cost significantly.</span>
      </div>
    `;
    return dashboard;
  }
  
  buildWarningsSection() {
    const section = document.createElement('div');
    section.className = 'trapsight-warnings-section';
    
    this.data.warnings.forEach((warn, index) => {
      const card = document.createElement('div');
      card.className = `trapsight-warning-card severity-${warn.severity} trapsight-animate-in`;
      card.style.animationDelay = `${0.2 + index * 0.1}s`;
      
      let actionBtnHTML = '';
      if (warn.domSelectorToHighlight) {
        actionBtnHTML = `
          <button class="trapsight-warning-action-btn" data-selector="${warn.domSelectorToHighlight}" data-severity="${warn.severity}">
            ${SEARCH_ICON_SVG} Read Fine Print in Context
          </button>
        `;
      }
      
      card.innerHTML = `
        <div class="trapsight-warning-icon">${WARNING_ICON_SVG}</div>
        <div class="trapsight-warning-content">
          <div class="trapsight-warning-meta">
            <span class="trapsight-warning-severity">${warn.severity} Alert</span>
          </div>
          <p class="trapsight-warning-msg">${warn.message}</p>
          ${actionBtnHTML}
        </div>
      `;
      
      // Wire up read action button
      if (warn.domSelectorToHighlight) {
        const btn = card.querySelector('.trapsight-warning-action-btn');
        btn.addEventListener('click', (e) => {
          const selector = e.currentTarget.getAttribute('data-selector');
          const severity = e.currentTarget.getAttribute('data-severity');
          this.highlightWarning(selector, severity);
        });
      }
      
      section.appendChild(card);
    });
    
    return section;
  }
  
  buildFAB() {
    this.fab = document.createElement('div');
    this.fab.className = 'trapsight-fab';
    
    const warnCount = this.data.warnings.length;
    
    this.fab.innerHTML = `
      <div class="trapsight-fab-pill">
        ${WARNING_ICON_SVG} ${warnCount} Warning${warnCount > 1 ? 's' : ''}
      </div>
      <span class="trapsight-fab-text">Billing trap detected</span>
      <div class="trapsight-fab-actions">
        <button class="trapsight-fab-btn trapsight-fab-btn-restore" title="Restore warning details">
          ${RESTORE_ICON_SVG}
        </button>
        <button class="trapsight-fab-btn trapsight-fab-btn-close" title="Dismiss completely">
          ${CLOSE_ICON_SVG}
        </button>
      </div>
    `;
    
    this.fab.querySelector('.trapsight-fab-btn-restore').addEventListener('click', () => {
      this.maximize();
    });
    
    this.fab.querySelector('.trapsight-fab-btn-close').addEventListener('click', () => {
      this.closeFABCompletely();
    });
    
    this.shadowRoot.appendChild(this.fab);
  }
  
  show() {
    if (!this.rootElement) this.init();
    
    // Freeze scroll on the main document
    document.body.style.overflow = 'hidden';
    
    // Show modal overlay
    setTimeout(() => {
      this.overlay.classList.add('active');
    }, 50);
  }
  
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  }
  
  minimize() {
    this.hide();
    
    // Bring up the floating FAB
    setTimeout(() => {
      if (this.fab) this.fab.classList.add('active');
    }, 300);
  }
  
  maximize() {
    if (this.fab) {
      this.fab.classList.remove('active');
    }
    this.clearHighlight();
    
    setTimeout(() => {
      this.show();
    }, 200);
  }
  
  highlightWarning(selector, severity) {
    this.minimize();
    
    // Remove previous highlights
    this.clearHighlight();
    
    // Find target in parent document
    const element = document.querySelector(selector);
    if (element) {
      // Smooth scroll to the warning element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Apply the glow class based on severity
      const highlightClass = severity === 'high' ? 'trapsight-highlight-high' : 'trapsight-highlight-medium';
      element.classList.add(highlightClass);
      this.lastHighlightedElement = { element, className: highlightClass };
    } else {
      console.warn(`[TrapSight UI] Could not locate targeted pricing elements with selector: ${selector}`);
    }
  }
  
  clearHighlight() {
    if (this.lastHighlightedElement) {
      const { element, className } = this.lastHighlightedElement;
      if (element) {
        element.classList.remove(className);
      }
      this.lastHighlightedElement = null;
    }
  }
  
  closeFABCompletely() {
    if (this.fab) {
      this.fab.classList.remove('active');
    }
    this.clearHighlight();
    this.onDismiss();
  }
  
  handleProceed() {
    this.hide();
    if (this.fab) this.fab.classList.remove('active');
    this.clearHighlight();
    this.onDismiss();
  }
  
  handleCancel() {
    this.hide();
    if (this.fab) this.fab.classList.remove('active');
    this.clearHighlight();
    this.onCancel();
  }
}

// Attach to window for standard script injection usage
window.TrapSightWidget = TrapSightWidget;
