/**
 * Video Card Enhancement Utilities
 * Adds badges, ratings, progress bars, and enhanced interactions to video cards
 */

class VideoCardEnhancer {
  constructor() {
    this.init();
  }

  /**
   * Initialize card enhancer
   */
  init() {
    // Add SVG gradient definitions for half stars
    this.addStarGradientDefs();
  }

  /**
   * Add SVG gradient definitions for half stars
   */
  addStarGradientDefs() {
    if (document.getElementById('star-gradients')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'star-gradients';
    svg.style.display = 'none';
    svg.innerHTML = `
      <defs>
        <linearGradient id="half-star-gradient">
          <stop offset="50%" stop-color="#FFC107"/>
          <stop offset="50%" stop-color="rgba(255, 255, 255, 0.2)"/>
        </linearGradient>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  /**
   * Enhance a video card with all features
   */
  enhanceCard(cardElement, data = {}) {
    if (!cardElement) return;

    const {
      isNew = false,
      isTrending = false,
      isFeatured = false,
      isExclusive = false,
      duration = null,
      watchProgress = 0,
      rating = 0,
      views = null,
      genres = [],
      description = ''
    } = data;

    // Add badges
    this.addBadges(cardElement, { isNew, isTrending, isFeatured, isExclusive });

    // Add duration badge
    if (duration) {
      this.addDurationBadge(cardElement, duration);
    }

    // Add watch progress
    if (watchProgress > 0) {
      this.addWatchProgress(cardElement, watchProgress);
    }

    // Enhance rating display
    if (rating > 0) {
      this.enhanceRating(cardElement, rating);
    }

    // Add views icon
    if (views !== null) {
      this.enhanceViews(cardElement);
    }

    // Add preview info on hover
    if (description || genres.length > 0) {
      this.addPreviewInfo(cardElement, { description, genres });
    }

    // Add overlay actions if not present
    this.ensureOverlayActions(cardElement);
  }

  /**
   * Add badges to card
   */
  addBadges(cardElement, badges) {
    const thumbnail = cardElement.querySelector('.thumbnail');
    if (!thumbnail) return;

    // Remove existing badges container
    const existingBadges = thumbnail.querySelector('.card-badges');
    if (existingBadges) existingBadges.remove();

    const badgeTypes = [];
    if (badges.isNew) badgeTypes.push({ class: 'badge-new', text: 'New' });
    if (badges.isTrending) badgeTypes.push({ class: 'badge-trending', text: 'Trending' });
    if (badges.isFeatured) badgeTypes.push({ class: 'badge-featured', text: 'Featured' });
    if (badges.isExclusive) badgeTypes.push({ class: 'badge-exclusive', text: 'Exclusive' });

    if (badgeTypes.length === 0) return;

    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'card-badges';

    badgeTypes.forEach(badge => {
      const badgeEl = document.createElement('div');
      badgeEl.className = `badge ${badge.class}`;
      badgeEl.textContent = badge.text;
      badgesContainer.appendChild(badgeEl);
    });

    thumbnail.appendChild(badgesContainer);
  }

  /**
   * Add duration badge
   */
  addDurationBadge(cardElement, duration) {
    const thumbnail = cardElement.querySelector('.thumbnail');
    if (!thumbnail) return;

    // Remove existing duration badge
    const existingBadge = thumbnail.querySelector('.duration-badge');
    if (existingBadge) existingBadge.remove();

    const badge = document.createElement('div');
    badge.className = 'duration-badge';
    badge.textContent = this.formatDuration(duration);
    thumbnail.appendChild(badge);
  }

  /**
   * Format duration in minutes to HH:MM or MM:SS
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Add watch progress bar
   */
  addWatchProgress(cardElement, progress) {
    const thumbnail = cardElement.querySelector('.thumbnail');
    if (!thumbnail) return;

    // Remove existing progress bar
    const existingProgress = thumbnail.querySelector('.watch-progress');
    if (existingProgress) existingProgress.remove();

    const progressBar = document.createElement('div');
    progressBar.className = 'watch-progress';
    progressBar.innerHTML = `
      <div class="watch-progress__fill" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
    `;
    thumbnail.appendChild(progressBar);
  }

  /**
   * Enhance rating display with stars
   */
  enhanceRating(cardElement, rating) {
    const ratingEl = cardElement.querySelector('.rating');
    if (!ratingEl) return;

    // Clear existing content
    ratingEl.innerHTML = '';

    // Create stars container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      starsContainer.appendChild(this.createStar('full'));
    }

    // Add half star
    if (hasHalfStar) {
      starsContainer.appendChild(this.createStar('half'));
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsContainer.appendChild(this.createStar('empty'));
    }

    ratingEl.appendChild(starsContainer);

    // Add rating value
    const ratingValue = document.createElement('span');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = rating.toFixed(1);
    ratingEl.appendChild(ratingValue);
  }

  /**
   * Create a star SVG element
   */
  createStar(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.classList.add(`star-${type}`);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z');

    svg.appendChild(path);
    return svg;
  }

  /**
   * Enhance views display with icon
   */
  enhanceViews(cardElement) {
    const viewsEl = cardElement.querySelector('.views');
    if (!viewsEl || viewsEl.querySelector('svg')) return;

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'currentColor');
    icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';

    viewsEl.insertBefore(icon, viewsEl.firstChild);
  }

  /**
   * Add preview info overlay
   */
  addPreviewInfo(cardElement, data) {
    const thumbnail = cardElement.querySelector('.thumbnail');
    if (!thumbnail) return;

    // Remove existing preview info
    const existingPreview = thumbnail.querySelector('.preview-info');
    if (existingPreview) existingPreview.remove();

    const previewInfo = document.createElement('div');
    previewInfo.className = 'preview-info';

    let html = '';

    if (data.description) {
      html += `
        <div class="preview-info__description">${data.description}</div>
      `;
    }

    if (data.genres && data.genres.length > 0) {
      html += `
        <div class="genre-tags">
          ${data.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
        </div>
      `;
    }

    if (html) {
      previewInfo.innerHTML = html;
      thumbnail.appendChild(previewInfo);
    }
  }

  /**
   * Ensure overlay actions are present
   */
  ensureOverlayActions(cardElement) {
    const thumbnail = cardElement.querySelector('.thumbnail');
    if (!thumbnail || thumbnail.querySelector('.overlay-actions')) return;

    const actions = document.createElement('div');
    actions.className = 'overlay-actions';
    actions.innerHTML = `
      <button class="action-button like-btn" aria-label="Like" title="Like">
        <svg viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
      <button class="action-button save-btn" aria-label="Add to list" title="Add to list">
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    `;

    thumbnail.appendChild(actions);
  }

  /**
   * Add appear animation to card
   */
  animateCardAppear(cardElement, delay = 0) {
    if (!cardElement) return;

    setTimeout(() => {
      cardElement.classList.add('appear');
    }, delay);
  }

  /**
   * Batch enhance multiple cards
   */
  enhanceCards(cards, dataArray = []) {
    cards.forEach((card, index) => {
      const data = dataArray[index] || {};
      this.enhanceCard(card, data);
      this.animateCardAppear(card, index * 50);
    });
  }

  /**
   * Update watch progress for a card
   */
  updateWatchProgress(cardElement, progress) {
    const progressBar = cardElement.querySelector('.watch-progress__fill');
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    } else {
      this.addWatchProgress(cardElement, progress);
    }
  }

  /**
   * Toggle like state
   */
  toggleLike(cardElement, isLiked) {
    const likeBtn = cardElement.querySelector('.like-btn');
    if (!likeBtn) return;

    if (isLiked) {
      likeBtn.classList.add('active');
      likeBtn.setAttribute('aria-label', 'Unlike');
      likeBtn.setAttribute('title', 'Unlike');
    } else {
      likeBtn.classList.remove('active');
      likeBtn.setAttribute('aria-label', 'Like');
      likeBtn.setAttribute('title', 'Like');
    }
  }

  /**
   * Toggle save state
   */
  toggleSave(cardElement, isSaved) {
    const saveBtn = cardElement.querySelector('.save-btn');
    if (!saveBtn) return;

    if (isSaved) {
      saveBtn.classList.add('active');
      saveBtn.setAttribute('aria-label', 'Remove from list');
      saveBtn.setAttribute('title', 'Remove from list');
      saveBtn.querySelector('svg').innerHTML = '<path d="M19 13H5v-2h14v2z"/>';
    } else {
      saveBtn.classList.remove('active');
      saveBtn.setAttribute('aria-label', 'Add to list');
      saveBtn.setAttribute('title', 'Add to list');
      saveBtn.querySelector('svg').innerHTML = '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>';
    }
  }
}

// Initialize global video card enhancer
window.videoCardEnhancer = new VideoCardEnhancer();

// Expose utility functions
window.enhanceVideoCard = (card, data) => window.videoCardEnhancer.enhanceCard(card, data);
window.enhanceVideoCards = (cards, dataArray) => window.videoCardEnhancer.enhanceCards(cards, dataArray);
