import { Event } from './event.js';
import { log } from './utils.js';

export class RoomProcessor {
  constructor() {
    this.partialRoom = null;
    this.lastRoomTime = null;
    this.roomTimeout = 200; // ms to wait for room completion
    this.visitedRooms = new Map(); // Store room data in a Map
    this.roomHistory = []; // Track order of rooms visited
    this.maxHistorySize = 20; // Maximum number of rooms to keep in history
    this.inDescription = false; // Track if we're in a room description
    this.currentRoom = null; // Track the current room being processed
    this.descriptionBuffer = []; // Buffer for collecting description lines
    this.itemsBuffer = []; // Buffer for collecting room items
    this.monstersBuffer = []; // Buffer for collecting room monsters
    this.exitsBuffer = []; // Buffer for collecting room exits
    
    // Hook into the text processing pipeline
    Event.listen('before_html', (text) => {
      // Log raw text with ANSI codes for debugging
      console.log('=== RAW MUD TEXT WITH ANSI CODES ===');
      console.log(this.formatAnsiText(text));
      console.log('===================================');
      return this.process(text);
    });
  }

  formatAnsiText(text) {
    // Replace ANSI codes with readable format
    return text.replace(/\x1B\[([0-?]*[ -/]*[@-~])/g, (match, code) => {
      return `[ANSI:${code}]`;
    });
  }

  process(text) {
    const lines = text.split('\n');
    let processedText = '';
    
    for (const line of lines) {
      const formattedLine = this.formatAnsiText(line);
      
      // If we're not in a room and this looks like a room title
      if (!this.currentRoom && this.isRoomLine(line)) {
        console.log('=== Found new room ===');
        console.log('Title:', this.cleanText(line));
        this.currentRoom = {
          title: this.cleanText(line),
          description: '',
          items: [],
          monsters: [],
          exits: []
        };
        this.descriptionBuffer = [];
        this.itemsBuffer = [];
        this.monstersBuffer = [];
        this.exitsBuffer = [];
        processedText += line + '\n';
        continue;
      }
      
      // If we're in a room
      if (this.currentRoom) {
        // Check if this is the start of the description
        if (formattedLine.startsWith('[ANSI:37;40;0m][ANSI:1;34m]  ')) {
          this.inDescription = true;
          this.descriptionBuffer.push(this.cleanText(line).trim());
          processedText += line + '\n';
          continue;
        }
        
        // If we're in the description, continue collecting lines
        if (this.inDescription) {
          // Check for end of description
          if (formattedLine.includes('Obvious exits are')) {
            this.inDescription = false;
            processedText += line + '\n';
            continue;
          }
          
          // Add wrapped lines to description buffer
          if (!formattedLine.startsWith('[ANSI:')) {
            const cleanLine = this.cleanText(line).trim();
            // If we have a previous line, check if we need to add a space
            if (this.descriptionBuffer.length > 0) {
              const lastLine = this.descriptionBuffer[this.descriptionBuffer.length - 1];
              // If the last line doesn't end with punctuation or space, and this line doesn't start with punctuation
              if (!lastLine.match(/[.,!?]$/) && !lastLine.endsWith(' ') && 
                  !cleanLine.match(/^[.,!?]/) && !cleanLine.startsWith(' ')) {
                this.descriptionBuffer[this.descriptionBuffer.length - 1] = lastLine + ' ' + cleanLine;
              } else {
                this.descriptionBuffer.push(cleanLine);
              }
            } else {
              this.descriptionBuffer.push(cleanLine);
            }
            processedText += line + '\n';
            continue;
          }
        }

        // Check for room items (green text)
        if (formattedLine.includes('[ANSI:1;32m]')) {
          const item = this.cleanText(line);
          if (item) {
            this.itemsBuffer.push(item);
          }
          processedText += line + '\n';
          continue;
        }

        // Check for monsters (magenta text)
        if (formattedLine.includes('[ANSI:1;35m]')) {
          const monster = this.cleanText(line);
          if (monster) {
            this.monstersBuffer.push(monster);
          }
          processedText += line + '\n';
          continue;
        }

        // Check for exits
        if (formattedLine.includes('Obvious exits are')) {
          // Extract all exit names (they're in bright red text)
          const exitMatches = formattedLine.match(/\[ANSI:1;31m\]([^\[\]]+)\[ANSI:37;40;0m\]/g);
          if (exitMatches) {
            this.exitsBuffer = exitMatches.map(exit => {
              return exit.replace(/\[ANSI:1;31m\]/, '').replace(/\[ANSI:37;40;0m\]/, '').trim();
            });
          }
        }

        // Check if we've reached the end of the room data (stats line)
        if (formattedLine.includes('Hp:') && formattedLine.includes('Sp:') && formattedLine.includes('Ep:')) {
          console.log('=== Found end of room description ===');
          // Join all buffered description lines with spaces
          this.currentRoom.description = this.descriptionBuffer.join(' ');
          this.processCompleteRoom(this.currentRoom);
          this.currentRoom = null;
          this.inDescription = false;
          this.descriptionBuffer = [];
          processedText += line + '\n';
          continue;
        }

        // If we have a clean line after stats (additional room description)
        if (!this.currentRoom && !formattedLine.startsWith('[ANSI:') && this.cleanText(line).trim()) {
          // Fire an event for additional room description
          Event.fire('additional_room_description', {
            text: this.cleanText(line).trim()
          });
        }

        processedText += line + '\n';
        continue;
      }
      
      processedText += line + '\n';
    }
    
    return processedText || text;
  }

  isRoomLine(line) {
    const formattedLine = this.formatAnsiText(line);
    return formattedLine.startsWith('[ANSI:37;40;0m][ANSI:1;36m]') && 
           !formattedLine.startsWith('[ANSI:37;40;0m][ANSI:1;36m] ');
  }

  processCompleteRoom(room) {
    // Clean up the description one final time
    room.description = room.description.trim();
    
    // Add items, monsters, and exits
    room.items = this.itemsBuffer;
    room.monsters = this.monstersBuffer;
    room.exits = this.exitsBuffer;
    
    // Add timestamp
    const timestamp = Date.now();
    room.lastVisited = timestamp;
    
    console.log('=== Processing complete room ===');
    console.log('Room data:', JSON.stringify(room, null, 2));
    console.log('===================================');
    
    if (room.title) {
      // If room already exists in history, remove it to update its position
      const existingIndex = this.roomHistory.indexOf(room.title);
      if (existingIndex !== -1) {
        this.roomHistory.splice(existingIndex, 1);
      }
      
      // Add room to history (most recent)
      this.roomHistory.push(room.title);
      
      // Remove oldest room if we exceed the history size
      if (this.roomHistory.length > this.maxHistorySize) {
        const oldestRoom = this.roomHistory.shift();
        this.visitedRooms.delete(oldestRoom);
      }
      
      // Store room data
      this.visitedRooms.set(room.title, room);
      
      Event.fire('room_visited', {
        timestamp: timestamp,
        roomName: room.title,
        roomData: room
      });
    }
  }

  cleanText(text) {
    // Remove ANSI escape sequences
    text = text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
    // Remove other control characters
    text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    // Remove leading/trailing whitespace
    text = text.trim();
    return text;
  }

  getVisitedRooms() {
    // Return rooms in order of most recently visited
    return this.roomHistory.map(roomName => [roomName, this.visitedRooms.get(roomName)]);
  }

  getRoomData(roomName) {
    return this.visitedRooms.get(roomName);
  }

  getRecentRooms(count = 5) {
    // Return the most recent N rooms
    const recentRoomNames = this.roomHistory.slice(-count);
    return recentRoomNames.map(roomName => this.visitedRooms.get(roomName));
  }

  getRoomVisitCount(roomName) {
    return this.roomHistory.filter(name => name === roomName).length;
  }
} 