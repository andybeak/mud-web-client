import jQuery from 'jquery';
import { config } from './config.js';
import { Window } from './window.js';
import { log } from './utils.js';

const j = jQuery;

export class MacroWindow {
  constructor(options = {}) {
    // Clean up any existing windows and their event listeners
    const existingWindows = j('#macro-window');
    if (existingWindows.length) {
      console.log('MacroWindow: Cleaning up existing windows:', existingWindows.length);
      existingWindows.remove();
      // Also clean up any associated event listeners
      j(document).off('click', '.macro-btn');
    }

    this.options = {
      title: 'Macro Buttons',
      css: {
        width: 300,
        height: 200,
        top: 100,
        right: 100,
        zIndex: 1000
      },
      ...options
    };

    this.id = '#macro-window';
    this.macros = options.macros || [];
    this.visible = false; // Start hidden
    
    this.initialize();
  }

  initialize() {
    console.log('MacroWindow: Starting initialization');
    this.initWindow();
    this.initLayout();
    this.initEventListeners();
    console.log('MacroWindow: Initialization complete');
    this.hide(); // Ensure window starts hidden
  }

  initWindow() {
    console.log('MacroWindow: Initializing window');
    this.win = new Window({
      id: this.id,
      title: this.options.title,
      closeable: true,
      class: 'nofade',
      css: {
        ...this.options.css,
        'background-color': 'rgba(0, 0, 0, 0.8)',
        'border-radius': '8px',
        'border': '1px solid #666',
        'display': 'block',
        'visibility': 'visible',
        'opacity': '1',
        'z-index': '9999 !important'
      },
      drag: !config.device.touch,
      snap: true
    });

    console.log('MacroWindow: Window created:', this.win);
    console.log('MacroWindow: Window element:', j(this.id));
    console.log('MacroWindow: Window in DOM:', document.querySelector(this.id));
    
    j(this.id).get(0).win = this.win;
  }

  initLayout() {
    const content = j(`${this.id} .content`);
    content.css({
      'height': 'auto',
      'min-height': '0',
      'padding': '5px'
    });

    content.append(`
      <div class="macro-grid">
        ${this.macros.map(macro => `
          <button class="macro-btn" 
                  title="${macro.command}"
                  data-command="${macro.command}">
            ${macro.name}
          </button>
        `).join('')}
      </div>
    `);

    // Add styles
    j('head').append(`
      <style>
        #macro-window .content {
          padding: 5px !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
        .macro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 5px;
          padding: 5px;
          width: 100%;
          box-sizing: border-box;
        }
        .macro-btn {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #888;
          background: #444;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .macro-btn:hover {
          background: #555;
          transform: scale(1.05);
        }
        .macro-btn:active {
          background: #666;
          transform: scale(0.95);
        }
      </style>
    `);
  }

  initEventListeners() {
    j(`${this.id} .macro-btn`).click((e) => {
      const command = j(e.target).data('command');
      if (config.Socket) {
        config.Socket.send(command + '\n');
      }
    });
  }

  show() {
    console.log('MacroWindow: Showing window');
    this.visible = true;
    const windowElement = j(this.id);
    
    windowElement.css({
      'display': 'block',
      'visibility': 'visible',
      'opacity': '1',
      'z-index': '9999 !important',
      'position': 'fixed',
      'bottom': '38px',
      'left': '0',
      'width': '100vw',
      'height': 'auto',
      'max-height': '50vh'
    });
    
    windowElement.show();
    
    windowElement.height();
    
    console.log('MacroWindow: Window element:', windowElement);
    console.log('MacroWindow: Window visibility:', windowElement.is(':visible'));
    console.log('MacroWindow: Window in DOM:', document.querySelector(this.id));
    this.win.bringToFront();
  }

  hide() {
    console.log('MacroWindow: Hiding window');
    this.visible = false;
    j(this.id).hide();
  }

  toggle() {
    console.log('MacroWindow: Toggling window, current state:', this.visible);
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
} 