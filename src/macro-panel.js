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

    // Listen for scrollview_ready to ensure we don't miss any events
    Event.listen('scrollview_ready', () => {
      console.log('ScrollView ready, MacroPanel initialized');
      // Force an initial update of compass buttons
      if (config.ScrollView) {
        const output = j(`${config.ScrollView.id} .out`);
        const text = output.text();
        if (text.includes('Obvious exits are:')) {
          const exitsText = text.split('Obvious exits are:')[1].split('.')[0].trim();
          const exits = exitsText
            .replace(/ and /g, ',')
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0);
          this.updateCompassButtons(exits);
        }
      }
    });

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
              <button class="compass-btn northwest" data-direction="northwest">↖</button>
              <button class="compass-btn north" data-direction="north">↑</button>
              <button class="compass-btn northeast" data-direction="northeast">↗</button>
            </div>
            <div class="compass-row">
              <button class="compass-btn west" data-direction="west">←</button>
              <button class="compass-btn center">•</button>
              <button class="compass-btn east" data-direction="east">→</button>
            </div>
            <div class="compass-row">
              <button class="compass-btn southwest" data-direction="southwest">↙</button>
              <button class="compass-btn south" data-direction="south">↓</button>
              <button class="compass-btn southeast" data-direction="southeast">↘</button>
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
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #888;
          background: #444;
          color: #fff;
          font-size: 20px;
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
        .compass-btn.disabled {
          background: #222;
          border-color: #444;
          color: #666;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .compass-btn.disabled:hover {
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
      const btn = j(e.currentTarget);
      if (btn.hasClass('disabled') || btn.hasClass('center')) return;
      
      const direction = btn.data('direction');
      let command = '';
      
      switch(direction) {
        case 'north': command = 'n'; break;
        case 'south': command = 's'; break;
        case 'east': command = 'e'; break;
        case 'west': command = 'w'; break;
        case 'northeast': command = 'ne'; break;
        case 'southeast': command = 'se'; break;
        case 'southwest': command = 'sw'; break;
        case 'northwest': command = 'nw'; break;
      }
      
      if (command) {
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
        config.socket.send(command);
      }
    });

    // Listen for new text in the main window
    Event.listen('scrollview_add', (text) => {
      // Remove HTML tags and decode entities
      const cleanText = text.replace(/<[^>]*>/g, '')
                           .replace(/&nbsp;/g, ' ')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>');
      
      if (cleanText.includes('Obvious exits are:')) {
        // Extract exits from the text
        const exitsText = cleanText.split('Obvious exits are:')[1].split('.')[0].trim();
        
        // Handle the 'and' case and clean up the text
        const exits = exitsText
          .replace(/ and /g, ',') // Replace 'and' with comma
          .split(',')
          .map(e => e.trim())
          .filter(e => e.length > 0); // Remove empty strings
        
        // Update compass buttons
        this.updateCompassButtons(exits);
      }
    });
  }

  updateCompassButtons(exits) {
    // Enable/disable buttons based on available exits
    j(this.id).find('.compass-btn').each((_, btn) => {
      const $btn = j(btn);
      if ($btn.hasClass('center')) return;
      
      const direction = $btn.data('direction');
      const isAvailable = exits.includes(direction);
      
      $btn.prop('disabled', !isAvailable);
      $btn.toggleClass('disabled', !isAvailable);
    });
  }

  exposeToConfig() {
    config.MacroPanel = this;
    setTimeout(() => {
      Event.fire('macropanel_ready', this);
    }, 500);
  }
} 