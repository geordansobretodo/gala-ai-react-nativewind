import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from "../api/tokenStorage";
import { authApi, LoginPayload, RegisterPayload } from "../api/endpoints";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USER: User = {
  id: 1,
  username: "Juan Dela Cruz",
  email: "juan@gala.ai",
  gender: "Male",
  birthdate: "1998-05-15",
  age: 28,
  phone: "+639171234567",
  address: "Imus, Cavite, Philippines",
  account_status: "Active",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const currentUser = await authApi.me();
          setUser(currentUser);
        }
      } catch {
        await clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const signIn = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    await saveAuthToken(res.token);
    setIsDemoMode(false);
    setUser(res.user);
  };

  const signInWithGoogle = async (idToken: string) => {
    const res = await authApi.loginWithGoogle(idToken);
    await saveAuthToken(res.token);
    setIsDemoMode(false);
    setUser(res.user);
  };

  const signUp = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    if (res.token) {
      await saveAuthToken(res.token);
      setIsDemoMode(false);
      setUser(res.user);
    }
  };

  const signInDemo = () => {
    setIsDemoMode(true);
    setUser(DEMO_USER);
  };

  const signOut = async () => {
    try {
      if (!isDemoMode) {
        await authApi.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      await clearAuthToken();
      setIsDemoMode(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        signIn,
        signInWithGoogle,
        signUp,
        signInDemo,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
