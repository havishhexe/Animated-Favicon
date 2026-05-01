/**
 * GifFavicon - Animated GIF favicon library
 * @version 1.0.0
 * @requires omggif (https://github.com/deanm/omggif)
 */

(function(global) {
  'use strict';

  class GifFavicon {
    constructor(options = {}) {
      this.frames = [];
      this.gifW = 0;
      this.gifH = 0;
      this.animTimer = null;
      this.currentFrame = 0;
      this.fps = options.fps || 0;
      this.faviconLink = null;
      this.running = false;
      this.autoStart = options.autoStart !== false; // default true

      // Callbacks
      this.onLoad = options.onLoad || null;
      this.onStart = options.onStart || null;
      this.onStop = options.onStop || null;
      this.onError = options.onError || null;

      this.FAVICON_SIZE = 128;
      this.FAVICON_OUTPUT_SIZE = 64;

      this._initCanvases();

      // Auto-load if a GIF source is provided
      if (options.gifFile) {
        this.loadFromFile(options.gifFile);
      } else if (options.gifBase64) {
        this.loadFromBase64(options.gifBase64);
      } else if (options.gifPath) {
        this.load(options.gifPath);
      }
    }

    _initCanvases() {
      // Main favicon canvas
      this.faviconCanvas = document.createElement('canvas');
      this.faviconCanvas.width = this.FAVICON_SIZE;
      this.faviconCanvas.height = this.FAVICON_SIZE;
      this.fCtx = this.faviconCanvas.getContext('2d', {
        alpha: true,
        willReadFrequently: false,
        desynchronized: true
      });
      this.fCtx.imageSmoothingEnabled = true;
      this.fCtx.imageSmoothingQuality = 'high';

      // Output canvas
      this.outputCanvas = document.createElement('canvas');
      this.outputCanvas.width = this.FAVICON_OUTPUT_SIZE;
      this.outputCanvas.height = this.FAVICON_OUTPUT_SIZE;
      this.oCtx = this.outputCanvas.getContext('2d', { alpha: true });
      this.oCtx.imageSmoothingEnabled = true;
      this.oCtx.imageSmoothingQuality = 'high';
    }

    /**
     * Load GIF from URL or path
     * @param {string} path - Path or URL to the GIF file
     * @returns {Promise}
     */
    load(path) {
      if (global.location && global.location.protocol === 'file:' && !this._isInlineGifSource(path)) {
        const err = new Error(
          'Cannot load GIF paths from a file:// page. Use a local server, loadFromFile(file), or loadFromBase64(base64).'
        );
        this._handleError(err.message);
        return Promise.reject(err);
      }

      return fetch(path)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load GIF: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then(buffer => this._parseGif(new Uint8Array(buffer)))
        .then(info => {
          if (this.onLoad) this.onLoad(info);
          if (this.autoStart) this.start();
          return info;
        })
        .catch(err => {
          this._handleError('Load error: ' + err.message);
          throw err;
        });
    }

    _isInlineGifSource(path) {
      return typeof path === 'string' && (
        path.indexOf('data:image/gif;base64,') === 0 ||
        path.indexOf('data:application/octet-stream;base64,') === 0
      );
    }

    /**
     * Load GIF from File object (for file uploads)
     * @param {File} file - File object
     * @returns {Promise}
     */
    loadFromFile(file) {
      return new Promise((resolve, reject) => {
        if (!file.name.toLowerCase().endsWith('.gif') && file.type !== 'image/gif') {
          const err = new Error('Invalid file type. Please provide a .gif file');
          this._handleError(err.message);
          reject(err);
          return;
        }

        const reader = new FileReader();
        reader.onload = e => {
          this._parseGif(new Uint8Array(e.target.result))
            .then(info => {
              if (this.onLoad) this.onLoad(info);
              if (this.autoStart) this.start();
              resolve(info);
            })
            .catch(reject);
        };
        reader.onerror = () => {
          const err = new Error('Failed to read file');
          this._handleError(err.message);
          reject(err);
        };
        reader.readAsArrayBuffer(file);
      });
    }

    /**
     * Load GIF from base64 string
     * @param {string} base64 - Base64 encoded GIF
     * @returns {Promise}
     */
    loadFromBase64(base64) {
      try {
        const b64Data = base64.replace(/^data:image\/gif;base64,/, '');
        const binaryString = atob(b64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return this._parseGif(bytes).then(info => {
          if (this.onLoad) this.onLoad(info);
          if (this.autoStart) this.start();
          return info;
        });
      } catch (err) {
        this._handleError('Base64 decode error: ' + err.message);
        return Promise.reject(err);
      }
    }

    _parseGif(bytes) {
      return new Promise((resolve, reject) => {
        if (typeof GifReader === 'undefined') {
          const err = new Error('omggif library not loaded. Include omggif before gif-favicon.js');
          this._handleError(err.message);
          reject(err);
          return;
        }

        try {
          const gr = new GifReader(bytes);
          this.gifW = gr.width;
          this.gifH = gr.height;
          const count = gr.numFrames();

          if (count === 0) {
            throw new Error('No frames found in GIF');
          }

          this.frames = [];

          const scaleFactor = Math.min(2, Math.max(1, 128 / Math.max(this.gifW, this.gifH)));
          const compositeW = Math.round(this.gifW * scaleFactor);
          const compositeH = Math.round(this.gifH * scaleFactor);

          const offscreen = document.createElement('canvas');
          offscreen.width = compositeW;
          offscreen.height = compositeH;
          const octx = offscreen.getContext('2d', { alpha: true, willReadFrequently: false });
          octx.imageSmoothingEnabled = scaleFactor === 1;
          octx.imageSmoothingQuality = 'high';

          const decodeCanvas = document.createElement('canvas');
          decodeCanvas.width = this.gifW;
          decodeCanvas.height = this.gifH;
          const dctx = decodeCanvas.getContext('2d', { alpha: true });

          let prevPixels = null;

          for (let i = 0; i < count; i++) {
            const info = gr.frameInfo(i);
            const pixels = new Uint8ClampedArray(this.gifW * this.gifH * 4);

            if (info.disposal === 1 && prevPixels) {
              pixels.set(prevPixels);
            } else if (info.disposal === 2) {
              pixels.fill(0);
            } else if (prevPixels) {
              pixels.set(prevPixels);
            }

            gr.decodeAndBlitFrameRGBA(i, pixels);

            const imgData = new ImageData(pixels, this.gifW, this.gifH);
            dctx.putImageData(imgData, 0, 0);

            if (scaleFactor > 1) {
              octx.imageSmoothingEnabled = false;
              octx.clearRect(0, 0, compositeW, compositeH);
              octx.drawImage(decodeCanvas, 0, 0, compositeW, compositeH);
            } else {
              octx.clearRect(0, 0, compositeW, compositeH);
              octx.drawImage(decodeCanvas, 0, 0);
            }

            const snap = document.createElement('canvas');
            snap.width = compositeW;
            snap.height = compositeH;
            const snapCtx = snap.getContext('2d', { alpha: true });
            snapCtx.drawImage(offscreen, 0, 0);

            const frameDelay = Math.max((info.delay || 10) * 10, 16);
            this.frames.push({ canvas: snap, delay: frameDelay });

            if (info.disposal !== 2) {
              prevPixels = new Uint8ClampedArray(pixels);
            } else {
              prevPixels = null;
            }
          }

          const avgDelay = Math.round(this.frames.reduce((s, f) => s + f.delay, 0) / this.frames.length);
          
          resolve({
            frames: count,
            width: this.gifW,
            height: this.gifH,
            averageDelay: avgDelay,
            compositeSize: `${compositeW}×${compositeH}`
          });

        } catch (err) {
          this._handleError('Parse error: ' + err.message);
          reject(err);
        }
      });
    }

    _renderFrame(idx) {
      if (!this.frames[idx]) return;

      const f = this.frames[idx];
      const s = this.FAVICON_SIZE;
      const frameW = f.canvas.width;
      const frameH = f.canvas.height;
      const scale = Math.min(s / frameW, s / frameH);
      const scaledW = Math.round(frameW * scale);
      const scaledH = Math.round(frameH * scale);
      const dx = Math.round((s - scaledW) / 2);
      const dy = Math.round((s - scaledH) / 2);

      this.fCtx.clearRect(0, 0, s, s);
      this.fCtx.imageSmoothingEnabled = true;
      this.fCtx.imageSmoothingQuality = 'high';
      this.fCtx.drawImage(f.canvas, dx, dy, scaledW, scaledH);
    }

    _ensureFaviconLink() {
      this.faviconLink = document.querySelector('link[rel="icon"]') ||
                         document.querySelector('link[rel="shortcut icon"]');
      
      if (!this.faviconLink) {
        this.faviconLink = document.createElement('link');
        this.faviconLink.rel = 'icon';
        this.faviconLink.type = 'image/png';
        document.head.appendChild(this.faviconLink);
      } else {
        this.faviconLink.type = 'image/png';
      }
    }

    /**
     * Start animating the favicon
     */
    start() {
      if (!this.frames.length) {
        this._handleError('No GIF loaded. Call load() first.');
        return this;
      }

      this._ensureFaviconLink();
      this.stop();
      this.running = true;
      this.currentFrame = 0;

      const tick = () => {
        this._renderFrame(this.currentFrame);

        this.oCtx.clearRect(0, 0, this.FAVICON_OUTPUT_SIZE, this.FAVICON_OUTPUT_SIZE);
        this.oCtx.drawImage(this.faviconCanvas, 0, 0, this.FAVICON_OUTPUT_SIZE, this.FAVICON_OUTPUT_SIZE);
        this.faviconLink.href = this.outputCanvas.toDataURL('image/png');

        const delay = this.fps > 0 ? (1000 / this.fps) : this.frames[this.currentFrame].delay;
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        this.animTimer = setTimeout(tick, delay);
      };

      tick();

      if (this.onStart) this.onStart();
      return this;
    }

    /**
     * Stop the animation
     */
    stop() {
      if (this.animTimer) {
        clearTimeout(this.animTimer);
        this.animTimer = null;
      }
      this.running = false;

      if (this.onStop) this.onStop();
      return this;
    }

    /**
     * Set FPS (0 = use native GIF timing)
     * @param {number} fps
     */
    setFps(fps) {
      this.fps = fps;
      if (this.running) {
        this.stop();
        this.start();
      }
      return this;
    }

    /**
     * Reset and clear everything
     */
    reset() {
      this.stop();
      this.frames = [];
      this.currentFrame = 0;
      this.fCtx.clearRect(0, 0, this.FAVICON_SIZE, this.FAVICON_SIZE);
      this.oCtx.clearRect(0, 0, this.FAVICON_OUTPUT_SIZE, this.FAVICON_OUTPUT_SIZE);
      if (this.faviconLink) {
        this.faviconLink.href = '';
      }
      return this;
    }

    /**
     * Get GIF info
     * @returns {Object}
     */
    getInfo() {
      return {
        frames: this.frames.length,
        width: this.gifW,
        height: this.gifH,
        fps: this.fps,
        running: this.running,
        currentFrame: this.currentFrame
      };
    }

    _handleError(message) {
      console.error('[GifFavicon]', message);
      if (this.onError) {
        this.onError(new Error(message));
      }
    }
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GifFavicon;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() { return GifFavicon; });
  } else {
    global.GifFavicon = GifFavicon;
  }

})(typeof window !== 'undefined' ? window : this);
