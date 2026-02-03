// AuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";

const LOCALURL = import.meta.env.FETCHURL;
interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  enterGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const isLoggedIn = Boolean(user);

  const GUEST_KEY = "powerbidz_guest";

  // Runs once when the app loads
  async function refreshUser() {
    try {
      const res = await fetch("http://localhost:8080/api/auth/check", {
        method: "GET",
        credentials: "include", // important to send the cookie
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsGuest(false);
        localStorage.removeItem(GUEST_KEY);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // User login
  async function login(data: User) {
    setUser(data);
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  }

  // User logout
  async function logout() {
    try {
      const res = await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to logout");
    } catch (err: any) {
      console.error("Logout error", err);
    } finally {
      setUser(null); // clear user in context
      setIsGuest(false);
      localStorage.removeItem(GUEST_KEY);
    }
  }

  function enterGuest() {
    setUser(null);
    setIsGuest(true);
    localStorage.setItem(GUEST_KEY, "1");
  }

  function exitGuest() {
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  }

  useEffect(() => {
    // If the user previously chose guest mode, keep them in guest mode until login.
    if (localStorage.getItem(GUEST_KEY) === "1") {
      setIsGuest(true);
    }
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isGuest,
        loading,
        login,
        logout,
        enterGuest,
        exitGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
