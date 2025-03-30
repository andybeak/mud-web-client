import { config } from './config.js';
import { Window } from './window.js';
import jQuery from 'jquery';

const j = jQuery;

export class MacroPanel extends Window {
  constructor(options = {}) {
    super({
      title: 'Macro Panel',
      css: {
        width: '300px',
        height: '200px',
        top: '10px',
        left: '10px',
        'background-color': 'rgba(0, 0, 0, 0.8)',
        'border-radius': '8px',
        'border': '1px solid #666'
      },
      ...options
    });

    this.id = 'macro-panel';
  }

  async initialize() {
    await super.initialize();

    // Create the macro panel content
    const content = j('<div>').addClass('macro-content');
    
    // Add some basic macro buttons
    const macroButtons = [
      { text: 'Look', command: 'look' },
      { text: 'Inventory', command: 'inventory' },
      { text: 'Status', command: 'status' }
    ];

    macroButtons.forEach(macro => {
      const button = j('<button>')
        .addClass('macro-btn')
        .text(macro.text)
        .on('click', () => {
          config.ScrollView.send(macro.command);
        });
      content.append(button);
    });

    // Add the content to the panel
    this.content.append(content);

    // Add styles
    j('head').append(`
      <style>
        .macro-content {
          padding: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .macro-btn {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid #666;
          color: #fff;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .macro-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          border-color: #888;
        }
      </style>
    `);
  }
} 