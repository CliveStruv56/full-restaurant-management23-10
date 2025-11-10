import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole, TenantMembership } from '../types';
import { auth, db } from '../firebase/config';
import {
    onAuthStateChanged,
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    signInWithCustomToken,
    signInAnonymously as firebaseSignInAnonymously,
    EmailAuthProvider,
    linkWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    userRole: UserRole | null;
    currentTenantId: string | null;
    tenantMemberships: { [tenantId: string]: TenantMembership } | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (displayName: string, email: string, password: string, tenantId?: string) => Promise<void>;
    logout: () => void;
    switchTenant: (tenantId: string) => Promise<void>;
    signupWithInvitation: (customToken: string) => Promise<void>;
    loginAsGuest: () => Promise<FirebaseUser>;
    upgradeAnonymousAccount: (email: string, password: string, tenantId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
    const [tenantMemberships, setTenantMemberships] = useState<{ [tenantId: string]: TenantMembership } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // User is signed in, get their profile from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();

                    // Build user object with multi-tenant support
                    const appUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || userData.displayName || null,
                        phoneNumber: userData.phoneNumber,
                        createdAt: userData.createdAt || new Date().toISOString(),
                        tenantMemberships: userData.tenantMemberships || {},
                        currentTenantId: userData.currentTenantId,
                        loyaltyPoints: userData.loyaltyPoints || 0,

                        // Legacy fields (backward compatibility)
                        tenantId: userData.tenantId,
                        role: userData.role,
                        invitedBy: userData.invitedBy,
                        invitedAt: userData.invitedAt,
                        invitationAccepted: userData.invitationAccepted,
                    };

                    setUser(appUser);
                    setTenantMemberships(appUser.tenantMemberships);

                    // Determine current tenant and role
                    let activeTenantId: string | null = null;
                    let activeRole: UserRole | null = null;

                    // Special handling for super-admins: they can access any tenant
                    if (appUser.role === 'super-admin') {
                        activeRole = 'super-admin';
                        // Super admins don't need a specific tenant ID for auth purposes
                        // The tenant will be determined by the URL (TenantContext)
                        activeTenantId = null;
                    }
                    // Priority: currentTenantId > first active membership > legacy tenantId
                    else if (appUser.currentTenantId && appUser.tenantMemberships[appUser.currentTenantId]) {
                        activeTenantId = appUser.currentTenantId;
                        activeRole = appUser.tenantMemberships[appUser.currentTenantId].role;
                    } else if (Object.keys(appUser.tenantMemberships).length > 0) {
                        // Use first active membership
                        const firstActiveTenant = Object.keys(appUser.tenantMemberships).find(
                            tenantId => appUser.tenantMemberships[tenantId].isActive
                        );
                        if (firstActiveTenant) {
                            activeTenantId = firstActiveTenant;
                            activeRole = appUser.tenantMemberships[firstActiveTenant].role;
                        }
                    } else if (appUser.tenantId && appUser.role) {
                        // Fallback to legacy structure
                        activeTenantId = appUser.tenantId;
                        activeRole = appUser.role;
                    }

                    setCurrentTenantId(activeTenantId);
                    setUserRole(activeRole);

                    // Store current tenant in localStorage for convenience
                    if (activeTenantId) {
                        localStorage.setItem('lastSelectedTenant', activeTenantId);
                    }
                } else {
                    // User document doesn't exist
                    // Check if this is an anonymous user (guest checkout)
                    if (firebaseUser.isAnonymous) {
                        // Create minimal user object for anonymous users
                        const guestUser: User = {
                            uid: firebaseUser.uid,
                            email: null,
                            displayName: 'Guest',
                            createdAt: new Date().toISOString(),
                            tenantMemberships: {},
                            currentTenantId: undefined,
                            loyaltyPoints: 0,
                        };
                        setUser(guestUser);
                        setUserRole('customer');
                        setCurrentTenantId(null);
                        setTenantMemberships({});
                    } else {
                        console.error('User document not found in Firestore. User may need to be invited by admin.');
                        setUser(null);
                        setUserRole(null);
                        setCurrentTenantId(null);
                        setTenantMemberships(null);
                    }
                }
            } else {
                // User is signed out
                setUser(null);
                setUserRole(null);
                setCurrentTenantId(null);
                setTenantMemberships(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        // Firebase handles login persistence automatically
        // The onAuthStateChanged listener will pick up the new user state
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (displayName: string, email: string, password: string, tenantId: string = 'demo-tenant') => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update Firebase Auth profile
        await updateProfile(firebaseUser, { displayName });

        const now = new Date().toISOString();

        // Create user document with multi-tenant structure
        const newUserDoc: any = {
            email,
            displayName,
            createdAt: now,
            loyaltyPoints: 0,

            // Multi-tenant structure
            tenantMemberships: {
                [tenantId]: {
                    role: 'customer' as UserRole,
                    joinedAt: now,
                    isActive: true,
                },
            },
            currentTenantId: tenantId,

            // Legacy fields (for backward compatibility)
            tenantId,
            role: 'customer' as UserRole,
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);

        // The onAuthStateChanged listener will set the user state in the app
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('lastSelectedTenant');
    };

    /**
     * Switch to a different tenant
     * Updates the currentTenantId in user document and context
     */
    const switchTenant = async (tenantId: string) => {
        if (!user) {
            throw new Error('No user logged in');
        }

        // Verify user has membership in this tenant
        if (!user.tenantMemberships[tenantId]) {
            throw new Error(`User does not have access to tenant: ${tenantId}`);
        }

        // Update current tenant in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            currentTenantId: tenantId,
        });

        // Update local state
        setCurrentTenantId(tenantId);
        setUserRole(user.tenantMemberships[tenantId].role);

        // Update user object
        setUser({ ...user, currentTenantId: tenantId });

        // Store in localStorage
        localStorage.setItem('lastSelectedTenant', tenantId);

        // Reload the page to refresh tenant-specific data
        window.location.reload();
    };

    /**
     * Sign up with invitation using custom token
     * This is called after user completes signup via invitation link
     */
    const signupWithInvitation = async (customToken: string) => {
        // Sign in with the custom token provided by acceptInvitation function
        await signInWithCustomToken(auth, customToken);
        // onAuthStateChanged will handle updating the user state
    };

    /**
     * Sign in anonymously for guest checkout
     * Returns the Firebase user object directly for immediate order placement
     */
    const loginAsGuest = async (): Promise<FirebaseUser> => {
        try {
            const result = await firebaseSignInAnonymously(auth);
            console.log('Guest user signed in anonymously:', result.user.uid);
            return result.user;
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            throw error;
        }
    };

    /**
     * Upgrade an anonymous account to a permanent account
     * Links the anonymous account with email/password credentials
     */
    const upgradeAnonymousAccount = async (email: string, password: string, tenantId: string = 'demo-tenant') => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error('No user is currently signed in');
        }

        if (!currentUser.isAnonymous) {
            throw new Error('Current user is not anonymous');
        }

        try {
            // Create email/password credential
            const credential = EmailAuthProvider.credential(email, password);

            // Link anonymous account with email/password
            await linkWithCredential(currentUser, credential);

            // Update user profile with display name derived from email
            const displayName = email.split('@')[0];
            await updateProfile(currentUser, { displayName });

            // Create user document in Firestore with multi-tenant structure
            const now = new Date().toISOString();
            const newUserDoc: any = {
                email,
                displayName,
                createdAt: now,
                loyaltyPoints: 0,

                // Multi-tenant structure
                tenantMemberships: {
                    [tenantId]: {
                        role: 'customer' as UserRole,
                        joinedAt: now,
                        isActive: true,
                    },
                },
                currentTenantId: tenantId,

                // Legacy fields (for backward compatibility)
                tenantId,
                role: 'customer' as UserRole,
            };

            await setDoc(doc(db, 'users', currentUser.uid), newUserDoc);

            console.log('Anonymous account upgraded successfully');
        } catch (error) {
            console.error('Account upgrade error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            currentTenantId,
            tenantMemberships,
            loading,
            login,
            signup,
            logout,
            switchTenant,
            signupWithInvitation,
            loginAsGuest,
            upgradeAnonymousAccount,
        }}>
            {children}
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
