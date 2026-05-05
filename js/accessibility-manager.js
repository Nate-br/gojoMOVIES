/**
 * Accessibility Enhancement Utilities
 * Manages keyboard navigation, focus management, and ARIA attributes
 */

class AccessibilityManager {
  constructor() {
    this.isUsingKeyboard = false;
    this.focusTrapStack = [];
    this.init();
  }

  /**
   * Initialize accessibility manager
   */
  init() {
    this.detectInputMethod();
    this.createAriaLiveRegion();
    this.setupKeyboardNavigation();
    this.enhanceFormAccessibility();
  }

  /**
   * Detect input method (keyboard vs mouse)
   */
  detectInputMethod() {
    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.isUsingKeyboard = true;
        document.body.classList.add('using-keyboard');
        document.body.classList.remove('using-mouse');
      }
    });

    // Detect mouse usage
    document.addEventListener('mousedown', () => {
      this.isUsingKeyboard = false;
      document.body.classList.add('using-mouse');
      document.body.classList.remove('using-keyboard');
    });
  }

  /**
   * Create ARIA live region for announcements
   */
  createAriaLiveRegion() {
    if (document.getElementById('ariaLiveRegion')) return;

    const liveRegion = document.createElement('div');
    liveRegion.id = 'ariaLiveRegion';
    liveRegion.className = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);

    this.liveRegion = liveRegion;
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Escape key to close modals/menus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
    });

    // Arrow key navigation for lists
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });
  }

  /**
   * Handle escape key press
   */
  handleEscapeKey() {
    // Close active modals
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      const closeBtn = activeModal.querySelector('[data-dismiss="modal"]');
      if (closeBtn) closeBtn.click();
    }

    // Close active dropdowns
    const activeDropdown = document.querySelector('[aria-expanded="true"]');
    if (activeDropdown) {
      activeDropdown.setAttribute('aria-expanded', 'false');
    }

    // Release focus trap
    if (this.focusTrapStack.length > 0) {
      this.releaseFocusTrap();
    }
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e) {
    const target = e.target;

    // Check if in a navigable list
    const list = target.closest('[role="menu"], [role="listbox"], [role="tablist"]');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"]'));
    const currentIndex = items.indexOf(target);

    if (currentIndex === -1) return;

    let nextIndex;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }

    if (nextIndex !== undefined) {
      items[nextIndex].focus();
    }
  }

  /**
   * Create focus trap for modal
   */
  createFocusTrap(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    const trap = {
      container,
      handleTabKey,
      previousFocus: document.activeElement
    };

    this.focusTrapStack.push(trap);

    // Focus first element
    firstElement.focus();

    return trap;
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap() {
    const trap = this.focusTrapStack.pop();
    if (!trap) return;

    trap.container.removeEventListener('keydown', trap.handleTabKey);

    // Restore previous focus
    if (trap.previousFocus && trap.previousFocus.focus) {
      trap.previousFocus.focus();
    }
  }

  /**
   * Enhance form accessibility
   */
  enhanceFormAccessibility() {
    // Add aria-invalid to invalid fields
    document.addEventListener('invalid', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        e.target.setAttribute('aria-invalid', 'true');
      }
    }, true);

    // Remove aria-invalid when field becomes valid
    document.addEventListener('input', (e) => {
      if (e.target.checkValidity && e.target.checkValidity()) {
        e.target.removeAttribute('aria-invalid');
      }
    });
  }

  /**
   * Make element accessible
   */
  makeAccessible(element, options = {}) {
    const {
      role = null,
      label = null,
      describedBy = null,
      expanded = null,
      selected = null,
      hidden = null
    } = options;

    if (role) element.setAttribute('role', role);
    if (label) element.setAttribute('aria-label', label);
    if (describedBy) element.setAttribute('aria-describedby', describedBy);
    if (expanded !== null) element.setAttribute('aria-expanded', expanded);
    if (selected !== null) element.setAttribute('aria-selected', selected);
    if (hidden !== null) element.setAttribute('aria-hidden', hidden);

    return element;
  }

  /**
   * Create accessible tabs
   */
  createAccessibleTabs(container) {
    const tabList = container.querySelector('[role="tablist"]');
    const tabs = container.querySelectorAll('[role="tab"]');
    const panels = container.querySelectorAll('[role="tabpanel"]');

    if (!tabList || tabs.length === 0 || panels.length === 0) return;

    tabs.forEach((tab, index) => {
      const panel = panels[index];
      const tabId = tab.id || `tab-${index}`;
      const panelId = panel.id || `panel-${index}`;

      tab.id = tabId;
      panel.id = panelId;

      tab.setAttribute('aria-controls', panelId);
      panel.setAttribute('aria-labelledby', tabId);

      // Set initial state
      const isActive = tab.classList.contains('active');
      tab.setAttribute('aria-selected', isActive);
      panel.setAttribute('aria-hidden', !isActive);
      tab.setAttribute('tabindex', isActive ? '0' : '-1');

      // Click handler
      tab.addEventListener('click', () => {
        this.activateTab(tab, tabs, panels);
      });

      // Keyboard handler
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.activateTab(tab, tabs, panels);
        }
      });
    });
  }

  /**
   * Activate tab
   */
  activateTab(activeTab, allTabs, allPanels) {
    const index = Array.from(allTabs).indexOf(activeTab);

    allTabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.setAttribute('aria-selected', isActive);
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
      tab.classList.toggle('active', isActive);
    });

    allPanels.forEach((panel, i) => {
      const isActive = i === index;
      panel.setAttribute('aria-hidden', !isActive);
      panel.classList.toggle('active', isActive);
    });

    activeTab.focus();
    this.announce(`${activeTab.textContent} tab selected`);
  }

  /**
   * Create accessible dropdown
   */
  createAccessibleDropdown(button, menu) {
    const buttonId = button.id || `dropdown-btn-${Math.random().toString(36).substr(2, 9)}`;
    const menuId = menu.id || `dropdown-menu-${Math.random().toString(36).substr(2, 9)}`;

    button.id = buttonId;
    menu.id = menuId;

    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', menuId);

    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', buttonId);

    const items = menu.querySelectorAll('button, a, [role="menuitem"]');
    items.forEach(item => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    });

    // Toggle dropdown
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('active', !isExpanded);

      if (!isExpanded && items.length > 0) {
        items[0].focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
      }
    });
  }

  /**
   * Update loading state
   */
  setLoadingState(element, isLoading, message = 'Loading') {
    element.setAttribute('aria-busy', isLoading);

    if (isLoading) {
      element.setAttribute('aria-label', message);
      this.announce(message);
    } else {
      element.removeAttribute('aria-label');
      this.announce('Content loaded');
    }
  }

  /**
   * Create skip links
   */
  createSkipLinks(links) {
    const container = document.createElement('div');
    container.className = 'skip-links';

    links.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.href;
      skipLink.className = 'skip-link';
      skipLink.textContent = link.text;
      container.appendChild(skipLink);
    });

    document.body.insertBefore(container, document.body.firstChild);
    return container;
  }

  /**
   * Ensure minimum contrast ratio
   */
  checkContrast(foreground, background) {
    // Simple contrast check (would need color library for full implementation)
    // This is a placeholder for demonstration
    return true;
  }
}

// Initialize global accessibility manager
window.accessibilityManager = new AccessibilityManager();

// Expose utility functions
window.announce = (message, priority) => window.accessibilityManager.announce(message, priority);
window.createFocusTrap = (container) => window.accessibilityManager.createFocusTrap(container);
window.releaseFocusTrap = () => window.accessibilityManager.releaseFocusTrap();
window.makeAccessible = (element, options) => window.accessibilityManager.makeAccessible(element, options);
window.setLoadingState = (element, isLoading, message) => window.accessibilityManager.setLoadingState(element, isLoading, message);
