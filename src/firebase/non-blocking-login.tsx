'use client';
import {
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth';

/** 
 * Initiate Google sign-in.
 * Tries popup first, falls back to redirect if popups are blocked or browser restricted.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    // Attempt popup sign-in
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    // Detect if the error is related to a blocked or closed popup
    const errorCode = error?.code;
    const errorMessage = error?.message?.toLowerCase() || "";
    
    const isPopupBlocked = 
      errorCode === 'auth/popup-blocked' || 
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-closed-by-user' ||
      errorMessage.includes('popup') ||
      errorMessage.includes('blocked');

    if (isPopupBlocked) {
      console.warn('Sign-in popup was blocked or closed. Falling back to redirect.');
      // Trigger redirect instead
      return await signInWithRedirect(authInstance, provider);
    }
    
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/** 
 * Initiate GitHub sign-in.
 * Tries popup first, falls back to redirect if popups are blocked.
 */
export async function initiateGithubSignIn(authInstance: Auth): Promise<void> {
  const provider = new GithubAuthProvider();
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    const errorCode = error?.code;
    const errorMessage = error?.message?.toLowerCase() || "";
    
    const isPopupBlocked = 
      errorCode === 'auth/popup-blocked' || 
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-closed-by-user' ||
      errorMessage.includes('popup') ||
      errorMessage.includes('blocked');

    if (isPopupBlocked) {
      console.warn('Sign-in popup was blocked or closed. Falling back to redirect.');
      return await signInWithRedirect(authInstance, provider);
    }
    
    console.error('GitHub sign-in error:', error);
    throw error;
  }
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance).catch(err => console.error("Sign out error:", err));
}
