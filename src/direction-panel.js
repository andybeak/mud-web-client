import jQuery from 'jquery';
import { config } from './config.js';
import { Event } from './event.js';
import { Window } from './window.js';
import { log } from './utils.js';

const j = jQuery;

export class DirectionPanel {
  constructor(options = {}) {
    if (!window.user) return;

    this.options = {
      title: 'Direction Panel',
      css: {
        width: config.device.mobile ? '100vw' : '400px',
        height: 100,
        top: 100,
        right: 100,
      },
      ...options,
      id: '#direction-panel',
    };

    this.id = '#direction-panel';
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
        <div class="compass-sections">
          <div class="section compass-rose-section" style="background: transparent;">
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
          <div class="section vertical-section" style="background: transparent;">
            <div class="vertical-buttons">
              <button class="compass-btn up" data-direction="up">⬆</button>
              <button class="compass-btn down" data-direction="down">⬇</button>
            </div>
          </div>
          <div class="section special-exits-section" style="background: transparent;">
            <div class="special-exits"></div>
          </div>
        </div>
      </div>
    `);

    // Add styles for the compass rose
    j('head').append(`
      <style>
        .compass-sections {
          display: flex;
          gap: 5px;
          padding: 2px;
          height: 100%;
          align-items: center;
        }
        .compass-rose-section {
          flex: 1;
        }
        .vertical-section {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        .special-exits-section {
          flex: 1;
        }
        .special-exits {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          padding: 2px;
        }
        .special-exit-btn {
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #888;
          background: #444;
          color: #fff;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          white-space: nowrap;
        }
        .special-exit-btn:hover {
          background: #555;
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .special-exit-btn:active {
          background: #666;
          transform: scale(0.95);
        }
        .special-exit-btn.disabled {
          background: #222;
          border-color: #444;
          color: #666;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .special-exit-btn.disabled:hover {
          transform: none;
          box-shadow: none;
        }
        .compass-rose {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 2px;
        }
        .compass-row {
          display: flex;
          gap: 2px;
          justify-content: center;
        }
        .vertical-buttons {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .compass-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #888;
          background: #444;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
        }
        .compass-btn:hover {
          background: #555;
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .compass-btn:active {
          background: #666;
          transform: scale(0.95);
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
        .compass-btn.center {
          background: #666;
          border-color: #aaa;
        }
        #direction-panel .content {
          padding: 0 !important;
          height: 100% !important;
        }
        #direction-panel .panel-content {
          height: 100% !important;
        }
      </style>
    `);
  }

  initEventListeners() {
    // Add click handlers for each button
    const buttons = j(this.id).find('.compass-btn, .special-exit-btn');
    
    buttons.on('click', (e) => {
      const btn = j(e.currentTarget);
      if (btn.hasClass('disabled')) {
        return;
      }
      
      // If it's the middle button (center), send "look" command
      if (btn.hasClass('center')) {
        if (config.ScrollView && config.ScrollView.send) {
          config.ScrollView.send('look');
        } else if (config.socket && config.socket.send) {
          config.socket.send('look');
        }
        return;
      }
      
      // For other buttons, send the direction command
      const direction = btn.data('direction');
      let command = '';
      
      if (btn.hasClass('special-exit-btn')) {
        // For special exits, use the button text as the command
        command = btn.text().trim();
      } else {
        switch(direction) {
          case 'north': command = 'n'; break;
          case 'south': command = 's'; break;
          case 'east': command = 'e'; break;
          case 'west': command = 'w'; break;
          case 'northeast': command = 'ne'; break;
          case 'southeast': command = 'se'; break;
          case 'southwest': command = 'sw'; break;
          case 'northwest': command = 'nw'; break;
          case 'up': command = 'up'; break;
          case 'down': command = 'down'; break;
        }
      }
      
      if (command) {
        if (config.ScrollView && config.ScrollView.send) {
          config.ScrollView.send(command);
        } else if (config.socket && config.socket.send) {
          config.socket.send(command);
        }
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
      if (!text) return; // Skip if text is undefined or null
      
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
    // Define compass directions
    const compassDirections = [
      'north', 'south', 'east', 'west',
      'northeast', 'southeast', 'southwest', 'northwest',
      'up', 'down'
    ];

    // Update compass buttons
    j(this.id).find('.compass-btn').each((_, btn) => {
      const $btn = j(btn);
      if ($btn.hasClass('center')) return;
      
      const direction = $btn.data('direction');
      const isAvailable = exits.includes(direction);
      
      $btn.prop('disabled', !isAvailable);
      $btn.toggleClass('disabled', !isAvailable);
    });

    // Update special exits
    const specialExits = exits.filter(exit => !compassDirections.includes(exit));
    
    const $specialExitsContainer = j(this.id).find('.special-exits');
    $specialExitsContainer.empty();

    specialExits.forEach(exit => {
      const $btn = j(`<button class="special-exit-btn" data-direction="${exit}">${exit}</button>`);
      $specialExitsContainer.append($btn);
    });

    // Re-attach event listeners to new special exit buttons
    const newButtons = $specialExitsContainer.find('.special-exit-btn');
    
    newButtons.on('click', (e) => {
      const btn = j(e.currentTarget);
      const command = btn.text().trim();
      
      if (config.ScrollView && config.ScrollView.send) {
        config.ScrollView.send(command);
      } else if (config.socket && config.socket.send) {
        config.socket.send(command);
      }
    });
  }

  exposeToConfig() {
    config.DirectionPanel = this;
    setTimeout(() => {
      Event.fire('directionpanel_ready', this);
    }, 500);
  }
}