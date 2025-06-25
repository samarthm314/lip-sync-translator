// Node.js polyfills for browser compatibility

// Process polyfill
if (typeof process === 'undefined') {
  window.process = {
    env: {},
    version: 'v16.0.0',
    platform: 'browser',
    stdout: null,
    stderr: null,
    stdin: null,
    nextTick: (cb) => setTimeout(cb, 0),
    browser: true,
    node: false
  };
}

// Buffer polyfill
if (typeof Buffer === 'undefined') {
  // Fallback Buffer implementation
  window.Buffer = class Buffer extends Uint8Array {
    constructor(input, encodingOrOffset, length) {
      if (typeof input === 'string') {
        const encoder = new TextEncoder();
        super(encoder.encode(input));
      } else if (input instanceof ArrayBuffer) {
        super(input);
      } else if (Array.isArray(input)) {
        super(input);
      } else {
        super(input || 0);
      }
    }
    
    static from(input, encoding) {
      return new Buffer(input, encoding);
    }
    
    toString(encoding = 'utf8') {
      const decoder = new TextDecoder();
      return decoder.decode(this);
    }
  };
}

// Events polyfill
if (typeof EventEmitter === 'undefined') {
  // Fallback EventEmitter implementation
  window.EventEmitter = class EventEmitter {
    constructor() {
      this.events = {};
    }
    
    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
      return this;
    }
    
    emit(event, ...args) {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(...args));
      }
      return this;
    }
    
    removeListener(event, listener) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(l => l !== listener);
      }
      return this;
    }
  };
}

// Util polyfill
if (typeof util === 'undefined') {
  // Fallback util implementation
  window.util = {
    inspect: (obj) => JSON.stringify(obj, null, 2),
    debuglog: () => () => {},
    inherits: (ctor, superCtor) => {
      ctor.prototype = Object.create(superCtor.prototype);
      ctor.prototype.constructor = ctor;
    }
  };
}

// Readable stream polyfill for simple-peer
if (typeof Readable === 'undefined') {
  // Simple Readable stream implementation
  window.Readable = class Readable extends EventEmitter {
    constructor(options = {}) {
      super();
      this.readable = true;
      this.reading = false;
      this.ended = false;
      this.options = options;
      this._readableState = {
        reading: false,
        ended: false,
        length: 0
      };
    }
    
    resume() {
      this.reading = true;
      this._readableState.reading = true;
      this.emit('resume');
      return this;
    }
    
    pause() {
      this.reading = false;
      this._readableState.reading = false;
      this.emit('pause');
      return this;
    }
    
    push(chunk) {
      if (chunk === null) {
        this.ended = true;
        this._readableState.ended = true;
        this.emit('end');
      } else {
        this._readableState.length += chunk.length || 1;
        this.emit('data', chunk);
      }
      return this;
    }
    
    // Add the resume_ method that simple-peer expects
    resume_() {
      return this.resume();
    }
    
    // Add other methods that might be expected
    destroy() {
      this.ended = true;
      this.readable = false;
      this.emit('close');
      return this;
    }
    
    pipe(dest) {
      this.on('data', (chunk) => {
        if (dest.write) {
          dest.write(chunk);
        }
      });
      this.on('end', () => {
        if (dest.end) {
          dest.end();
        }
      });
      return dest;
    }
  };
}

// Duplex stream polyfill for simple-peer
if (typeof Duplex === 'undefined') {
  window.Duplex = class Duplex extends Readable {
    constructor(options = {}) {
      super(options);
      this.writable = true;
      this._writableState = {
        ended: false,
        length: 0
      };
    }
    
    write(chunk, encoding, callback) {
      if (typeof encoding === 'function') {
        callback = encoding;
        encoding = null;
      }
      
      this._writableState.length += chunk.length || 1;
      this.emit('data', chunk);
      
      if (callback) {
        callback();
      }
      return true;
    }
    
    end(chunk, encoding, callback) {
      if (chunk) {
        this.write(chunk, encoding, callback);
      }
      this._writableState.ended = true;
      this.emit('end');
      return this;
    }
  };
}

console.log('Polyfills loaded successfully'); 