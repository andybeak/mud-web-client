import { config } from './config.js';
import { Event } from './event.js';
import { ScrollView } from './scroll-view.js';
import { DirectionPanel } from './direction-panel.js';
import { CommunicationPanel } from './communication-panel.js';
import { MacroWindow } from './macro-window.js';
import { ImageryPanel } from './imagery-panel.js';
import { defaultMacros, windowStyle } from './config/macros.js';
import jQuery from 'jquery';
import { log } from './utils.js';
import { initializeCore } from './core.js';
import { RoomProcessor } from './room-processor.js';

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

// Wait for DOM to be ready
jQuery(async () => {
  // Initialize config first
  await config.initialize();

  // Initialize core
  initializeCore();

  // Initialize room processor
  const roomProcessor = new RoomProcessor();
  config.RoomProcessor = roomProcessor;

  // Add tab click handlers using event delegation
  j('body').on('click', '.tab-btn', (e) => {
    const tab = j(e.target).data('tab');
    
    // Remove active class from all buttons
    j('.tab-btn').removeClass('active');
    
    // Add active class to clicked button
    j(e.target).addClass('active');
    
    // Handle tab actions
    switch(tab) {
      case 'macro':
        // Toggle the macro window through config
        if (config.MacroWindow) {
          config.MacroWindow.toggle();
        }
        break;
      case 'chat':
        // Toggle the communication panel through config
        if (config.CommunicationPanel) {
          config.CommunicationPanel.toggle();
        }
        break;
      case 'imagery':
        // Toggle the imagery panel through config
        if (config.ImageryPanel) {
          config.ImageryPanel.toggle();
        }
        break;
    }
  });

  // Mobile-only layout
  // Enable communication panel
  config.communicationPanel = true;

  // Initialize communication panel
  const communicationPanel = new CommunicationPanel({
    title: 'Communication',
    css: {
      width: config.device.mobile ? '100vw' : '600px',
      height: '400px',
      bottom: '38px', // 30px tab bar + 8px gap
      left: config.device.mobile ? 0 : 'auto',
      right: config.device.mobile ? 'auto' : 100,
      top: config.device.mobile ? 'auto' : 100,
    },
    drag: !config.device.touch,
    snap: true
  });

  await communicationPanel.initialize();

  // Connect CommunicationPanel to Toolbar if in desktop mode
  if (!config.embed && !config.device.mobile && !config.kong && config.Toolbar) {
    config.Toolbar.setCommunicationPanel(communicationPanel);
  }

  // Initialize direction panel
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
  
  // Connect DirectionPanel to Toolbar if in desktop mode
  if (!config.embed && !config.device.mobile && !config.kong && config.Toolbar) {
    config.Toolbar.setDirectionPanel(directionPanel);
  }

  // Initialize imagery panel
  console.log('Initializing imagery panel with config:', {
    mobile: config.device.mobile,
    touch: config.device.touch,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });

  const imageryPanel = new ImageryPanel({
    title: 'Imagery',
    css: {
      width: config.device.mobile ? '100vw' : '600px',
      height: config.device.mobile ? '200px' : '400px',
      top: config.device.mobile ? '10px' : '10px',
      left: config.device.mobile ? '0' : 'auto',
      right: config.device.mobile ? 'auto' : '100px',
      bottom: 'auto',
      position: 'fixed',
      'z-index': config.device.mobile ? '104' : '9999',
      'background-color': 'rgba(0, 0, 0, 0.8)',
      'border-radius': '0',
      'border': config.device.mobile ? 'none' : '1px solid #666',
      'outline': '2px solid red',
      'overflow-y': 'auto',
      'max-height': '50vh'
    },
    drag: !config.device.touch,
    snap: true
  });

  await imageryPanel.initialize();

  // Log the panel's position after initialization
  setTimeout(() => {
    const panel = j('#imagery-panel');
    console.log('Imagery panel position:', {
      offset: panel.offset(),
      width: panel.width(),
      height: panel.height(),
      css: panel.css(['position', 'top', 'left', 'right', 'bottom', 'z-index'])
    });
  }, 100);

  // Connect ImageryPanel to Toolbar if in desktop mode
  if (!config.embed && !config.device.mobile && !config.kong && config.Toolbar) {
    config.Toolbar.setImageryPanel(imageryPanel);
  }

  // Initialize macro window if enabled
  if (config.macroPanel) {
    // Create the MacroWindow instance
    const macroWindow = new MacroWindow({
      ...windowStyle,
      css: {
        ...windowStyle.css,
        width: config.device.mobile ? '100vw' : windowStyle.css.width,
        height: 'auto',
        top: '10vh',
        right: config.device.mobile ? 'auto' : '20px',
        bottom: 'auto',
        left: config.device.mobile ? 0 : 'auto',
        'max-height': '80vh',
        'overflow-y': 'auto',
        'position': 'fixed'
      },
      macros: defaultMacros,
      drag: !config.device.mobile,
      snap: true
    });

    // Initialize the MacroWindow
    macroWindow.initialize();

    // Store in config for both mobile and desktop
    config.MacroWindow = macroWindow;

    // Connect to Toolbar if in desktop mode
    if (!config.embed && !config.device.mobile && !config.kong && config.Toolbar) {
      config.Toolbar.setMacroWindow(macroWindow);
    }
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
        <button class="tab-btn" data-tab="chat">Chat</button>
        <button class="tab-btn" data-tab="imagery">Imagery</button>
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
  } else {
    // Add desktop toolbar button styles
    j('head').append(`
      <style>
        #tmp-toolbar .btn {
          opacity: 1 !important;
          color: #fff !important;
        }
        #tmp-toolbar .btn.disabled {
          opacity: 0.7 !important;
        }
      </style>
    `);
  }
});
