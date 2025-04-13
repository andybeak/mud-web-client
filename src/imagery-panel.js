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
    this.lastRoom = null;
    this.exposeToConfig();
    
    console.log('ImageryPanel: Creating event listener for room_visited');
    // Create the event listener
    this.roomListener = Event.listen('room_visited', (data) => {
      console.log('ImageryPanel: Received room_visited event:', data);
      if (!data) {
        console.log('ImageryPanel: No data received in event');
        return;
      }
      if (data.roomData) {
        console.log('ImageryPanel: Room data available:', {
          title: data.roomData.title,
          description: data.roomData.description,
          items: data.roomData.items,
          monsters: data.roomData.monsters,
          exits: data.roomData.exits
        });
        this.lastRoom = data.roomData.title;
        this.updateLastRoom();
        this.updateImagery(data.roomData);
      } else {
        console.log('ImageryPanel: No room data in event:', data);
      }
    });
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
      transparent: true,
      css: {
        ...this.options.css,
        zIndex: 9999,
        'background-color': 'rgba(0, 0, 0, 0.8)',
        'border-radius': '8px',
        'border': '1px solid #666',
        display: 'none',
        visibility: 'hidden',
        opacity: '0'
      },
      drag: !this.touch,
      snap: true,
    });

    // Force the size after window creation
    j(this.id).css({
      width: this.mobile ? '100vw' : '400px',
      height: '100px',
      minWidth: this.mobile ? '100vw' : '400px',
      minHeight: '100px',
      maxWidth: this.mobile ? '100vw' : '400px',
      maxHeight: '100px',
      display: 'none',
      visibility: 'hidden',
      opacity: '0',
      'background-color': 'rgba(0, 0, 0, 0.8)',
      'border-radius': '8px',
      'border': '1px solid #666',
      zIndex: 9999,
      position: 'fixed'
    });

    j(this.id).get(0).win = this.win;
  }

  initLayout() {
    j(`${this.id} .content`).append(`
      <div class="panel-content" style="background: transparent;">
        <div class="imagery-container">
          <div class="imagery-content">
            <div class="last-room"></div>
          </div>
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
        .last-room {
          color: #fff;
          padding: 10px;
          font-size: 16px;
          font-weight: bold;
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
    // No need to create the room_visited listener here as it's already created in the constructor
  }

  updateLastRoom() {
    console.log('Updating last room display:', this.lastRoom);
    if (this.lastRoom) {
      j(`${this.id} .last-room`).text(`Last Room: ${this.lastRoom}`);
      console.log('Last room text updated in DOM');
    } else {
      console.log('No last room to display');
    }
  }

  updateImagery(roomData) {
    console.log('ImageryPanel: Updating imagery with room data:', roomData);
    if (!roomData) {
      console.log('ImageryPanel: No room data provided');
      return;
    }

    const $content = j(`${this.id} .imagery-content`);
    console.log('ImageryPanel: Current content:', $content.html());
    $content.empty();

    // Add room title
    $content.append(`<div class="room-title">${roomData.title}</div>`);
    console.log('ImageryPanel: Added title:', roomData.title);
    
    // Add room description
    $content.append(`<div class="room-description">${roomData.description}</div>`);
    console.log('ImageryPanel: Added description');
    
    // Add items if any
    if (roomData.items && roomData.items.length > 0) {
      $content.append('<div class="room-items-title">Items:</div>');
      roomData.items.forEach(item => {
        $content.append(`<div class="room-item">${item}</div>`);
      });
      console.log('ImageryPanel: Added items:', roomData.items);
    }
    
    // Add monsters if any
    if (roomData.monsters && roomData.monsters.length > 0) {
      $content.append('<div class="room-monsters-title">Monsters:</div>');
      roomData.monsters.forEach(monster => {
        $content.append(`<div class="room-monster">${monster}</div>`);
      });
      console.log('ImageryPanel: Added monsters:', roomData.monsters);
    }
    
    // Add exits if any
    if (roomData.exits && roomData.exits.length > 0) {
      $content.append('<div class="room-exits-title">Exits:</div>');
      $content.append(`<div class="room-exits">${roomData.exits.join(', ')}</div>`);
      console.log('ImageryPanel: Added exits:', roomData.exits);
    }

    console.log('ImageryPanel: Final content:', $content.html());
  }

  exposeToConfig() {
    config.ImageryPanel = this;
    setTimeout(() => {
      Event.fire('imagerypanel_ready', this);
    }, 500);
  }

  show() {
    console.log('Showing imagery panel');
    if (!this.visible) {
      this.visible = true;
      j(this.id).css({
        display: 'block',
        visibility: 'visible',
        opacity: '1'
      });
      Event.fire('window_show', this.id);
      console.log('Panel visibility set to true');
      // Update the display with the last room when shown
      this.updateLastRoom();
    }
    return this;
  }

  hide() {
    console.log('Hiding imagery panel');
    if (this.visible) {
      this.visible = false;
      j(this.id).css({
        display: 'none',
        visibility: 'hidden',
        opacity: '0'
      });
      Event.fire('window_hide', this.id);
      console.log('Panel visibility set to false');
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

  // Add a cleanup method
  destroy() {
    if (this.roomListener) {
      this.roomListener.remove(); // Clean up the event listener
    }
  }
} 