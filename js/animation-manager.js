/**
 * Animation Utilities
 * Manages micro-interactions, toast notifications, and smooth animations
 */

class AnimationManager {
  constructor() {
    this.toastContainer = null;
    this.toastQueue = [];
    this.activeToasts = new Map();
    this.init();
  }

  /**
   * Initialize animation manager
   */
  init() {
    this.createToastContainer();
    this.setupRippleEffect();
    this.setupScrollReveal();
    this.setupButtonAnimations();
  }

  /**
   * Create toast container
   */
  createToastContainer() {
    if (!document.getElementById('toastContainer')) {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.toastContainer = container;
    } else {
      this.toastContainer = document.getElementById('toastContainer');
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, options = {}) {
    const {
      type = 'info',
      title = '',
      duration = 4000,
      closable = true
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    };

    toast.innerHTML = `
      <div class="toast__icon">${icons[type]}</div>
      <div class="toast__content">
        ${title ? `<div class="toast__title">${title}</div>` : ''}
        <div class="toast__message">${message}</div>
      </div>
      ${closable ? `
        <button class="toast__close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      ` : ''}
    `;

    const toastId = Date.now() + Math.random();
    this.activeToasts.set(toastId, toast);

    if (closable) {
      const closeBtn = toast.querySelector('.toast__close');
      closeBtn.addEventListener('click', () => this.removeToast(toastId));
    }

    this.toastContainer.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => this.removeToast(toastId), duration);
    }

    return toastId;
  }

  /**
   * Remove toast notification
   */
  removeToast(toastId) {
    const toast = this.activeToasts.get(toastId);
    if (!toast) return;

    toast.classList.add('removing');
    setTimeout(() => {
      toast.remove();
      this.activeToasts.delete(toastId);
    }, 300);
  }

  /**
   * Setup ripple effect for buttons
   */
  setupRippleEffect() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button, .btn, .icon-button');
      if (!button) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      button.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  }

  /**
   * Setup scroll reveal animations
   */
  setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements with scroll-reveal class
    const observeScrollElements = () => {
      document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
      });
    };

    observeScrollElements();

    // Re-observe when new content is added
    const mutationObserver = new MutationObserver(observeScrollElements);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup button press animations
   */
  setupButtonAnimations() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button, .btn');
      if (!button) return;

      button.classList.add('btn-press');
      setTimeout(() => button.classList.remove('btn-press'), 200);
    });
  }

  /**
   * Animate element entrance
   */
  animateIn(element, animation = 'fade-in') {
    if (!element) return;

    element.classList.add(animation);
  }

  /**
   * Shake element (for errors)
   */
  shake(element) {
    if (!element) return;

    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
  }

  /**
   * Bounce element
   */
  bounce(element) {
    if (!element) return;

    element.classList.add('bounce');
    setTimeout(() => element.classList.remove('bounce'), 600);
  }

  /**
   * Add pulse ring effect
   */
  addPulseRing(element) {
    if (!element) return;

    element.classList.add('pulse-ring');
  }

  /**
   * Remove pulse ring effect
   */
  removePulseRing(element) {
    if (!element) return;

    element.classList.remove('pulse-ring');
  }

  /**
   * Smooth scroll to element
   */
  scrollTo(element, offset = 0) {
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }

  /**
   * Add page transition
   */
  pageTransition() {
    document.body.classList.add('page-transition');
  }

  /**
   * Stagger animation for multiple elements
   */
  staggerAnimation(elements, delay = 100) {
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('fade-in');
      }, index * delay);
    });
  }
}

// Initialize global animation manager
window.animationManager = new AnimationManager();

// Expose utility functions
window.showToast = (message, options) => window.animationManager.showToast(message, options);
window.shake = (element) => window.animationManager.shake(element);
window.bounce = (element) => window.animationManager.bounce(element);
window.smoothScrollTo = (element, offset) => window.animationManager.scrollTo(element, offset);

// Convenience toast methods
window.toast = {
  success: (message, title) => window.showToast(message, { type: 'success', title }),
  error: (message, title) => window.showToast(message, { type: 'error', title }),
  warning: (message, title) => window.showToast(message, { type: 'warning', title }),
  info: (message, title) => window.showToast(message, { type: 'info', title })
};

console.log('[AnimationManager] Initialized');
