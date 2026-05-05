/**
 * Enhanced Player Controls
 * Custom video controls, keyboard shortcuts, and mobile gestures
 */

class EnhancedPlayer {
  constructor(videoElement) {
    this.video = videoElement;
    this.container = videoElement.parentElement;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 1;
    this.currentTime = 0;
    this.duration = 0;
    this.isFullscreen = false;
    this.isMiniPlayer = false;
    this.controlsTimeout = null;

    this.init();
  }

  /**
   * Initialize enhanced player
   */
  init() {
    this.createCustomControls();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
    this.setupTouchGestures();
    this.setupGestureIndicators();
  }

  /**
   * Create custom controls UI
   */
  createCustomControls() {
    const controls = document.createElement('div');
    controls.className = 'custom-controls';
    controls.innerHTML = `
      <div class="progress-container">
        <div class="buffered-progress"></div>
        <div class="progress-bar"></div>
        <div class="time-tooltip">0:00</div>
      </div>
      <div class="controls-row">
        <div class="controls-left">
          <button class="control-btn play-pause" aria-label="Play">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <div class="volume-control">
            <button class="control-btn volume-btn" aria-label="Mute">
              <svg viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
            <div class="volume-slider-container">
              <div class="volume-slider">
                <div class="volume-slider-fill" style="width: 100%"></div>
              </div>
            </div>
          </div>
          <div class="time-display">
            <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
          </div>
        </div>
        <div class="controls-right">
          <button class="control-btn settings-btn" aria-label="Settings">
            <svg viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
          <button class="control-btn pip-button" aria-label="Picture in Picture">
            <svg viewBox="0 0 24 24">
              <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
            </svg>
          </button>
          <button class="control-btn fullscreen-btn" aria-label="Fullscreen">
            <svg viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="settings-menu">
        <div class="settings-item" data-setting="quality">
          <span>Quality</span>
          <span>Auto</span>
        </div>
        <div class="settings-item" data-setting="speed">
          <span>Speed</span>
          <span>1x</span>
        </div>
      </div>
    `;

    this.container.appendChild(controls);
    this.controls = controls;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Play/Pause
    const playPauseBtn = this.controls.querySelector('.play-pause');
    playPauseBtn.addEventListener('click', () => this.togglePlay());

    // Video click to play/pause
    this.video.addEventListener('click', () => this.togglePlay());

    // Progress bar
    const progressContainer = this.controls.querySelector('.progress-container');
    progressContainer.addEventListener('click', (e) => this.seek(e));
    progressContainer.addEventListener('mousemove', (e) => this.updateTimeTooltip(e));

    // Volume
    const volumeBtn = this.controls.querySelector('.volume-btn');
    volumeBtn.addEventListener('click', () => this.toggleMute());

    const volumeSlider = this.controls.querySelector('.volume-slider');
    volumeSlider.addEventListener('click', (e) => this.setVolume(e));

    // Fullscreen
    const fullscreenBtn = this.controls.querySelector('.fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

    // Settings
    const settingsBtn = this.controls.querySelector('.settings-btn');
    const settingsMenu = this.controls.querySelector('.settings-menu');
    settingsBtn.addEventListener('click', () => {
      settingsMenu.classList.toggle('active');
    });

    // PiP
    const pipBtn = this.controls.querySelector('.pip-button');
    if (document.pictureInPictureEnabled) {
      pipBtn.addEventListener('click', () => this.togglePiP());
    } else {
      pipBtn.style.display = 'none';
    }

    // Video events
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('loadedmetadata', () => this.updateDuration());
    this.video.addEventListener('play', () => this.onPlay());
    this.video.addEventListener('pause', () => this.onPause());
    this.video.addEventListener('volumechange', () => this.onVolumeChange());

    // Auto-hide controls
    this.container.addEventListener('mousemove', () => this.showControls());
    this.container.addEventListener('mouseleave', () => this.hideControls());

    // Close settings menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
        settingsMenu.classList.remove('active');
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          this.skip(-10);
          this.showGestureIndicator('rewind', '-10s');
          break;
        case 'arrowright':
          e.preventDefault();
          this.skip(10);
          this.showGestureIndicator('forward', '+10s');
          break;
        case 'arrowup':
          e.preventDefault();
          this.adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          this.adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case '?':
          e.preventDefault();
          this.showKeyboardShortcuts();
          break;
        case 'escape':
          this.hideKeyboardShortcuts();
          break;
      }
    });
  }

  /**
   * Setup touch gestures for mobile
   */
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = this.video.currentTime;
    });

    this.container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Horizontal swipe for seeking
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const seekAmount = (deltaX / this.container.offsetWidth) * 30;
        this.skip(seekAmount);
        this.showGestureIndicator(
          seekAmount > 0 ? 'forward' : 'rewind',
          `${seekAmount > 0 ? '+' : ''}${Math.round(seekAmount)}s`
        );
      }

      // Vertical swipe for volume
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        const volumeChange = -(deltaY / this.container.offsetHeight);
        this.adjustVolume(volumeChange);
      }

      // Double tap to play/pause
      const now = Date.now();
      if (now - (this.lastTap || 0) < 300) {
        this.togglePlay();
      }
      this.lastTap = now;
    });
  }

  /**
   * Setup gesture indicators
   */
  setupGestureIndicators() {
    const indicator = document.createElement('div');
    indicator.className = 'gesture-indicator';
    indicator.innerHTML = `
      <svg viewBox="0 0 24 24"></svg>
      <span class="gesture-indicator-text"></span>
    `;
    this.container.appendChild(indicator);
    this.gestureIndicator = indicator;
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  /**
   * On play event
   */
  onPlay() {
    this.isPlaying = true;
    const playPauseBtn = this.controls.querySelector('.play-pause');
    playPauseBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
      </svg>
    `;
    playPauseBtn.setAttribute('aria-label', 'Pause');
  }

  /**
   * On pause event
   */
  onPause() {
    this.isPlaying = false;
    const playPauseBtn = this.controls.querySelector('.play-pause');
    playPauseBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
    playPauseBtn.setAttribute('aria-label', 'Play');
  }

  /**
   * Seek to position
   */
  seek(e) {
    const progressContainer = this.controls.querySelector('.progress-container');
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    this.video.currentTime = pos * this.video.duration;
  }

  /**
   * Skip forward/backward
   */
  skip(seconds) {
    this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    const progress = (this.video.currentTime / this.video.duration) * 100;
    const progressBar = this.controls.querySelector('.progress-bar');
    progressBar.style.width = `${progress}%`;

    // Update time display
    const currentTimeEl = this.controls.querySelector('.current-time');
    currentTimeEl.textContent = this.formatTime(this.video.currentTime);
  }

  /**
   * Update duration
   */
  updateDuration() {
    const totalTimeEl = this.controls.querySelector('.total-time');
    totalTimeEl.textContent = this.formatTime(this.video.duration);
  }

  /**
   * Update time tooltip
   */
  updateTimeTooltip(e) {
    const progressContainer = this.controls.querySelector('.progress-container');
    const tooltip = this.controls.querySelector('.time-tooltip');
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * this.video.duration;

    tooltip.textContent = this.formatTime(time);
    tooltip.style.left = `${pos * 100}%`;
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.video.muted = !this.video.muted;
  }

  /**
   * Set volume
   */
  setVolume(e) {
    const volumeSlider = this.controls.querySelector('.volume-slider');
    const rect = volumeSlider.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    this.video.volume = Math.max(0, Math.min(1, pos));
  }

  /**
   * Adjust volume
   */
  adjustVolume(delta) {
    this.video.volume = Math.max(0, Math.min(1, this.video.volume + delta));
    this.video.muted = false;
  }

  /**
   * On volume change
   */
  onVolumeChange() {
    const volumeFill = this.controls.querySelector('.volume-slider-fill');
    volumeFill.style.width = `${this.video.volume * 100}%`;

    const volumeBtn = this.controls.querySelector('.volume-btn');
    if (this.video.muted || this.video.volume === 0) {
      volumeBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
    } else {
      volumeBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      `;
    }
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Toggle Picture-in-Picture
   */
  async togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }

  /**
   * Show controls
   */
  showControls() {
    this.controls.classList.add('visible');
    clearTimeout(this.controlsTimeout);

    if (this.isPlaying) {
      this.controlsTimeout = setTimeout(() => {
        this.hideControls();
      }, 3000);
    }
  }

  /**
   * Hide controls
   */
  hideControls() {
    if (this.isPlaying) {
      this.controls.classList.remove('visible');
    }
  }

  /**
   * Show gesture indicator
   */
  showGestureIndicator(type, text) {
    const icons = {
      rewind: '<path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>',
      forward: '<path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>',
      volume: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>'
    };

    this.gestureIndicator.querySelector('svg').innerHTML = icons[type] || '';
    this.gestureIndicator.querySelector('.gesture-indicator-text').textContent = text;
    this.gestureIndicator.classList.add('active');

    setTimeout(() => {
      this.gestureIndicator.classList.remove('active');
    }, 800);
  }

  /**
   * Show keyboard shortcuts overlay
   */
  showKeyboardShortcuts() {
    let overlay = document.getElementById('keyboardShortcutsOverlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'keyboardShortcutsOverlay';
      overlay.className = 'keyboard-shortcuts-overlay';
      overlay.innerHTML = `
        <div class="shortcuts-panel">
          <h2>Keyboard Shortcuts</h2>
          <div class="shortcuts-grid">
            <div class="shortcut-item">
              <span class="shortcut-description">Play/Pause</span>
              <span class="shortcut-key">Space / K</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Seek backward 10s</span>
              <span class="shortcut-key">←</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Seek forward 10s</span>
              <span class="shortcut-key">→</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Volume up</span>
              <span class="shortcut-key">↑</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Volume down</span>
              <span class="shortcut-key">↓</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Mute/Unmute</span>
              <span class="shortcut-key">M</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Fullscreen</span>
              <span class="shortcut-key">F</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-description">Show shortcuts</span>
              <span class="shortcut-key">?</span>
            </div>
          </div>
          <button class="btn btn-secondary" style="margin-top: 1.5rem; width: 100%;" onclick="document.getElementById('keyboardShortcutsOverlay').classList.remove('active')">Close</button>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideKeyboardShortcuts();
        }
      });
    }

    overlay.classList.add('active');
  }

  /**
   * Hide keyboard shortcuts overlay
   */
  hideKeyboardShortcuts() {
    const overlay = document.getElementById('keyboardShortcutsOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Format time in MM:SS or HH:MM:SS
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Initialize enhanced player when video element is ready
window.initEnhancedPlayer = (videoElement) => {
  return new EnhancedPlayer(videoElement);
};
