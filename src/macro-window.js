import jQuery from 'jquery';
import { config } from './config.js';
import { Window } from './window.js';
import { log } from './utils.js';
import { defaultMacros, windowStyle, STORAGE_KEY } from './config/macros.js';
import { Modal } from './modal.js';

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
    this.macros = [...defaultMacros, ...this.loadCustomMacros()];
    this.visible = false; // Start hidden
    
    this.initialize();
  }

  loadCustomMacros() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  saveCustomMacros(macros) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(macros));
  }
  
  addCustomMacro(name, command) {
    const customMacros = this.loadCustomMacros();
    customMacros.push({ name, command, category: 'custom' });
    this.saveCustomMacros(customMacros);
    this.refreshMacros();
  }
  
  removeCustomMacro(index) {
    const customMacros = this.loadCustomMacros();
    customMacros.splice(index, 1);
    this.saveCustomMacros(customMacros);
    this.refreshMacros();
  }
  
  refreshMacros() {
    const customMacros = this.loadCustomMacros();
    this.macros = [...defaultMacros, ...customMacros];
    this.initLayout();
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
    
    // Clear existing content
    content.empty();
    
    content.css({
      'height': 'auto',
      'min-height': '100px',
      'padding': '5px',
      'display': 'block'
    });

    // Add "Add Macro" button
    content.append(`
      <button class="add-macro-btn" style="margin-bottom: 10px;">
        <i class="icon-plus"></i> Add Macro
      </button>
    `);

    content.append(`
      <div class="macro-grid">
        ${this.macros.map((macro, index) => `
          <div class="macro-container">
            <button class="macro-btn ${macro.category === 'custom' ? 'custom-macro' : ''}" 
                    title="${macro.command}"
                    data-command="${macro.command}">
              ${macro.name}
            </button>
            ${macro.category === 'custom' ? `
              <button class="delete-macro-btn" data-index="${index - defaultMacros.length}" title="Delete macro">
                ×
              </button>
            ` : ''}
          </div>
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
          background-color: #f0f0f0 !important;
          border-radius: 8px !important;
          margin: 0 !important;
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
        .macro-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .macro-btn {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #666;
          background: #888;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          min-width: 0;
          flex: 1;
        }
        .macro-btn.custom-macro {
          background: #5b8ce6;
          border-color: #4a7bd4;
        }
        .macro-btn:hover {
          transform: scale(1.05);
        }
        .macro-btn:active {
          transform: scale(0.95);
        }
        .delete-macro-btn {
          padding: 8px;
          border: none;
          background: #ff4444;
          color: white;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          width: 32px;
          height: 32px;
          line-height: 1;
        }
        .delete-macro-btn:hover {
          background: #ff0000;
          transform: scale(1.1);
        }
        .delete-macro-btn:active {
          transform: scale(0.95);
        }
        .add-macro-btn {
          width: 100%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #4a7bd4;
          background: #5b8ce6;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-macro-btn:hover {
          background: #4a7bd4;
        }
      </style>
    `);
  }

  initEventListeners() {
    // Handle macro button clicks
    j(`${this.id} .macro-btn`).click((e) => {
      const command = j(e.target).data('command');
      if (config.Socket) {
        config.Socket.send(command + '\n');
      }
    });

    // Handle delete button clicks
    j(`${this.id} .delete-macro-btn`).click((e) => {
      const index = parseInt(j(e.target).data('index'));
      const macro = this.macros[index + defaultMacros.length];
      
      new Modal({
        title: 'Delete Macro',
        html: `
          <div class="mb-3">
            Are you sure you want to delete the macro "${macro.name}"?
          </div>
        `,
        css: {
          width: config.device.mobile ? '90vw' : '400px',
          'max-width': '90vw'
        },
        buttons: [
          {
            text: 'Delete',
            class: 'btn-danger',
            click: (modalInstance) => {
              this.removeCustomMacro(index);
              modalInstance.hide();
            }
          },
          {
            text: 'Cancel',
            class: 'btn-secondary',
            click: (modalInstance) => {
              modalInstance.hide();
            }
          }
        ]
      });
    });

    // Handle add macro button click
    j(`${this.id} .add-macro-btn`).click(() => {
      new Modal({
        title: 'Add New Macro',
        html: `
          <div class="mb-3">
            <label for="macro-name" class="form-label">Macro Name:</label>
            <input type="text" id="macro-name" class="form-control" placeholder="Enter macro name">
          </div>
          <div class="mb-3">
            <label for="macro-command" class="form-label">Command:</label>
            <input type="text" id="macro-command" class="form-control" placeholder="Enter command">
          </div>
        `,
        css: {
          width: config.device.mobile ? '90vw' : '400px',
          'max-width': '90vw'
        },
        buttons: [
          {
            text: 'Add',
            class: 'btn-success',
            click: (modalInstance) => {
              const name = j('#macro-name').val();
              const command = j('#macro-command').val();
              
              if (!name || !command) {
                alert('Please enter both a name and command for the macro.');
                return;
              }
              
              this.addCustomMacro(name, command);
              modalInstance.hide();
            }
          },
          {
            text: 'Cancel',
            class: 'btn-danger',
            click: (modalInstance) => {
              modalInstance.hide();
            }
          }
        ]
      });
    });

    // Close macro window when clicking outside
    j(document).on('click', (e) => {
      // Don't close if clicking on tab buttons
      if (j(e.target).closest('.tab-btn').length) {
        return;
      }
      
      if (!j(e.target).closest(this.id).length && this.visible) {
        this.hide();
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
        'overflow': 'hidden auto',  // Add this to maintain scrolling
        'background-color': 'transparent'  // Make the window background transparent
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