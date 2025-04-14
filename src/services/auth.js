import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Store the nonces globally
let currentNonce = null
let currentHashedNonce = null // Added to store the hashed version

// Generate a nonce for Google Sign In
export const generateNonce = async () => {
  // Generate a raw random nonce (base64)
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  
  // Hash the nonce for Google (SHA-256 hex)
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  
  // Store both nonces globally
  currentNonce = nonce
  currentHashedNonce = hashedNonce
  
  console.log('Generated Raw Nonce (for Supabase):', currentNonce)
  console.log('Generated Hashed Nonce (for Google):', currentHashedNonce)
  
  return { nonce, hashedNonce }
}

// Get the current nonce (raw)
export const getCurrentNonce = async () => {
  if (!currentNonce) {
    // This function might not be strictly needed anymore if handleSignInWithGoogle uses the stored value
    console.warn('getCurrentNonce called when currentNonce is null')
    return null
  }
  return currentNonce
}

// Handle Google Sign In callback
export const handleSignInWithGoogle = async (response) => {
  console.log('Google sign-in response:', response)
  
  if (!response.credential) {
    console.error('No credential received from Google')
    return { error: 'No credential received from Google' }
  }

  try {
    // Decode the JWT to get the nonce
    const [header, payload] = response.credential.split('.')
    const decodedHeader = JSON.parse(atob(header))
    const decodedPayload = JSON.parse(atob(payload))
    
    console.log('JWT Header:', decodedHeader)
    console.log('JWT Payload:', decodedPayload)
    console.log('Extracted nonce:', decodedPayload.nonce)
    console.log('Current stored nonce:', currentNonce)
    
    // Verify the nonce matches what we stored (hashed nonce from Google vs stored hashed nonce)
    if (decodedPayload.nonce !== currentHashedNonce) { // Compare against stored HASHED nonce
      console.error('Nonce mismatch detected:', {
        googleNonce: decodedPayload.nonce,
        storedHashedNonce: currentHashedNonce,
        storedRawNonce: currentNonce // Log raw one too for info
      })
      return { error: { message: 'Nonce mismatch - please try signing in again' } }
    }
    
    // If nonces match, proceed using the RAW nonce for Supabase
    const signInParams = {
      provider: 'google',
      token: response.credential,
      nonce: currentNonce // Send RAW nonce to Supabase
    }
    console.log('Sign in parameters:', signInParams)
    
    const { data, error } = await supabase.auth.signInWithIdToken(signInParams)

    if (error) {
      console.error('Error signing in with Google:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      if (error.message.includes('Provider is not enabled')) {
        console.error('Google OAuth is not enabled in your Supabase project. Please enable it in the Supabase dashboard.')
      }
      // Dispatch failure event (optional, but could be useful)
      document.dispatchEvent(new CustomEvent('loginFailure', { detail: error }));
      return { error }
    }

    console.log('Successfully signed in:', data)
    // Dispatch success event
    document.dispatchEvent(new CustomEvent('loginSuccess', { detail: data }));
    return { data }
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    console.error('Error stack:', error.stack)
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