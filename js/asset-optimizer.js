/**
 * Asset Optimization Utility
 * Handles lazy loading, preloading, and optimization of images and resources
 */

class AssetOptimizer {
  constructor() {
    this.imageCache = new Map();
    this.observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };
    this.init();
  }

  /**
   * Initialize asset optimization
   */
  init() {
    this.setupIntersectionObserver();
    this.optimizeImages();
    this.addResourceHints();
    this.setupImageErrorHandling();
  }

  /**
   * Setup Intersection Observer for lazy loading
   */
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);
  }

  /**
   * Optimize all images on the page
   */
  optimizeImages() {
    // Find all images that need lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      }
    });

    // Add loading attribute to images without it
    const allImages = document.querySelectorAll('img:not([loading])');
    allImages.forEach(img => {
      // Don't lazy load images in viewport
      const rect = img.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
      }
    });
  }

  /**
   * Load an image
   */
  loadImage(img) {
    const src = img.dataset.src || img.src;

    if (!src || this.imageCache.has(src)) {
      return;
    }

    // Create a new image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.imageCache.set(src, true);
    };

    tempImg.onerror = () => {
      img.classList.add('error');
      this.handleImageError(img, src);
    };

    tempImg.src = src;
  }

  /**
   * Handle image loading errors
   */
  handleImageError(img, src) {
    console.warn('[AssetOptimizer] Failed to load image:', src);

    // Try fallback image quality for YouTube thumbnails
    if (src.includes('img.youtube.com') && src.includes('maxresdefault')) {
      const fallbackSrc = src.replace('maxresdefault', 'hqdefault');
      img.src = fallbackSrc;

      if (window.errorLogger) {
        window.errorLogger.logError({
          type: 'image',
          message: 'YouTube thumbnail fallback',
          original: src,
          fallback: fallbackSrc
        });
      }
    } else {
      // Set placeholder or hide image
      img.style.display = 'none';

      if (window.errorLogger) {
        window.errorLogger.logError({
          type: 'image',
          message: 'Image failed to load',
          src
        });
      }
    }
  }

  /**
   * Setup global image error handling
   */
  setupImageErrorHandling() {
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target, e.target.src);
      }
    }, true);
  }

  /**
   * Add resource hints for better performance
   */
  addResourceHints() {
    const hints = [
      { rel: 'preconnect', href: 'https://img.youtube.com' },
      { rel: 'dns-prefetch', href: 'https://www.youtube.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' }
    ];

    hints.forEach(hint => {
      if (!document.querySelector(`link[href="${hint.href}"]`)) {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.rel === 'preconnect') {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(urls) {
    urls.forEach(url => {
      if (!this.imageCache.has(url)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
        this.imageCache.set(url, true);
      }
    });
  }

  /**
   * Optimize YouTube thumbnail URLs
   */
  optimizeThumbnailUrl(videoId, quality = 'mqdefault') {
    // Available qualities: default, mqdefault, hqdefault, sddefault, maxresdefault
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }

  /**
   * Get responsive image URL based on viewport
   */
  getResponsiveThumbnail(videoId) {
    const width = window.innerWidth;

    if (width < 480) {
      return this.optimizeThumbnailUrl(videoId, 'default'); // 120x90
    } else if (width < 768) {
      return this.optimizeThumbnailUrl(videoId, 'mqdefault'); // 320x180
    } else if (width < 1200) {
      return this.optimizeThumbnailUrl(videoId, 'hqdefault'); // 480x360
    } else {
      return this.optimizeThumbnailUrl(videoId, 'sddefault'); // 640x480
    }
  }

  /**
   * Defer non-critical CSS
   */
  deferCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = function() {
      this.media = 'all';
    };
    document.head.appendChild(link);
  }

  /**
   * Monitor asset loading performance
   */
  monitorAssetPerformance() {
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');

      const slowResources = resources.filter(r => r.duration > 1000);

      if (slowResources.length > 0 && window.errorLogger) {
        window.errorLogger.logPerformance({
          type: 'slow_resources',
          count: slowResources.length,
          resources: slowResources.map(r => ({
            name: r.name,
            duration: r.duration,
            size: r.transferSize
          }))
        });
      }
    }
  }
}

// Initialize asset optimizer
window.assetOptimizer = new AssetOptimizer();

// Monitor performance after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    window.assetOptimizer.monitorAssetPerformance();
  }, 2000);
});

// Expose utility functions
window.optimizeImages = () => window.assetOptimizer.optimizeImages();
window.preloadImages = (urls) => window.assetOptimizer.preloadCriticalImages(urls);

console.log('[AssetOptimizer] Initialized');
