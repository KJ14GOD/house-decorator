"use client";

import Link from "next/link";
import Image from "next/image";
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
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px min(calc(8vw + 40px), 120px) 0 min(calc(8vw + 40px), 120px)",
      fontFamily: 'TWKLausanne, sans-serif',
      background: '#ffffff',
      minHeight: 64,
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 100,
    }}>
      {/* Left: Logo and nav links */}
      <div style={{ display: "flex", alignItems: "center", width: '100%', marginLeft: '50px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#000', marginRight: 32 }}>
          <Image src="/images/newlogo.png" alt="Logo" width={33} height={33} style={{ marginRight: 12 , marginTop: '-10px', marginLeft: '50px'}} />
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase' , marginTop: '-10px'}}>DECORATOR</span>
        </Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/layout" style={{ textDecoration: "none", color: "#000000", fontSize: 17, marginTop: '-10px' }}>Layout</Link>
            <Link href="/board" style={{ textDecoration: "none", color: "#000000", fontSize: 17, marginTop: '-10px' }}>Board</Link>
            <Link href="#" style={{ textDecoration: "none", color: "#000000", fontSize: 17, marginTop: '-10px' }}>Pricing</Link>
          </div>
        </div>
      </div>
      {/* Right: Book Demo and Profile */}
      <div style={{ display: "flex", gap: 16, alignItems: 'center', marginRight: '100px', marginTop: '-10px' }}>
        <a
          href="https://calendly.com/kartik-joshi-ron/30min?month=2025-07"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#000',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            height: 40,
            padding: '0 24px',
            border: 'none',
            borderRadius: 0,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FFD600';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#000';
            e.currentTarget.style.color = '#fff';
          }}
        >
          Book Demo
        </a>
        {!loading && (
          <>
            {user ? (
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  style={{ cursor: 'pointer', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', height: 40, justifyContent: 'center' }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" style={{ width: 40, height: 40, borderRadius: '50%', display: 'block' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontWeight: 'bold', fontSize: 18 }}>
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
                <Link href="/auth" style={{ textDecoration: 'none', color: '#000000', fontSize: 16, whiteSpace: 'nowrap' }}>Sign in</Link>
              </div>
            )}
          </>
        )}
      </div>
      {/* Horizontal line under navbar, between verticals only */}
      <div style={{
        position: 'absolute',
        left: 'calc(8vw + 40px)',
        right: 'calc(8vw + 40px)',
        bottom: 0,
        height: 1,
        background: '#e5e7eb',
        zIndex: 2,
        pointerEvents: 'none',
      }} />
      {/* Left vertical line in navbar (at horizontal bar edge) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 'calc(8vw + 40px)',
        width: '1px',
        height: '100%',
        background: '#e5e7eb',
        zIndex: 2,
        pointerEvents: 'none',
      }} />
      {/* Right vertical line in navbar (at horizontal bar edge) */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 'calc(8vw + 40px)',
        width: '1px',
        height: '100%',
        background: '#e5e7eb',
        zIndex: 2,
        pointerEvents: 'none',
      }} />
    </nav>
  );
} 