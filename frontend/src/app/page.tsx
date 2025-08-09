// "use client";
// import Link from 'next/link';

// export default function Home() {
//   return (
//     <div style={{ 
//       minHeight: "100vh", 
//       background: "#ffffff", 
//       color: "#000000",
//       fontFamily: "Inter, system-ui, -apple-system, sans-serif",
//       position: 'relative',
//       overflow: 'hidden'
//     }}>
      
//       {/* Global CSS to hide scroll bars */}
//       <style jsx global>{`
//         * {
//           scrollbar-width: none; /* Firefox */
//           -ms-overflow-style: none; /* Internet Explorer 10+ */
//         }
        
//         *::-webkit-scrollbar {
//           display: none; /* Safari and Chrome */
//         }
        
//         html, body {
//           overflow-x: hidden;
//           scrollbar-width: none;
//           -ms-overflow-style: none;
//         }
        
//         html::-webkit-scrollbar,
//         body::-webkit-scrollbar {
//           display: none;
//         }
//       `}</style>
      
//       {/* Left Side Animation */}
//       <div style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         width: 'calc(8vw + 40px)',
//         height: '100vh',
//         zIndex: 1,
//         pointerEvents: 'auto',
//         cursor: 'pointer',
//         overflow: 'hidden'
//       }}>
//         {/* Architectural Grid */}
//         <div style={{
//           position: 'absolute',
//           top: '10%',
//           left: '20%',
//           width: '60px',
//           height: '40px',
//           border: '1px solid rgba(190, 189, 189, 0.2)',
//           borderRight: 'none',
//           borderBottom: 'none'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '10%',
//           left: '20%',
//           width: '60px',
//           height: '40px',
//           border: '1px solid rgba(190, 189, 189, 0.2)',
//           borderLeft: 'none',
//           borderTop: 'none'
//         }} />
        
//         {/* Additional Grid Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '45%',
//           left: '15%',
//           width: '30px',
//           height: '25px',
//           border: '1px solid rgba(190, 189, 189, 0.15)',
//           borderRight: 'none',
//           borderBottom: 'none'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '45%',
//           left: '15%',
//           width: '30px',
//           height: '25px',
//           border: '1px solid rgba(190, 189, 189, 0.15)',
//           borderLeft: 'none',
//           borderTop: 'none'
//         }} />
        
//         {/* Floating Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '25%',
//           left: '50%',
//           width: '8px',
//           height: '8px',
//           background: '#facc15',
//           borderRadius: '50%',
//           animation: 'floatUp 6s ease-in-out infinite',
//           boxShadow: '0 0 8px rgba(250, 204, 21, 0.4)'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '55%',
//           left: '30%',
//           width: '12px',
//           height: '12px',
//           background: '#000000',
//           borderRadius: '50%',
//           animation: 'floatUp 8s ease-in-out infinite 2s',
//           boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '35%',
//           left: '70%',
//           width: '6px',
//           height: '6px',
//           background: '#facc15',
//           borderRadius: '50%',
//           animation: 'floatUp 7s ease-in-out infinite 1s',
//           boxShadow: '0 0 6px rgba(250, 204, 21, 0.3)'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '75%',
//           left: '25%',
//           width: '10px',
//           height: '10px',
//           background: '#000000',
//           borderRadius: '50%',
//           animation: 'floatUp 9s ease-in-out infinite 3s',
//           boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)'
//         }} />
        
//         {/* Geometric Shapes */}
//         <div style={{
//           position: 'absolute',
//           top: '15%',
//           left: '60%',
//           width: '15px',
//           height: '15px',
//           border: '1px solid rgba(250, 204, 21, 0.4)',
//           transform: 'rotate(45deg)',
//           animation: 'geometricRotate 12s linear infinite'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '65%',
//           left: '65%',
//           width: '12px',
//           height: '12px',
//           border: '1px solid rgba(190, 189, 189, 0.3)',
//           transform: 'rotate(0deg)',
//           animation: 'geometricRotate 15s linear infinite reverse'
//         }} />
        
//         {/* Line Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '20%',
//           left: '40%',
//           width: '25px',
//           height: '1px',
//           background: 'linear-gradient(to right, transparent, rgba(250, 204, 21, 0.5), transparent)',
//           animation: 'lineExtend 8s ease-in-out infinite'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '80%',
//           left: '50%',
//           width: '1px',
//           height: '20px',
//           background: 'linear-gradient(to bottom, transparent, rgba(190, 189, 189, 0.4), transparent)',
//           animation: 'lineExtend 6s ease-in-out infinite 2s'
//         }} />
        
//         {/* Typography Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '75%',
//           left: '40%',
//           fontSize: '14px',
//           color: 'rgba(190, 189, 189, 0.6)',
//           fontFamily: 'monospace',
//           fontWeight: '300',
//           letterSpacing: '1px',
//           animation: 'typewriter 12s linear infinite',
//           whiteSpace: 'nowrap'
//         }}>
//           DESIGN
//         </div>
        
//         <div style={{
//           position: 'absolute',
//           top: '85%',
//           left: '35%',
//           fontSize: '12px',
//           color: 'rgba(250, 204, 21, 0.7)',
//           fontFamily: 'monospace',
//           fontWeight: '300',
//           letterSpacing: '2px',
//           animation: 'typewriter 15s linear infinite 4s',
//           whiteSpace: 'nowrap'
//         }}>
//           CREATE
//         </div>
        
