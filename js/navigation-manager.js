/**
 * Navigation Enhancement Utilities
 * Manages sticky header, back-to-top button, scroll effects, and navigation features
 */

class NavigationManager {
  constructor() {
    this.scrollThreshold = 100;
    this.lastScrollTop = 0;
    this.init();
  }

  /**
   * Initialize navigation manager
   */
  init() {
    this.createBackToTopButton();
    this.createScrollProgress();
    this.setupScrollEffects();
    this.setupSmoothScroll();
    this.createSkipToContent();
  }

  /**
   * Create back to top button
   */
  createBackToTopButton() {
    if (document.getElementById('backToTop')) return;

    const button = document.createElement('button');
    button.id = 'backToTop';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill="currentColor"/>
      </svg>
    `;

    document.body.appendChild(button);

    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    this.backToTopButton = button;
  }

  /**
   * Create scroll progress indicator
   */
  createScrollProgress() {
    if (document.getElementById('scrollProgress')) return;

    const progress = document.createElement('div');
    progress.id = 'scrollProgress';
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);

    this.scrollProgress = progress;
  }

  /**
   * Setup scroll effects
   */
  setupScrollEffects() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Update back to top button
    if (scrollTop > this.scrollThreshold) {
      this.backToTopButton?.classList.add('visible');
    } else {
      this.backToTopButton?.classList.remove('visible');
    }

    // Update scroll progress
    this.updateScrollProgress();

    // Update header on scroll
    this.updateHeaderOnScroll(scrollTop);

    // Update tabs container on scroll
    this.updateTabsOnScroll(scrollTop);

    this.lastScrollTop = scrollTop;
  }

  /**
   * Update scroll progress indicator
   */
  updateScrollProgress() {
    if (!this.scrollProgress) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

    this.scrollProgress.style.width = `${Math.min(100, scrollPercent)}%`;
  }

  /**
   * Update header on scroll
   */
  updateHeaderOnScroll(scrollTop) {
    const header = document.querySelector('header');
    if (!header) return;

    if (scrollTop > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  /**
   * Update tabs container on scroll
   */
  updateTabsOnScroll(scrollTop) {
    const tabs = document.querySelector('.tabs-container');
    if (!tabs) return;

    if (scrollTop > 150) {
      tabs.classList.add('scrolled');
    } else {
      tabs.classList.remove('scrolled');
    }
  }

  /**
   * Setup smooth scroll for anchor links
   */
  setupSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      this.scrollToElement(target);
    });
  }

  /**
   * Scroll to element with offset
   */
  scrollToElement(element, offset = 80) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Create skip to content link
   */
  createSkipToContent() {
    if (document.querySelector('.skip-to-content')) return;

    const skip = document.createElement('a');
    skip.href = '#main-content';
    skip.className = 'skip-to-content';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /**
   * Create breadcrumb navigation
   */
  createBreadcrumb(container, items) {
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');

    breadcrumb.innerHTML = items.map((item, index) => {
      const isLast = index === items.length - 1;
      return `
        <div class="breadcrumb-item">
          ${item.url && !isLast ?
            `<a href="${item.url}" class="breadcrumb-link">${item.label}</a>` :
            `<span class="breadcrumb-link active">${item.label}</span>`
          }
          ${!isLast ? `
            <span class="breadcrumb-separator">
              <svg viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </span>
          ` : ''}
        </div>
      `;
    }).join('');

    container.appendChild(breadcrumb);
    return breadcrumb;
  }

  /**
   * Create quick navigation menu
   */
  createQuickNav(sections) {
    if (document.querySelector('.quick-nav')) return;

    const quickNav = document.createElement('div');
    quickNav.className = 'quick-nav';

    sections.forEach((section, index) => {
      const item = document.createElement('div');
      item.className = 'quick-nav-item';
      item.dataset.label = section.label;
      item.dataset.target = section.id;

      item.addEventListener('click', () => {
        const target = document.getElementById(section.id);
        if (target) {
          this.scrollToElement(target);
        }
      });

      quickNav.appendChild(item);
    });

    document.body.appendChild(quickNav);

    // Update active state on scroll
    this.updateQuickNavOnScroll(sections);

    return quickNav;
  }

  /**
   * Update quick nav active state on scroll
   */
  updateQuickNavOnScroll(sections) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.quick-nav-item').forEach(item => {
            if (item.dataset.target === id) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
      });
    }, {
      threshold: 0.5
    });

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });
  }

  /**
   * Show quick nav
   */
  showQuickNav() {
    const quickNav = document.querySelector('.quick-nav');
    if (quickNav) {
      quickNav.classList.add('visible');
    }
  }

  /**
   * Hide quick nav
   */
  hideQuickNav() {
    const quickNav = document.querySelector('.quick-nav');
    if (quickNav) {
      quickNav.classList.remove('visible');
    }
  }

  /**
   * Create mobile navigation drawer
   */
  createMobileNav(items) {
    // Create toggle button
    const toggle = document.createElement('button');
    toggle.className = 'mobile-nav-toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
      </svg>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';

    // Create drawer
    const drawer = document.createElement('div');
    drawer.className = 'mobile-nav-drawer';
    drawer.innerHTML = `
      <div class="mobile-nav-header">
        <h2>Menu</h2>
        <button class="mobile-nav-close" aria-label="Close menu">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div class="mobile-nav-content">
        ${items.map(item => `
          <a href="${item.url}" class="mobile-nav-item ${item.active ? 'active' : ''}">
            ${item.label}
          </a>
        `).join('')}
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    const closeBtn = drawer.querySelector('.mobile-nav-close');

    // Toggle drawer
    const toggleDrawer = () => {
      drawer.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
    };

    toggle.addEventListener('click', toggleDrawer);
    closeBtn.addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', toggleDrawer);

    // Close on navigation
    drawer.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        setTimeout(toggleDrawer, 100);
      });
    });

    return { toggle, drawer, overlay };
  }

  /**
   * Enhance tab navigation with indicator
   */
  enhanceTabNavigation() {
    const tabsContainer = document.querySelector('.tabs-container');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.tab-button');
    if (tabs.length === 0) return;

    // Create indicator
    const indicator = document.createElement('div');
    indicator.className = 'tabs-indicator';
    tabsContainer.appendChild(indicator);

    // Update indicator position
    const updateIndicator = (tab) => {
      const rect = tab.getBoundingClientRect();
      const containerRect = tabsContainer.getBoundingClientRect();
      indicator.style.width = `${rect.width}px`;
      indicator.style.left = `${rect.left - containerRect.left + tabsContainer.scrollLeft}px`;
    };

    // Set initial position
    const activeTab = tabsContainer.querySelector('.tab-button.active');
    if (activeTab) {
      updateIndicator(activeTab);
    }

    // Update on tab change
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateIndicator(tab);
      });
    });

    // Update on resize
    window.addEventListener('resize', () => {
      const activeTab = tabsContainer.querySelector('.tab-button.active');
      if (activeTab) {
        updateIndicator(activeTab);
      }
    });
  }

  /**
   * Create section navigation
   */
  createSectionNav(container, title) {
    const nav = document.createElement('div');
    nav.className = 'section-nav';
    nav.innerHTML = `
      <h2 class="section-title">${title}</h2>
      <div class="section-actions">
        <button class="section-nav-btn prev-btn" aria-label="Previous">
          <svg viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
          </svg>
        </button>
        <button class="section-nav-btn next-btn" aria-label="Next">
          <svg viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    `;

    container.insertBefore(nav, container.firstChild);
    return nav;
  }
}

// Initialize global navigation manager
window.navigationManager = new NavigationManager();

// Expose utility functions
window.scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.scrollToElement = (element, offset) => {
  window.navigationManager.scrollToElement(element, offset);
};

window.createBreadcrumb = (container, items) => {
  return window.navigationManager.createBreadcrumb(container, items);
};

window.createQuickNav = (sections) => {
  return window.navigationManager.createQuickNav(sections);
};
