
'use client';
import {
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider);
}

/** Initiate GitHub sign-in (non-blocking). */
export function initiateGithubSignIn(authInstance: Auth): void {
  const provider = new GithubAuthProvider();
  signInWithPopup(authInstance, provider);
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance);
}
