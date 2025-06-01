
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
// Import GoogleAuthProvider class here and remove googleAuthProvider instance import
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase'; // Use getter
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const auth = getFirebaseAuth(); // Get auth instance
    if (!auth) {
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth(); // Get auth instance
    if (!auth) {
      toast({
        title: 'Configuration Error',
        description: 'Firebase is not properly configured. Please check console for details.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Instantiate GoogleAuthProvider directly here
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      let errorMessage = 'Could not sign in with Google. Please try again.';
      if (error instanceof Error) {
        // Check if it's a FirebaseError-like object
        const firebaseError = error as any; // Use 'any' for broader compatibility if direct type import is tricky
        if (firebaseError.code) {
            if (firebaseError.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in popup closed before completion.';
            } else if (firebaseError.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Sign-in popup request cancelled.';
            } else if (firebaseError.code === 'auth/web-storage-unsupported' || firebaseError.message?.includes('Access to storage is not allowed')) {
                errorMessage = 'Browser storage is unavailable or disallowed. Please check your browser settings (e.g., third-party cookies, iframe restrictions).';
            } else if (firebaseError.code === 'auth/argument-error') {
                errorMessage = 'Firebase authentication argument error. Please check configuration.';
            }
        }
      }
      toast({
        title: 'Sign In Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    const auth = getFirebaseAuth(); // Get auth instance
    if (!auth) {
       toast({
        title: 'Configuration Error',
        description: 'Firebase is not properly configured. Cannot sign out.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'Successfully signed out.',
      });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: 'Sign Out Error',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
