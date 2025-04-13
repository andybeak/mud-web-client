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
    
    // Create the event listener
    this.roomListener = Event.listen('room_visited', (data) => {
      if (!data) {
        return;
      }
      if (data.roomData) {
        this.lastRoom = data.roomData.title;
        this.updateLastRoom();
        this.updateImagery(data.roomData);
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
        display: 'none',
        visibility: 'hidden',
        opacity: '0'
      },
      drag: !this.touch,
      snap: true,
    });

    // Remove the force size CSS that was overriding our mobile settings
    j(this.id).css({
      display: 'none',
      visibility: 'hidden',
      opacity: '0'
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
        .room-title {
          color: #fff;
          padding: 10px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          background: #2a2a2a;
          border-radius: 3px;
          margin-bottom: 5px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .room-title:hover {
          background: #3a3a3a;
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
      </style>
    `);
  }

  initEventListeners() {
    // Listen for room visits to update the room list
    Event.listen('room_visited', (data) => {
      if (data && data.roomData) {
        this.lastRoom = data.roomData.title;
        this.updateImagery(data.roomData);
      }
    });

    // Add click handler for room titles
    j(`${this.id} .room-title`).click((e) => {
      const roomTitle = j(e.target).data('room');
      if (roomTitle) {
        const roomData = config.RoomProcessor.getRoomData(roomTitle);
        if (roomData) {
          this.updateImagery(roomData);
        }
      }
    });
  }

  updateLastRoom() {
    if (this.lastRoom) {
      j(`${this.id} .last-room`).text(`Last Room: ${this.lastRoom}`);
    }
  }

  updateImagery(roomData) {
    if (!roomData) {
      return;
    }

    const $content = j(`${this.id} .imagery-content`);
    $content.empty();

    // Get recent rooms and remove duplicates
    const recentRooms = config.RoomProcessor.getRecentRooms(20); // Get more than we need to ensure we have enough unique rooms
    const uniqueRooms = new Map();
    
    // Add rooms to map (this will automatically handle duplicates)
    recentRooms.forEach(room => {
      if (room && room.title) {
        uniqueRooms.set(room.title, room);
      }
    });

    // Convert to array and take first 10
    const uniqueRecentRooms = Array.from(uniqueRooms.values()).slice(0, 10);

    // Display the list of unique recent rooms
    uniqueRecentRooms.forEach(room => {
      $content.append(`
        <div class="room-title" data-room="${room.title}">
          ${room.title}
        </div>
      `);
    });
  }

  exposeToConfig() {
    config.ImageryPanel = this;
    setTimeout(() => {
      Event.fire('imagerypanel_ready', this);
    }, 500);
  }

  show() {
    this.visible = true;
    const windowElement = j(this.id);
    
    // Set all visibility properties at once
    windowElement.css({
      'display': 'block',
      'visibility': 'visible',
      'opacity': '1',
      'z-index': this.mobile ? '104' : '9999',
      'position': 'fixed',
      'top': '10px',
      'left': this.mobile ? '10px' : 'auto',
      'right': this.mobile ? '10px' : '100px',
      'width': this.mobile ? 'calc(100vw - 20px)' : '600px',
      'height': this.mobile ? '200px' : '400px',
      'max-height': '50vh',
      'overflow-y': 'auto',
      'background-color': 'rgba(0, 0, 0, 0.8)',
      'border-radius': '0',
      'border': this.mobile ? 'none' : '1px solid #666',
      'outline': '2px solid red'
    });
    
    // Force a reflow to ensure proper sizing
    windowElement.height();
    this.win.bringToFront();
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

  // Add a cleanup method
  destroy() {
    if (this.roomListener) {
      this.roomListener.remove(); // Clean up the event listener
    }
  }
} 