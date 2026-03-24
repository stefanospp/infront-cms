import type { Plugin } from 'vite';

/**
 * Vite plugin that injects the editor bridge script into pages during dev mode.
 *
 * The bridge script:
 * 1. Finds elements with data-section-id attributes (added by the schema compiler)
 * 2. Highlights hovered sections with an overlay
 * 3. Sends postMessage to the parent editor iframe on click/edit events
 * 4. Listens for postMessage from the editor to scroll to / highlight sections
 *
 * Only active when the page is loaded inside an iframe (the editor preview).
 */
export function editorBridgePlugin(options?: { origin?: string }): Plugin {
  // Use '*' since the admin URL varies (localhost in dev, web.infront.cy in prod,
  // and the preview proxy changes the origin context). Safe because the bridge
  // self-disables outside of iframes and messages are editor-specific only.
  const targetOrigin = options?.origin ?? '*';
  return {
    name: 'agency-editor-bridge',
    enforce: 'post',

    transformIndexHtml(html: string) {
      // Only inject in dev mode — Vite only calls this hook during dev/preview
      // The script self-disables if not in an iframe
      const script = BRIDGE_SCRIPT.replace(/__EDITOR_ORIGIN__/g, targetOrigin);
      return html.replace(
        '</body>',
        `<script type="module">${script}</script>\n</body>`,
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Bridge script (injected into client pages in dev mode)
// ---------------------------------------------------------------------------

const BRIDGE_SCRIPT = `
(function editorBridge() {
  // Only run inside an iframe (editor preview)
  if (window === window.parent) return;

  const OVERLAY_ID = '__editor-bridge-overlay';
  const TOOLTIP_ID = '__editor-bridge-tooltip';
  let selectedId = null;
  let editingElement = null;

  // ---- Overlay for hover/selection ----

  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position: 'fixed',
      pointerEvents: 'none',
      border: '2px solid #3b82f6',
      borderRadius: '4px',
      background: 'rgba(59, 130, 246, 0.05)',
      transition: 'all 0.15s ease',
      zIndex: '99998',
      display: 'none',
    });
    document.body.appendChild(overlay);

    const tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    Object.assign(tooltip.style, {
      position: 'fixed',
      pointerEvents: 'none',
      background: '#1e40af',
      color: '#fff',
      fontSize: '11px',
      fontFamily: 'system-ui, sans-serif',
      padding: '2px 8px',
      borderRadius: '0 0 4px 4px',
      zIndex: '99999',
      display: 'none',
      whiteSpace: 'nowrap',
    });
    document.body.appendChild(tooltip);
  }

  function positionOverlay(el) {
    const overlay = document.getElementById(OVERLAY_ID);
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (!overlay || !tooltip) return;

    const rect = el.getBoundingClientRect();
    Object.assign(overlay.style, {
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      display: 'block',
    });

    const sectionId = el.getAttribute('data-section-id');
    const component = el.getAttribute('data-component') || sectionId;
    tooltip.textContent = component;
    Object.assign(tooltip.style, {
      top: Math.max(0, rect.top - 22) + 'px',
      left: rect.left + 'px',
      display: 'block',
    });
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (overlay) overlay.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
  }

  function setSelectedStyle(el) {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.style.border = '2px solid #2563eb';
      overlay.style.background = 'rgba(37, 99, 235, 0.08)';
    }
  }

  // ---- Find closest section element ----

  function findSectionElement(target) {
    let el = target;
    while (el && el !== document.body) {
      if (el.hasAttribute && el.hasAttribute('data-section-id')) return el;
      el = el.parentElement;
    }
    return null;
  }

  // ---- Editable text helpers ----

  function findEditableText(target) {
    // Find the closest text-bearing element within a section
    let el = target;
    while (el) {
      const tag = el.tagName;
      if (tag && ['H1','H2','H3','H4','H5','H6','P','SPAN','A','LI','BLOCKQUOTE','LABEL'].includes(tag)) {
        return el;
      }
      if (el.hasAttribute && el.hasAttribute('data-section-id')) break;
      el = el.parentElement;
    }
    return null;
  }

  function startInlineEdit(el) {
    if (editingElement === el) return;
    stopInlineEdit();

    editingElement = el;
    el.setAttribute('contenteditable', 'true');
    el.style.outline = '2px solid #3b82f6';
    el.style.outlineOffset = '2px';
    el.style.borderRadius = '2px';
    el.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function stopInlineEdit() {
    if (!editingElement) return;

    const el = editingElement;
    el.removeAttribute('contenteditable');
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.borderRadius = '';

    // Find which section this belongs to and what prop it maps to
    const sectionEl = findSectionElement(el);
    if (sectionEl) {
      const sectionId = sectionEl.getAttribute('data-section-id');
      const propPath = el.getAttribute('data-prop') || guessPropName(el);
      const newValue = el.textContent || '';

      window.parent.postMessage({
        type: 'editor-bridge:prop-update',
        sectionId,
        propPath,
        value: newValue,
      }, '__EDITOR_ORIGIN__');
    }

    editingElement = null;
  }

  function guessPropName(el) {
    const tag = el.tagName;
    if (tag === 'H1' || tag === 'H2') return 'heading';
    if (tag === 'H3' || tag === 'H4') return 'subheading';
    if (tag === 'P') return 'description';
    return 'text';
  }

  // ---- Event listeners ----

  createOverlay();

  // Hover → show overlay
  document.addEventListener('mousemove', (e) => {
    if (editingElement) return;

    const sectionEl = findSectionElement(e.target);
    if (sectionEl) {
      positionOverlay(sectionEl);
      if (sectionEl.getAttribute('data-section-id') === selectedId) {
        setSelectedStyle(sectionEl);
      }
    } else {
      if (!selectedId) hideOverlay();
    }
  }, true);

  // Click → select section
  document.addEventListener('click', (e) => {
    if (editingElement && !editingElement.contains(e.target)) {
      stopInlineEdit();
    }

    const sectionEl = findSectionElement(e.target);
    if (!sectionEl) return;

    e.preventDefault();
    e.stopPropagation();

    selectedId = sectionEl.getAttribute('data-section-id');
    positionOverlay(sectionEl);
    setSelectedStyle(sectionEl);

    window.parent.postMessage({
      type: 'editor-bridge:section-select',
      sectionId: selectedId,
    }, '__EDITOR_ORIGIN__');
  }, true);

  // Double-click → inline edit
  document.addEventListener('dblclick', (e) => {
    const textEl = findEditableText(e.target);
    if (!textEl) return;

    e.preventDefault();
    e.stopPropagation();
    startInlineEdit(textEl);
  }, true);

  // Blur / Enter → stop editing
  document.addEventListener('keydown', (e) => {
    if (!editingElement) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopInlineEdit();
    }
    if (e.key === 'Escape') {
      // Revert — reload the text from props
      editingElement.removeAttribute('contenteditable');
      editingElement.style.outline = '';
      editingElement.style.outlineOffset = '';
      editingElement.style.borderRadius = '';
      editingElement = null;
    }
  }, true);

  // Listen for messages from editor parent
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'editor-bridge:highlight-section') {
      const el = document.querySelector('[data-section-id="' + CSS.escape(msg.sectionId) + '"]');
      if (el) {
        selectedId = msg.sectionId;
        positionOverlay(el);
        setSelectedStyle(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (msg.type === 'editor-bridge:refresh') {
      window.location.reload();
    }
  });

  // Notify parent that bridge is ready
  window.parent.postMessage({ type: 'editor-bridge:ready' }, '__EDITOR_ORIGIN__');

  // Re-position overlay on scroll/resize
  window.addEventListener('scroll', () => {
    if (selectedId) {
      const el = document.querySelector('[data-section-id="' + CSS.escape(selectedId) + '"]');
      if (el) positionOverlay(el);
      else hideOverlay();
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (selectedId) {
      const el = document.querySelector('[data-section-id="' + CSS.escape(selectedId) + '"]');
      if (el) positionOverlay(el);
      else hideOverlay();
    }
  });
})();
`;
