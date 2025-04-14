import { Window } from './window.js';
import { signIn, signOut } from './services/auth.js';

export class LoginWindow extends Window {
  constructor(options = {}) {
    super({
      id: 'login-window',
      title: window.user?.id ? 'Logout' : 'Login',
      width: 300,
      height: window.user?.id ? 150 : 200,
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 100,
      handle: true,
      resizable: false,
      ...options
    });

    this.setupContent();
  }

  setupContent() {
    const content = document.createElement('div');
    content.className = 'login-content';
    content.style.padding = '20px';
    content.style.textAlign = 'center';

    if (window.user?.id) {
      // Logout state
      content.innerHTML = `
        <p>You are currently logged in as ${window.user.email}</p>
        <button class="btn btn-danger" style="margin-top: 20px;">
          <i class="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      `;

      const logoutButton = content.querySelector('button');
      logoutButton.addEventListener('click', async () => {
        try {
          await signOut();
          window.location.reload();
        } catch (error) {
          console.error('Error signing out:', error);
        }
      });
    } else {
      // Login state
      content.innerHTML = `
        <p>Login is optional. You can continue without logging in.</p>
        <div id="g_id_onload"
          data-client_id="856939382785-0d867j443uuu62mbq8nh2qlbhqss2l59.apps.googleusercontent.com"
          data-context="signin"
          data-ux_mode="popup"
          data-callback="handleGoogleSignIn"
          data-auto_prompt="false">
        </div>
        <div class="g_id_signin"
          data-type="standard"
          data-size="large"
          data-theme="outline"
          data-text="signin_with"
          data-shape="rectangular"
          data-logo_alignment="left">
        </div>
        <button class="btn btn-secondary" style="margin-top: 20px;">
          Continue without login
        </button>
      `;

      const continueButton = content.querySelector('.btn-secondary');
      continueButton.addEventListener('click', () => {
        this.hide();
      });
    }

    this.content.appendChild(content);
  }
} 