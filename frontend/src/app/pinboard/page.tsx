// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import { Trash2 } from "lucide-react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { db } from "@/lib/firebase/firebase";
// import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

// interface Note {
//   id: string;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   text: string;
//   color: string;
//   fontSize?: number;
//   fontWeight?: string;
//   fontStyle?: string;
//   textDecoration?: string;
// }

// export default function PinboardPage() {
//   const search = useSearchParams();
//   const roomId = search.get("roomId") || "";
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [isLoaded, setIsLoaded] = useState(false);

//   const [textSaveTimeout, setTextSaveTimeout] = useState<NodeJS.Timeout | null>(null);
//   const [selectedId, setSelectedId] = useState<string | null>(null);
//   const [showFormatToolbar, setShowFormatToolbar] = useState<boolean>(false);
//   const [drag, setDrag] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
//   const [resize, setResize] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
//   const boardRef = useRef<HTMLDivElement>(null);
//   const [boardHeight, setBoardHeight] = useState<number>(1200);

//   const loadFromFirestore = async () => {
//     if (!roomId || isLoaded) return;
//     try {
//       const roomRef = doc(db, "rooms", roomId);
//       const roomDoc = await getDoc(roomRef);
//       if (roomDoc.exists()) {
//         const data = roomDoc.data();
//         if (data.pinboard?.notes) {
//           setNotes(data.pinboard.notes);
//         }
//       }
//       setIsLoaded(true);
//     } catch (error) {
//       console.error("Error loading pinboard:", error);
//       setIsLoaded(true);
//     }
//   };

//   // Auto-load data when component mounts
//   if (!isLoaded && roomId) {
//     loadFromFirestore();
//   }

//   const addNote = async () => {
//     // Auto-load data if not loaded yet
//     if (!isLoaded) {
//       await loadFromFirestore();
//     }
    
//     const screenCenterX = window.innerWidth / 2;
//     const screenCenterY = window.innerHeight / 2;
    
//     // Convert screen center to board coordinates
//     let x = screenCenterX - 110; // Center the 220px wide note
//     let y = screenCenterY - 80;  // Center the 160px tall note
    
//     if (boardRef.current) {
//       const rect = boardRef.current.getBoundingClientRect();
//       x = screenCenterX - rect.left - 125; // Adjust for board position
//       y = screenCenterY - rect.top - 125;   // Adjust for board position
//     }
    
//     const id = `note_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
//     const newNote = { 
//       id, x, y, width: 250, height: 250, text: "", color: "#FEF9C3",
//       fontSize: 16, fontWeight: "normal", fontStyle: "normal", textDecoration: "none"
//     };
//     const newNotes = [...notes, newNote];
    
//     setNotes(newNotes);
//     setSelectedId(id);
    
//     // Auto-save to Firestore
//     await saveToFirestore(newNotes);
//   };

//   const colors = ["#FEF9C3", "#E0F2FE", "#FCE7F3", "#DCFCE7", "#F1F5F9"];

//   const onMouseDownItem = (e: React.MouseEvent, id: string) => {
//     if (!boardRef.current) return;
//     const rect = boardRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const n = notes.find(n => n.id === id);
//     if (!n) return;
//     setDrag({ id, offsetX: x - n.x, offsetY: y - n.y });
//     try { (document.body as any).style.userSelect = 'none'; } catch {}
//   };

//   const onMouseMove = (e: React.MouseEvent) => {
//     if (!boardRef.current) return;
//     const rect = boardRef.current.getBoundingClientRect();
//     if (drag) {
//       const x = e.clientX - rect.left - drag.offsetX;
//       const y = e.clientY - rect.top - drag.offsetY;
//       setNotes(prev => prev.map(n => n.id === drag.id ? { ...n, x, y } : n));
//       if (y + 300 > boardHeight) setBoardHeight(y + 600);
//     }
//     if (resize) {
//       const dx = e.clientX - rect.left - resize.startX;
//       const dy = e.clientY - rect.top - resize.startY;
//       setNotes(prev => prev.map(n => n.id === resize.id ? { ...n, width: Math.max(140, resize.startW + dx), height: Math.max(100, resize.startH + dy) } : n));
//     }
//   };

//   const onMouseUp = async () => { 
//     setDrag(null); 
//     setResize(null); 
//     try { (document.body as any).style.userSelect = ''; } catch {} 
//     // Auto-save when dragging/resizing ends
//     if (isLoaded) {
//       await saveToFirestore(notes);
//     }
//   };

