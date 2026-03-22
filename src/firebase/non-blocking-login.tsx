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
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    // Broaden error detection for popup issues
    const isPopupError = 
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.message?.toLowerCase().includes('popup');

    if (isPopupError) {
      console.warn('Sign-in popup was blocked or closed. Falling back to redirect.');
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
    const isPopupError = 
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.message?.toLowerCase().includes('popup');

    if (isPopupError) {
      console.warn('Sign-in popup was blocked or closed. Falling back to redirect.');
      return await signInWithRedirect(authInstance, provider);
    }
    console.error('GitHub sign-in error:', error);
    throw error;
  }
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance);
}
