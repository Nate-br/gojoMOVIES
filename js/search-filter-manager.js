/**
 * Search & Filter Enhancement Utilities
 * Manages search suggestions, filter chips, and sort options
 */

class SearchFilterManager {
  constructor() {
    this.activeFilters = new Set();
    this.currentSort = 'newest';
    this.searchHistory = [];
    this.suggestions = [];
    this.init();
  }

  /**
   * Initialize search and filter manager
   */
  init() {
    this.loadSearchHistory();
  }

  /**
   * Create enhanced search bar
   */
  createSearchBar(container, options = {}) {
    const {
      placeholder = 'Search movies...',
      onSearch = null,
      showSuggestions = true
    } = options;

    const searchBar = document.createElement('div');
    searchBar.className = 'search-container';
    searchBar.innerHTML = `
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5.2 5.2 1.4-1.4-5.2-5.2zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>
        </svg>
        <input type="text" placeholder="${placeholder}" aria-label="Search">
        <button class="search-clear" aria-label="Clear search">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      ${showSuggestions ? '<div class="search-suggestions"></div>' : ''}
    `;

    container.appendChild(searchBar);

    const input = searchBar.querySelector('input');
    const searchBarEl = searchBar.querySelector('.search-bar');
    const clearBtn = searchBar.querySelector('.search-clear');
    const suggestionsEl = searchBar.querySelector('.search-suggestions');

    // Expand on focus
    input.addEventListener('focus', () => {
      searchBarEl.classList.add('expanded');
    });

    // Collapse on blur (with delay for clicks)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!input.value) {
          searchBarEl.classList.remove('expanded');
        }
        if (suggestionsEl) {
          suggestionsEl.classList.remove('active');
        }
      }, 200);
    });

    // Handle input
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      if (value) {
        searchBarEl.classList.add('has-value');
        if (showSuggestions) {
          this.showSuggestions(suggestionsEl, value);
        }
      } else {
        searchBarEl.classList.remove('has-value');
        if (suggestionsEl) {
          suggestionsEl.classList.remove('active');
        }
      }
    });

    // Handle search
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value) {
        this.performSearch(input.value, onSearch);
        if (suggestionsEl) {
          suggestionsEl.classList.remove('active');
        }
      }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      input.value = '';
      searchBarEl.classList.remove('has-value');
      if (suggestionsEl) {
        suggestionsEl.classList.remove('active');
      }
      input.focus();
      if (onSearch) onSearch('');
    });

    return searchBar;
  }

  /**
   * Show search suggestions
   */
  showSuggestions(container, query) {
    if (!container || !query) return;

    const suggestions = this.getSuggestions(query);

    if (suggestions.length === 0) {
      container.classList.remove('active');
      return;
    }

    container.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion-item" data-value="${suggestion.value}">
        <svg class="suggestion-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5.2 5.2 1.4-1.4-5.2-5.2zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>
        </svg>
        <span class="suggestion-text">${this.highlightMatch(suggestion.text, query)}</span>
        ${suggestion.category ? `<span class="suggestion-category">${suggestion.category}</span>` : ''}
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const value = item.dataset.value;
        const input = container.parentElement.querySelector('input');
        input.value = value;
        this.performSearch(value);
        container.classList.remove('active');
      });
    });

    container.classList.add('active');
  }

  /**
   * Get suggestions based on query
   */
  getSuggestions(query) {
    const lowerQuery = query.toLowerCase();
    const suggestions = [];

    // Add from search history
    this.searchHistory
      .filter(term => term.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(term => {
        suggestions.push({
          value: term,
          text: term,
          category: 'Recent'
        });
      });

    // Add predefined suggestions (could be from API)
    const predefined = [
      'Comedy', 'Drama', 'Action', 'Romance', 'Thriller',
      'New Releases', 'Top Rated', 'Most Viewed'
    ];

    predefined
      .filter(term => term.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .forEach(term => {
        suggestions.push({
          value: term,
          text: term,
          category: 'Category'
        });
      });

    return suggestions.slice(0, 8);
  }

  /**
   * Highlight matching text
   */
  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Perform search
   */
  performSearch(query, callback) {
    if (query) {
      this.addToSearchHistory(query);
    }
    if (callback) {
      callback(query);
    }
  }

  /**
   * Create filter chips
   */
  createFilterChips(container, filters = []) {
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';
    filterSection.innerHTML = `
      <span class="filter-label">Filter:</span>
      <div class="filter-chips">
        ${filters.map(filter => `
          <button class="filter-chip" data-filter="${filter.value}">
            ${filter.icon ? `<svg class="filter-chip-icon" viewBox="0 0 24 24"><path d="${filter.icon}"/></svg>` : ''}
            <span>${filter.label}</span>
            <span class="filter-chip-remove">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </span>
          </button>
        `).join('')}
      </div>
    `;

    container.appendChild(filterSection);

    // Add click handlers
    filterSection.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.toggleFilter(chip);
      });
    });

    return filterSection;
  }

  /**
   * Toggle filter
   */
  toggleFilter(chipElement) {
    const filter = chipElement.dataset.filter;

    if (chipElement.classList.contains('active')) {
      chipElement.classList.remove('active');
      this.activeFilters.delete(filter);
    } else {
      chipElement.classList.add('active');
      this.activeFilters.add(filter);
    }

    this.updateActiveFiltersDisplay();
    this.triggerFilterChange();
  }

  /**
   * Create sort dropdown
   */
  createSortDropdown(container, options = []) {
    const sortDropdown = document.createElement('div');
    sortDropdown.className = 'sort-dropdown';
    sortDropdown.innerHTML = `
      <button class="sort-button">
        <svg class="sort-icon" viewBox="0 0 24 24">
          <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
        </svg>
        <span>Sort: <span class="sort-label">Newest</span></span>
      </button>
      <div class="sort-menu">
        ${options.map(option => `
          <div class="sort-option ${option.value === this.currentSort ? 'active' : ''}" data-sort="${option.value}">
            <span>${option.label}</span>
            <svg class="sort-option-check" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        `).join('')}
      </div>
    `;

    container.appendChild(sortDropdown);

    const button = sortDropdown.querySelector('.sort-button');
    const menu = sortDropdown.querySelector('.sort-menu');
    const label = sortDropdown.querySelector('.sort-label');

    // Toggle menu
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
      button.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      menu.classList.remove('active');
      button.classList.remove('active');
    });

    // Handle sort selection
    sortDropdown.querySelectorAll('.sort-option').forEach(option => {
      option.addEventListener('click', () => {
        const sortValue = option.dataset.sort;
        const sortLabel = option.textContent.trim();

        // Update active state
        sortDropdown.querySelectorAll('.sort-option').forEach(opt => {
          opt.classList.remove('active');
        });
        option.classList.add('active');

        // Update button label
        label.textContent = sortLabel;

        // Update current sort
        this.currentSort = sortValue;

        // Close menu
        menu.classList.remove('active');
        button.classList.remove('active');

        // Trigger sort change
        this.triggerSortChange();
      });
    });

    return sortDropdown;
  }

  /**
   * Update active filters display
   */
  updateActiveFiltersDisplay() {
    let container = document.querySelector('.active-filters');

    if (this.activeFilters.size === 0) {
      if (container) container.remove();
      return;
    }

    if (!container) {
      container = document.createElement('div');
      container.className = 'active-filters';
      const filterSection = document.querySelector('.filter-section');
      if (filterSection) {
        filterSection.after(container);
      }
    }

    container.innerHTML = `
      ${Array.from(this.activeFilters).map(filter => `
        <span class="active-filter-tag">
          ${filter}
          <button class="active-filter-remove" data-filter="${filter}">
            <svg viewBox="0 0 24 24" width="12" height="12">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </span>
      `).join('')}
      <button class="clear-all-filters">Clear all</button>
    `;

    // Add remove handlers
    container.querySelectorAll('.active-filter-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.removeFilter(filter);
      });
    });

    // Clear all handler
    container.querySelector('.clear-all-filters').addEventListener('click', () => {
      this.clearAllFilters();
    });
  }

  /**
   * Remove filter
   */
  removeFilter(filter) {
    this.activeFilters.delete(filter);

    // Update chip state
    const chip = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
    if (chip) {
      chip.classList.remove('active');
    }

    this.updateActiveFiltersDisplay();
    this.triggerFilterChange();
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.activeFilters.clear();

    // Update all chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.remove('active');
    });

    this.updateActiveFiltersDisplay();
    this.triggerFilterChange();
  }

  /**
   * Trigger filter change event
   */
  triggerFilterChange() {
    const event = new CustomEvent('filtersChanged', {
      detail: {
        filters: Array.from(this.activeFilters),
        sort: this.currentSort
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Trigger sort change event
   */
  triggerSortChange() {
    const event = new CustomEvent('sortChanged', {
      detail: {
        sort: this.currentSort
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query) {
    if (!this.searchHistory.includes(query)) {
      this.searchHistory.unshift(query);
      this.searchHistory = this.searchHistory.slice(0, 10);
      this.saveSearchHistory();
    }
  }

  /**
   * Load search history from localStorage
   */
  loadSearchHistory() {
    try {
      const history = localStorage.getItem('searchHistory');
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  /**
   * Save search history to localStorage
   */
  saveSearchHistory() {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Get active filters
   */
  getActiveFilters() {
    return Array.from(this.activeFilters);
  }

  /**
   * Get current sort
   */
  getCurrentSort() {
    return this.currentSort;
  }
}

// Initialize global search filter manager
window.searchFilterManager = new SearchFilterManager();

// Expose utility functions
window.createSearchBar = (container, options) => window.searchFilterManager.createSearchBar(container, options);
window.createFilterChips = (container, filters) => window.searchFilterManager.createFilterChips(container, filters);
window.createSortDropdown = (container, options) => window.searchFilterManager.createSortDropdown(container, options);
