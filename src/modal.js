import jQuery from 'jquery';
import { Modal as BootstrapModal } from 'bootstrap';
import { config } from './config.js';
import { Event } from './event.js';
import { log } from './utils.js';

const j = jQuery;

export class Modal {
  constructor(options) {
    log('Modal.init');
    this.options = options;
    this.options.backdrop = options.backdrop || false;
    this.modalInstance = null;
    this.init();
  }

  close() {
    log('Modal.close');

    if (this.options.abort) {
      config.Socket.write(this.options.abort);
    }

    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  init() {
    const o = this.options;

    // Clean up any existing modals
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
      const instance = BootstrapModal.getInstance(modal);
      if (instance) {
        instance.hide();
        instance.dispose();
      }
      modal.remove();
    });

    if (o.close && o.close === 1) {
      return;
    }

    if (o.mxp) {
      o.replace = 1;
      o.mxp = config.mxp.translate(o.mxp);
      o.text = o.text ? o.mxp + o.text : o.mxp;
    }

    if (o.text) o.text = config.mxp.prep(o.text);
    if (o.error) o.error = config.mxp.prep(o.error);
    if (o.info) o.info = config.mxp.prep(o.info);

    if (o.monospace !== undefined && !o.monospace) {
      o.html = o.text;
      delete o.text;
      log('monospace option is false');
    }

    /* try to update the contents of an already existing modal */
    if (o.replace) {
      if (j('.modal-plain').length && j('.modal').is(':visible')) {
        log('modal (simple) found in replace mode');
        j('.modal h3').html(o.title);
        j('.modal .modal-body').html(o.text || o.html);

        this.setupButtons();
        this.setupLinks();
        return;
      }
    }

    // Hide any existing modals
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
      const modal = BootstrapModal.getInstance(existingModal);
      if (modal) modal.hide();
    }

    const modalTemplate = `
      <div class="modal ${o['class'] || ''} modal-plain fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${o.title || ''}</h5>
              <button type="button" class="btn-close mo-dismiss" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              ${o.info ? `<div class="alert alert-info">${o.info}</div>` : ''}
              ${o.error ? `<div class="alert alert-danger">${o.error}</div>` : ''}
              ${o.text ? `<div class="modal-text-content">${o.text}</div>` : o.html || ''}
            </div>
            <div class="modal-footer">
              ${!o.buttons ? '<button class="btn btn-primary kbutton ok-button dismiss mo-dismiss" data-bs-dismiss="modal">OK</button>' : ''}
              ${o.buttons ? o.buttons.map((button, index) => {
                const buttonClass = button.class || 'btn-secondary';
                return `
                  <button class="btn ${buttonClass} kbutton custom-${index}" ${button.keep ? '' : 'data-bs-dismiss="modal"'}>
                    ${button.text}
                  </button>
                `;
              }).join('') : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    j('body').append(modalTemplate);

    this.modalInstance = new BootstrapModal(j('.modal').get(0));
    console.log('Created modal instance:', this.modalInstance);

    // Add event listener for when modal is hidden
    j('.modal').on('hidden.bs.modal', () => {
      console.log('Modal hidden, cleaning up');
      if (this.modalInstance) {
        this.modalInstance.dispose();
        this.modalInstance = null;
      }
      j('.modal').remove();
    });

    // Add click handlers for custom buttons using event delegation
    if (o.buttons) {
      j('.modal-footer').on('click', '.custom-0, .custom-1', (e) => {
        const index = parseInt(j(e.target).attr('class').match(/custom-(\d+)/)[1]);
        const button = o.buttons[index];
        console.log(`Button ${index} clicked:`, button);
        console.log('Button element:', e.target);
        
        if (button.click) {
          console.log('Executing button click handler');
          button.click(this.modalInstance);
        }
        
        if (!button.keep) {
          console.log('Attempting to hide modal');
          this.modalInstance.hide();
        }
      });
    }

    this.modalInstance.show();

    this.setupButtons();
    this.setupLinks();

    if (o.closeText || o.cancelText) {
      j('.modal .dismiss').html(o.closeText || o.cancelText);
    }

    if (o.showOk === false) {
      j('.modal .ok-button').remove();
    }

    if (o.closeable === false || o.closeable === 0) {
      j('.modal .btn-close').remove();
    }

    if (o.css) {
      if (o.css.width) {
        o.css['margin-left'] = -(o.css.width / 2);
      }
      j('.modal').css(o.css);
    }

    j('.modal .mo-dismiss').on('click', () => this.close());
  }

  setupButtons() {
    const o = this.options;
    if (!o.buttons) return;

    j('.modal-footer .btn').not('.dismiss').remove();

    if (Array.isArray(o.buttons)) {
      o.buttons.forEach((button, index) => {
        const buttonEl = `
          <button class="btn btn-secondary kbutton custom-${index}"
            ${button.keep ? '' : ''}>
            ${button.text}
          </button>
        `;

        j('.modal-footer').append(buttonEl);

        const $button = j('.modal-footer .custom-' + index);

        if (button.send) {
          $button.on('click', () => {
            config.Socket.write(button.send);
            if (!button.keep) {
              this.modalInstance.hide();
            }
          });
        }

        if (button.handler) {
          $button.on('click', (e) => {
            e.preventDefault();
            button.handler();
            if (!button.keep) {
              this.modalInstance.hide();
            }
          });
        }

        if (button.css) {
          $button.css(button.css);
        }
      });
    } else {
      Object.entries(o.buttons).forEach(([text, cmd], index) => {
        const buttonEl = `
          <button class="btn btn-secondary kbutton custom-${index}" 
            data-bs-dismiss="modal">
            ${text}
          </button>
        `;
        j('.modal-footer').append(buttonEl);
        j('.modal-footer .custom-' + index).click(() => {
          config.Socket.write(cmd);
        });
      });
    }
  }

  setupLinks() {
    if (this.options.links) {
      this.options.links.forEach(({ text, cmd }, index) => {
        j('.modal-links').append(`
          <a class="link-${index}" href="#">
            ${text}
          </a><br>
        `);
        j('.modal-links .link-' + index).click(() => {
          config.Socket.write(cmd);
        });
      });
    }
  }
}

// Bootstrap 5 Event handlers
document.addEventListener('shown.bs.modal', () => {
  j('.modal .modal-body').niceScroll({
    cursorborder: 'none',
    cursorwidth: 7,
  });
});

document.addEventListener('hide.bs.modal', () => {
  j('.modal .modal-body').getNiceScroll().remove();
  j('.modal a, .modal button').off('click');
  j('.modal input, .modal textarea').off('keydown');
  j('.modal, .modal-backdrop').remove();
});

// GMCP event listener
Event.listen('gmcp', (data) => {
  if (!data?.startsWith('Modal ')) return data;

  log('Modal: gmcp trigger');

  try {
    const options = JSON.parse(data.match(/^[^ ]+ (.*)/)[1]);
    new Modal(options);
  } catch (error) {
    log('Modal parse error:', error);
  }

  return data;
});