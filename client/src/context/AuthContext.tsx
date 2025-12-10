// AuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";

interface User {
    email: string,
    role: string, 
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

//   // Runs once when the app loads
//   async function refreshUser() {
//     try {
//       const res = await fetch("/auth/me", {
//         method: "GET",
//         credentials: "include", // IMPORTANT → send cookies
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setUser(data.user);
//       } else {
//         setUser(null);
//       }
//     } catch {
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   }

  // User login
  async function login(data: User) {
    setUser(data); // store user info (not the token)
  }

  // User logout
  async function logout() {
    setUser(null);
  }

//   useEffect(() => {
//     refreshUser();
//   }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
