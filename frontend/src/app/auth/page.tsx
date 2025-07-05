"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/layout');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The useEffect will handle the redirect
    } catch (error) {
      console.error("Error signing in with Google", error);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // The useEffect will handle the redirect
    } catch (error: any) {
      console.error("Error with email/password auth", error);
      setError(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', background: '#fdfdfb', color: '#222' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', marginBottom: 16 }}>
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p style={{ fontSize: 18, color: '#6b7280', margin: '0' }}>
              {isSignUp ? 'Get started with your design journey.' : 'Sign in to continue.'}
            </p>
        </div>

        {/* Toggle between Sign In and Sign Up */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
          <button onClick={() => setIsSignUp(false)} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, background: !isSignUp ? '#facc15' : 'transparent', color: '#222', fontWeight: 600, cursor: 'pointer', boxShadow: !isSignUp ? '0 2px 8px rgba(250,204,21,0.10)' : 'none', transition: 'background 0.2s' }}>
            Sign In
          </button>
          <button onClick={() => setIsSignUp(true)} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, background: isSignUp ? '#facc15' : 'transparent', color: '#222', fontWeight: 600, cursor: 'pointer', boxShadow: isSignUp ? '0 2px 8px rgba(250,204,21,0.10)' : 'none', transition: 'background 0.2s' }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleEmailPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, background: '#fff', color: '#222' }}
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ padding: '14px 40px 14px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, background: '#fff', color: '#222', width: '100%' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            style={{
              background: '#222', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 32px',
              fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#000'}
            onMouseLeave={e => e.currentTarget.style.background = '#222'}
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {error && <p style={{ color: 'red', textAlign: 'center', marginTop: 16, fontSize: 14 }}>{error}</p>}

        <button
          onClick={handleGoogleSignIn}
          style={{
            background: '#fff', color: '#222', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 32px',
            fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 16
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 