import { log } from './utils.js';

/**
 * Event System Documentation
 * 
 * This module provides a simple event system for the application. It allows components to communicate
 * with each other through events without direct dependencies.
 * 
 * To add a new event:
 * 1. Add the event name to the q object below
 * 2. Initialize it as an empty array: eventName: []
 * 3. Use Event.fire('eventName', data) to trigger the event
 * 4. Use Event.listen('eventName', callback) to handle the event
 * 
 * Example:
 * // Add new event to q object:
 * q: {
 *   my_new_event: [],
 *   ...
 * }
 * 
 * // Fire the event:
 * Event.fire('my_new_event', { someData: 'value' });
 * 
 * // Listen for the event:
 * Event.listen('my_new_event', (data) => {
 *   console.log('Received:', data.someData);
 * });
 */

export const Event = {
  /**
   * Event Queue
   * 
   * This object stores all event listeners for each event type.
   * Each event is an array of callback functions that will be called
   * when the event is fired.
   * 
   * To add a new event type:
   * 1. Add a new property with the event name
   * 2. Initialize it as an empty array
   * 3. Document the event's purpose and expected data structure
   */
  q: {
    // Socket events
    socket_open: [],      // Fired when socket connection opens
    socket_data: [],      // Fired when socket receives data
    socket_before_close: [], // Fired before socket closes
    socket_close: [],     // Fired when socket closes

    // Chat events
    chat_open: [],        // Fired when chat panel opens
    chat_data: [],        // Fired when chat data is received
    chat_before_close: [], // Fired before chat panel closes
    chat_close: [],       // Fired when chat panel closes
    chat_message: [],     // Fired when a chat message is sent/received

    // Telnet events
    telnet_open: [],      // Fired when telnet connection opens
    telnet_before_close: [], // Fired before telnet closes
    telnet_close: [],     // Fired when telnet closes

    // Protocol events
    before_process: [],   // Fired before processing incoming data
    after_protocols: [],  // Fired after protocol processing
    before_html: [],      // Fired before HTML conversion
    internal_colorize: [], // Fired for internal color processing
    internal_mxp: [],     // Fired for internal MXP processing
    before_display: [],   // Fired before displaying content
    after_display: [],    // Fired after displaying content
    before_send: [],      // Fired before sending data

    // UI Component events
    scrollview_ready: [], // Fired when scrollview is ready
    scrollview_add: [],   // Fired when content is added to scrollview
    chatterbox_ready: [], // Fired when chatterbox is ready
    controlpanel_ready: [], // Fired when control panel is ready
    macropane_ready: [],  // Fired when macro pane is ready

    // Protocol-specific events
    will_msdp: [],        // Fired for MSDP protocol negotiation
    msdp: [],            // Fired when MSDP data is received
    will_gmcp: [],       // Fired for GMCP protocol negotiation
    gmcp: [],            // Fired when GMCP data is received
    will_atcp: [],       // Fired for ATCP protocol negotiation
    atcp: [],            // Fired when ATCP data is received
    will_mxp: [],        // Fired for MXP protocol negotiation
    mxp_elements: [],    // Fired for MXP elements
    mxp_entity: [],      // Fired for MXP entities
    mxp_frame: [],       // Fired for MXP frames
    mxp_dest: [],        // Fired for MXP destinations

    // Window management events
    window_open: [],     // Fired when a window opens
    window_close: [],    // Fired when a window closes
    window_front: [],    // Fired when a window comes to front
    window_hide: [],     // Fired when a window is hidden
    window_show: [],     // Fired when a window is shown

    // Game events
    room_visited: [],    // Fired when player enters a new room
  },

  /**
   * Fire an event
   * 
   * @param {string} event - The name of the event to fire
   * @param {any} data - The data to pass to event listeners
   * @param {any} caller - Optional caller information
   * @returns {any} The result of the last event listener
   * 
   * Example:
   * Event.fire('my_event', { data: 'value' });
   */
  fire(event, data, caller) {
    if (!this.q[event]) {
      log(`Event.js: No such event to fire: ${event}`);
      return 0;
    }

    if (event === 'room_visited') {
      console.log('Event.fire: room_visited', data);
    }

    return this.q[event].reduce(
      (acc, callback) => callback(acc, caller),
      data,
    );
  },

  /**
   * Listen for an event
   * 
   * @param {string} event - The name of the event to listen for
   * @param {Function} callback - The function to call when the event fires
   * @returns {number} 1 if successful, 0 if event doesn't exist
   * 
   * Example:
   * Event.listen('my_event', (data) => {
   *   console.log('Event received:', data);
   * });
   */
  listen(event, callback) {
    if (!this.q[event]) {
      log(`Event.js: No such event to subscribe to: ${event}`);
      return 0;
    }

    if (event === 'room_visited') {
      console.log('Event.listen: room_visited', callback);
    }

    this.q[event].push(callback);
    return 1;
  },

  /**
   * Remove an event listener
   * 
   * @param {string} event - The name of the event
   * @param {Function} callback - The callback function to remove
   * @returns {number} 1 if removed, 0 if not found
   * 
   * Example:
   * const myCallback = (data) => console.log(data);
   * Event.listen('my_event', myCallback);
   * Event.drop('my_event', myCallback);
   */
  drop(event, callback) {
    if (!this.q[event]) {
      log(`Event.js: No such event to drop from: ${event}`);
      return 0;
    }

    const index = this.q[event].indexOf(callback);
    if (index !== -1) {
      this.q[event].splice(index, 1);
      return 1;
    }
    return 0;
  },

  /**
   * Create a new event type
   * 
   * @param {string} event - The name of the new event
   * 
   * Example:
   * Event.create('my_new_event');
   */
  create(event) {
    if (this.q[event]) {
      log(
        `Event.js: This event already exists and will not be created: ${event}`,
      );
      return;
    }
    this.q[event] = [];
    log(`Event.js: Event created: ${event}`);
  },

  /**
   * Remove an event type and all its listeners
   * 
   * @param {string} event - The name of the event to remove
   * 
   * Example:
   * Event.destroy('my_event');
   */
  destroy(event) {
    if (!this.q[event]) {
      log(
        `Event.js: This event does not exist and will not be destroyed: ${event}`,
      );
      return;
    }
    delete this.q[event];
    log(`Event.js: Event destroyed: ${event}`);
  },
};
