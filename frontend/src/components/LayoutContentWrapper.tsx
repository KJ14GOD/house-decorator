"use client";

import React from 'react';

interface LayoutContentWrapperProps {
  children: React.ReactNode;
}

export default function LayoutContentWrapper({
  children,
}: LayoutContentWrapperProps) {
  const isPinboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/pinboard');
  return (
    <>
      {/* Global CSS to hide scroll bars */}
      <style jsx global>{`
        * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        
        *::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
        
        html, body {
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Vertical Guide Lines */}
      <div style={{
        position: 'fixed',
        top: isPinboard ? 0 : 64,
        bottom: 0,
        left: 'calc(8vw + 40px)',
        width: '1px',
        backgroundColor: '#d4d4d8',
        zIndex: 1,
        opacity: 0.6,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'fixed',
        top: isPinboard ? 0 : 64,
        bottom: 0,
        right: 'calc(8vw + 40px)',
        width: '1px',
        backgroundColor: '#d4d4d8',
        zIndex: 1,
        opacity: 0.6,
        pointerEvents: 'none'
      }} />

      {/* Main Content Wrapper */}
      <div style={{
        position: 'absolute',
        top: isPinboard ? 0 : 64,
        left: 'min(calc(8vw + 40px), 120px)',
        right: 'min(calc(8vw + 40px), 120px)',
        bottom: 0,
        overflowY: 'auto',
        zIndex: 2,
        padding: 'clamp(24px, 4vw, 72px) clamp(24px, 4vw, 48px)'
      }}>
        {/* Inner Content Container */}
        <div style={{
          maxWidth: '1500px',
          margin: '0 auto',
          padding: '0' /* Inner padding handled by outer wrapper */
        }}>
          {children}
        </div>
      </div>
    </>
  );
}