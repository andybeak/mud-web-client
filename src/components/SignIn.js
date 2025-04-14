import { generateNonce, getCurrentNonce } from '../services/auth.js'
import { supabase, getSession } from '../services/auth.js'

export class SignIn {
  constructor() {
    this.container = null
    this.errorMessage = null
    this.initializeGoogleSignIn()
    this.setupAuthListener()
  }

  async setupAuthListener() {
    // Check initial auth state
    const { session } = await getSession()
    if (session) {
      this.hideSignIn()
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.hideSignIn()
      } else if (event === 'SIGNED_OUT') {
        this.showSignIn()
      }
    })
  }

  hideSignIn() {
    if (this.container) {
      this.container.style.display = 'none'
    }
  }

  showSignIn() {
    if (this.container) {
      this.container.style.display = 'block'
    }
  }

  showError(message) {
    if (!this.errorMessage) {
      this.errorMessage = document.createElement('div')
      this.errorMessage.style.cssText = `
        color: #dc3545;
        margin-top: 1rem;
        padding: 0.5rem;
        background: rgba(220, 53, 69, 0.1);
        border-radius: 4px;
      `
      this.container.appendChild(this.errorMessage)
    }
    this.errorMessage.textContent = message
    this.errorMessage.style.display = 'block'
  }

  hideError() {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none'
    }
  }

  async initializeGoogleSignIn() {
    try {
      const { hashedNonce } = await generateNonce()
      
      // Create a container for the sign-in UI
      this.container = document.createElement('div')
      this.container.id = 'google-signin-container'
      this.container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        background: rgba(255, 255, 255, 0.9);
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 90%;
        width: 400px;
      `
      
      // Add a title
      const title = document.createElement('h2')
      title.textContent = 'Welcome to RetroMUD simple web client'
      title.style.marginBottom = '1rem'
      this.container.appendChild(title)

      // Add a description
      const description = document.createElement('p')
      description.textContent = 'Please sign in with your Google account to continue'
      description.style.marginBottom = '1.5rem'
      description.style.color = '#666'
      this.container.appendChild(description)
      
      // Add Google Sign In button container
      const googleContainer = document.createElement('div')
      googleContainer.innerHTML = `
        <div
          id="g_id_onload"
          data-client_id="${import.meta.env.VITE_GOOGLE_CLIENT_ID}"
          data-context="signin"
          data-ux_mode="popup"
          data-callback="handleSignInWithGoogle"
          data-nonce="${hashedNonce}"
          data-auto_select="true"
          data-itp_support="true"
          data-use_fedcm_for_prompt="true"
        ></div>
        <div
          class="g_id_signin"
          data-type="standard"
          data-shape="pill"
          data-theme="outline"
          data-text="signin_with"
          data-size="large"
          data-logo_alignment="left"
        ></div>
      `
      this.container.appendChild(googleContainer)
      
      // Add to document
      document.body.appendChild(this.container)
      
      // Load Google client library
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onerror = () => {
        this.showError('Failed to load Google Sign-In. Please check your internet connection.')
      }
      document.head.appendChild(script)
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error)
      this.showError('Failed to initialize Google Sign-In. Please try refreshing the page.')
    }
  }
} 