//   const saveToFirestore = async (notesToSave: Note[]) => {
//     if (!roomId) return;
//     try {
//       const roomRef = doc(db, "rooms", roomId);
//       await updateDoc(roomRef, {
//         pinboard: { notes: notesToSave }
//       });
//     } catch (error) {
//       console.error("Error saving pinboard:", error);
//     }
//   };


//   return (
//     <div style={{ height: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", overflow: "hidden" }}>
//       <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center" 
//         ref={boardRef}
//         onMouseMove={onMouseMove}
//         onMouseUp={onMouseUp}
//         style={{ 
//           position: "relative", 
//           flex: 1, 
//           width: "100%",
//           height: "100%",
//           background: '#fafafa',
//           backgroundImage: 'radial-gradient(#d1d1d1 1px, transparent 1px)',
//           backgroundSize: '16px 16px',
//           userSelect: resize ? 'none' as const : 'auto' 
//         }}>
//         {notes.map((n) => (
//           <div key={n.id} style={{ position: "absolute", left: n.x, top: n.y, width: n.width, boxShadow: selectedId === n.id ? "0 4px 10px rgba(0,0,0,0.1)" : "0 2px 6px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", borderRadius: 8, background: n.color }}>
//             <div onMouseDown={(e) => onMouseDownItem(e, n.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #e5e7eb", cursor: "move" }}>
//               <div style={{ display: "flex", gap: 6 }}>
//                 {colors.map(c => (
//                   <button key={c} onClick={async () => {
//                     const updatedNotes = notes.map(x => x.id === n.id ? { ...x, color: c } : x);
//                     setNotes(updatedNotes);
//                     if (isLoaded) await saveToFirestore(updatedNotes);
//                   }} style={{ width: 14, height: 14, borderRadius: 4, border: "1px solid #cbd5e1", background: c }} />
//                 ))}
//               </div>
//               <button onClick={async () => {
//                 const updatedNotes = notes.filter(x => x.id !== n.id);
//                 setNotes(updatedNotes);
//                 if (isLoaded) await saveToFirestore(updatedNotes);
//               }} aria-label="Delete note" style={{ border: "none", background: "transparent", color: "#64748b", padding: 4, display: 'flex', alignItems: 'center' }}>
//                 <Trash2 size={16} />
//               </button>
//             </div>
//             <textarea 
//               value={n.text} 
//               onFocus={() => {
//                 setSelectedId(n.id);
//                 setShowFormatToolbar(true);
//               }}
//               onBlur={() => {
//                 setTimeout(() => setShowFormatToolbar(false), 200);
//               }}
//               onChange={e => {
//                 const updatedNotes = notes.map(x => x.id === n.id ? { ...x, text: e.target.value } : x);
//                 setNotes(updatedNotes);
                
//                 // Debounced save - wait 1 second after user stops typing
//                 if (textSaveTimeout) clearTimeout(textSaveTimeout);
//                 const timeout = setTimeout(async () => {
//                   if (isLoaded) await saveToFirestore(updatedNotes);
//                 }, 1000);
//                 setTextSaveTimeout(timeout);
//               }} 
//               style={{ 
//                 width: "100%", 
//                 height: Math.max(60, n.height - 40), 
//                 resize: "none", 
//                 padding: 10, 
//                 border: "none", 
//                 outline: "none", 
//                 background: "transparent", 
//                 fontSize: n.fontSize || 16,
//                 fontWeight: n.fontWeight || "normal",
//                 fontStyle: n.fontStyle || "normal", 
//                 textDecoration: n.textDecoration || "none",
//                 color: "#111827", 
//                 lineHeight: "1.6" 
//               }} 
//               placeholder="Write your idea..." 
//             />
//             <div onMouseDown={(e) => { e.stopPropagation(); if (!boardRef.current) return; const rect = boardRef.current.getBoundingClientRect(); setResize({ id: n.id, startX: e.clientX - rect.left, startY: e.clientY - rect.top, startW: n.width, startH: n.height }); try { (document.body as any).style.userSelect = 'none'; } catch {} }} style={{ position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, cursor: 'nwse-resize' }} />
//           </div>
//         ))}

//         {/* Floating format toolbar */}
//         {showFormatToolbar && selectedId && (() => {
//           const selectedNote = notes.find(n => n.id === selectedId);
//           if (!selectedNote) return null;
          
