import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    if (tokenStore.get()) api("/api/auth/logout", { method: "POST" }).catch(() => {});
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { tokenStore.clear(); setUser(null); });
    if (!tokenStore.get()) return;
    api("/api/auth/me").then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const finish = (res) => { tokenStore.set(res.access_token); setUser(res.user); return res.user; };
  const login = (email, password) => api("/api/auth/login", { method: "POST", body: { email, password } }).then(finish);
  const signup = (name, email, password) =>
    api("/api/auth/signup", { method: "POST", body: { name, email, password } }).then(finish);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
