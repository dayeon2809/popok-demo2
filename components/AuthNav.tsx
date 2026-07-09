"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLoggedInUser, logout } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export default function AuthNav() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Initial check
    setUser(getLoggedInUser());

    // Listen for custom login/logout events to update GNB dynamically
    const handleAuthChange = () => {
      setUser(getLoggedInUser());
    };
    window.addEventListener("poc-auth-change", handleAuthChange);
    
    return () => {
      window.removeEventListener("poc-auth-change", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    window.dispatchEvent(new Event("poc-auth-change"));
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link href="/login" style={{
          textDecoration: "none", fontSize: "0.875rem", fontWeight: 700,
          color: "var(--navy)",
        }}>
          Log in
        </Link>
        <Link href="/submit" style={{
          textDecoration: "none", fontSize: "0.875rem", fontWeight: 800,
          padding: "10px 20px", borderRadius: "10px",
          display: "inline-flex", alignItems: "center",
        }} className="btn-lime">
          Get my POPOK
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
      <Link href="/profile" style={{
        textDecoration: "none", fontSize: "0.875rem", fontWeight: 700,
        color: "var(--navy)", display: "flex", alignItems: "center", gap: "8px"
      }}>
        <img 
          src={user.avatarUrl} 
          alt={user.nickname} 
          style={{ 
            width: "28px", 
            height: "28px", 
            borderRadius: "50%", 
            border: "1px solid var(--border-dark)",
            objectFit: "cover"
          }} 
        />
        <span>{user.nickname}</span>
      </Link>
      <Link href="/submit" style={{
        textDecoration: "none", fontSize: "0.875rem", fontWeight: 800,
        padding: "8px 16px", borderRadius: "10px",
        display: "inline-flex", alignItems: "center",
      }} className="btn-lime">
        Get my POPOK
      </Link>
      <button 
        onClick={handleLogout}
        style={{
          background: "transparent", 
          border: "none", 
          color: "var(--ink-muted)",
          fontSize: "0.82rem", 
          fontWeight: 600, 
          cursor: "pointer", 
          fontFamily: "inherit",
          padding: 0
        }}
      >
        Log out
      </button>
    </div>
  );
}
