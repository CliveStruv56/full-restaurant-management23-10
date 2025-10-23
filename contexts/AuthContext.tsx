import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { auth, db } from '../firebase/config';
import {
    onAuthStateChanged,
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    userRole: UserRole | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (displayName: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // User is signed in, get their profile from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const appUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        // FIX: Explicitly cast the role to UserRole to satisfy TypeScript's type checker.
                        // The data from Firestore is untyped, so `userData.role` is `any`.
                        role: (userData.role || 'customer') as UserRole,
                        loyaltyPoints: userData.loyaltyPoints || 0,
                    };
                    setUser(appUser);
                    setUserRole(appUser.role);
                } else {
                    // This case might happen if a user was created in Auth but their Firestore doc failed to be created.
                    // We can create it here as a fallback.
                    const defaultUserData = {
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        role: 'customer' as UserRole,
                        loyaltyPoints: 0,
                    };
                    await setDoc(userDocRef, defaultUserData);
                    // FIX: Resolved error by ensuring `defaultUserData.role` is correctly typed as `UserRole` before spreading.
                    // This prevents TypeScript from widening the type to `string`, which caused an assignment error.
                     const appUser: User = {
                        uid: firebaseUser.uid,
                        ...defaultUserData
                     };
                     setUser(appUser);
                     setUserRole(appUser.role);
                }
            } else {
                // User is signed out
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        // NOTE: Firebase handles login persistence automatically.
        // The onAuthStateChanged listener will pick up the new user state.
        await signInWithEmailAndPassword(auth, email, password);
    };
    
    const signup = async (displayName: string, email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update Firebase Auth profile
        await updateProfile(firebaseUser, { displayName });

        // Create user document in Firestore
        const newUserDoc = {
            email,
            displayName,
            // FIX: Explicitly cast the role to UserRole to ensure type safety when creating new user documents.
            role: 'customer' as UserRole,
            loyaltyPoints: 0,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
        
        // The onAuthStateChanged listener will set the user state in the app
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userRole, loading, login, signup, logout }}>
            {children}
        {/* FIX: Corrected the closing tag from `Auth-Provider` to `AuthContext.Provider` to match the opening tag. */}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};