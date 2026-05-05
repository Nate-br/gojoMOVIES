/**
 * Empty States & Error Handling Utilities
 * Manages empty states, error messages, and user feedback
 */

class EmptyStateManager {
  constructor() {
    this.init();
  }

  /**
   * Initialize empty state manager
   */
  init() {
    this.setupOfflineDetection();
  }

  /**
   * Create empty state
   */
  createEmptyState(container, options = {}) {
    const {
      icon = 'search',
      title = 'No results found',
      description = 'Try adjusting your search or filters',
      actions = [],
      type = 'no-results'
    } = options;

    const icons = {
      search: '<path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5.2 5.2 1.4-1.4-5.2-5.2zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>',
      inbox: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z"/>',
      error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
      folder: '<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>'
    };

    const emptyState = document.createElement('div');
    emptyState.className = `empty-state ${type}`;
    emptyState.innerHTML = `
      <svg class="empty-state-icon" viewBox="0 0 24 24">
        ${icons[icon] || icons.search}
      </svg>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-description">${description}</p>
      ${actions.length > 0 ? `
        <div class="empty-state-actions">
          ${actions.map(action => `
            <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${action.action}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    container.innerHTML = '';
    container.appendChild(emptyState);

    // Add action handlers
    actions.forEach(action => {
      const btn = emptyState.querySelector(`[data-action="${action.action}"]`);
      if (btn && action.handler) {
        btn.addEventListener('click', action.handler);
      }
    });

    return emptyState;
  }

  /**
   * Create no results state
   */
  createNoResults(container, query = '', suggestions = []) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <svg class="no-results-icon" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5.2 5.2 1.4-1.4-5.2-5.2zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="currentColor"/>
      </svg>
      <h3 class="no-results-title">No results for "${query}"</h3>
      <p class="no-results-text">We couldn't find any movies matching your search.</p>
      ${suggestions.length > 0 ? `
        <div class="no-results-suggestions">
          <h4 class="no-results-suggestions-title">Try these suggestions:</h4>
          <ul class="no-results-suggestions-list">
            ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;

    container.innerHTML = '';
    container.appendChild(noResults);
    return noResults;
  }

  /**
   * Show error message
   */
  showError(message, options = {}) {
    const {
      title = 'Error',
      type = 'error',
      duration = 0,
      actions = [],
      closable = true
    } = options;

    const icons = {
      error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
      warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
      info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
      success: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    };

    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.innerHTML = `
      <svg class="${type}-message-icon" viewBox="0 0 24 24">
        ${icons[type]}
      </svg>
      <div class="${type}-message-content">
        <h4 class="${type}-message-title">${title}</h4>
        <p class="${type}-message-text">${message}</p>
        ${actions.length > 0 ? `
          <div class="error-message-actions">
            ${actions.map(action => `
              <button class="btn btn-secondary" data-action="${action.action}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${closable ? `
        <button class="error-message-close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      ` : ''}
    `;

    // Add to page
    const container = document.querySelector('main') || document.body;
    container.insertBefore(messageEl, container.firstChild);

    // Add close handler
    if (closable) {
      const closeBtn = messageEl.querySelector('.error-message-close');
      closeBtn.addEventListener('click', () => {
        messageEl.remove();
      });
    }

    // Add action handlers
    actions.forEach(action => {
      const btn = messageEl.querySelector(`[data-action="${action.action}"]`);
      if (btn && action.handler) {
        btn.addEventListener('click', () => {
          action.handler();
          messageEl.remove();
        });
      }
    });

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        messageEl.remove();
      }, duration);
    }

    return messageEl;
  }

  /**
   * Show loading error
   */
  showLoadingError(container, options = {}) {
    const {
      title = 'Failed to load content',
      message = 'Something went wrong. Please try again.',
      retryHandler = null
    } = options;

    const errorEl = document.createElement('div');
    errorEl.className = 'loading-error';
    errorEl.innerHTML = `
      <svg class="loading-error-icon" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
      </svg>
      <h3 class="loading-error-title">${title}</h3>
      <p class="loading-error-text">${message}</p>
      <div class="loading-error-actions">
        ${retryHandler ? '<button class="btn btn-primary retry-btn">Try Again</button>' : ''}
        <button class="btn btn-secondary home-btn">Go Home</button>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(errorEl);

    // Add retry handler
    if (retryHandler) {
      const retryBtn = errorEl.querySelector('.retry-btn');
      retryBtn.addEventListener('click', retryHandler);
    }

    // Add home handler
    const homeBtn = errorEl.querySelector('.home-btn');
    homeBtn.addEventListener('click', () => {
      window.location.href = '/';
    });

    return errorEl;
  }

  /**
   * Setup offline detection
   */
  setupOfflineDetection() {
    let offlineBanner = null;

    const showOfflineBanner = () => {
      if (offlineBanner) return;

      offlineBanner = document.createElement('div');
      offlineBanner.className = 'offline-banner';
      offlineBanner.innerHTML = `
        <p class="offline-banner-text">You are currently offline. Some features may not be available.</p>
      `;
      document.body.appendChild(offlineBanner);

      setTimeout(() => {
        offlineBanner.classList.add('visible');
      }, 100);
    };

    const hideOfflineBanner = () => {
      if (!offlineBanner) return;

      offlineBanner.classList.remove('visible');
      setTimeout(() => {
        offlineBanner.remove();
        offlineBanner = null;
      }, 300);
    };

    window.addEventListener('offline', showOfflineBanner);
    window.addEventListener('online', hideOfflineBanner);

    // Check initial state
    if (!navigator.onLine) {
      showOfflineBanner();
    }
  }

  /**
   * Create 404 page
   */
  create404Page(container) {
    const page = document.createElement('div');
    page.className = 'error-page error-404';
    page.innerHTML = `
      <svg class="error-illustration" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--accent-primary)" stroke-width="2"/>
        <text x="100" y="115" text-anchor="middle" font-size="60" font-weight="bold" fill="var(--text-primary)">404</text>
      </svg>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page Not Found</h2>
      <p class="error-description">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="error-actions">
        <button class="btn btn-primary home-btn">Go Home</button>
        <button class="btn btn-secondary back-btn">Go Back</button>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(page);

    // Add handlers
    page.querySelector('.home-btn').addEventListener('click', () => {
      window.location.href = '/';
    });

    page.querySelector('.back-btn').addEventListener('click', () => {
      window.history.back();
    });

    return page;
  }

  /**
   * Create maintenance page
   */
  createMaintenancePage(container, eta = null) {
    const page = document.createElement('div');
    page.className = 'maintenance-page';
    page.innerHTML = `
      <svg class="maintenance-icon" viewBox="0 0 24 24">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="var(--accent-primary)"/>
      </svg>
      <h1 class="maintenance-title">Under Maintenance</h1>
      <p class="maintenance-description">
        We're currently performing scheduled maintenance to improve your experience.
        We'll be back shortly!
      </p>
      ${eta ? `<p class="maintenance-eta">Expected completion: ${eta}</p>` : ''}
    `;

    container.innerHTML = '';
    container.appendChild(page);
    return page;
  }
}

// Initialize global empty state manager
window.emptyStateManager = new EmptyStateManager();

// Expose utility functions
window.createEmptyState = (container, options) => window.emptyStateManager.createEmptyState(container, options);
window.createNoResults = (container, query, suggestions) => window.emptyStateManager.createNoResults(container, query, suggestions);
window.showError = (message, options) => window.emptyStateManager.showError(message, options);
window.showLoadingError = (container, options) => window.emptyStateManager.showLoadingError(container, options);
window.create404Page = (container) => window.emptyStateManager.create404Page(container);
window.createMaintenancePage = (container, eta) => window.emptyStateManager.createMaintenancePage(container, eta);
