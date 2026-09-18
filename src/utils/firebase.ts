import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<GoogleUserProfile | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user && user.email) {
      const profile: GoogleUserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || undefined,
      };
      return profile;
    }
  } catch (error: any) {
    console.warn('Firebase popup sign-in encountered an issue (may be blocked by iframe):', error?.message || error);
    throw error;
  }
  return null;
}

// Sign out
export async function signOutManager(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
  }
}
