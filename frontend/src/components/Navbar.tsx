"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/firebase";
import { signOut } from "firebase/auth";
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Hide navbar on chat page
  if (pathname === '/chat') {
    return null;
  }
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 48px 0 48px", fontFamily: 'TWKLausanne, sans-serif' }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link href="/" style={{ textDecoration: "none", color: "#222" }}><span style={{ fontWeight: 700, fontSize: 22 }}>Decorator</span></Link>
        <Link href="/layout" style={{ textDecoration: "none", color: "#222", fontSize: 16 }}>Layout</Link>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: 'center' }}>
        {!loading && (
          <>
            {user ? (
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  style={{ cursor: 'pointer', padding: 0, borderRadius: '50%' }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" style={{ width: 48, height: 48, borderRadius: '50%', display: 'block' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontWeight: 'bold', fontSize: 22 }}>
                      {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #f3f4f6',
                  zIndex: 10,
                  minWidth: 240,
                  opacity: dropdownOpen ? 1 : 0,
                  transform: `translateY(${dropdownOpen ? 0 : '-5px'})`,
                  transition: 'opacity 150ms ease-in-out, transform 150ms ease-in-out',
                  pointerEvents: dropdownOpen ? 'auto' : 'none',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#111827' }}>{user.displayName || 'Anonymous User'}</p>
                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280', marginTop: 4, wordBreak: 'break-all' }}>{user.email}</p>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <button
                      onClick={handleSignOut}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#374151',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        width: '100%',
                        textAlign: 'left',
                        fontSize: 14,
                        borderRadius: 8
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '48px', display: 'flex', alignItems: 'center' }}>
                <Link href="/auth" style={{ textDecoration: 'none', color: '#222', fontSize: 16 }}>Sign in</Link>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
} 