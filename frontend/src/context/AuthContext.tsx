import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db, messaging } from "../lib/firebase";
import {
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { login } from "../lib/api";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getToken } from "firebase/messaging";

interface AuthContextType {
  user: User | null;
  governorId: string | null;
  role: string | null; // "governor" | "officer" | "king"
  loading: boolean;
  loginUser: (governorId: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [governorId, setGovernorId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setGovernorId(firebaseUser.uid);

        // TODO: Fetch role from Firestore instead of hardcoding
        setRole("governor");
      } else {
        setGovernorId(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Push notification subscription
  useEffect(() => {
    const subscribeToPush = async () => {
      if (user && messaging && governorId) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (token) {
              console.log("FCM Token:", token);

              // Subscribe to announcements topic
              await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/subscribe_announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              });

              // Save token in Firestore (merge with existing tokens)
              const userRef = doc(db, "players_profiles", governorId);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
              });

              console.log("Subscribed to announcements + token saved in Firestore");
            }
          }
        } catch (err) {
          console.error("Push notification setup failed", err);
        }
      }
    };

    subscribeToPush();
  }, [user, governorId]);

  const loginUser = async (govId: string, password: string) => {
    const { token } = await login(govId, password);
    await signInWithCustomToken(auth, token);
    setGovernorId(govId);
  };

  const logoutUser = async () => {
    await signOut(auth);
    setGovernorId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, governorId, role, loading, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