//         {/* Hover Effect */}
//         <div style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: '100%',
//           background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.03) 0%, transparent 70%)',
//           opacity: 0,
//           transition: 'opacity 0.5s ease',
//           pointerEvents: 'none'
//         }} />
//       </div>

//       {/* Right Side Animation */}
//       <div style={{
//         position: 'fixed',
//         top: 0,
//         right: 0,
//         width: 'calc(8vw + 40px)',
//         height: '100vh',
//         zIndex: 1,
//         pointerEvents: 'auto',
//         cursor: 'pointer',
//         overflow: 'hidden'
//       }}>
//         {/* Architectural Grid */}
//         <div style={{
//           position: 'absolute',
//           top: '15%',
//           right: '30%',
//           width: '50px',
//           height: '35px',
//           border: '1px solid rgba(190, 189, 189, 0.2)',
//           borderRight: 'none',
//           borderBottom: 'none'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '15%',
//           right: '30%',
//           width: '50px',
//           height: '35px',
//           border: '1px solid rgba(190, 189, 189, 0.2)',
//           borderLeft: 'none',
//           borderTop: 'none'
//         }} />
        
//         {/* Additional Grid Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '50%',
//           right: '20%',
//           width: '35px',
//           height: '20px',
//           border: '1px solid rgba(190, 189, 189, 0.15)',
//           borderRight: 'none',
//           borderBottom: 'none'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '50%',
//           right: '20%',
//           width: '35px',
//           height: '20px',
//           border: '1px solid rgba(190, 189, 189, 0.15)',
//           borderLeft: 'none',
//           borderTop: 'none'
//         }} />
        
//         {/* Floating Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '35%',
//           right: '40%',
//           width: '10px',
//           height: '10px',
//           background: '#facc15',
//           borderRadius: '50%',
//           animation: 'floatUp 7s ease-in-out infinite 1s',
//           boxShadow: '0 0 12px rgba(250, 204, 21, 0.5)'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '65%',
//           right: '25%',
//           width: '6px',
//           height: '6px',
//           background: '#000000',
//           borderRadius: '50%',
//           animation: 'floatUp 9s ease-in-out infinite 3s',
//           boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '25%',
//           right: '60%',
//           width: '8px',
//           height: '8px',
//           background: '#facc15',
//           borderRadius: '50%',
//           animation: 'floatUp 8s ease-in-out infinite 0.5s',
//           boxShadow: '0 0 10px rgba(250, 204, 21, 0.4)'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '70%',
//           right: '70%',
//           width: '12px',
//           height: '12px',
//           background: '#000000',
//           borderRadius: '50%',
//           animation: 'floatUp 10s ease-in-out infinite 2.5s',
//           boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
//         }} />
        
//         {/* Geometric Shapes */}
//         <div style={{
//           position: 'absolute',
//           top: '20%',
//           right: '50%',
//           width: '18px',
//           height: '18px',
//           border: '1px solid rgba(250, 204, 21, 0.4)',
//           transform: 'rotate(-45deg)',
//           animation: 'geometricRotate 14s linear infinite reverse'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '60%',
//           right: '55%',
//           width: '14px',
//           height: '14px',
//           border: '1px solid rgba(190, 189, 189, 0.3)',
//           transform: 'rotate(0deg)',
//           animation: 'geometricRotate 16s linear infinite'
//         }} />
        
//         {/* Line Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '30%',
//           right: '75%',
//           width: '1px',
//           height: '30px',
//           background: 'linear-gradient(to bottom, transparent, rgba(250, 204, 21, 0.5), transparent)',
//           animation: 'lineExtend 7s ease-in-out infinite 1s'
//         }} />
        
//         <div style={{
//           position: 'absolute',
//           top: '75%',
//           right: '45%',
//           width: '22px',
//           height: '1px',
//           background: 'linear-gradient(to left, transparent, rgba(190, 189, 189, 0.4), transparent)',
//           animation: 'lineExtend 9s ease-in-out infinite 3s'
//         }} />
        
//         {/* Typography Elements */}
//         <div style={{
//           position: 'absolute',
//           top: '80%',
//           right: '45%',
//           fontSize: '14px',
//           color: 'rgba(190, 189, 189, 0.6)',
//           fontFamily: 'monospace',
//           fontWeight: '300',
//           letterSpacing: '1.5px',
//           animation: 'typewriter 14s linear infinite 2s',
//           whiteSpace: 'nowrap'
//         }}>
//           BUILD
//         </div>
        
//         <div style={{
//           position: 'absolute',
//           top: '90%',
//           right: '40%',
//           fontSize: '12px',
//           color: 'rgba(250, 204, 21, 0.7)',
//           fontFamily: 'monospace',
//           fontWeight: '300',
//           letterSpacing: '2.5px',
//           animation: 'typewriter 18s linear infinite 6s',
//           whiteSpace: 'nowrap'
//         }}>
//           INSPIRE
//         </div>
        
//         {/* Hover Effect */}
//         <div style={{
//           position: 'absolute',
//           top: 0,
//           right: 0,
//           width: '100%',
//           height: '100%',
//           background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.03) 0%, transparent 70%)',
//           opacity: 0,
//           transition: 'opacity 0.5s ease',
//           pointerEvents: 'none'
//         }} />
//       </div>

