"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: `
        radial-gradient(circle at 40% 90%, rgba(255, 69, 0, 0.8) 0%, transparent 60%),
        radial-gradient(circle at 75% 85%, rgba(239, 68, 68, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 60% 100%, rgba(59, 130, 246, 0.4) 0%, transparent 70%),
        #f8fafc
      `, 
      color: "#222",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Canvas weave texture overlay - Option 2: Canvas Weave */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          repeating-linear-gradient(0deg, transparent 0px, rgba(0,0,0,0.01) 1px, transparent 2px),
          repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.008) 1px, transparent 2px),
          radial-gradient(circle at 25% 75%, rgba(255,255,255,0.03) 1px, transparent 1px),
          radial-gradient(circle at 75% 25%, rgba(0,0,0,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '1px 1px, 1px 1px, 4px 4px, 6px 6px',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: 0.8
      }} />



      {/* Main Content Container */}
      <div style={{
        maxWidth: '1500px',
        margin: '0 auto',
        padding: '120px 48px 80px 48px',
        position: 'relative',
        zIndex: 2
      }}>
        
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '80px'
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 84px)',
            fontWeight: 900,
            color: '#222',
            margin: '0 0 32px 0',
            lineHeight: '0.95',
            letterSpacing: '-0.04em',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Interior Design. Room Planning.<br />The AI Home Decor Sandbox.
          </h1>
          <p style={{
            fontSize: 24,
            color: '#444',
            margin: '0 0 48px 0',
            lineHeight: '1.4',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontWeight: 400
          }}>
            Visualize, plan, and decorate your space with AI-powered tools. Instantly see how your room could look, experiment with layouts, and get expert suggestions.
          </p>
        </div>

                 {/* Simple Feature Grid */}
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(2, 1fr)',
           gap: '24px',
           marginBottom: '80px'
         }}>
          
                     {/* AI Design Assistant */}
           <div style={{
             gridColumn: 'span 1',
             background: `
               linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%),
               radial-gradient(circle at 25% 25%, transparent 1px, rgba(0,0,0,0.01) 1px, rgba(0,0,0,0.01) 2px, transparent 2px)
             `,
             backgroundSize: 'cover, 3px 3px',
             border: '2px solid rgba(0,0,0,0.08)',
             borderRadius: '24px',
             padding: '32px',
             position: 'relative',
             backdropFilter: 'blur(20px)',
             boxShadow: `
               0 25px 50px -12px rgba(0,0,0,0.25),
               0 0 0 1px rgba(255,255,255,0.05),
               inset 0 1px 0 rgba(255,255,255,0.1)
             `,
             overflow: 'hidden'
           }}>
            {/* Subtle accent element */}
            <div style={{
              position: 'absolute',
              top: '32px',
              right: '32px',
              width: '120px',
              height: '4px',
              background: 'linear-gradient(90deg, rgba(255, 69, 0, 0.6), rgba(239, 68, 68, 0.4))',
              borderRadius: '2px'
            }} />
            
                         <h2 style={{
               fontSize: 42,
               fontWeight: 800,
               margin: '0 0 16px 0',
               color: '#222',
               letterSpacing: '-0.03em',
               lineHeight: '1.1'
             }}>
               AI Design Assistant
             </h2>
             <p style={{
               fontSize: 20,
               color: '#555',
               lineHeight: '1.5',
               margin: '0 0 20px 0',
               maxWidth: '580px',
               fontWeight: 400
             }}>
              Get instant design recommendations, color palettes, and layout suggestions tailored to your unique space and personal style preferences.
            </p>
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(255, 69, 0, 0.1)',
                borderRadius: '8px',
                fontSize: 14,
                color: '#d65d0e',
                fontWeight: 600,
                border: '1px solid rgba(255, 69, 0, 0.2)'
              }}>
                Smart Recommendations
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                fontSize: 14,
                color: '#dc2626',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                Color Harmony
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                fontSize: 14,
                color: '#2563eb',
                fontWeight: 600,
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                Style Matching
              </div>
            </div>
          </div>

                     {/* 3D Visualization */}
           <div style={{
             gridColumn: 'span 1',
             background: `
               linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,245,255,0.85) 100%),
               radial-gradient(circle at 75% 75%, transparent 1px, rgba(0,0,0,0.008) 1px, rgba(0,0,0,0.008) 2px, transparent 2px)
             `,
             backgroundSize: 'cover, 4px 4px',
             border: '2px solid rgba(59, 130, 246, 0.15)',
             borderRadius: '24px',
             padding: '28px',
             position: 'relative',
             backdropFilter: 'blur(15px)',
             boxShadow: `
               0 20px 40px -12px rgba(59, 130, 246, 0.3),
               0 0 0 1px rgba(255,255,255,0.05),
               inset 0 1px 0 rgba(255,255,255,0.1)
             `
           }}>
            <div style={{
              position: 'absolute',
              bottom: '32px',
              right: '32px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1))',
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.3)'
            }} />
            
                         <h3 style={{
               fontSize: 32,
               fontWeight: 800,
               margin: '0 0 12px 0',
               color: '#222',
               letterSpacing: '-0.02em'
             }}>
               3D Visualization
             </h3>
            <p style={{
              fontSize: 18,
              color: '#555',
              lineHeight: '1.5',
              margin: '0',
              fontWeight: 400
            }}>
              Walk through your future space in realistic 3D before making any changes to your actual room. Experience your design vision come to life.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}