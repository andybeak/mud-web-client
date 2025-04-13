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
    this.initWindow();
    this.initLayout();
    this.initEventListeners();
    this.hide(); // Ensure window starts hidden
  }

  initWindow() {
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
        'z-index': '200 !important',
        'height': 'auto',
        'min-height': '100px'
      },
      drag: !config.device.touch,
      snap: true
    });
    
    j(this.id).get(0).win = this.win;
  }

  initLayout() {
    const content = j(`${this.id} .content`);
    content.css({
      'height': 'auto',
      'min-height': '100px',
      'padding': '5px',
      'display': 'block'
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
          min-height: 100px !important;
          overflow: visible !important;
          display: block !important;
        }
        .macro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 5px;
          padding: 5px;
          width: 100%;
          box-sizing: border-box;
          min-height: 100px;
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
    this.visible = true;
    const windowElement = j(this.id);
    
    // Set all visibility properties at once
    windowElement.css({
        'display': 'block',
        'visibility': 'visible',
        'opacity': '1',
        'z-index': '200 !important',
        'position': 'fixed',
        'bottom': '38px',
        'left': '0',
        'width': '100vw',
        'height': 'auto',
        'min-height': '100px',
        'max-height': '50vh',
        'overflow': 'hidden auto'  // Add this to maintain scrolling
    });
    
    // Force a reflow to ensure proper sizing
    windowElement.height();
    this.win.bringToFront();
  }

  hide() {
    this.visible = false;
    const windowElement = j(this.id);
    
    // Set all visibility properties at once
    windowElement.css({
        'display': 'none',
        'visibility': 'hidden',
        'opacity': '0'
    });
  }

  toggle() {
    console.log('MacroWindow: Toggling visibility');
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
} 