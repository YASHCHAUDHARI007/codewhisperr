'use client';
import {
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** 
 * Initiate Google sign-in.
 * Tries popup first, falls back to redirect if popups are blocked or browser restricted.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
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
      toast({
        title: "Redirecting to Sign-in",
        description: "Your browser blocked the sign-in popup. Redirecting you to complete sign-in safely.",
      });
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
      toast({
        title: "Redirecting to Sign-in",
        description: "Your browser blocked the sign-in popup. Redirecting you to complete sign-in safely.",
      });
      return await signInWithRedirect(authInstance, provider);
    }
    
    console.error('GitHub sign-in error:', error);
    throw error;
  }
}

/**
 * Initiate Email/Password sign-in.
 */
export async function initiateEmailSignIn(authInstance: Auth, email: string, pass: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(authInstance, email, pass);
    toast({ title: "Welcome back!", description: "Successfully signed in." });
  } catch (error: any) {
    toast({ 
      title: "Sign-in Failed", 
      description: error.message || "Invalid credentials.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Initiate Email/Password sign-up.
 */
export async function initiateEmailSignUp(authInstance: Auth, email: string, pass: string, name: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    toast({ title: "Account Created", description: "Welcome to CodeWhisper!" });
  } catch (error: any) {
    toast({ 
      title: "Sign-up Failed", 
      description: error.message || "Could not create account.",
      variant: "destructive"
    });
    throw error;
  }
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance).catch(err => console.error("Sign out error:", err));
}
