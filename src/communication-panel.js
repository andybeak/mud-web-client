import jQuery from 'jquery';
import { config } from './config.js';
import { Event } from './event.js';
import { Window } from './window.js';
import { log } from './utils.js';
import { ChatProcessor } from './chat-processor.js';

const j = jQuery;

export class CommunicationPanel {
  constructor(options = {}) {
    if (!window.user) return;

    this.options = {
      title: 'Communication',
      css: {
        width: 600,
        height: 400,
        top: 100,
        right: 100,
      },
      ...options,
      id: '#communication-panel',
    };

    this.id = '#communication-panel';
    this.mobile = config.device.mobile;
    this.touch = config.device.touch;
    this.pref = window.user.pref;
    this.messages = []; // Array to store messages
    this.maxMessages = 50; // Maximum number of messages to store
    this.visible = false; // Start hidden
    this.exposeToConfig();

    // Initialize chat processor
    this.chatProcessor = new ChatProcessor();
    
    // Listen for processed chat messages
    Event.listen('chat_message', (message) => {
      this.addChatMessage(message.character, message.channel, message.content);
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
        <div class="chat-container">
          <div class="chat-messages"></div>
        </div>
      </div>
    `);

    // Add some basic styling
    j('head').append(`
      <style>
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 5px;
          background: transparent;
        }
        .chat-messages {
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
        .chat-messages::-webkit-scrollbar {
          width: 8px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: #333;
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        .chat-message {
          margin-bottom: 4px;
          line-height: 1.2;
          word-wrap: break-word;
          padding: 2px 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: block;
          width: 100%;
          box-sizing: border-box;
        }
        .chat-message:last-child {
          border-bottom: none;
        }
        .chat-message .character {
          font-weight: bold;
          color: #88ff88;
          display: inline-block;
          margin-right: 2px;
        }
        .chat-message .channel {
          color: #8888ff;
          margin: 0 2px;
          display: inline-block;
        }
        .chat-message .message-text {
          color: #ffffff;
          display: inline-block;
          margin-left: 4px;
          box-sizing: border-box;
          word-break: break-word;
        }
        #communication-panel .content {
          background: #1a1a1a !important;
          padding: 0 !important;
          height: 100% !important;
        }
        #communication-panel .panel-content {
          background: #1a1a1a !important;
          height: 100% !important;
        }
        @media (max-width: 768px) {
          #communication-panel {
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
    // Remove old chat detection logic
    // The new ChatProcessor handles this through events
  }

  addChatMessage(character, channel, content) {
    console.log('CommunicationPanel received message:', { character, channel, content });
    if (channel === 'retro' || channel === 'chat') {
      console.log('Message channel accepted:', channel);
      const isDuplicate = this.messages.some(msg => 
        msg.character === character && 
        msg.channel === channel && 
        msg.content === content
      );

      if (isDuplicate) return;

      this.messages.unshift({
        character,
        channel,
        content,
        timestamp: new Date()
      });

      if (this.messages.length > this.maxMessages) {
        this.messages.pop();
      }

      this.updateMessageDisplay();
    } else {
      console.log('Message channel rejected:', channel);
    }
  }

  updateMessageDisplay() {
    const $messages = j(`${this.id} .chat-messages`);
    $messages.empty();

    this.messages.forEach(msg => {
      const $message = j(`
        <div class="chat-message">
          <span class="character">${msg.character}</span>
          <span class="channel">[${msg.channel}]</span>
          <span class="message-text">${msg.content}</span>
        </div>
      `);
      
      $messages.append($message);
    });

    $messages.scrollTop(0);
  }

  exposeToConfig() {
    config.CommunicationPanel = this;
    setTimeout(() => {
      Event.fire('communicationpanel_ready', this);
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