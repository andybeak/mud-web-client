import { generateNonce } from '../services/auth.js'

// Singleton instance
let instance = null

export class SignIn {
  constructor() {
    if (instance) {
      console.log('Returning existing SignIn instance')
      return instance
    }
    instance = this
    console.log('SignIn constructor called')

    this.element = document.createElement('div')
    this.element.className = 'sign-in-window'
    this.element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 90%;
      width: 400px;
      display: none;
      pointer-events: auto;
    `
    console.log('Window element created:', this.element)
    document.body.appendChild(this.element)
    console.log('Window element appended to body')

    // Create container for Google Sign-In button
    this.element.innerHTML = `
      <div class="sign-in-content">
        <h2>Sign In</h2>
        <div class="g_id_signin" data-nonce=""></div>
      </div>
    `
    console.log('Window content set')

    // Add click outside handler
    this.element.addEventListener('click', (e) => {
      // This log helps see what was clicked
      console.log('Window click detected:', e.target) 
      
      // Check if the click was directly on the background overlay (this.element)
      // and not on the content inside it.
      if (e.target === this.element) { 
        this.hide() // Hide the window if the click was outside the content area
      }
    })

    // Track initialization state
    this.initialized = false
    this.buttonRendered = false
    console.log('SignIn constructor complete')

    // Listen for login success
    document.addEventListener('loginSuccess', (event) => {
      console.log('Login success event received:', event.detail)
      this.showSuccessMessage()
    })
  }

  async initializeGoogleSignIn() {
    console.log('Starting Google Sign-In initialization...')
    console.log('Current window state:', {
      display: this.element.style.display,
      visible: this.element.offsetParent !== null,
      buttonRendered: this.buttonRendered
    })
    
    // Generate a new nonce for this sign-in attempt
    const { nonce, hashedNonce } = await generateNonce() // Get both nonces
    // Use the raw nonce for Supabase later (stored globally in auth.js)
    // Use the hashed nonce for Google
    
    // Set the HASHED nonce in the button and initialize calls
    const buttonContainer = this.element.querySelector('.g_id_signin')
    buttonContainer.setAttribute('data-nonce', hashedNonce) // Hashed for Google
    window.nonce = nonce // Store RAW nonce for potential use (though auth.js should use its own global)
    console.log('Initializing Google Sign-In with HASHED nonce:', hashedNonce)

    // Wait for Google client library to load
    if (!window.google) {
      console.log('Loading Google Sign-In library...')
      await new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          console.log('Google Sign-In library loaded')
          resolve()
        }
        document.head.appendChild(script)
      })
    } else {
      console.log('Google Sign-In library already loaded')
    }

    // Initialize Google Sign-In
    console.log('Initializing Google Sign-In with config:', {
      client_id: '856939382785-0d867j443uuu62mbq8nh2qlbhqss2l59.apps.googleusercontent.com',
      callback: window.handleSignInWithGoogle,
      context: 'signin',
      ux_mode: 'popup',
      auto_select: true,
      itp_support: true,
      use_fedcm_for_prompt: true,
      nonce: hashedNonce // Hashed for Google
    })

    window.google.accounts.id.initialize({
      client_id: '856939382785-0d867j443uuu62mbq8nh2qlbhqss2l59.apps.googleusercontent.com',
      callback: window.handleSignInWithGoogle,
      context: 'signin',
      ux_mode: 'popup',
      auto_select: true,
      itp_support: true,
      use_fedcm_for_prompt: true,
      nonce: hashedNonce // Hashed for Google
    })

    // Render the button only if it hasn't been rendered before
    if (!this.buttonRendered) {
      console.log('Rendering Google Sign-In button')
      console.log('Button container found:', buttonContainer)
      window.google.accounts.id.renderButton(
        buttonContainer,
        { theme: 'outline', size: 'large', width: '280' }
      )
      this.buttonRendered = true
      console.log('Button rendered, container now:', buttonContainer.innerHTML)
    } else {
      console.log('Button already rendered, skipping')
    }

    console.log('Google Sign-In initialization complete')
  }

  show() {
    console.log('Showing sign-in window')
    console.log('Window state before show:', {
      display: this.element.style.display,
      visible: this.element.offsetParent !== null,
      zIndex: this.element.style.zIndex
    })
    
    // Ensure window is on top
    this.element.style.zIndex = '9999'
    this.element.style.display = 'block'
    
    console.log('Window state after show:', {
      display: this.element.style.display,
      visible: this.element.offsetParent !== null,
      zIndex: this.element.style.zIndex
    })
  }

  showSuccessMessage() {
    const contentDiv = this.element.querySelector('.sign-in-content')
    if (contentDiv) {
      // Temporarily replace content with success message
      const originalContent = contentDiv.innerHTML
      contentDiv.innerHTML = '<p style="color: green; font-weight: bold;">Login Successful!</p>'
      console.log('Showing success message')

      // Hide the window after a delay
      setTimeout(() => {
        console.log('Hiding window after success')
        this.hide()
        // Restore original content for next time (optional)
        // contentDiv.innerHTML = originalContent
      }, 1500) // Hide after 1.5 seconds
    }
  }

  hide() {
    console.log('Hiding sign-in window')
    this.element.style.display = 'none'
  }

  getElement() {
    return this.element
  }
} 