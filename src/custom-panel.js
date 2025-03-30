import jQuery from 'jquery';
import { config } from './config.js';
import { Event } from './event.js';
import { Window } from './window.js';
import { log } from './utils.js';

const j = jQuery;

export class CustomPanel {
  constructor(options = {}) {
    if (!window.user) return;

    this.options = {
      title: 'Custom Panel',
      css: {
        width: 400,
        height: 300,
        top: 100,
        right: 100,
      },
      ...options,
      id: '#custom-panel',
    };

    this.id = '#custom-panel';
    this.mobile = config.device.mobile;
    this.touch = config.device.touch;
    this.pref = window.user.pref;
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
        ...this.options.css,
        zIndex: 101,
      },
      drag: !this.touch,
      snap: true,
    });

    j(this.id).get(0).win = this.win;
  }

  initLayout() {
    j(`${this.id} .content`).append(`
      <div class="panel-content">
        <div class="section">
          <h3>Section 1</h3>
          <div class="content"></div>
        </div>
        <div class="section">
          <h3>Section 2</h3>
          <div class="content"></div>
        </div>
      </div>
    `);
  }

  initEventListeners() {
    // Add your event listeners here
    j(this.id).on('click', '.button', (e) => {
      // Handle button clicks
      log('Button clicked');
    });
  }

  exposeToConfig() {
    config.CustomPanel = this;
    setTimeout(() => {
      Event.fire('custompanel_ready', this);
    }, 500);
  }
} 