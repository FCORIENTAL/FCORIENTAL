import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { auth, fbSignInWithGoogle, fbSignOut, onAuthStateChanged, type FirebaseUser } from "@/lib/firebase";

const ADMIN_EMAILS = new Set<string>([
  "redrumsid@gmail.com",
]);

interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    await fbSignInWithGoogle();
  };

  const logout = () => {
    fbSignOut();
  };

  const isAdmin = () => {
    if (!user?.email) return false;
    return ADMIN_EMAILS.has(user.email.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
