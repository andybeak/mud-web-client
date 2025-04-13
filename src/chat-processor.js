import { Event } from './event.js';
import { log } from './utils.js';

export class ChatProcessor {
  constructor() {
    this.partialMessage = null;
    this.lastMessageTime = null;
    this.messageTimeout = 200; // ms to wait for message completion
    
    // Hook into the text processing pipeline
    Event.listen('before_html', (text) => this.process(text));
  }

  process(text) {
    const lines = text.split('\n');
    let processedText = '';
    
    console.log('ChatProcessor received text:', text);
    
    for (const line of lines) {
      console.log('Processing line:', line);
      if (this.isChatLine(line)) {
        console.log('Line matched chat pattern');
        // If we have a partial message, process it
        if (this.partialMessage) {
          this.processCompleteMessage(this.partialMessage);
        }
        
        // Start new message
        this.partialMessage = line;
        this.lastMessageTime = Date.now();
        processedText += line + '\n';
      } else if (this.partialMessage) {
        // Check if this is a continuation of the current message
        if (this.isMessageContinuation(line)) {
          console.log('Line is message continuation');
          this.partialMessage += '\n' + line;
          this.lastMessageTime = Date.now();
          processedText += line + '\n';
        } else {
          // Process the complete message
          console.log('Processing complete message due to non-continuation');
          this.processCompleteMessage(this.partialMessage);
          this.partialMessage = null;
          processedText += line + '\n';
        }
      } else {
        processedText += line + '\n';
      }
    }
    
    // Process any remaining partial message
    if (this.partialMessage) {
      console.log('Processing final partial message');
      this.processCompleteMessage(this.partialMessage);
      this.partialMessage = null;
    }
    
    return processedText || text;
  }

  isChatLine(line) {
    // Convert non-ASCII characters to a placeholder for pattern matching
    const asciiLine = line.replace(/[^\x00-\x7F]/g, '');
    const pattern = /^\[(\d+)\]\s*\[(\d{2}:\d{2}:\d{2})\]\s*(?:(\S+)\s+)?\[([^\]]+)\]:/;
    const matches = asciiLine.match(pattern);
    console.log('Checking if line is chat:', line, 'ASCII version:', asciiLine, 'Result:', matches);
    return matches;
  }

  isMessageContinuation(line) {
    // Convert non-ASCII characters to a placeholder for pattern matching
    const asciiLine = line.replace(/[^\x00-\x7F]/g, '');
    // A line is a continuation if:
    // 1. It doesn't start with a timestamp
    // 2. It doesn't start with a status indicator (Hp:, Sp:, etc.)
    // 3. It's not empty
    return asciiLine.trim() !== '' && 
           !asciiLine.match(/^\[(\d+)\]\s*\[(\d{2}:\d{2}:\d{2})\]/) && 
           !asciiLine.match(/^Hp: \d+\/\d+ Sp: \d+\/\d+ Ep: \d+\/\d+/);
  }

  cleanText(text) {
    // Remove ANSI escape sequences
    text = text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
    // Remove other control characters
    text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    return text;
  }

  processCompleteMessage(message) {
    console.log('Processing complete message:', message);
    
    // Split the message into lines and clean up carriage returns
    const lines = message.split('\n').map(line => line.replace(/\r/g, ''));
    const headerLine = lines[0];
    const contentLines = [];
    
    // Process each line after the header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // If we hit a line with non-ASCII characters, that's the end of the chat message
      if (line.match(/[^\x00-\x7F]/)) {
        console.log('Found end of chat message at line:', i);
        break;
      }
      contentLines.push(line);
    }
    
    // Convert non-ASCII characters in header line for pattern matching
    const asciiHeaderLine = headerLine.replace(/[^\x00-\x7F]/g, '');
    const match = asciiHeaderLine.match(/^\[(\d+)\]\s*\[(\d{2}:\d{2}:\d{2})\]\s*(?:(\S+)\s+)?\[([^\]]+)\]:\s*(.*)$/);
    if (match) {
      const [, timestamp, time, character, channel, firstLineContent] = match;
      const content = [firstLineContent, ...contentLines]
        .join('\n')
        .trim();
      
      console.log('Extracted message components:', { timestamp, time, character, channel, content });
      
      // Fire event with structured message data
      Event.fire('chat_message', {
        timestamp: parseInt(timestamp),
        time,
        character: character?.trim() || 'System',
        channel: channel.trim(),
        content: content
      });
    } else {
      console.log('Failed to match message pattern:', message);
    }
  }
} 