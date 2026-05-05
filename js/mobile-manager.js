/**
 * Mobile Experience Utilities
 * Manages mobile-specific interactions, gestures, and optimizations
 */

class MobileManager {
  constructor() {
    this.isMobile = this.detectMobile();
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.pullStartY = 0;
    this.isPulling = false;
    this.init();
  }

  /**
   * Initialize mobile manager
   */
  init() {
    if (!this.isMobile) return;

    this.createBottomNav();
    this.setupPullToRefresh();
    this.setupSwipeGestures();
    this.optimizeForTouch();
  }

  /**
   * Detect if device is mobile
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Create mobile bottom navigation
   */
  createBottomNav() {
    if (document.querySelector('.mobile-bottom-nav')) return;

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = `
      <a href="/" class="mobile-nav-item active">
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
        <span>Home</span>
      </a>
      <a href="#search" class="mobile-nav-item">
        <svg viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5.2 5.2 1.4-1.4-5.2-5.2zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="currentColor"/>
        </svg>
        <span>Search</span>
      </a>
      <a href="#my-list" class="mobile-nav-item">
        <svg viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
        <span>My List</span>
      </a>
      <a href="#profile" class="mobile-nav-item">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
        </svg>
        <span>Profile</span>
      </a>
    `;

    document.body.appendChild(nav);

    // Update active state on navigation
    nav.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        nav.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  /**
   * Setup pull to refresh
   */
  setupPullToRefresh() {
    const container = document.querySelector('main') || document.body;
    container.classList.add('pull-to-refresh');

    // Create indicator
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh-indicator';
    indicator.innerHTML = '<div class="pull-to-refresh-spinner"></div>';
    container.insertBefore(indicator, container.firstChild);

    let startY = 0;
    let currentY = 0;
    let pulling = false;

    container.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    });

    container.addEventListener('touchmove', (e) => {
      if (!pulling) return;

      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && diff < 100) {
        container.classList.add('pulling');
        indicator.style.top = `${diff - 60}px`;
      }
    });

    container.addEventListener('touchend', () => {
      if (!pulling) return;

      const diff = currentY - startY;

      if (diff > 80) {
        this.triggerRefresh();
      }

      container.classList.remove('pulling');
      indicator.style.top = '';
      pulling = false;
      startY = 0;
      currentY = 0;
    });
  }

  /**
   * Trigger refresh
   */
  triggerRefresh() {
    const event = new CustomEvent('pullToRefresh');
    document.dispatchEvent(event);

    // Show loading for a moment
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  /**
   * Setup swipe gestures
   */
  setupSwipeGestures() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    });
  }

  /**
   * Handle swipe gesture
   */
  handleSwipe() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const minSwipeDistance = 50;

    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        this.onSwipeRight();
      } else {
        this.onSwipeLeft();
      }
    }

    // Vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        this.onSwipeDown();
      } else {
        this.onSwipeUp();
      }
    }
  }

  /**
   * Swipe handlers
   */
  onSwipeLeft() {
    const event = new CustomEvent('swipeLeft');
    document.dispatchEvent(event);
  }

  onSwipeRight() {
    const event = new CustomEvent('swipeRight');
    document.dispatchEvent(event);
  }

  onSwipeUp() {
    const event = new CustomEvent('swipeUp');
    document.dispatchEvent(event);
  }

  onSwipeDown() {
    const event = new CustomEvent('swipeDown');
    document.dispatchEvent(event);
  }

  /**
   * Optimize for touch
   */
  optimizeForTouch() {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Add touch feedback
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, .btn, a');
      if (target) {
        target.style.opacity = '0.7';
      }
    });

    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('button, .btn, a');
      if (target) {
        setTimeout(() => {
          target.style.opacity = '';
        }, 100);
      }
    });
  }

  /**
   * Create swipeable carousel
   */
  createSwipeableCarousel(container, items) {
    const carousel = document.createElement('div');
    carousel.className = 'swipeable-carousel';

    items.forEach(item => {
      const carouselItem = document.createElement('div');
      carouselItem.className = 'carousel-item';
      carouselItem.innerHTML = item;
      carousel.appendChild(carouselItem);
    });

    container.appendChild(carousel);
    return carousel;
  }

  /**
   * Show swipe indicator
   */
  showSwipeIndicator(message) {
    let indicator = document.querySelector('.swipe-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'swipe-indicator';
      document.body.appendChild(indicator);
    }

    indicator.textContent = message;
    indicator.classList.add('visible');

    setTimeout(() => {
      indicator.classList.remove('visible');
    }, 1000);
  }

  /**
   * Enable horizontal scroll with indicators
   */
  enableScrollIndicators(container) {
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'scroll-indicator left';
    leftIndicator.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
      </svg>
    `;

    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'scroll-indicator right';
    rightIndicator.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
      </svg>
    `;

    container.style.position = 'relative';
    container.appendChild(leftIndicator);
    container.appendChild(rightIndicator);

    const updateIndicators = () => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      leftIndicator.classList.toggle('visible', scrollLeft > 10);
      rightIndicator.classList.toggle('visible', scrollLeft < scrollWidth - clientWidth - 10);
    };

    container.addEventListener('scroll', updateIndicators);
    updateIndicators();
  }

  /**
   * Optimize images for mobile
   */
  optimizeImages() {
    const images = document.querySelectorAll('img[data-src-mobile]');
    images.forEach(img => {
      if (this.isMobile) {
        img.src = img.dataset.srcMobile;
      }
    });
  }

  /**
   * Add safe area padding
   */
  addSafeAreaPadding() {
    const style = document.createElement('style');
    style.textContent = `
      @supports (padding: max(0px)) {
        body {
          padding-top: max(0px, env(safe-area-inset-top));
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Prevent overscroll
   */
  preventOverscroll() {
    document.body.style.overscrollBehavior = 'none';
  }

  /**
   * Enable smooth scrolling
   */
  enableSmoothScrolling() {
    document.documentElement.style.scrollBehavior = 'smooth';
  }
}

// Initialize mobile manager if on mobile device
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768) {
  window.mobileManager = new MobileManager();
}

// Expose utility functions
window.showSwipeIndicator = (message) => {
  if (window.mobileManager) {
    window.mobileManager.showSwipeIndicator(message);
  }
};

window.createSwipeableCarousel = (container, items) => {
  if (window.mobileManager) {
    return window.mobileManager.createSwipeableCarousel(container, items);
  }
};
