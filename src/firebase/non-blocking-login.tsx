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
 * Tries popup first, falls back to redirect if popups are blocked.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.warn('Popup blocked, falling back to redirect sign-in.');
      return await signInWithRedirect(authInstance, provider);
    }
    console.error('Sign-in error:', error);
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
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.warn('Popup blocked, falling back to redirect sign-in.');
      return await signInWithRedirect(authInstance, provider);
    }
    console.error('Sign-in error:', error);
    throw error;
  }
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance);
}