//       {/* CSS Animations */}
//       <style>{`
//         @keyframes floatUp {
//           0%, 100% { 
//             transform: translateY(0px) scale(1); 
//             opacity: 0.6; 
//           }
//           25% { 
//             transform: translateY(-15px) scale(1.1); 
//             opacity: 0.9; 
//           }
//           50% { 
//             transform: translateY(-25px) scale(0.9); 
//             opacity: 0.4; 
//           }
//           75% { 
//             transform: translateY(-10px) scale(1.05); 
//             opacity: 0.8; 
//           }
//         }
        
//         @keyframes geometricRotate {
//           0% { transform: rotate(0deg); opacity: 0.3; }
//           25% { transform: rotate(90deg); opacity: 0.6; }
//           50% { transform: rotate(180deg); opacity: 0.3; }
//           75% { transform: rotate(270deg); opacity: 0.6; }
//           100% { transform: rotate(360deg); opacity: 0.3; }
//         }
        
//         @keyframes lineExtend {
//           0%, 100% { 
//             transform: scaleX(0.3); 
//             opacity: 0.2; 
//           }
//           50% { 
//             transform: scaleX(1); 
//             opacity: 0.8; 
//           }
//         }
        
//         @keyframes typewriter {
//           0% { 
//             opacity: 0; 
//             transform: translateY(10px); 
//           }
//           10% { 
//             opacity: 1; 
//             transform: translateY(0px); 
//           }
//           90% { 
//             opacity: 1; 
//             transform: translateY(0px); 
//           }
//           100% { 
//             opacity: 0; 
//             transform: translateY(-10px); 
//           }
//         }
        
//         /* Hover effects */
//         div[style*="position: fixed"][style*="left: 0"]:hover div[style*="opacity: 0"][style*="transition: opacity 0.5s ease"] {
//           opacity: 1 !important;
//         }
        
//         div[style*="position: fixed"][style*="right: 0"]:hover div[style*="opacity: 0"][style*="transition: opacity 0.5s ease"] {
//           opacity: 1 !important;
//         }
        
//         div[style*="position: fixed"]:hover div[style*="animation: floatUp"] {
//           animation-duration: 3s !important;
//         }
        
//         div[style*="position: fixed"]:hover div[style*="animation: typewriter"] {
//           animation-duration: 6s !important;
//         }
        
//         div[style*="position: fixed"]:hover div[style*="animation: geometricRotate"] {
//           animation-duration: 6s !important;
//         }
        
//         div[style*="position: fixed"]:hover div[style*="animation: lineExtend"] {
//           animation-duration: 3s !important;
//         }
//       `}</style>
      
//             {/* Vertical Guide Lines */}
//       <div style={{
//         position: 'fixed',
//         top: 64,
//         bottom: 0,
//         left: 'calc(8vw + 40px)',
//         width: '1px',
//         backgroundColor: '#d4d4d8',
//         zIndex: 1,
//         opacity: 0.6,
//         pointerEvents: 'none'
//       }} />

//       <div style={{
//         position: 'fixed',
//         top: 64,
//         bottom: 0,
//         right: 'calc(8vw + 40px)',
//         width: '1px',
//         backgroundColor: '#d4d4d8',
//         zIndex: 1,
//         opacity: 0.6,
//         pointerEvents: 'none'
//       }} />



//       {/* Main Content Wrapper */}
//       <div style={{
//         position: 'absolute',
//         top: 64,
//         left: 'calc(8vw + 40px)',
//         right: 'calc(8vw + 40px)',
//         bottom: 0,
//         overflowY: 'auto',
//         zIndex: 2,
//         padding: '72px 0 48px 0'
//       }}>
//         {/* Inner Content Container */}
//         <div style={{
//           maxWidth: '1500px',
//           margin: '0 auto',
//           padding: '0 calc(4vw + 24px)'
//         }}>
          
//           {/* Hero Section */}
//           <div style={{
//             textAlign: 'center',
//             marginBottom: '80px',
//             paddingTop: '24px'
//           }}>
//             <h1 style={{
//               fontSize: 'clamp(48px, 6vw, 84px)',
//               fontWeight: 800,
//               color: '#000000',
//               margin: '0 0 32px 0',
//               lineHeight: '0.95',
//               letterSpacing: '-0.04em',
//               maxWidth: '1200px',
//               marginLeft: 'auto',
//               marginRight: 'auto'
//             }}>
//               Create Rooms. AI-Powered Design.
//             </h1>
//             <p style={{
//               fontSize: 'clamp(18px, 2vw, 20px)',
//               color: '#6b7280',
//               margin: '0 0 48px 0',
//               lineHeight: '1.4',
//               maxWidth: '800px',
//               marginLeft: 'auto',
//               marginRight: 'auto',
//               fontWeight: 400
//             }}>
//               Build, visualize, and decorate rooms with AI assistance. Get stuck? Use deep research and agents to help you create the perfect space.
//             </p>
//             <div style={{
//               display: 'flex',
//               gap: '16px',
//               justifyContent: 'center',
//               flexWrap: 'wrap'
//             }}>
//               <button style={{
//                 padding: '12px 24px',
//                 background: '#facc15',
//                 color: '#000000',
//                 border: 'none',
//                 borderRadius: '0',
//                 fontWeight: 700,
//                 fontSize: 14,
//                 cursor: 'pointer',
//                 textTransform: 'uppercase',
//                 letterSpacing: '0.5px'
//               }}>
//                 Create Room
//               </button>
//               <button style={{
//                 padding: '12px 24px',
//                 background: '#ffffff',
//                 color: '#000000',
//                 border: '1px solid #000000',
//                 borderRadius: '0',
//                 fontWeight: 700,
//                 fontSize: 14,
//                 cursor: 'pointer',
//                 textTransform: 'uppercase',
//                 letterSpacing: '0.5px'
//               }}>
//                 View Layout
//               </button>
//             </div>
//           </div>

