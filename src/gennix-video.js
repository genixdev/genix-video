/* gennix-video — 0.1.0. No runtime dependencies. All rights reserved. */
(() => {
  'use strict';
  if (customElements.get('gennix-video')) return;

  const texts = {
    playlabel: 'Play', loadinglabel: 'Loading video…',
    errorlabel: 'Unable to load the video.', retrylabel: 'Retry',
    fullscreenlabel: 'Full screen', exitfullscreenlabel: 'Exit full screen',
    blockedlabel: 'Press Play to start the video.',
    fullscreenerrorlabel: 'The browser did not allow full screen.'
  };
  function language(value) {
    const normalized = (value || '').trim().replaceAll('_', '-').toLowerCase();
    return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(normalized) ? normalized : '';
  }
  // Read only the requested site cookie. Never write cookies or poll for changes.
  function cookieLanguage(name) {
    if (!name) return '';
    try {
      const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
      return cookie ? language(decodeURIComponent(cookie.slice(name.length + 1))) : '';
    } catch { return ''; }
  }

  let youtubeAPI;
  const instances = new Set();

  function booleanAttribute(node, name, fallback = false) {
    if (!node.hasAttribute(name)) return fallback;
    const value = node.getAttribute(name).trim().toLowerCase();
    if (value === '' || value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
  }

  function seconds(value) {
    if (/^\d+$/.test(value)) {
      const number = Number(value);
      if (Number.isSafeInteger(number)) return number;
    }
    const time = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
    if (value && time) {
      const number = Number(time[1] || 0) * 3600 + Number(time[2] || 0) * 60 + Number(time[3] || 0);
      if (Number.isSafeInteger(number)) return number;
    }
    throw new Error('Start must be a time such as 15 or 1m30s.');
  }

  function youtubeSource(source) {
    if (/^[a-zA-Z0-9_-]{11}$/.test(source)) return { id: source, time: null };
    let url;
    try { url = new URL(source); }
    catch { throw new Error('Provide a YouTube ID or a complete URL.'); }
    const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
    if (!['http:', 'https:'].includes(url.protocol) || !hosts.includes(url.hostname) || url.port || url.username || url.password) {
      throw new Error('The URL does not use a supported YouTube host.');
    }
    let id;
    if (url.hostname.endsWith('youtu.be')) id = /^\/([a-zA-Z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
    else if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = /^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error('Invalid YouTube ID or URL format.');
    return { id, time: url.searchParams.get('start') ?? url.searchParams.get('t') ?? new URLSearchParams(url.hash.slice(1)).get('t') };
  }

  // Share one API promise without replacing another integration's global callback.
  // Stop polling when YT.Player becomes available or the API fails to load.
  function loadYouTubeAPI() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeAPI) return youtubeAPI;
    youtubeAPI = new Promise((resolve, reject) => {
      let script = Array.from(document.scripts).find((item) =>
        /^https:\/\/www\.youtube\.com\/(iframe_api|player_api)(?:[?#]|$)/.test(item.src));
      const owned = !script;
      let settled = false;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
      }
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        clearTimeout(timeout);
        script.removeEventListener('error', failed);
        if (error) {
          if (owned) script.remove();
          reject(error);
        } else resolve(window.YT);
      };
      const failed = () => finish(new Error('Unable to load the YouTube API. Check your connection and retry.'));
      const poll = setInterval(() => {
        if (window.YT?.Player) finish();
      }, 50);
      const timeout = setTimeout(() => finish(new Error('Timed out waiting for the YouTube API. You can retry.')), 20000);
      script.addEventListener('error', failed, { once: true });
      if (owned) document.head.append(script);
    }).catch((error) => {
      youtubeAPI = undefined;
      throw error;
    });
    return youtubeAPI;
  }

  function safeURL(value) {
    const url = new URL(value, document.baseURI);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Resource URLs must use HTTP or HTTPS.');
    }
    return url.href;
  }

  function ratioOf(value) {
    const match = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(value || '16/9');
    const ratio = match ? Number(match[1]) / Number(match[2]) : NaN;
    if (!Number.isFinite(ratio) || ratio <= 0) {
      throw new Error('Aspect ratio must use a format such as 16/9.');
    }
    return ratio;
  }

  function element(tag, className) {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }

  function aborted() {
    return new DOMException('The playback request was cancelled.', 'AbortError');
  }

  class GennixVideo extends HTMLElement {
    static get observedAttributes() { return ['size', 'width', 'height', 'max-height', 'viewport-offset', 'aspect-ratio', 'lang', 'lang-cookie', ...Object.keys(texts)]; }

    get state() { return this._state || 'idle'; }

    attributeChangedCallback(name) {
      if (!this._stage) return;
      if (name === 'lang' || name === 'lang-cookie' || name in texts) { this.refreshLanguage(); return; }
      try { this._configureLayout(); }
      catch (error) { this._fail(error, 'configuration'); }
    }

    // Regional text falls back to its base language, then the attribute and English.
    _text(key) {
      const lang = this._language || '';
      const regional = lang && this.getAttribute(key + '-' + lang);
      const base = lang && this.getAttribute(key + '-' + lang.split('-')[0]);
      return regional || base || this.getAttribute(key) || texts[key];
    }

    // Refresh labels in place: never reload media or change playback state.
    refreshLanguage() {
      this._language = language(this.getAttribute('lang')) || (this.hasAttribute('lang-cookie')
        ? cookieLanguage(this.getAttribute('lang-cookie').trim()) : language(document.documentElement.lang));
      if (!this._button || !this._status || !this._fullscreenButton) return;
      this._renderTexts();
      this._updateFullscreen();
    }

    _renderTexts() {
      const label = this._text(this.state === 'error' ? 'retrylabel' : 'playlabel');
      if (!this._customButton) this._label.textContent = label;
      this._button.setAttribute('aria-label', this._customButton ? this._customLabel : label);
      const message = this._messageKey ? this._text(this._messageKey) : '';
      this._status.textContent = message;
      this._status.hidden = !message;
    }

    _configureLayout() {
      const size = this.getAttribute('size');
      if (size && !['fullwidth', 'custom', 'viewport'].includes(size)) {
        throw new Error('Size must be fullwidth, custom or viewport.');
      }
      const values = [];
      for (const name of ['width', 'height', 'viewport-offset']) {
        const value = this.getAttribute(name)?.trim();
        let length = null;
        if (value != null) {
          if (name === 'height' && value === 'auto') length = 'auto';
          else if (name === 'width' && /^\d+(?:\.\d+)?%$/.test(value) && parseFloat(value) > 0 && parseFloat(value) <= 100) length = value;
          else if (/^\d+(?:\.\d+)?(?:px)?$/.test(value) && Number.isFinite(parseFloat(value)) && (name === 'viewport-offset' ? parseFloat(value) >= 0 : parseFloat(value) > 0)) length = parseFloat(value) + 'px';
          else throw new Error(name + ': provide a valid pixel value' + (name === 'width' ? ' or a percentage greater than 0 and no greater than 100.' : name === 'height' ? ' or auto.' : ' (zero or greater).'));
        }
        values.push([name, length]);
      }
      const ratio = ratioOf(this.getAttribute('aspect-ratio'));
      const maximum = this.getAttribute('max-height')?.trim();
      let maxLength = null;
      if (maximum != null) {
        const match = /^(\d+(?:\.\d+)?)(px|vh|dvh|svh)?$/.exec(maximum);
        if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) <= 0) {
          throw new Error('max-height: provide a positive pixel value or a height such as 80dvh, 80svh or 80vh.');
        }
        const unit = match[2] || 'px';
        maxLength = match[1] + (CSS.supports('height', '1' + unit) ? unit : 'vh');
      }
      values.push(['max-height', maxLength]);
      for (const [name, length] of values) {
        if (length === null) this.style.removeProperty('--gv-attr-' + name);
        else this.style.setProperty('--gv-attr-' + name, length);
      }
      this.style.setProperty('--gv-container-ratio', ratio);
      // Resizing must not overwrite the native aspect ratio read from metadata.
      this.style.setProperty('--gv-ratio', this._video?.videoWidth
        ? this._video.videoWidth / this._video.videoHeight : ratio);
    }

    connectedCallback() {
      if (this._stage) {
        try { this._configure(); }
        catch (error) { this._fail(error, 'configuration'); }
        this._connect();
        return;
      }
      this._generation = 0;
      this._background = element('div', 'gv-background');
      this._background.setAttribute('aria-hidden', 'true');
      this._poster = element('img', 'gv-poster');
      this._poster.alt = '';
      this._poster.decoding = 'async';
      this._poster.hidden = true;
      this._poster.addEventListener('error', () => { this._poster.hidden = true; });
      this._stage = element('div', 'gv-stage');
      this._button = this.querySelector('button[data-gv-play]');
      this._customButton = Boolean(this._button);
      this._button = this._button || element('button', 'gv-play');
      this._button.classList.add('gv-play');
      this._button.type = 'button';
      this._customLabel = this._button.getAttribute('aria-label') || this._button.textContent.trim() || 'Play';
      if (!this._customButton) {
        this._icon = element('span', 'gv-play-icon');
        this._icon.setAttribute('aria-hidden', 'true');
        this._label = element('span', 'gv-play-text');
        this._button.append(this._icon, this._label);
      }
      this._status = element('p', 'gv-status');
      this._status.setAttribute('role', 'status');
      this._status.setAttribute('aria-live', 'polite');
      // Handle UI-triggered rejections here; public callers handle their own promises.
      this._button.addEventListener('click', () => {
        if (this.state !== 'loading') this.play().catch(() => {});
      });
      this.addEventListener('click', (event) => {
        if (this._posterClick && this.state === 'idle' && [this, this._poster, this._stage, this._background].includes(event.target)) {
          this.play().catch(() => {});
        }
      });
      this._toolbar = element('div', 'gv-toolbar');
      this._fullscreenButton = element('button', 'gv-fullscreen');
      this._fullscreenButton.type = 'button';
      this._fullscreenButton.addEventListener('click', () => {
        const action = document.fullscreenElement === this ? document.exitFullscreen() : this.requestFullscreen();
        Promise.resolve(action).catch(() => {
          this._messageKey = 'fullscreenerrorlabel';
          this._renderTexts();
        });
      });
      this._toolbar.append(this._fullscreenButton);
      this._closeButton = element('button', 'gv-close');
      this._closeButton.type = 'button';
      this._closeButton.textContent = '×';
      this._closeButton.setAttribute('aria-label', 'Close video');
      this._closeButton.addEventListener('click', () => this.reset());
      this.append(this._background, this._poster, this._stage, this._status, this._toolbar, this._closeButton);
      if (!this._customButton) this.append(this._button);
      this._setState('idle');
      try { this._configure(); }
      catch (error) { this._fail(error, 'configuration'); }
      this._connect();
    }

    _connect() {
      instances.add(this);
      this._connectionEvents?.abort();
      this._connectionEvents = new AbortController();
      document.addEventListener('fullscreenchange', () => this._updateFullscreen(), { signal: this._connectionEvents.signal });
      this._updateFullscreen();
      const generation = this._generation;
      queueMicrotask(() => {
        if (!this.isConnected || generation !== this._generation || this.state !== 'idle') return;
        if (this._autoplay) this.play().catch(() => {});
        else if (!this._showPlay && !this._customButton) this._prepare();
      });
    }

    _updateFullscreen() {
      const wasFullscreen = this._inFullscreen;
      this._inFullscreen = document.fullscreenElement === this;
      this._fullscreenButton.textContent = this._text(this._inFullscreen ? 'exitfullscreenlabel' : 'fullscreenlabel');
      this._fullscreenButton.disabled = !document.fullscreenEnabled;
      if (wasFullscreen && !this._inFullscreen && this.isConnected) this._fullscreenButton.focus({ preventScroll: true });
    }

    requestFullscreen(options) {
      if (!this.isConnected || !HTMLElement.prototype.requestFullscreen) {
        return Promise.reject(new DOMException('Full screen is unavailable.', 'NotSupportedError'));
      }
      return HTMLElement.prototype.requestFullscreen.call(this, options);
    }

    disconnectedCallback() {
      instances.delete(this);
      this._connectionEvents?.abort();
      this._release(aborted());
      if (this._stage) this._setState('idle');
    }

    _configure() {
      this.refreshLanguage();
      this._provider = this.getAttribute('provider') || 'youtube';
      this._src = this.getAttribute('src') || '';
      if (!['youtube', 'native'].includes(this._provider)) throw new Error('Invalid video provider.');
      let urlTime = null;
      if (this._provider === 'youtube') {
        const source = youtubeSource(this._src.trim());
        this._src = source.id;
        urlTime = source.time;
      }
      if (this._provider === 'native') {
        if (!this._src) throw new Error('Missing video source.');
        this._src = safeURL(this._src);
      }
      this._configureLayout();
      this._start = seconds(this.getAttribute('start') ?? urlTime ?? '0');
      this._controls = booleanAttribute(this, 'controls', true);
      this._muted = booleanAttribute(this, 'muted');
      this._loop = booleanAttribute(this, 'loop');
      this._autoplay = booleanAttribute(this, 'autoplay');
      this._posterClick = booleanAttribute(this, 'poster-click');
      this._pauseOthers = booleanAttribute(this, 'pause-others');
      this._showPlay = booleanAttribute(this, 'play-button', true);
      this._playsInline = booleanAttribute(this, 'playsinline', true);
      this._preload = this.getAttribute('preload') || 'none';
      if (!['none', 'metadata', 'auto'].includes(this._preload)) throw new Error('preload must be none, metadata or auto.');
      this._onEnd = this.getAttribute('on-end') || 'keep';
      if (!['keep', 'poster'].includes(this._onEnd)) throw new Error('on-end must be keep or poster.');
      if (this.querySelector('[data-gv-play]') && !this._customButton) throw new Error('data-gv-play must be placed on an HTML button.');
      if (!this._showPlay && !this._customButton && !this._controls) {
        throw new Error('With play-button="false", keep controls="true" to provide accessible playback.');
      }
      const content = this.getAttribute('play-content') || 'both';
      if (!['both', 'text', 'icon'].includes(content)) throw new Error('play-content must be both, text or icon.');
      if (!this._customButton) {
        this._icon.hidden = content === 'text';
        this._label.hidden = content === 'icon';
      }
      for (const name of ['button-background', 'button-color', 'button-hover-background', 'button-hover-color', 'button-focus-background', 'button-focus-color']) {
        const color = this.getAttribute(name);
        if (color !== null && !CSS.supports('color', color)) throw new Error(name + ' must be a valid color, such as #ffffff.');
        if (color === null) this.style.removeProperty('--gv-attr-' + name);
        else this.style.setProperty('--gv-attr-' + name, color);
      }
      const radius = this.getAttribute('button-radius');
      if (radius !== null && !/^\d+(?:\.\d+)?$/.test(radius)) throw new Error('button-radius must be a non-negative pixel number.');
      if (radius === null) this.style.removeProperty('--gv-attr-button-radius');
      else this.style.setProperty('--gv-attr-button-radius', radius + 'px');
      const fullscreen = booleanAttribute(this, 'fullscreen');
      this._toolbar.hidden = !fullscreen;
      this.toggleAttribute('data-gv-fullscreen', fullscreen);
      this._updateFullscreen();
      const poster = this.getAttribute('poster') || (this._provider === 'youtube'
        ? 'https://i.ytimg.com/vi/' + this._src + '/hqdefault.jpg' : '');
      if (poster) {
        const url = safeURL(poster);
        if (this._poster.src !== url) this._poster.src = url;
        this._poster.hidden = false;
        this._background.style.backgroundImage = 'url(' + JSON.stringify(url) + ')';
      } else {
        this._poster.removeAttribute('src');
        this._poster.hidden = true;
        this._background.style.backgroundImage = '';
      }
      this._setState(this.state, this._messageKey);
    }

    _emit(name, extra = {}) {
      this.dispatchEvent(new CustomEvent('gennix:' + name, {
        bubbles: true,
        detail: { state: this.state, provider: this._provider, src: this._src, ...extra }
      }));
    }

    _setState(state, message = '') {
      const previousState = this._state;
      this._state = state;
      this.dataset.gvState = state;
      const showClose = booleanAttribute(this, 'close-button', true) && state !== 'idle' && state !== 'error';
      this._closeButton.hidden = !showClose;
      this.toggleAttribute('data-gv-close', showClose);
      this.setAttribute('aria-busy', String(state === 'loading'));
      // Keep focus while loading; play() reuses the pending request.
      this._button.setAttribute('aria-disabled', String(state === 'loading'));
      const manualButton = this._manualPlayRequired && !this._controls;
      this._button.hidden = state !== 'error' && !manualButton && (this._playerReady || (!this._customButton && this._showPlay === false) || !['idle', 'loading'].includes(state));
      this._messageKey = message;
      this._renderTexts();
      if (previousState !== undefined && previousState !== state) {
        this._emit('statechange', { previousState });
      }
    }

    _settlePlay(error) {
      const pending = this._pendingPlay;
      this._pendingPlay = null;
      if (pending) error ? pending.reject(error) : pending.resolve();
    }

    _release(error = aborted()) {
      // Invalidate first: destroy/pause/load may trigger callbacks from the old player.
      this._generation++;
      this._settlePlay(error);
      this._mediaEvents?.abort();
      this._mediaEvents = null;
      const youtube = this._youtube;
      const video = this._video;
      this._youtube = null;
      this._video = null;
      this._playerReady = false;
      this._loadingPlayer = false;
      this._wasPlaying = false;
      this._manualPlayRequired = false;
      this.removeAttribute('data-gv-active');
      try { youtube?.destroy(); }
      finally {
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        this._stage?.replaceChildren();
      }
    }

    _fail(error, code = 'load') {
      if (!this.isConnected || this.state === 'error') return;
      const transferFocus = this.contains(document.activeElement);
      this._error = error;
      this._release(error);
      const generation = this._generation;
      this._setState('error', 'errorlabel');
      if (generation !== this._generation || this.state !== 'error') return;
      if (transferFocus) this._button.focus({ preventScroll: true });
      this._emit('error', { error: { name: error.name, message: error.message, code } });
    }

    _ready(player) {
      if (this._playerReady) return;
      const generation = this._generation;
      const transferFocus = document.activeElement === this._button;
      this._playerReady = true;
      this._loadingPlayer = false;
      this.setAttribute('data-gv-active', '');
      this._setState('ready', this._manualPlayRequired ? 'blockedlabel' : '');
      if (generation !== this._generation) return;
      if (transferFocus) player.focus({ preventScroll: true });
      this._emit('ready');
    }

    _playing() {
      const generation = this._generation;
      const emit = !this._wasPlaying;
      this._wasPlaying = true;
      this._settlePlay();
      this._setState('playing');
      if (this._pauseOthers && generation === this._generation && this.state === 'playing') {
        for (const other of instances) if (other !== this) other.pause();
      }
      if (emit && generation === this._generation && this.state === 'playing') this._emit('play');
    }

    _stopped(state) {
      if (this.state === state) return;
      const generation = this._generation;
      this._wasPlaying = false;
      this._settlePlay(aborted());
      this._setState(state);
      if (generation === this._generation && this.state === state) {
        this._emit(state === 'paused' ? 'pause' : 'ended');
      }
      if (state === 'ended' && this._onEnd === 'poster' && generation === this._generation) this.reset();
    }

    _blocked(error) {
      // A browser playback policy rejection does not mean the media file is broken.
      this._settlePlay(error);
      this._wasPlaying = false;
      this._manualPlayRequired = true;
      this._setState(this._playerReady ? 'ready' : 'loading', this._playerReady
        ? 'blockedlabel' : 'loadinglabel');
    }

    play() {
      if (!this.isConnected || !this._stage) {
        return Promise.reject(new DOMException('Connect the element to the document before playing.', 'InvalidStateError'));
      }
      if (this._pendingPlay) return this._pendingPlay.promise;
      if (this.state === 'playing') return Promise.resolve();
      if (this.state === 'error') this.reset();
      const promise = new Promise((resolve, reject) => {
        this._pendingPlay = { resolve, reject };
      });
      this._pendingPlay.promise = promise;
      if (this._playerReady) {
        this._requestPlay(this._generation);
      } else if (this._loadingPlayer) {
        if (this._video) this._requestPlay(this._generation);
      } else this._prepare();
      return promise;
    }

    _prepare() {
      const generation = ++this._generation;
      try {
        this._configure();
        this._loadingPlayer = true;
        this._setState('loading', 'loadinglabel');
        if (generation === this._generation) this._load(generation);
      } catch (error) { this._fail(error, 'configuration'); }
    }

    pause() {
      if (!this._stage || this.state === 'idle' || this.state === 'error') return;
      if (!this._playerReady) {
        this.reset();
        return;
      }
      this._settlePlay(aborted());
      if (this._video) this._video.pause();
      else this._youtube?.pauseVideo();
      // Only a confirmed player event changes the state, not the requested action.
    }

    reset() {
      if (!this._stage) return;
      const restoreFocus = this.contains(document.activeElement);
      this._release();
      this._error = null;
      this._setState('idle');
      // Reset always leaves an accessible manual action, even with play-button disabled.
      this._button.hidden = false;
      if (restoreFocus && this.isConnected && this.state === 'idle') {
        this._button.focus({ preventScroll: true });
      }
    }

    _requestPlay(generation) {
      const current = () => this.isConnected && generation === this._generation;
      if (!current() || !this._pendingPlay) return;
      this._manualPlayRequired = false;
      try {
        if (this._video) {
          this._video.play().catch((error) => {
            if (!current() || !this._pendingPlay) return;
            if (error.name === 'NotAllowedError') {
              this._blocked(error);
              // Load data so native controls remain usable after playback is blocked.
              this._video.preload = 'auto';
              this._video.load();
            } else if (error.name === 'AbortError') this._settlePlay(error);
            else this._fail(error, 'native-play');
          });
        } else this._youtube.playVideo();
      } catch (error) {
        if (current()) this._fail(error, 'play');
      }
    }

    async _load(generation) {
      const current = () => this.isConnected && generation === this._generation;
      try {
        if (this._provider === 'native') {
          const video = element('video', 'gv-player');
          this._video = video;
          this._mediaEvents = new AbortController();
          const listen = (name, handler) => video.addEventListener(name, () => {
            if (current()) handler();
          }, { signal: this._mediaEvents.signal });
          video.controls = this._controls;
          video.muted = this._muted;
          video.defaultMuted = this._muted;
          video.loop = this._loop;
          video.playsInline = this._playsInline;
          video.preload = this._pendingPlay ? this._preload : 'auto';
          video.tabIndex = 0;
          video.setAttribute('aria-label', this.getAttribute('aria-label') || 'Video player');
          listen('loadedmetadata', () => {
            if (video.videoWidth && video.videoHeight) {
              this.style.setProperty('--gv-ratio', video.videoWidth / video.videoHeight);
            }
            if (this._start) {
              if (Number.isFinite(video.duration) && this._start >= video.duration) {
                this._fail(new Error('Start must be less than the video duration.'), 'start');
              } else video.currentTime = this._start;
            }
          });
          listen('loadeddata', () => this._ready(video));
          listen('playing', () => {
            this._ready(video);
            if (current()) this._playing();
          });
          listen('pause', () => { if (!video.ended) this._stopped('paused'); });
          listen('ended', () => { if (!this._loop) this._stopped('ended'); });
          listen('waiting', () => {
            if (this._playerReady && !video.paused) this._setState('loading', 'loadinglabel');
          });
          listen('error', () => this._fail(
            new Error('Unable to load the video. Check its URL, connection and format.'),
            video.error?.code || 'native-load'));
          video.src = this._src;
          this._stage.append(video);
          if (this._pendingPlay) this._requestPlay(generation);
          else video.load();
          return;
        }

        const YT = await loadYouTubeAPI();
        if (!current()) return;
        const iframe = element('iframe', 'gv-player');
        iframe.title = this.getAttribute('aria-label') || 'YouTube player';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        const url = new URL('https://www.youtube-nocookie.com/embed/' + this._src);
        url.search = new URLSearchParams({ enablejsapi: '1', origin: location.origin, playsinline: this._playsInline ? '1' : '0', controls: this._controls ? '1' : '0', start: String(this._start), loop: this._loop ? '1' : '0' });
        if (this._loop) url.searchParams.set('playlist', this._src);
        iframe.src = url.href;
        this._stage.append(iframe);
        this._youtube = new YT.Player(iframe, {
          events: {
            onReady: (event) => {
              if (!current()) return;
              if (this._muted) event.target.mute();
              this._ready(iframe);
              this._requestPlay(generation);
            },
            onStateChange: (event) => {
              if (!current()) return;
              switch (event.data) {
                case YT.PlayerState.PLAYING: this._playing(); break;
                case YT.PlayerState.PAUSED: this._stopped('paused'); break;
                case YT.PlayerState.ENDED: if (!this._loop) this._stopped('ended'); break;
                case YT.PlayerState.BUFFERING:
                  if (this._playerReady) this._setState('loading', 'loadinglabel');
                  break;
              }
            },
            onAutoplayBlocked: () => {
              if (current()) this._blocked(new DOMException(
                'The browser requires pressing Play in the video controls.', 'NotAllowedError'));
            },
            onError: (event) => {
              if (current()) this._fail(new Error(
                'YouTube could not play the video (code ' + event.data + '). You can retry.'),
              event.data);
            }
          }
        });
      } catch (error) {
        if (current()) this._fail(error);
      }
    }
  }

  customElements.define('gennix-video', GennixVideo);
})();

