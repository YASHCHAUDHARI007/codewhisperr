'use client';
import {
  Auth,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

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
