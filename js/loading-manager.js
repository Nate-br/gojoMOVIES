/**
 * Loading State Utilities
 * Manages loading states, skeletons, and progress indicators
 */

class LoadingManager {
  constructor() {
    this.activeLoaders = new Set();
    this.init();
  }

  /**
   * Initialize loading manager
   */
  init() {
    // Create global loading overlay if it doesn't exist
    if (!document.getElementById('globalLoadingOverlay')) {
      this.createGlobalOverlay();
    }
  }

  /**
   * Create global loading overlay
   */
  createGlobalOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'globalLoadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-overlay__content">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /**
   * Show global loading overlay
   */
  showGlobalLoading(message = 'Loading...') {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) {
      const text = overlay.querySelector('.loading-text');
      if (text) text.textContent = message;
      overlay.classList.add('active');
    }
  }

  /**
   * Hide global loading overlay
   */
  hideGlobalLoading() {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Create skeleton cards for a grid
   */
  createSkeletonCards(container, count = 12) {
    if (!container) return;

    container.innerHTML = '';
    container.classList.add('skeleton-grid');

    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      card.innerHTML = `
        <div class="skeleton-card__thumbnail"></div>
        <div class="skeleton-card__content">
          <div class="skeleton-card__title"></div>
          <div class="skeleton-card__meta">
            <div class="skeleton-card__meta-item"></div>
            <div class="skeleton-card__meta-item"></div>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  }

  /**
   * Remove skeleton cards and show content
   */
  showContent(container) {
    if (!container) return;

    container.classList.remove('skeleton-grid');
    container.classList.add('content-loaded', 'stagger-grid');

    // Remove any skeleton cards
    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());
  }

  /**
   * Show loading spinner in element
   */
  showSpinner(element, size = 'medium') {
    if (!element) return;

    const spinner = document.createElement('div');
    spinner.className = `spinner spinner-${size}`;
    spinner.dataset.loadingSpinner = 'true';

    // Store original content
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(spinner);
    element.disabled = true;
  }

  /**
   * Hide loading spinner and restore content
   */
  hideSpinner(element) {
    if (!element) return;

    const spinner = element.querySelector('[data-loading-spinner]');
    if (spinner) {
      spinner.remove();
    }

    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
      delete element.dataset.originalContent;
    }

    element.disabled = false;
  }

  /**
   * Create progress bar
   */
  createProgressBar(container, progress = 0) {
    if (!container) return null;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
      <div class="progress-bar__fill" style="width: ${progress}%"></div>
    `;

    container.appendChild(progressBar);
    return progressBar;
  }

  /**
   * Update progress bar
   */
  updateProgress(progressBar, progress) {
    if (!progressBar) return;

    const fill = progressBar.querySelector('.progress-bar__fill');
    if (fill) {
      fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  }

  /**
   * Create indeterminate progress bar
   */
  createIndeterminateProgress(container) {
    if (!container) return null;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-bar__indeterminate"></div>';

    container.appendChild(progressBar);
    return progressBar;
  }

  /**
   * Wrap async function with loading state
   */
  async withLoading(asyncFn, options = {}) {
    const {
      showGlobal = false,
      message = 'Loading...',
      element = null,
      onProgress = null
    } = options;

    const loaderId = Math.random().toString(36).substr(2, 9);
    this.activeLoaders.add(loaderId);

    try {
      if (showGlobal) {
        this.showGlobalLoading(message);
      }

      if (element) {
        this.showSpinner(element);
      }

      const result = await asyncFn(onProgress);
      return result;
    } finally {
      this.activeLoaders.delete(loaderId);

      if (showGlobal) {
        this.hideGlobalLoading();
      }

      if (element) {
        this.hideSpinner(element);
      }
    }
  }

  /**
   * Add fade-in animation to elements
   */
  fadeIn(elements, stagger = false) {
    const els = Array.isArray(elements) ? elements : [elements];

    els.forEach((el, index) => {
      if (!el) return;

      if (stagger) {
        el.classList.add(`fade-in-delay-${Math.min(index + 1, 3)}`);
      } else {
        el.classList.add('fade-in');
      }
    });
  }

  /**
   * Check if any loaders are active
   */
  isLoading() {
    return this.activeLoaders.size > 0;
  }

  /**
   * Create loading state for image
   */
  createImageLoader(img) {
    if (!img) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'image-loader';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';

    // Create skeleton
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-thumbnail';
    skeleton.style.position = 'absolute';
    skeleton.style.top = '0';
    skeleton.style.left = '0';
    skeleton.style.width = '100%';
    skeleton.style.height = '100%';

    // Wrap image
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(skeleton);
    wrapper.appendChild(img);

    // Hide skeleton when image loads
    img.addEventListener('load', () => {
      skeleton.style.opacity = '0';
      skeleton.style.transition = 'opacity 0.3s';
      setTimeout(() => skeleton.remove(), 300);
      img.classList.add('fade-in');
    });

    // Remove skeleton on error
    img.addEventListener('error', () => {
      skeleton.remove();
    });
  }
}

// Initialize global loading manager
window.loadingManager = new LoadingManager();

// Expose utility functions
window.showLoading = (message) => window.loadingManager.showGlobalLoading(message);
window.hideLoading = () => window.loadingManager.hideGlobalLoading();
window.createSkeletons = (container, count) => window.loadingManager.createSkeletonCards(container, count);
window.showContent = (container) => window.loadingManager.showContent(container);
window.withLoading = (fn, options) => window.loadingManager.withLoading(fn, options);

console.log('[LoadingManager] Initialized');