//                    {/* Simple Feature Grid */}
//            <div style={{
//              display: 'grid',
//              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//              gap: 'clamp(24px, 4vw, 32px)',
//              marginBottom: '80px'
//            }}>
            
//                        {/* AI Design Assistant */}
//              <div 
//                style={{
//                  gridColumn: 'span 1',
//                  background: '#ffffff',
//                  border: '1px solid #e5e7eb',
//                  borderRadius: '0',
//                  padding: '32px',
//                  position: 'relative',
//                  color: '#000000',
//                  transition: 'border-color 0.2s ease'
//                }}
//                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#000000'}
//                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
//              >
              
//                            <h2 style={{
//                  fontSize: 'clamp(18px, 2vw, 24px)',
//                  fontWeight: 700,
//                  margin: '0 0 16px 0',
//                  color: '#000000',
//                  letterSpacing: '-0.02em',
//                  lineHeight: '1.1',
//                  textTransform: 'uppercase'
//                }}>
//                  AI Design Assistant
//                </h2>
//                <p style={{
//                  fontSize: 'clamp(14px, 1.5vw, 16px)',
//                  color: '#6b7280',
//                  lineHeight: '1.5',
//                  margin: '0 0 24px 0',
//                  maxWidth: '580px',
//                  fontWeight: 400
//                }}>
//                 Get instant design recommendations, color palettes, and layout suggestions. AI helps you create the perfect room with smart recommendations.
//               </p>
//               <div style={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 gap: '12px'
//               }}>
//                 <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: 8, textAlign: 'left', width: 'calc(100% - 2px)', paddingLeft: 0 }}>
//                   <button
//                     style={{
//                       background: '#FFD600',
//                       color: '#000',
//                       fontWeight: 600,
//                       fontSize: '15px',
//                       padding: '8px 16px',
//                       border: '1px solid #1a1814',
//                       borderRadius: '0',
//                       marginRight: '8px',
//                       marginBottom: '8px',
//                       cursor: 'pointer',
//                       transition: 'background 0.2s, color 0.2s',
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background = '#0029ff';
//                       e.currentTarget.style.color = '#fff';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background = '#FFD600';
//                       e.currentTarget.style.color = '#000';
//                     }}
//                   >
//                     Smart Recommendations
//                   </button>
//                   {/* <input
//                     className="ai-input"
//                     style={{
//                       // width: '50%',
//                       // padding: '10px 16px',
//                       // border: '1px solid #000',
//                       // borderRadius: '0',
//                       // fontSize: '16px',
//                       // background: '#222',
//                       // color: '#fff',
//                       // margin: 0,
//                       // textAlign: 'left',
//                       background: '##000000',
//                       color: '#000',
//                       fontWeight: 600,
//                       fontSize: '15px',
//                       padding: '8px 16px',
//                       border: '1px solid #e5e7eb',
//                       borderRadius: '0',
//                       marginRight: '8px',
//                       marginBottom: '8px',
//                       cursor: 'pointer',
//                       transition: 'background 0.2s, color 0.2s',
//                     }}
//                     placeholder="Color Harmony"
//                   /> */}
//                     <button
//                     style={{
//                       background: '#000',
//                       color: '#fff',
//                       fontWeight: 600,
//                       fontSize: '15px',
//                       padding: '8px 16px',
//                       border: '1px solid #1a1814',
//                       borderRadius: '0',
//                       marginRight: '8px',
//                       marginBottom: '8px',
//                       cursor: 'pointer',
//                       transition: 'background 0.2s, color 0.2s',
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background = '#fff';
//                       e.currentTarget.style.color = '#000';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background = '#000';
//                       e.currentTarget.style.color = '#fff';
//                     }}
//                   >
//                     Color Harmony
//                   </button>
//                 </div>
//               </div>
//             </div>

//                        {/* Deep Research & Agents */}
//              <div 
//                style={{
//                  gridColumn: 'span 1',
//                  background: '#ffffff',
//                  border: '1px solid #e5e7eb',
//                  borderRadius: '0',
//                  padding: '32px',
//                  position: 'relative',
//                  transition: 'border-color 0.2s ease'
//                }}
//                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#000000'}
//                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
//              >
              
