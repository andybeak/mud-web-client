import jQuery from 'jquery';
import { config } from './config.js';
import { Event } from './event.js';
import { Window } from './window.js';

const j = jQuery;

export class ImageryPanel {
  constructor(options = {}) {
    if (!window.user) return;

    this.options = {
      title: 'Imagery',
      css: {
        width: 600,
        height: 400,
        top: 100,
        right: 100,
      },
      ...options,
      id: '#imagery-panel',
    };

    this.id = '#imagery-panel';
    this.mobile = config.device.mobile;
    this.touch = config.device.touch;
    this.pref = window.user.pref;
    this.visible = false; // Start hidden
    this.exposeToConfig();
  }

  async initialize() {
    this.initWindow();
    this.initLayout();
    this.initEventListeners();

    if (!this.touch) {
      j(`${this.id} .nice`).niceScroll({
        cursorborder: 'none',
        cursorwidth: '7px',
      });
    }
  }

  initWindow() {
    this.win = new Window({
      id: this.id,
      title: this.options.title,
      closeable: true,
      class: 'nofade',
      css: {
        width: this.mobile ? '100vw' : '600px',
        height: this.mobile ? '50vh' : '400px',
        top: this.mobile ? 'auto' : '100px',
        right: this.mobile ? 'auto' : '100px',
        bottom: this.mobile ? '70px' : 'auto',
        left: this.mobile ? '0' : 'auto',
        zIndex: 101,
        display: 'none',
        visibility: 'hidden',
        opacity: '0',
        'background-color': '#1a1a1a',
        'border-radius': '8px',
        'border': '1px solid #444'
      },
      drag: !this.touch,
      snap: true,
    });

    // Force the size after window creation
    j(this.id).css({
      width: this.mobile ? '100vw' : '600px',
      height: this.mobile ? '50vh' : '400px',
      minWidth: this.mobile ? '100vw' : '600px',
      minHeight: this.mobile ? '200px' : '400px',
      maxWidth: this.mobile ? '100vw' : '600px',
      maxHeight: this.mobile ? '50vh' : '400px',
      display: 'none',
      visibility: 'hidden',
      opacity: '0',
      'background-color': '#1a1a1a',
      'border-radius': '8px',
      'border': '1px solid #444'
    });

    // Store reference to this panel in the window object
    j(this.id).get(0).win = this;
    j(this.id).get(0).panel = this;
  }

  initLayout() {
    j(`${this.id} .content`).append(`
      <div class="panel-content" style="background: transparent;">
        <div class="imagery-container">
          <div class="imagery-content"></div>
        </div>
      </div>
    `);

    // Add some basic styling
    j('head').append(`
      <style>
        .imagery-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 5px;
          background: transparent;
        }
        .imagery-content {
          flex: 1;
          overflow-y: auto;
          padding: 5px;
          background: #1a1a1a;
          border-radius: 4px;
          font-family: monospace;
          font-size: ${this.mobile ? '12px' : '14px'};
          scrollbar-width: thin;
          scrollbar-color: #888 #333;
        }
        .imagery-content::-webkit-scrollbar {
          width: 8px;
        }
        .imagery-content::-webkit-scrollbar-track {
          background: #333;
          border-radius: 4px;
        }
        .imagery-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .imagery-content::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        #imagery-panel .content {
          background: #1a1a1a !important;
          padding: 0 !important;
          height: 100% !important;
        }
        #imagery-panel .panel-content {
          background: #1a1a1a !important;
          height: 100% !important;
        }
        @media (max-width: 768px) {
          #imagery-panel {
            width: 100vw !important;
            height: 50vh !important;
            bottom: 70px !important;
            left: 0 !important;
            right: auto !important;
            top: auto !important;
          }
        }
      </style>
    `);
  }

  initEventListeners() {
    // Listen for room updates to update imagery
    Event.listen('room_visited', (data) => {
      this.updateImagery(data.roomData);
    });
  }

  updateImagery(roomData) {
    const $content = j(`${this.id} .imagery-content`);
    $content.empty();

    if (roomData) {
      // Add room title
      $content.append(`<div class="room-title">${roomData.title}</div>`);
      
      // Add room description
      $content.append(`<div class="room-description">${roomData.description}</div>`);
      
      // Add items if any
      if (roomData.items && roomData.items.length > 0) {
        $content.append('<div class="room-items-title">Items:</div>');
        roomData.items.forEach(item => {
          $content.append(`<div class="room-item">${item}</div>`);
        });
      }
      
      // Add monsters if any
      if (roomData.monsters && roomData.monsters.length > 0) {
        $content.append('<div class="room-monsters-title">Monsters:</div>');
        roomData.monsters.forEach(monster => {
          $content.append(`<div class="room-monster">${monster}</div>`);
        });
      }
      
      // Add exits if any
      if (roomData.exits && roomData.exits.length > 0) {
        $content.append('<div class="room-exits-title">Exits:</div>');
        $content.append(`<div class="room-exits">${roomData.exits.join(', ')}</div>`);
      }
    }
  }

  exposeToConfig() {
    config.ImageryPanel = this;
    setTimeout(() => {
      Event.fire('imagerypanel_ready', this);
    }, 500);
  }

  show() {
    if (!this.visible) {
      this.visible = true;
      j(this.id).css({
        display: 'block',
        visibility: 'visible',
        opacity: '1'
      });
      Event.fire('window_show', this.id);
    }
    return this;
  }

  hide() {
    if (this.visible) {
      this.visible = false;
      j(this.id).css({
        display: 'none',
        visibility: 'hidden',
        opacity: '0'
      });
      Event.fire('window_hide', this.id);
    }
    return this;
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
    return this;
  }
} 