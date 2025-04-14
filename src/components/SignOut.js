import { supabase, getSession } from '../services/auth.js'

export class SignOut {
  constructor() {
    this.container = null
    this.errorMessage = null
    this.clickOutsideHandler = this.handleClickOutside.bind(this)
    this.setupAuthListener()
  }

  async setupAuthListener() {
    // Check initial auth state
    const { session } = await getSession()
    if (!session) {
      this.hideSignOut()
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.showSignOut()
      } else if (event === 'SIGNED_OUT') {
        this.hideSignOut()
      }
    })
  }

  hideSignOut() {
    if (this.container) {
      this.container.style.display = 'none'
      document.removeEventListener('click', this.clickOutsideHandler)
    }
  }

  showSignOut() {
    if (this.container) {
      this.container.style.display = 'block'
      // Add a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', this.clickOutsideHandler)
      }, 100)
    }
  }

  handleClickOutside(event) {
    if (this.container && !this.container.contains(event.target)) {
      this.hideSignOut()
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

  async initializeSignOut() {
    try {
      // Create a container for the sign-out UI
      this.container = document.createElement('div')
      this.container.id = 'sign-out-container'
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
      
      // Add user info
      const { session } = await getSession()
      const userInfo = document.createElement('div')
      userInfo.style.marginBottom = '1.5rem'
      userInfo.innerHTML = `
        <h2 style="margin-bottom: 0.5rem">Signed in as</h2>
        <p style="margin: 0; color: #666">${session?.user?.email || 'Unknown user'}</p>
      `
      this.container.appendChild(userInfo)
      
      // Add Sign Out button
      const signOutButton = document.createElement('button')
      signOutButton.className = 'btn btn-danger'
      signOutButton.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-right: 0.5rem;
      `
      signOutButton.innerHTML = `
        <i class="fa-solid fa-right-from-bracket"></i>
        Sign Out
      `
      signOutButton.addEventListener('click', async () => {
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          window.location.reload()
        } catch (error) {
          console.error('Error signing out:', error)
          this.showError('Failed to sign out. Please try again.')
        }
      })
      this.container.appendChild(signOutButton)

      // Add cancel button
      const cancelButton = document.createElement('button')
      cancelButton.className = 'btn btn-secondary'
      cancelButton.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
      `
      cancelButton.textContent = 'Cancel'
      cancelButton.addEventListener('click', () => this.hideSignOut())
      this.container.appendChild(cancelButton)
      
      // Add to document
      document.body.appendChild(this.container)
      
    } catch (error) {
      console.error('Error initializing Sign Out:', error)
      this.showError('Failed to initialize Sign Out. Please try refreshing the page.')
    }
  }
} 