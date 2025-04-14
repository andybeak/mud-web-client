import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Store the nonce globally
let currentNonce = null

// Generate a nonce for Google Sign In
export const generateNonce = async () => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  
  // Store the nonce
  currentNonce = nonce
  
  return { nonce, hashedNonce }
}

// Get the current nonce
export const getCurrentNonce = () => currentNonce

// Handle Google Sign In callback
export const handleSignInWithGoogle = async (response) => {
  console.log('Google sign-in response:', response)
  
  if (!response.credential) {
    console.error('No credential received from Google')
    return { error: 'No credential received from Google' }
  }

  try {
    // Use the stored nonce
    const nonce = getCurrentNonce()
    if (!nonce) {
      console.error('No nonce found. Please try signing in again.')
      return { error: 'No nonce found. Please try signing in again.' }
    }
    
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
      nonce: nonce
    })

    if (error) {
      console.error('Error signing in with Google:', error)
      if (error.message.includes('Provider is not enabled')) {
        console.error('Google OAuth is not enabled in your Supabase project. Please enable it in the Supabase dashboard.')
      }
      return { error }
    }

    console.log('Successfully signed in:', data)
    return { data }
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    return { error }
  }
}

// Check if user is authenticated
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
  }
  return { session, error }
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
  return { error }
} 