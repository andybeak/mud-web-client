import { config } from './config.js';
import { Event } from './event.js';
import { ScrollView } from './scroll-view.js';
import { DirectionPanel } from './direction-panel.js';
import { CommunicationPanel } from './communication-panel.js';
import jQuery from 'jquery';
import { log } from './utils.js';
import { initializeCore } from './core.js';
import { MacroWindow } from './macro-window.js'; // Add MacroWindow import

import './mxp.js'; // Import MXP module
import './modal-input.js'; // ModalInput module
import { ChatterBox } from './chatter-box.js'; // ChatterBox module
import { ControlPanel } from './control-panel.js'; // ControlPanel module
import { GroupTab } from './group-tab.js'; // GroupTab module
import { IFrame } from './iframe.js';
import { MistyBars } from './misty-bars.js'; // MistyBars module
import { LoginPrompt } from './login-prompt.js';
import { JujuMapper } from './juju-mapper.js'; // JujuMapper module
import { Havoc } from './havoc-core.js'; // Havoc module
import { HavocMapper } from './havoc-mapper.js'; // HavocMapper module
import { Facebook } from './fb.js';

const j = jQuery;

window.jQuery = window.$ = jQuery;

// Default macros configuration
const defaultMacros = [
  { name: 'Look', command: 'look' },
  { name: 'Score', command: 'score' },
  { name: 'Inventory', command: 'inventory' },
  { name: 'Equipment', command: 'equipment' },
  { name: 'Who', command: 'who' },
  { name: 'Time', command: 'time' },
  { name: 'Weather', command: 'weather' },
  { name: 'Help', command: 'help' }
];

// Global macro window instance
let macroWindow = null;

// Wait for DOM to be ready
j(document).ready(async () => {
  console.log('DOM Content Loaded');

  // Initialize config first
  await config.initialize();

  // Debug screen dimensions and mobile detection
  console.log('Device Info:', {
    isMobile: config.device.mobile,
    isTouch: config.device.touch,
    deviceConfig: config.device
  });

  // Initialize core
  initializeCore();

  // Add tab click handlers
  j('.tab-btn').click((e) => {
    const tab = j(e.target).data('tab');
    console.log('Tab clicked:', tab);
    
    // Remove active class from all buttons
    j('.tab-btn').removeClass('active');
    
    // Add active class to clicked button
    j(e.target).addClass('active');
    
    // Handle tab actions
    switch(tab) {
      case 'macro':
        console.log('Macro tab clicked, macroWindow:', config.MacroWindow);
        if (config.MacroWindow) {
          console.log('Before toggle - visible:', config.MacroWindow.visible);
          config.MacroWindow.toggle();
          console.log('After toggle - visible:', config.MacroWindow.visible);
        } else {
          console.error('Macro window not initialized');
        }
        break;
      case 'map':
        // Handle map tab
        break;
      case 'settings':
        // Handle settings tab
        break;
    }
  });

  // Mobile-only layout
  // Hide communication panel
  config.communicationPanel = false;

  // Position direction panel at bottom
  if (config.macroPanel) {
    const directionPanel = new DirectionPanel({
      title: 'Direction Panel',
      css: {
        width: config.device.mobile ? '100vw' : '400px',
        height: '100px',
        bottom: '38px', // 30px tab bar + 8px gap
        left: config.device.mobile ? 0 : 'auto',
        right: config.device.mobile ? 'auto' : 100,
        top: config.device.mobile ? 'auto' : 100,
      },
      drag: false,
      snap: false,
      noresize: true
    });

    await directionPanel.initialize();
  }

  // Initialize tab bar
  if (config.device.mobile) {
    j('body').append(`
      <div id="tab-bar" style="
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 30px;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1000;
        border-top: 1px solid #666;
      ">
        <button class="tab-btn" data-tab="macro">Macro</button>
        <button class="tab-btn" data-tab="map">Map</button>
        <button class="tab-btn" data-tab="settings">Settings</button>
      </div>
    `);

    // Add tab bar styles
    j('head').append(`
      <style>
        .tab-btn {
          background: transparent;
          border: none;
          color: #fff;
          padding: 5px 15px;
          font-size: 14px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .tab-btn:hover {
          opacity: 1;
        }
        .tab-btn.active {
          opacity: 1;
          border-bottom: 2px solid #fff;
        }
      </style>
    `);
  }
});