//           const isNearTop = selectedNote.y < 80;
//           const toolbarY = isNearTop ? selectedNote.y + selectedNote.height + 10 : selectedNote.y - 60;
          
//           return (
//             <div style={{
//               position: 'absolute',
//               left: selectedNote.x,
//               top: toolbarY,
//               zIndex: 100,
//               background: '#333',
//               borderRadius: 12,
//               padding: '8px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '4px',
//               boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
//             }}>
//               {/* Color picker */}
//               <input 
//                 type="color" 
//                 value={selectedNote.color}
//                 onChange={async (e) => {
//                   const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, color: e.target.value } : x);
//                   setNotes(updatedNotes);
//                   if (isLoaded) await saveToFirestore(updatedNotes);
//                 }}
//                 style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer' }}
//               />
              
//               {/* Font size */}
//               <select 
//                 value={selectedNote.fontSize || 16}
//                 onChange={async (e) => {
//                   const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, fontSize: parseInt(e.target.value) } : x);
//                   setNotes(updatedNotes);
//                   if (isLoaded) await saveToFirestore(updatedNotes);
//                 }}
//                 style={{ 
//                   background: '#444', color: 'white', border: 'none', borderRadius: 6, 
//                   padding: '6px 8px', fontSize: 12, cursor: 'pointer' 
//                 }}
//               >
//                 <option value={12}>12</option>
//                 <option value={14}>14</option>
//                 <option value={16}>16</option>
//                 <option value={18}>18</option>
//                 <option value={20}>20</option>
//                 <option value={24}>24</option>
//               </select>
              
//               {/* Bold */}
//               <button 
//                 onClick={async () => {
//                   const newWeight = selectedNote.fontWeight === 'bold' ? 'normal' : 'bold';
//                   const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, fontWeight: newWeight } : x);
//                   setNotes(updatedNotes);
//                   if (isLoaded) await saveToFirestore(updatedNotes);
//                 }}
//                 style={{ 
//                   background: selectedNote.fontWeight === 'bold' ? '#555' : 'transparent',
//                   color: 'white', border: 'none', borderRadius: 6, padding: '8px', 
//                   cursor: 'pointer', fontWeight: 'bold', fontSize: 14 
//                 }}
//               >B</button>
              
//               {/* Italic */}
//               <button 
//                 onClick={async () => {
//                   const newStyle = selectedNote.fontStyle === 'italic' ? 'normal' : 'italic';
//                   const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, fontStyle: newStyle } : x);
//                   setNotes(updatedNotes);
//                   if (isLoaded) await saveToFirestore(updatedNotes);
//                 }}
//                 style={{ 
//                   background: selectedNote.fontStyle === 'italic' ? '#555' : 'transparent',
//                   color: 'white', border: 'none', borderRadius: 6, padding: '8px', 
//                   cursor: 'pointer', fontStyle: 'italic', fontSize: 14 
//                 }}
//               >I</button>
              
//               {/* Underline */}
//               <button 
//                 onClick={async () => {
//                   const newDecoration = selectedNote.textDecoration === 'underline' ? 'none' : 'underline';
//                   const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, textDecoration: newDecoration } : x);
//                   setNotes(updatedNotes);
//                   if (isLoaded) await saveToFirestore(updatedNotes);
//                 }}
//                 style={{ 
//                   background: selectedNote.textDecoration === 'underline' ? '#555' : 'transparent',
//                   color: 'white', border: 'none', borderRadius: 6, padding: '8px', 
//                   cursor: 'pointer', textDecoration: 'underline', fontSize: 14 
//                 }}
//               >U</button>
              
//               {/* Link placeholder */}
//               <button 
//                 style={{ 
//                   background: 'transparent', color: 'white', border: 'none', 
//                   borderRadius: 6, padding: '8px', cursor: 'pointer', fontSize: 14 
//                 }}
//               >🔗</button>
//             </div>
//           );
//         })()}
//       </div> 
//       <div
//         style={{ 
//             position: 'fixed', 
//             bottom: 20, 
//             left: '50%', 
//             zIndex: 50,
//             background: 'white',
//             border: '1px solid #e0e0e0',
//             borderRadius: 12,
//             padding: '8px',
//             boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
//       }}>
//         <button onClick={addNote} style={{ 
//           background: 'transparent', 
//           color: '#333', 
//           border: 'none', 
//           borderRadius: 8, 
//           padding: '10px 12px', 
//           fontSize: 14,
//           cursor: 'pointer',
//           display: 'flex',
//           alignItems: 'center',
//           gap: '6px'
//         }}>
//           📝 Note
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import { useRef, useState, useEffect } from "react";
import { 
  Pencil, Eraser, StickyNote, ImagePlus, ZoomIn, ZoomOut, Trash2, ArrowLeft
} from "lucide-react";
import { Canvas as FabricCanvas, Rect, Textbox, Image as FabricImage, Group, Path as FabricPath } from "fabric";
import * as fabricNS from "fabric";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";


