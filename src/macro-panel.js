import jQuery from 'jquery';
import { config } from './config.js';
import { Event } from './event.js';
import { Window } from './window.js';
import { log } from './utils.js';

const j = jQuery;

export class MacroPanel {
  constructor(options = {}) {
    if (!window.user) return;

    this.options = {
      title: 'Macro Panel',
      css: {
        width: 400,
        height: 300,
        top: 100,
        right: 100,
      },
      ...options,
      id: '#macro-panel',
    };

    this.id = '#macro-panel';
    this.mobile = config.device.mobile;
    this.touch = config.device.touch;
    this.pref = window.user.pref;
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
      transparent: true,
      css: {
        ...this.options.css,
        zIndex: 101,
        'background-color': 'rgba(0, 0, 0, 0.8)',
        'border-radius': '8px',
        'border': '1px solid #666'
      },
      drag: !this.touch,
      snap: true,
    });

    j(this.id).get(0).win = this.win;
  }

  initLayout() {
    j(`${this.id} .content`).append(`
      <div class="panel-content" style="background: transparent;">
        <div class="section" style="background: transparent;">
          <div class="compass-rose">
            <div class="compass-row">
              <button class="compass-btn north">↑</button>
            </div>
            <div class="compass-row">
              <button class="compass-btn west">←</button>
              <button class="compass-btn center">•</button>
              <button class="compass-btn east">→</button>
            </div>
            <div class="compass-row">
              <button class="compass-btn south">↓</button>
            </div>
          </div>
        </div>
        <div class="section" style="background: transparent;">
          <h3>Quick Actions</h3>
          <div class="content"></div>
        </div>
      </div>
    `);

    // Add some basic styling
    j('head').append(`
      <style>
        .compass-rose {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px;
        }
        .compass-row {
          display: flex;
          gap: 5px;
          justify-content: center;
        }
        .compass-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid #888;
          background: #444;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
          z-index: 102;
        }
        .compass-btn:hover {
          background: #555;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .compass-btn:active {
          background: #666;
          transform: scale(0.95);
        }
        .compass-btn.center {
          background: #333;
          cursor: default;
        }
        .compass-btn.center:hover {
          transform: none;
          box-shadow: none;
        }
        #macro-panel .content {
          background: transparent !important;
        }
      </style>
    `);
  }

  initEventListeners() {
    // Handle compass button clicks
    j(this.id).on('click', '.compass-btn', (e) => {
      const direction = j(e.currentTarget).attr('class').split(' ')[1];
      let command = '';
      
      switch(direction) {
        case 'north': command = 'n'; break;
        case 'south': command = 's'; break;
        case 'east': command = 'e'; break;
        case 'west': command = 'w'; break;
      }
      
      if (command) {
        log('Sending command:', command);
        config.socket.send(command);
      }
    });

    // Handle keyboard arrow keys
    j(document).on('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      let command = '';
      switch(e.key) {
        case 'ArrowUp': command = 'n'; break;
        case 'ArrowDown': command = 's'; break;
        case 'ArrowRight': command = 'e'; break;
        case 'ArrowLeft': command = 'w'; break;
      }
      
      if (command) {
        e.preventDefault();
        log('Sending command:', command);
        config.socket.send(command);
      }
    });
  }

  exposeToConfig() {
    config.MacroPanel = this;
    setTimeout(() => {
      Event.fire('macropanel_ready', this);
    }, 500);
  }
} 