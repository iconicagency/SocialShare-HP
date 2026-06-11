'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isTeamMember, TEAM_OWNER_EMAIL } from '@/lib/team';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // effectiveOwnerId: ID dùng cho tất cả Firestore queries
  // - Team members → dùng chung UID của team owner
  // - Người khác → dùng UID của chính họ
  effectiveOwnerId: string | null;
  isTeam: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  effectiveOwnerId: null,
  isTeam: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function getTeamOwnerUid(): Promise<string | null> {
  try {
    // Tìm user doc có email = TEAM_OWNER_EMAIL trong Firestore
    const q = query(collection(db, 'users'), where('email', '==', TEAM_OWNER_EMAIL));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id; // doc ID = Firebase UID
    }
  } catch (e) {
    console.warn('Could not fetch team owner UID:', e);
  }
  return null;
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveOwnerId, setEffectiveOwnerId] = useState<string | null>(null);
  const [isTeam, setIsTeam] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const teamMember = isTeamMember(email);
        setIsTeam(teamMember);

        // Ensure user doc exists
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: teamMember ? 'team' : 'user',
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Could not write user doc:', e);
        }

        // Xác định effectiveOwnerId
        if (teamMember) {
          if (email === TEAM_OWNER_EMAIL) {
            // Chính là owner → dùng uid của mình
            setEffectiveOwnerId(firebaseUser.uid);
          } else {
            // Team member khác → tìm UID của owner
            const ownerUid = await getTeamOwnerUid();
            setEffectiveOwnerId(ownerUid || firebaseUser.uid);
          }
        } else {
          // Không phải team → dùng uid riêng
          setEffectiveOwnerId(firebaseUser.uid);
        }

        setUser(firebaseUser);
      } else {
        setUser(null);
        setEffectiveOwnerId(null);
        setIsTeam(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', error);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, effectiveOwnerId, isTeam, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