//                            <h3 style={{
//                  fontSize: 'clamp(18px, 2vw, 24px)',
//                  fontWeight: 700,
//                  margin: '0 0 16px 0',
//                  color: '#000000',
//                  letterSpacing: '-0.02em',
//                  textTransform: 'uppercase'
//                }}>
//                  Deep Research & Agents
//                </h3>
//               <p style={{
//                 fontSize: 'clamp(14px, 1.5vw, 16px)',
//                 color: '#6b7280',
//                 lineHeight: '1.5',
//                 margin: '0 0 24px 0',
//                 fontWeight: 400
//               }}>
//                 Get stuck? Use AI agents to help with research, design decisions, and complex room planning. Deep research tools guide your creative process.
//               </p>
//               <div style={{
//                 display: 'flex',
//                 gap: '12px',
//                 flexWrap: 'wrap'
//               }}>
//                 <button
//                   style={{
//                     background: '#fff',
//                     color: '#000',
//                     fontWeight: 600,
//                     fontSize: '15px',
//                     padding: '8px 16px',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '0',
//                     marginRight: '8px',
//                     marginBottom: '8px',
//                     cursor: 'pointer',
//                     transition: 'background 0.2s, color 0.2s',
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.background = '#000';
//                     e.currentTarget.style.color = '#fff';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.background = '#fff';
//                     e.currentTarget.style.color = '#000';
//                   }}
//                 >
//                   AI Agents
//                 </button>
//                 <button
//                   style={{
//                     background: '#fff',
//                     color: '#000',
//                     fontWeight: 600,
//                     fontSize: '15px',
//                     padding: '8px 16px',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '0',
//                     marginRight: '8px',
//                     marginBottom: '8px',
//                     cursor: 'pointer',
//                     transition: 'background 0.2s, color 0.2s',
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.background = '#000';
//                     e.currentTarget.style.color = '#fff';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.background = '#fff';
//                     e.currentTarget.style.color = '#000';
//                   }}
//                 >
//                   Deep Research
//                 </button>
//                 <button
//                   style={{
//                     background: '#fff',
//                     color: '#000',
//                     fontWeight: 600,
//                     fontSize: '15px',
//                     padding: '8px 16px',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '0',
//                     marginRight: '8px',
//                     marginBottom: '8px',
//                     cursor: 'pointer',
//                     transition: 'background 0.2s, color 0.2s',
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.background = '#000';
//                     e.currentTarget.style.color = '#fff';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.background = '#fff';
//                     e.currentTarget.style.color = '#000';
//                   }}
//                 >
//                   Design Guidance
//                 </button>
//               </div>
//             </div>
//           </div>

//         </div>

//         {/* Core Features Section */}
//         <div style={{
//           marginTop: '120px',
//           paddingTop: '80px',
//           borderTop: '1px solid rgb(190, 189, 189)',
//           paddingLeft: 'calc(4vw + 24px)',
//           paddingRight: 'calc(4vw + 24px)',
//         }}>
//           <div style={{
//             textAlign: 'center',
//             marginBottom: '80px'
//           }}>
//             <h2 style={{
//               fontSize: 'clamp(24px, 3vw, 32px)',
//               fontWeight: 700,
//               color: '#000000',
//               margin: '0 0 16px 0',
//               textTransform: 'uppercase',
//               letterSpacing: '0.5px'
//             }}>
//               Core Features
//             </h2>
//             <p style={{
//               fontSize: 'clamp(16px, 1.8vw, 18px)',
//               color: '#6b7280',
//               margin: '0',
//               maxWidth: 'min(600px, 80vw)',
//               marginLeft: 'auto',
//               marginRight: 'auto'
//             }}>
//               Everything you need to design, customize, and share your perfect room
//             </p>
//           </div>

//           <div style={{
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '0'
//           }}>
//             {/* Feature 1 */}
//             <div style={{
//               padding: 'clamp(40px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Create and Customize Rooms in 3D
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Build rooms from scratch with full 3D visualization. Customize dimensions, colors, and layouts with real-time preview. Walk through your designs before making any changes.
//                   </p>
//                 </div>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   3D Room Preview
//                 </div>
//               </div>
//             </div>

//             {/* Feature 2 */}
//             <div style={{
//               padding: 'clamp(100px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   Image Upload Preview
//                 </div>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Generate Rooms from Images
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Upload any room image and let AI generate a 3D model. Perfect for recreating spaces you love or getting inspiration from real-world designs.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Feature 3 */}
//             <div style={{
//               padding: 'clamp(100px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Deep Research Agents
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Get stuck? AI agents conduct deep research to find the perfect design solutions. From color palettes to furniture recommendations, agents guide your creative process.
//                   </p>
//                 </div>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   AI Research Interface
//                 </div>
//               </div>
//             </div>

//             {/* Feature 4 */}
//             <div style={{
//               padding: 'clamp(100px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   Chat Interface
//                 </div>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Intelligent Chatbot Assistant
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Your AI design partner. Ask the chatbot to add furniture, change colors, optimize layouts, or get expert advice. The chatbot does the work while you focus on creativity.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Feature 5 */}
//             <div style={{
//               padding: 'clamp(100px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Import from Pinterest & Wayfair
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Directly import furniture and decor from your favorite sites. Seamlessly integrate Pinterest inspiration and Wayfair products into your 3D room designs.
//                   </p>
//                 </div>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   Import Interface
//                 </div>
//               </div>
//             </div>

//             {/* Feature 6 */}
//             <div style={{
//               padding: 'clamp(100px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   Inspiration Board
//                 </div>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Create Inspiration Boards
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Pin conversations, furniture ideas, and design inspiration to your personal boards. Build collections of ideas for future projects and keep your creative process organized.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Feature 7 */}
//             <div style={{
//               padding: 'clamp(100px, 4vw, 60px) 0',
//               borderBottom: '1px solid rgb(190, 189, 189)',
//               marginLeft: 'calc(-1 * (4vw + 24px))',
//               marginRight: 'calc(-1 * (4vw + 24px))',
//               paddingLeft: 'calc(4vw + 24px)',
//               paddingRight: 'calc(4vw + 24px)'
//             }}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//                 gap: 'clamp(20px, 4vw, 48px)',
//                 alignItems: 'start'
//               }}>
//                 <div style={{ minWidth: 0 }}>
//                   <h3 style={{
//                     fontSize: 'clamp(16px, 2.5vw, 24px)',
//                     fontWeight: 700,
//                     color: '#000000',
//                     margin: '0 0 12px 0',
//                     textTransform: 'uppercase',
//                     lineHeight: '1.3'
//                   }}>
//                     Share Your Rooms
//                   </h3>
//                   <p style={{
//                     fontSize: 'clamp(13px, 1.8vw, 16px)',
//                     color: '#6b7280',
//                     lineHeight: '1.5',
//                     margin: '0',
//                     wordBreak: 'break-word'
//                   }}>
//                     Share your designs with friends, family, or clients. Export high-quality renders, share links, or collaborate on room designs in real-time.
//                   </p>
//                 </div>
//                 <div style={{
//                   background: '#f9fafb',
//                   width: '100%',
//                   paddingBottom: '56.25%',
//                   position: 'relative',
//                   borderRadius: '8px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: '#9ca3af',
//                   fontSize: 'clamp(11px, 1.5vw, 14px)'
//                 }}>
//                   Share Interface
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//       <style>{`
//         .ai-input::placeholder {
//           color: #fff !important;
//           opacity: 1;
//         }
//       `}</style>
//     </div>
//   );
// }

