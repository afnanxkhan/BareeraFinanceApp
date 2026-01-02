import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentAuthUser, getUserProfile, loginUser, logoutUser } from "./lib/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const authUser = await getCurrentAuthUser();

      if (authUser) {
        const dbProfile = await getUserProfile(authUser.email);
        setUser(authUser);
        setProfile(dbProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (e) {
      console.error("Auth check error:", e);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Initializing auth...");
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      await loginUser(email, password);
      await checkUser();
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}