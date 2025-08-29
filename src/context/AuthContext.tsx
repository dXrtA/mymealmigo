"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "firebase/auth";
import { db, onAuthStateChangedClient } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type AuthCtx = { user: User | null; loading: boolean; isAdmin: boolean; };
const AuthContext = createContext<AuthCtx>({ user: null, loading: true, isAdmin: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChangedClient(async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          setIsAdmin((snap.exists() && (snap.data() as any).role?.toLowerCase?.() === "admin") || false);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  return <AuthContext.Provider value={{ user, loading, isAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
export { AuthContext };