"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#ffffff", 
      color: "#000000",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
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
      
      {/* Left Side Animation */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'calc(8vw + 40px)',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'auto',
        cursor: 'pointer',
        overflow: 'hidden'
      }}>
        {/* Architectural Grid */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '60px',
          height: '40px',
          border: '1px solid rgba(190, 189, 189, 0.2)',
          borderRight: 'none',
          borderBottom: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '60px',
          height: '40px',
          border: '1px solid rgba(190, 189, 189, 0.2)',
          borderLeft: 'none',
          borderTop: 'none'
        }} />
        
        {/* Additional Grid Elements */}
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '15%',
          width: '30px',
          height: '25px',
          border: '1px solid rgba(190, 189, 189, 0.15)',
          borderRight: 'none',
          borderBottom: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '15%',
          width: '30px',
          height: '25px',
          border: '1px solid rgba(190, 189, 189, 0.15)',
          borderLeft: 'none',
          borderTop: 'none'
        }} />
        
        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          width: '8px',
          height: '8px',
          background: '#facc15',
          borderRadius: '50%',
          animation: 'floatUp 6s ease-in-out infinite',
          boxShadow: '0 0 8px rgba(250, 204, 21, 0.4)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '30%',
          width: '12px',
          height: '12px',
          background: '#000000',
          borderRadius: '50%',
          animation: 'floatUp 8s ease-in-out infinite 2s',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '70%',
          width: '6px',
          height: '6px',
          background: '#facc15',
          borderRadius: '50%',
          animation: 'floatUp 7s ease-in-out infinite 1s',
          boxShadow: '0 0 6px rgba(250, 204, 21, 0.3)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '75%',
          left: '25%',
          width: '10px',
          height: '10px',
          background: '#000000',
          borderRadius: '50%',
          animation: 'floatUp 9s ease-in-out infinite 3s',
          boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)'
        }} />
        
        {/* Geometric Shapes */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '60%',
          width: '15px',
          height: '15px',
          border: '1px solid rgba(250, 204, 21, 0.4)',
          transform: 'rotate(45deg)',
          animation: 'geometricRotate 12s linear infinite'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '65%',
          left: '65%',
          width: '12px',
          height: '12px',
          border: '1px solid rgba(190, 189, 189, 0.3)',
          transform: 'rotate(0deg)',
          animation: 'geometricRotate 15s linear infinite reverse'
        }} />
        
        {/* Line Elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '40%',
          width: '25px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(250, 204, 21, 0.5), transparent)',
          animation: 'lineExtend 8s ease-in-out infinite'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '80%',
          left: '50%',
          width: '1px',
          height: '20px',
          background: 'linear-gradient(to bottom, transparent, rgba(190, 189, 189, 0.4), transparent)',
          animation: 'lineExtend 6s ease-in-out infinite 2s'
        }} />
        
        {/* Typography Elements */}
        <div style={{
          position: 'absolute',
          top: '75%',
          left: '40%',
          fontSize: '14px',
          color: 'rgba(190, 189, 189, 0.6)',
          fontFamily: 'monospace',
          fontWeight: '300',
          letterSpacing: '1px',
          animation: 'typewriter 12s linear infinite',
          whiteSpace: 'nowrap'
        }}>
          DESIGN
        </div>
        
        <div style={{
          position: 'absolute',
          top: '85%',
          left: '35%',
          fontSize: '12px',
          color: 'rgba(250, 204, 21, 0.7)',
          fontFamily: 'monospace',
          fontWeight: '300',
          letterSpacing: '2px',
          animation: 'typewriter 15s linear infinite 4s',
          whiteSpace: 'nowrap'
        }}>
          CREATE
        </div>
        
        {/* Hover Effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.03) 0%, transparent 70%)',
          opacity: 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Right Side Animation */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 'calc(8vw + 40px)',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'auto',
        cursor: 'pointer',
        overflow: 'hidden'
      }}>
        {/* Architectural Grid */}
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '30%',
          width: '50px',
          height: '35px',
          border: '1px solid rgba(190, 189, 189, 0.2)',
          borderRight: 'none',
          borderBottom: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '30%',
          width: '50px',
          height: '35px',
          border: '1px solid rgba(190, 189, 189, 0.2)',
          borderLeft: 'none',
          borderTop: 'none'
        }} />
        
        {/* Additional Grid Elements */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20%',
          width: '35px',
          height: '20px',
          border: '1px solid rgba(190, 189, 189, 0.15)',
          borderRight: 'none',
          borderBottom: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20%',
          width: '35px',
          height: '20px',
          border: '1px solid rgba(190, 189, 189, 0.15)',
          borderLeft: 'none',
          borderTop: 'none'
        }} />
        
        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '35%',
          right: '40%',
          width: '10px',
          height: '10px',
          background: '#facc15',
          borderRadius: '50%',
          animation: 'floatUp 7s ease-in-out infinite 1s',
          boxShadow: '0 0 12px rgba(250, 204, 21, 0.5)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '65%',
          right: '25%',
          width: '6px',
          height: '6px',
          background: '#000000',
          borderRadius: '50%',
          animation: 'floatUp 9s ease-in-out infinite 3s',
          boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '25%',
          right: '60%',
          width: '8px',
          height: '8px',
          background: '#facc15',
          borderRadius: '50%',
          animation: 'floatUp 8s ease-in-out infinite 0.5s',
          boxShadow: '0 0 10px rgba(250, 204, 21, 0.4)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '70%',
          right: '70%',
          width: '12px',
          height: '12px',
          background: '#000000',
          borderRadius: '50%',
          animation: 'floatUp 10s ease-in-out infinite 2.5s',
          boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
        }} />
        
        {/* Geometric Shapes */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '50%',
          width: '18px',
          height: '18px',
          border: '1px solid rgba(250, 204, 21, 0.4)',
          transform: 'rotate(-45deg)',
          animation: 'geometricRotate 14s linear infinite reverse'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '55%',
          width: '14px',
          height: '14px',
          border: '1px solid rgba(190, 189, 189, 0.3)',
          transform: 'rotate(0deg)',
          animation: 'geometricRotate 16s linear infinite'
        }} />
        
        {/* Line Elements */}
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '75%',
          width: '1px',
          height: '30px',
          background: 'linear-gradient(to bottom, transparent, rgba(250, 204, 21, 0.5), transparent)',
          animation: 'lineExtend 7s ease-in-out infinite 1s'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '75%',
          right: '45%',
          width: '22px',
          height: '1px',
          background: 'linear-gradient(to left, transparent, rgba(190, 189, 189, 0.4), transparent)',
          animation: 'lineExtend 9s ease-in-out infinite 3s'
        }} />
        
        {/* Typography Elements */}
        <div style={{
          position: 'absolute',
          top: '80%',
          right: '45%',
          fontSize: '14px',
          color: 'rgba(190, 189, 189, 0.6)',
          fontFamily: 'monospace',
          fontWeight: '300',
          letterSpacing: '1.5px',
          animation: 'typewriter 14s linear infinite 2s',
          whiteSpace: 'nowrap'
        }}>
          BUILD
        </div>
        
        <div style={{
          position: 'absolute',
          top: '90%',
          right: '40%',
          fontSize: '12px',
          color: 'rgba(250, 204, 21, 0.7)',
          fontFamily: 'monospace',
          fontWeight: '300',
          letterSpacing: '2.5px',
          animation: 'typewriter 18s linear infinite 6s',
          whiteSpace: 'nowrap'
        }}>
          INSPIRE
        </div>
        
        {/* Hover Effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.03) 0%, transparent 70%)',
          opacity: 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none'
        }} />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes floatUp {
          0%, 100% { 
            transform: translateY(0px) scale(1); 
            opacity: 0.6; 
          }
          25% { 
            transform: translateY(-15px) scale(1.1); 
            opacity: 0.9; 
          }
          50% { 
            transform: translateY(-25px) scale(0.9); 
            opacity: 0.4; 
          }
          75% { 
            transform: translateY(-10px) scale(1.05); 
            opacity: 0.8; 
          }
        }
        
        @keyframes geometricRotate {
          0% { transform: rotate(0deg); opacity: 0.3; }
          25% { transform: rotate(90deg); opacity: 0.6; }
          50% { transform: rotate(180deg); opacity: 0.3; }
          75% { transform: rotate(270deg); opacity: 0.6; }
          100% { transform: rotate(360deg); opacity: 0.3; }
        }
        
        @keyframes lineExtend {
          0%, 100% { 
            transform: scaleX(0.3); 
            opacity: 0.2; 
          }
          50% { 
            transform: scaleX(1); 
            opacity: 0.8; 
          }
        }
        
        @keyframes typewriter {
          0% { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          10% { 
            opacity: 1; 
            transform: translateY(0px); 
          }
          90% { 
            opacity: 1; 
            transform: translateY(0px); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
        }
        
        /* Hover effects */
        div[style*="position: fixed"][style*="left: 0"]:hover div[style*="opacity: 0"][style*="transition: opacity 0.5s ease"] {
          opacity: 1 !important;
        }
        
        div[style*="position: fixed"][style*="right: 0"]:hover div[style*="opacity: 0"][style*="transition: opacity 0.5s ease"] {
          opacity: 1 !important;
        }
        
        div[style*="position: fixed"]:hover div[style*="animation: floatUp"] {
          animation-duration: 3s !important;
        }
        
        div[style*="position: fixed"]:hover div[style*="animation: typewriter"] {
          animation-duration: 6s !important;
        }
        
        div[style*="position: fixed"]:hover div[style*="animation: geometricRotate"] {
          animation-duration: 6s !important;
        }
        
        div[style*="position: fixed"]:hover div[style*="animation: lineExtend"] {
          animation-duration: 3s !important;
        }
      `}</style>
      
            {/* Vertical Guide Lines */}
      <div style={{
        position: 'fixed',
        top: 64,
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
        top: 64,
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
        top: 64,
        left: 'calc(8vw + 40px)',
        right: 'calc(8vw + 40px)',
        bottom: 0,
        overflowY: 'auto',
        zIndex: 2,
        padding: '72px 0 48px 0'
      }}>
        {/* Inner Content Container */}
        <div style={{
          maxWidth: '1500px',
          margin: '0 auto',
          padding: '0 calc(4vw + 24px)'
        }}>
          
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
            paddingTop: '24px'
          }}>
            <h1 style={{
              fontSize: 'clamp(48px, 6vw, 84px)',
              fontWeight: 800,
              color: '#000000',
              margin: '0 0 32px 0',
              lineHeight: '0.95',
              letterSpacing: '-0.04em',
              maxWidth: '1200px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Create Rooms. AI-Powered Design.
            </h1>
            <p style={{
              fontSize: 'clamp(18px, 2vw, 20px)',
              color: '#6b7280',
              margin: '0 0 48px 0',
              lineHeight: '1.4',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto',
              fontWeight: 400
            }}>
              Build, visualize, and decorate rooms with AI assistance. Get stuck? Use deep research and agents to help you create the perfect space.
            </p>
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button style={{
                padding: '12px 24px',
                background: '#facc15',
                color: '#000000',
                border: 'none',
                borderRadius: '0',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Create Room
              </button>
              <button style={{
                padding: '12px 24px',
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #000000',
                borderRadius: '0',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                View Layout
              </button>
            </div>
          </div>

                   {/* Simple Feature Grid */}
           <div style={{
             display: 'grid',
             gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
             gap: 'clamp(24px, 4vw, 32px)',
             marginBottom: '80px'
           }}>
            
                       {/* AI Design Assistant */}
             <div 
               style={{
                 gridColumn: 'span 1',
                 background: '#ffffff',
                 border: '1px solid #e5e7eb',
                 borderRadius: '0',
                 padding: '32px',
                 position: 'relative',
                 color: '#000000',
                 transition: 'border-color 0.2s ease'
               }}
               onMouseEnter={(e) => e.currentTarget.style.borderColor = '#000000'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
             >
              
                           <h2 style={{
                 fontSize: 'clamp(18px, 2vw, 24px)',
                 fontWeight: 700,
                 margin: '0 0 16px 0',
                 color: '#000000',
                 letterSpacing: '-0.02em',
                 lineHeight: '1.1',
                 textTransform: 'uppercase'
               }}>
                 AI Design Assistant
               </h2>
               <p style={{
                 fontSize: 'clamp(14px, 1.5vw, 16px)',
                 color: '#6b7280',
                 lineHeight: '1.5',
                 margin: '0 0 24px 0',
                 maxWidth: '580px',
                 fontWeight: 400
               }}>
                Get instant design recommendations, color palettes, and layout suggestions. AI helps you create the perfect room with smart recommendations.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: 8, textAlign: 'left', width: 'calc(100% - 2px)', paddingLeft: 0 }}>
                  <button
                    style={{
                      background: '#FFD600',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '15px',
                      padding: '8px 16px',
                      border: '1px solid #1a1814',
                      borderRadius: '0',
                      marginRight: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0029ff';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFD600';
                      e.currentTarget.style.color = '#000';
                    }}
                  >
                    Smart Recommendations
                  </button>
                  {/* <input
                    className="ai-input"
                    style={{
                      // width: '50%',
                      // padding: '10px 16px',
                      // border: '1px solid #000',
                      // borderRadius: '0',
                      // fontSize: '16px',
                      // background: '#222',
                      // color: '#fff',
                      // margin: 0,
                      // textAlign: 'left',
                      background: '##000000',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '15px',
                      padding: '8px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0',
                      marginRight: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    placeholder="Color Harmony"
                  /> */}
                    <button
                    style={{
                      background: '#000',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '15px',
                      padding: '8px 16px',
                      border: '1px solid #1a1814',
                      borderRadius: '0',
                      marginRight: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#000';
                      e.currentTarget.style.color = '#fff';
                    }}
                  >
                    Color Harmony
                  </button>
                </div>
              </div>
            </div>

                       {/* Deep Research & Agents */}
             <div 
               style={{
                 gridColumn: 'span 1',
                 background: '#ffffff',
                 border: '1px solid #e5e7eb',
                 borderRadius: '0',
                 padding: '32px',
                 position: 'relative',
                 transition: 'border-color 0.2s ease'
               }}
               onMouseEnter={(e) => e.currentTarget.style.borderColor = '#000000'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
             >
              
                           <h3 style={{
                 fontSize: 'clamp(18px, 2vw, 24px)',
                 fontWeight: 700,
                 margin: '0 0 16px 0',
                 color: '#000000',
                 letterSpacing: '-0.02em',
                 textTransform: 'uppercase'
               }}>
                 Deep Research & Agents
               </h3>
              <p style={{
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                color: '#6b7280',
                lineHeight: '1.5',
                margin: '0 0 24px 0',
                fontWeight: 400
              }}>
                Get stuck? Use AI agents to help with research, design decisions, and complex room planning. Deep research tools guide your creative process.
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  style={{
                    background: '#fff',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0',
                    marginRight: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  AI Agents
                </button>
                <button
                  style={{
                    background: '#fff',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0',
                    marginRight: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  Deep Research
                </button>
                <button
                  style={{
                    background: '#fff',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0',
                    marginRight: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  Design Guidance
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}