// Helper to read design tokens (HSL) from CSS variables and return usable CSS color strings
function token(name: string) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return val ? `hsl(${val})` : undefined;
}

const TOOLBAR_HEIGHT = 88; // keep some space for a comfy fixed toolbar

export type Tool = "select" | "hand" | "draw" | "eraser";

export default function Jamboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const isDraggingRef = useRef(false);
  const search = useSearchParams();
  const roomId = search.get("roomId") || "";
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // default color for new notes; can be changed from swatches
  const [noteColor, setNoteColor] = useState<string>("#FEF9C3");
  
  // Apply a consistent, modern look to Fabric controls per object
  const applyControlsTheme = (obj: any) => {
    try {
      obj.set({
        transparentCorners: false,
        cornerStyle: 'circle',
        cornerColor: '#111827', // slate-900
        cornerStrokeColor: '#ffffff',
        cornerSize: 12,
        borderColor: '#111827',
        padding: 6,
        rotatingPointOffset: 24,
      });
    } catch {}
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Modernize Fabric selection/resize UI (global)
    try {
      (fabricNS as any).Object.prototype.transparentCorners = false;
      (fabricNS as any).Object.prototype.cornerStyle = 'circle';
      (fabricNS as any).Object.prototype.cornerColor = '#111827'; // slate-900
      (fabricNS as any).Object.prototype.cornerStrokeColor = '#ffffff';
      (fabricNS as any).Object.prototype.cornerSize = 12;
      (fabricNS as any).Object.prototype.borderColor = '#111827';
      (fabricNS as any).Object.prototype.borderScaleFactor = 2;
      (fabricNS as any).Object.prototype.selectionBackgroundColor = 'rgba(15,23,42,0.05)';
      (fabricNS as any).Object.prototype.padding = 6;
      (fabricNS as any).Object.prototype.rotatingPointOffset = 24;
    } catch {}

    const computeSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight - TOOLBAR_HEIGHT;
      return { w, h };
    };

    const { w, h } = computeSize();
    const canvas = new FabricCanvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: 'transparent',
      selection: true,
      subTargetCheck: true,
    });
    // Canvas selection cosmetics
    (canvas as any).selectionColor = 'rgba(15,23,42,0.06)';
    (canvas as any).selectionBorderColor = '#111827';
    (canvas as any).selectionLineWidth = 1.25;

    // Drawing brush will be configured when entering draw mode

    // Wheel: zoom with ctrl/cmd, otherwise pan (infinite scroll feel)
    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      const point = { x: e.offsetX, y: e.offsetY } as any;

      if (e.ctrlKey || e.metaKey) {
        const zoom = canvas.getZoom();
        const delta = -e.deltaY;
        const zoomFactor = 1 + (delta > 0 ? 0.1 : -0.1);
        let newZoom = zoom * zoomFactor;
        newZoom = Math.max(0.2, Math.min(5, newZoom));
        canvas.zoomToPoint(point, newZoom);
        canvas.requestRenderAll();
        return;
      }

      // Pan using Fabric API so controls remain in sync
      const panPoint = new (fabricNS as any).Point(-e.deltaX, -e.deltaY);
      canvas.relativePan(panPoint);
      canvas.requestRenderAll();
    };

    // Mouse drag panning when in "hand" tool
    const onMouseDown = (opt: any) => {
      if (activeTool !== "hand") return;
      isDraggingRef.current = true;
      canvas.setCursor("grabbing");
    };

    const onMouseMove = (opt: any) => {
      if (!isDraggingRef.current) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;
      vpt[4] += evt.movementX;
      vpt[5] += evt.movementY;
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      canvas.setCursor("default");
    };

    // Enable editing textbox inside a note on double-click
    const onDbl = (opt: any) => {
      const target = opt?.target;
      if (!target) return;
      let group = target as any;
      if (group.type !== 'group' && (group.group as any)?.type === 'group') {
        group = group.group;
      }
      if (group.type === 'group') {
        const tb = (group as Group).getObjects().find((o: any) => o.type === 'textbox') as any;
        if (tb) {
          // Clear placeholder text when editing begins
          if ((tb as any)._isPlaceholder) {
            tb.set('text', '');
            tb.set('fill', token('foreground') || '#111111');
            (tb as any)._isPlaceholder = false;
          }
          canvas.setActiveObject(tb);
          tb.enterEditing();
          tb.hiddenTextarea?.focus?.();
          canvas.requestRenderAll();
        }
      }
    };

    // Attach listeners
    const upper = canvas.upperCanvasEl as HTMLCanvasElement;
    upper.addEventListener("wheel", wheelListener, { passive: false });
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
    canvas.on('mouse:dblclick', onDbl);
    canvas.on('object:added', (evt: any) => { if (evt?.target) applyControlsTheme(evt.target); });
    
    // Handle placeholder text when editing ends
    const onTextEditingEnd = (evt: any) => {
      const tb = evt.target;
      if (tb && tb.type === 'textbox') {
        if (!tb.text || tb.text.trim() === '') {
          // Restore placeholder if text is empty
          (tb as any)._isPlaceholder = true;
          tb.set('text', (tb as any)._placeholder || 'Write your idea...');
          tb.set('fill', '#9ca3af'); // gray-400 for placeholder
          canvas.requestRenderAll();
        } else {
          // Ensure normal text color
          (tb as any)._isPlaceholder = false;
          tb.set('fill', token('foreground') || '#111111');
        }
        
        saveNotesDebounced();
      }
    };
    canvas.on('text:editing:exited', onTextEditingEnd);
    
    // Tag drawing paths when created
    const onPathCreated = (evt: any) => {
      const p = evt?.path as any;
      if (p) {
        p.data = { type: 'drawing', id: `draw_${Date.now()}_${Math.random().toString(36).slice(2,6)}` };
        p.erasable = true;
        saveNotesDebounced();
      }
    };
    canvas.on('path:created', onPathCreated);

    setFabricCanvas(canvas);

    // Try loading saved notes
    const loadFromFirestore = async () => {
      if (!roomId || isLoaded) return;
      try {
        const roomRef = doc(db, "rooms", roomId);
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
          const data: any = snap.data();
          const saved = data?.pinboard?.notes as any[] | undefined;
          if (Array.isArray(saved)) {
            for (const n of saved) {
              const w = Math.max(60, n.width ?? 180);
              const h = Math.max(60, n.height ?? 180);
              // Children are positioned relative to group center to preserve layout on reload
              const rect = new Rect({
                left: 0,
                top: 0,
                originX: 'center',
                originY: 'center',
                width: w,
                height: h,
                rx: 0,
                ry: 0,
                fill: n.fill || noteColor,
                stroke: n.stroke || (token('border') || '#e5e7eb'),
              });
              const tb = new Textbox(n.text || '', {
                left: -w / 2 + 12,
                top: -h / 2 + 12,
                originX: 'left',
                originY: 'top',
                width: w - 24,
                fontSize: 18,
                fill: token('foreground') || '#111111',
                editable: true,
                splitByGrapheme: false, // Changed to false for proper word wrapping
                lineHeight: 1.4,
              });
              
              // Set up placeholder behavior for loaded notes
              (tb as any)._placeholder = "Write your idea...";
              if (!n.text || n.text.trim() === '') {
                (tb as any)._isPlaceholder = true;
                tb.set('text', 'Write your idea...');
                tb.set('fill', '#9ca3af'); // gray-400 for placeholder
              } else {
                (tb as any)._isPlaceholder = false;
              }
              const group = new Group([rect, tb], { left: n.left ?? 0, top: n.top ?? 0 });
              applyControlsTheme(group);
              (group as any).data = { type: 'note', id: n.id || `note_${Date.now()}_${Math.random().toString(36).slice(2,6)}` };
              (group as any).erasable = false;
              canvas.add(group);
            }
            canvas.requestRenderAll();
          }
          const images = data?.pinboard?.images as any[] | undefined;
          if (Array.isArray(images)) {
            for (const im of images) {
              // @ts-ignore promise signature
              await FabricImage.fromURL(im.src).then((img: any) => {
                img.set({
                  left: im.left ?? 0,
                  top: im.top ?? 0,
                  scaleX: im.scaleX ?? 1,
                  scaleY: im.scaleY ?? 1,
                  angle: im.angle ?? 0,
                });
                applyControlsTheme(img);
                (img as any).data = { type: 'image', id: im.id, src: im.src };
                canvas.add(img);
              });
            }
            canvas.requestRenderAll();
          }
          const drawings = data?.pinboard?.drawings as any[] | undefined;
          if (Array.isArray(drawings)) {
            for (const d of drawings) {
              try {
                const svg: string | undefined = d.svg;
                if (svg && (fabricNS as any).loadSVGFromString) {
                  // Fabric v6: promise API
                  (fabricNS as any).loadSVGFromString(svg).then(({ objects, options }: any) => {
                    const grouped = (fabricNS as any).util.groupSVGElements(objects || [], options || {});
                    const obj = grouped || objects?.[0];
                    if (!obj) return;
                    obj.set({
                      left: d.left ?? 0,
                      top: d.top ?? 0,
                      scaleX: d.scaleX ?? 1,
                      scaleY: d.scaleY ?? 1,
                      angle: d.angle ?? 0,
                    });
                    applyControlsTheme(obj);
                    obj.data = { type: 'drawing', id: d.id };
                    obj.erasable = true;
                    canvas.add(obj);
                    canvas.requestRenderAll();
                  }).catch(() => {});
                }
              } catch {}
            }
            canvas.requestRenderAll();
          }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error("Load pinboard notes error", err);
        setIsLoaded(true);
      }
    };
    loadFromFirestore();

    const onResize = () => {
      const { w, h } = computeSize();
      canvas.setDimensions({ width: w, height: h });
      canvas.requestRenderAll();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      upper.removeEventListener("wheel", wheelListener as any);
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
      canvas.off('mouse:dblclick', onDbl);
      canvas.off('text:editing:exited', onTextEditingEnd);
      canvas.off('path:created', onPathCreated);
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle modes based on active tool (draw/eraser)
  useEffect(() => {
    if (!fabricCanvas) return;
    const isDraw = activeTool === 'draw';
    const isErase = activeTool === 'eraser';
    fabricCanvas.isDrawingMode = isDraw || isErase;
    fabricCanvas.selection = !(isDraw || isErase);
    if (isDraw) {
      const brush = new (fabricNS as any).PencilBrush(fabricCanvas);
      brush.width = 3;
      brush.color = token('foreground') || '#111111';
      fabricCanvas.freeDrawingBrush = brush;
    } else if (isErase) {
      const EB = (fabricNS as any).EraserBrush;
      if (EB) {
        const ebrush = new EB(fabricCanvas);
        ebrush.width = 12;
        fabricCanvas.freeDrawingBrush = ebrush;
      } else {
        fabricCanvas.isDrawingMode = false;
      }
    }
  }, [activeTool, fabricCanvas]);

  const getCanvasCenter = () => {
    if (!fabricCanvas) return { x: 0, y: 0 };
    const zoom = fabricCanvas.getZoom();
    const vpt = fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const w = fabricCanvas.getWidth();
    const h = fabricCanvas.getHeight();
    const cx = (w / 2 - vpt[4]) / zoom;
    const cy = (h / 2 - vpt[5]) / zoom;
    return { x: cx, y: cy };
  };

  const addStickyNote = () => {
    if (!fabricCanvas) return;
    const { x, y } = getCanvasCenter();

    const noteSize = 180;
    const fill = noteColor || token("accent") || "#FEF9C3";
    const stroke = token("border") || "#e5e7eb";
    const textColor = token("foreground") || "#111111";

    const rect = new Rect({ // rectangular, centered
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center',
      width: noteSize,
      height: noteSize,
      rx: 0,
      ry: 0,
      fill,
      stroke,
    });

    const tb = new Textbox("", {
      left: -noteSize / 2 + 12,
      top: -noteSize / 2 + 12,
      originX: 'left',
      originY: 'top',
      width: noteSize - 24,
      fontSize: 18,
      fill: textColor,
      editable: true,
      splitByGrapheme: false, // Changed to false for proper word wrapping
      cursorColor: '#111827',
      lineHeight: 1.4,
    });
    
    // Add placeholder behavior
    (tb as any)._placeholder = "Write your idea...";
    (tb as any)._isPlaceholder = true;
    tb.set('text', 'Write your idea...');
    tb.set('fill', '#9ca3af'); // gray-400 for placeholder

    const group = new Group([rect, tb], { left: x, top: y });
    applyControlsTheme(group);
    (group as any).data = { type: "note", id: `note_${Date.now()}_${Math.random().toString(36).slice(2,6)}` };
    (group as any).erasable = false;
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.requestRenderAll();
    // save
    saveNotesDebounced();
  };

  // recolor active note or set default for next
  const recolorActiveNote = (c: string) => {
    setNoteColor(c);
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (obj && (obj as any).type === 'group' && (obj as any).data?.type === 'note') {
      const r = (obj as Group).getObjects().find((o: any) => o.type === 'rect') as any;
      if (r) { r.set({ fill: c }); fabricCanvas.requestRenderAll(); saveNotesDebounced(); }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImage = () => fileInputRef.current?.click();

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Fabric 6: use fromURL promise API
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - types may not include promise signature in this env
      FabricImage.fromURL(dataUrl).then((img: any) => {
        const { x, y } = getCanvasCenter();
        img.set({ left: x - 150, top: y - 100, selectable: true, evented: true });
        const maxW = 360;
        if (img.getScaledWidth && img.getScaledWidth() > maxW) {
          img.scaleToWidth(maxW);
        } else if (img.width && img.width > maxW) {
          img.scaleToWidth(maxW);
        }
        applyControlsTheme(img);
        (img as any).data = { type: 'image', id: `img_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, src: dataUrl };
        (img as any).erasable = false;
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        saveNotesDebounced();
      }).catch(() => {});
    };
    reader.readAsDataURL(file);
    // reset input
    e.currentTarget.value = "";
  };

  const zoomIn = () => {
    if (!fabricCanvas) return;
    const center = { x: fabricCanvas.getWidth() / 2, y: fabricCanvas.getHeight() / 2 } as any;
    const newZoom = Math.min(5, fabricCanvas.getZoom() * 1.2);
    fabricCanvas.zoomToPoint(center, newZoom);
    fabricCanvas.requestRenderAll();
  };

  const zoomOut = () => {
    if (!fabricCanvas) return;
    const center = { x: fabricCanvas.getWidth() / 2, y: fabricCanvas.getHeight() / 2 } as any;
    const newZoom = Math.max(0.2, fabricCanvas.getZoom() / 1.2);
    fabricCanvas.zoomToPoint(center, newZoom);
    fabricCanvas.requestRenderAll();
  };

  const clearAll = () => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (active) {
      fabricCanvas.remove(active);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
      saveNotesDebounced();
    }
  };

  // Serialize notes
  const serializeNotes = (): any[] => {
    if (!fabricCanvas) return [];
    const out: any[] = [];
    for (const obj of fabricCanvas.getObjects()) {
      const tag = (obj as any).data;
      if (!tag || tag.type !== "note") continue;
      // Expect group with rect + textbox
      let rect: any = null, tb: any = null;
      if (obj instanceof Group) {
        (obj as Group).getObjects().forEach((child: any) => {
          if (child.type === "rect") rect = child;
          if (child.type === "textbox") tb = child;
        });
      }
      out.push({
        id: tag.id,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        width: rect?.width ?? 180,
        height: rect?.height ?? 180,
        fill: rect?.fill ?? undefined,
        stroke: rect?.stroke ?? undefined,
        text: ((tb as any)?._isPlaceholder) ? "" : (tb?.text ?? ""),
      });
    }
    return out;
  };

  // Serialize images
  const serializeImages = (): any[] => {
    if (!fabricCanvas) return [];
    const out: any[] = [];
    for (const obj of fabricCanvas.getObjects()) {
      const tag = (obj as any).data;
      if (!tag || tag.type !== 'image') continue;
      const rec: any = {
        id: tag.id,
        src: tag.src,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        scaleX: (obj as any).scaleX ?? 1,
        scaleY: (obj as any).scaleY ?? 1,
        angle: obj.angle ?? 0,
      };
      out.push(rec);
    }
    return out;
  };

  const serializeDrawings = (): any[] => {
    if (!fabricCanvas) return [];
    const out: any[] = [];
    for (const obj of fabricCanvas.getObjects()) {
      const tag = (obj as any).data;
      if (!tag || tag.type !== 'drawing') continue;
      const svg = (obj as any).toSVG ? (obj as any).toSVG() : '';
      const rec: any = {
        id: tag.id,
        svg,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        scaleX: (obj as any).scaleX ?? 1,
        scaleY: (obj as any).scaleY ?? 1,
        angle: obj.angle ?? 0,
      };
      out.push(rec);
    }
    return out;
  };

  const saveNotes = async () => {
    if (!fabricCanvas || !roomId || isSaving) return;
    try {
      setIsSaving(true);
      const sanitize = (o: any): any => {
        if (Array.isArray(o)) return o.map(sanitize);
        if (o && typeof o === 'object') {
          const r: any = {};
          Object.entries(o).forEach(([k, v]) => { if (v !== undefined) r[k] = sanitize(v); });
          return r;
        }
        return o;
      };
      const notes = sanitize(serializeNotes());
      const images = sanitize(serializeImages());
      const drawings = sanitize(serializeDrawings());
      const roomRef = doc(db, "rooms", roomId);
      // Save with merge-like structure to avoid invalid nested entity errors
      await updateDoc(roomRef, {
        'pinboard.notes': notes,
        'pinboard.images': images,
        'pinboard.drawings': drawings,
      });
    } catch (err) {
      console.error("Save pinboard pinboard error", err);
    } finally {
      setIsSaving(false);
    }
  };

  let saveTimer: any = null;
  const saveNotesDebounced = () => {
    if (saveTimer) clearTimeout(saveTimer);
    // shorter debounce so drawings/images/notes persist faster
    saveTimer = setTimeout(saveNotes, 150);
  };

  // Auto-save when objects move/scale
  useEffect(() => {
    if (!fabricCanvas) return;
    const handler = () => saveNotesDebounced();
    fabricCanvas.on("object:modified", handler);
    // delete via Backspace/Delete
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const obj = fabricCanvas.getActiveObject();
        if (obj) {
          fabricCanvas.remove(obj);
          fabricCanvas.requestRenderAll();
          saveNotesDebounced();
        }
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      fabricCanvas.off("object:modified", handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [fabricCanvas]);


  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh)]">
      {/* Back to layouts */}
      <button
        onClick={() => router.push('/layout')}
        title="Back to layouts"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          background: 'white',
          color: '#111827',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={18} />
      </button>
      {/* SEO-friendly H1 (visually hidden) */}
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Drawing is handled directly by Fabric freeDrawingBrush; no overlay needed */}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 16,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 24,
            border: "1px solid #e5e7eb",
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          {(() => {
            const baseBtn: React.CSSProperties = {
              width: 48,
              height: 48,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            };
            const activeBtn: React.CSSProperties = {
              ...baseBtn,
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid #0f172a",
            };
            const divider: React.CSSProperties = { width: 1, height: 28, background: "#e5e7eb", margin: "0 4px" };

            return (
              <>
                <button title="Draw" onClick={() => setActiveTool("draw")} style={activeTool === "draw" ? activeBtn : baseBtn}>
                  <Pencil size={20} />
                </button>
                <button title="Eraser" onClick={() => setActiveTool("eraser" as any)} style={activeTool === ("eraser" as any) ? activeBtn : baseBtn}>
                  <Eraser size={20} />
                </button>

                <div style={divider} />

                <button title="Add sticky note" onClick={addStickyNote} style={baseBtn}>
                  <StickyNote size={20} />
                </button>
                {/* Sticky note color swatches */}
                {['#FEF9C3','#E0F2FE','#FCE7F3','#DCFCE7','#F1F5F9'].map((c) => (
                  <button key={c} title="Note color" onClick={() => recolorActiveNote(c)}
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: c, cursor: 'pointer' }} />
                ))}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageSelected} style={{ display: "none" }} />
                <button title="Add image" onClick={addImage} style={baseBtn}>
                  <ImagePlus size={20} />
                </button>

                <div style={divider} />

                <button title="Zoom out" onClick={zoomOut} style={baseBtn}>
                  <ZoomOut size={20} />
                </button>
                <button title="Zoom in" onClick={zoomIn} style={baseBtn}>
                  <ZoomIn size={20} />
                </button>

                <div style={divider} />
                <button title="Clear board" onClick={clearAll} style={{
                  ...baseBtn,
                  background: "#ef4444",
                  border: "1px solid #ef4444",
                  color: "white",
                }}>
                  <Trash2 size={20} />
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
