/**
 * Error Logging and Monitoring Utility
 * Centralized error handling and performance monitoring for gojoMOVIES
 */

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 50; // Keep last 50 errors in memory
    this.sessionId = this.generateSessionId();
    this.initGlobalHandlers();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize global error handlers
   */
  initGlobalHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Catch resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.logError({
          type: 'resource',
          message: `Failed to load: ${event.target.tagName}`,
          src: event.target.src || event.target.href,
          timestamp: new Date().toISOString()
        });
      }
    }, true);
  }

  /**
   * Log an error
   */
  logError(error) {
    const enrichedError = {
      ...error,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    // Add to memory
    this.errors.push(enrichedError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (this.isDevelopment()) {
      console.error('[ErrorLogger]', enrichedError);
    }

    // Store in localStorage for debugging
    this.saveToStorage(enrichedError);

    // Send to monitoring service (placeholder for future implementation)
    this.sendToMonitoring(enrichedError);
  }

  /**
   * Log API errors
   */
  logApiError(endpoint, error, response = null) {
    this.logError({
      type: 'api',
      endpoint,
      message: error.message || String(error),
      status: response?.status,
      statusText: response?.statusText,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric) {
    const perfData = {
      type: 'performance',
      metric,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    if (this.isDevelopment()) {
      console.log('[Performance]', perfData);
    }

    this.saveToStorage(perfData);
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
          const firstPaint = performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint');

          this.logPerformance({
            loadTime,
            domReady,
            firstContentfulPaint: firstPaint?.startTime,
            page: window.location.pathname
          });
        }, 0);
      });
    }
  }

  /**
   * Save error to localStorage
   */
  saveToStorage(data) {
    try {
      const key = `gojo_logs_${new Date().toISOString().split('T')[0]}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(data);

      // Keep only last 100 entries per day
      if (existing.length > 100) {
        existing.shift();
      }

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      // localStorage might be full or disabled
      console.warn('Failed to save log to storage:', e);
    }
  }

  /**
   * Send to monitoring service (placeholder)
   */
  sendToMonitoring(error) {
    // Placeholder for future integration with services like:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - Custom logging endpoint

    // Example implementation:
    // if (this.isProduction()) {
    //   fetch('/api/log', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(error)
    //   }).catch(() => {});
    // }
  }

  /**
   * Get all logged errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get errors from localStorage
   */
  getStoredLogs() {
    const logs = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('gojo_logs_')) {
        try {
          logs[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          console.warn('Failed to parse stored logs:', e);
        }
      }
    }
    return logs;
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith('gojo_logs_')) {
        localStorage.removeItem(key);
      }
    }
    this.errors = [];
  }

  /**
   * Check if in development mode
   */
  isDevelopment() {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.port !== '';
  }

  /**
   * Check if in production mode
   */
  isProduction() {
    return !this.isDevelopment();
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const data = {
      sessionId: this.sessionId,
      currentErrors: this.errors,
      storedLogs: this.getStoredLogs(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gojo-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize global error logger
window.errorLogger = new ErrorLogger();
window.errorLogger.trackPageLoad();

// Expose utility functions globally
window.logError = (error) => window.errorLogger.logError(error);
window.logApiError = (endpoint, error, response) => window.errorLogger.logApiError(endpoint, error, response);
window.logPerformance = (metric) => window.errorLogger.logPerformance(metric);
window.exportLogs = () => window.errorLogger.exportLogs();

// Log initialization
console.log('[ErrorLogger] Initialized - Session:', window.errorLogger.sessionId);
