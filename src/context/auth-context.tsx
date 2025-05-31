
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '@/lib/firebase'; // auth can be null
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
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Skipping AuthProvider setup.");
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
      await signInWithPopup(auth, googleAuthProvider);
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      let errorMessage = 'Could not sign in with Google. Please try again.';
      // Basic error check, specific Firebase error codes can be checked if needed
      if (error instanceof Error) {
        if ('code' in error && typeof error.code === 'string') {
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in popup closed before completion.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Sign-in popup request cancelled.';
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
