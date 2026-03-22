'use client';
import {
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

/** 
 * Initiate Google sign-in (non-blocking). 
 * Note: If popups are blocked in your environment, ensure you are 
 * triggering this from a direct user click.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.error('Sign-in popup was blocked by the browser. Please allow popups for this site.');
      // Optional: Fallback to redirect if needed
      // await signInWithRedirect(authInstance, provider);
    } else {
      console.error('Sign-in error:', error);
    }
    throw error;
  }
}

/** Initiate GitHub sign-in (non-blocking). */
export async function initiateGithubSignIn(authInstance: Auth): Promise<void> {
  try {
    const provider = new GithubAuthProvider();
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.error('Sign-in popup was blocked by the browser.');
    }
    throw error;
  }
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance);
}
