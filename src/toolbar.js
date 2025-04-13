import jQuery from 'jquery';
import { Event } from './event.js';
import { config } from './config.js';

const j = jQuery;

export class Toolbar {
  constructor() {
    this.communicationPanel = null;
    this.macroWindow = null;
    this.directionPanel = null;
    this.imageryPanel = null;
  }

  initialize() {
    // Check if toolbar already exists
    if (!j('#tmp-toolbar').length) {
      j('body').append('<div id="tmp-toolbar" class="tmp-toolbar"></div>');
    }

    j('#tmp-toolbar').on('click', 'button', (e) => {
      e.stopPropagation();

      const target = j(e.target).attr('href');
      const button = j(e.target);
      
      // Special handling for Communication button
      if (button.hasClass('communication-btn')) {
        if (this.communicationPanel) {
          this.communicationPanel.toggle();
          button.toggleClass('disabled');
        }
        return;
      }

      // Special handling for Macro button
      if (button.hasClass('macro-btn')) {
        if (this.macroWindow) {
          this.macroWindow.toggle();
          button.toggleClass('disabled');
        }
        return;
      }

      // Special handling for Direction button
      if (button.hasClass('direction-btn')) {
        if (this.directionPanel) {
          this.directionPanel.toggle();
          button.toggleClass('disabled');
        } else {
          console.log('No direction panel reference found!');
        }
        return;
      }

      // Special handling for Imagery button
      if (button.hasClass('imagery-btn')) {
        if (this.imageryPanel) {
          this.imageryPanel.toggle();
          button.toggleClass('disabled');
        }
        return;
      }

      // Check if window still exists
      if (!j(target).length) {
        // Window was closed, remove button
        j(e.target).remove();
        return;
      }

      const win = j(target).get(0).win;
      if (button.hasClass('disabled')) {
        win.show();
        button.removeClass('disabled');
      } else {
        win.hide();
        button.addClass('disabled');
      }
    });

    // Event listeners - Make update async to ensure DOM is updated
    Event.listen('window_open', () => setTimeout(() => this.update(), 0));
    Event.listen('window_close', () => setTimeout(() => this.update(), 0));
    Event.listen('window_show', () => setTimeout(() => this.update(), 0));
    Event.listen('window_hide', () => setTimeout(() => this.update(), 0));
    Event.listen('window_front', (id) => this.front(id));

    return this;
  }

  update() {
    j('#tmp-toolbar').empty();

    // Add Macro button first
    j('#tmp-toolbar').append(`
      <button class="btn kbutton macro-btn" title="Toggle Macro Panel">
        Macro
      </button>
    `);

    // Add Communication button
    j('#tmp-toolbar').append(`
      <button class="btn kbutton communication-btn" title="Toggle Communication Panel">
        Communication
      </button>
    `);

    // Add Direction Panel button
    j('#tmp-toolbar').append(`
      <button class="btn kbutton direction-btn" title="Toggle Direction Panel">
        Direction
      </button>
    `);

    // Add Imagery Panel button
    j('#tmp-toolbar').append(`
      <button class="btn kbutton imagery-btn" title="Toggle Imagery Panel">
        Imagery
      </button>
    `);

    return this;
  }

  front(windowSelector) {
    j('#tmp-toolbar button').removeClass('active');
    j(`#tmp-toolbar button[href="${windowSelector}"]`).addClass('active');
  }

  setCommunicationPanel(panel) {
    this.communicationPanel = panel;
  }

  setMacroWindow(window) {
    this.macroWindow = window;
  }

  setDirectionPanel(panel) {
    this.directionPanel = panel;
  }

  setImageryPanel(panel) {
    this.imageryPanel = panel;
  }
}

// Example usage:
// import { Toolbar } from './toolbar.js';
// const toolbar = new Toolbar();
