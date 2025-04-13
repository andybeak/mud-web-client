import jQuery from 'jquery';
import { config } from './config.js';
import { Event } from './event.js';
import { Window } from './window.js';
import { log } from './utils.js';

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
    this.maxMessages = 50; // Increased maximum number of messages to store
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

    j(this.id).get(0).win = this.win;
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
    // Listen for new text in the main window
    Event.listen('scrollview_add', (text) => {
      if (!text) return; // Skip if text is undefined or null
      
      // Remove HTML tags and decode entities
      const cleanText = text.replace(/<[^>]*>/g, '')
                           .replace(/&nbsp;/g, ' ')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>');
      
      // Split the text into lines and process each line
      const lines = cleanText.split('\n');
      lines.forEach(line => {
        if (!line.trim()) return; // Skip empty lines
        
        // First try to match the "chat last" format
        const lastChatMatch = line.match(/\[(\d+)\]\s*\[(\d{2}:\d{2}:\d{2})\]\s*(?:(\S+)\s+)?\[([^\]]+)\]:\s*(.+)$/s);
        if (lastChatMatch) {
          const [, timestamp, time, character, channel, content] = lastChatMatch;
          // Clean up the content by removing extra whitespace and line breaks
          const cleanContent = content.replace(/\s+/g, ' ').trim();
          this.addChatMessage(character?.trim() || 'System', channel.trim(), cleanContent);
          return;
        }
        
        // Then try to match the regular chat format
        const chatMatch = line.match(/^([^[]+?)\s*\[([^\]]+)\]:\s*(.+)$/s);
        if (chatMatch) {
          const [, character, channel, content] = chatMatch;
          // Clean up the content by removing extra whitespace and line breaks
          const cleanContent = content.replace(/\s+/g, ' ').trim();
          this.addChatMessage(character.trim(), channel.trim(), cleanContent);
        }
      });
    });

    // Backup method: Observe ScrollView content directly
    if (config.ScrollView) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent;
                
                // Split the text into lines and process each line
                const lines = text.split('\n');
                lines.forEach(line => {
                  if (!line.trim()) return; // Skip empty lines
                  
                  // First try to match the "chat last" format
                  const lastChatMatch = line.match(/\[(\d+)\]\s*\[(\d{2}:\d{2}:\d{2})\]\s*(?:(\S+)\s+)?\[([^\]]+)\]:\s*(.+)$/s);
                  if (lastChatMatch) {
                    const [, timestamp, time, character, channel, content] = lastChatMatch;
                    // Clean up the content by removing extra whitespace and line breaks
                    const cleanContent = content.replace(/\s+/g, ' ').trim();
                    this.addChatMessage(character?.trim() || 'System', channel.trim(), cleanContent);
                    return;
                  }
                  
                  // Then try to match the regular chat format
                  const chatMatch = line.match(/^([^[]+?)\s*\[([^\]]+)\]:\s*(.+)$/s);
                  if (chatMatch) {
                    const [, character, channel, content] = chatMatch;
                    // Clean up the content by removing extra whitespace and line breaks
                    const cleanContent = content.replace(/\s+/g, ' ').trim();
                    this.addChatMessage(character.trim(), channel.trim(), cleanContent);
                  }
                });
              }
            });
          }
        });
      });

      const scrollView = j(`${config.ScrollView.id} .out`);
      observer.observe(scrollView[0], { childList: true, subtree: true });
    }
  }

  addChatMessage(character, channel, content) {
    // Only process messages from retro or chat channels
    if (channel !== 'retro' && channel !== 'chat') return;

    // Check for duplicate messages
    const isDuplicate = this.messages.some(msg => 
      msg.character === character && 
      msg.channel === channel && 
      msg.content === content
    );

    // Skip if this is a duplicate message
    if (isDuplicate) return;

    // Add new message to the beginning of the array
    this.messages.unshift({
      character,
      channel,
      content,
      timestamp: new Date()
    });

    // Remove oldest message if we exceed the limit
    if (this.messages.length > this.maxMessages) {
      this.messages.pop();
    }

    // Update the display
    this.updateMessageDisplay();
  }

  updateMessageDisplay() {
    const $messages = j(`${this.id} .chat-messages`);
    $messages.empty();

    // Display messages in reverse chronological order (newest first)
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

    // Scroll to the top (newest messages)
    $messages.scrollTop(0);
  }

  exposeToConfig() {
    config.CommunicationPanel = this;
    setTimeout(() => {
      Event.fire('communicationpanel_ready', this);
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
        'z-index': '200 !important',
        'position': 'fixed',
        'width': this.mobile ? '100vw' : '600px',
        'height': this.mobile ? '50vh' : '400px',
        'min-height': this.mobile ? '200px' : '400px',
        'max-height': this.mobile ? '50vh' : '400px',
        'bottom': this.mobile ? '70px' : 'auto',
        'left': this.mobile ? '0' : 'auto',
        'right': this.mobile ? 'auto' : '100px',
        'top': this.mobile ? 'auto' : '100px',
        'overflow': 'hidden auto',
        'background-color': '#1a1a1a',
        'border-radius': '8px',
        'border': '1px solid #444'
    });
    
    // Force a reflow to ensure proper sizing
    windowElement.height();
    this.win.bringToFront();
  }

  hide() {
    this.visible = false;
    const windowElement = j(this.id);
    
    // Set all visibility properties at once
    windowElement.css({
        'display': 'none',
        'visibility': 'hidden',
        'opacity': '0'
    });
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
} 