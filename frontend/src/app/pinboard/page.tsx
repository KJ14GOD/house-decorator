"use client";
import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

interface Note {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

export default function PinboardPage() {
  const search = useSearchParams();
  const roomId = search.get("roomId") || "";
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [textSaveTimeout, setTextSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFormatToolbar, setShowFormatToolbar] = useState<boolean>(false);
  const [drag, setDrag] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resize, setResize] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardHeight, setBoardHeight] = useState<number>(1200);

  const loadFromFirestore = async () => {
    if (!roomId || isLoaded) return;
    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomDoc = await getDoc(roomRef);
      if (roomDoc.exists()) {
        const data = roomDoc.data();
        if (data.pinboard?.notes) {
          setNotes(data.pinboard.notes);
        }
      }
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading pinboard:", error);
      setIsLoaded(true);
    }
  };

  // Auto-load data when component mounts
  if (!isLoaded && roomId) {
    loadFromFirestore();
  }

  const addNote = async () => {
    // Auto-load data if not loaded yet
    if (!isLoaded) {
      await loadFromFirestore();
    }
    
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    // Convert screen center to board coordinates
    let x = screenCenterX - 110; // Center the 220px wide note
    let y = screenCenterY - 80;  // Center the 160px tall note
    
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      x = screenCenterX - rect.left - 125; // Adjust for board position
      y = screenCenterY - rect.top - 125;   // Adjust for board position
    }
    
    const id = `note_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const newNote = { 
      id, x, y, width: 250, height: 250, text: "", color: "#FEF9C3",
      fontSize: 16, fontWeight: "normal", fontStyle: "normal", textDecoration: "none"
    };
    const newNotes = [...notes, newNote];
    
    setNotes(newNotes);
    setSelectedId(id);
    
    // Auto-save to Firestore
    await saveToFirestore(newNotes);
  };

  const colors = ["#FEF9C3", "#E0F2FE", "#FCE7F3", "#DCFCE7", "#F1F5F9"];

  const onMouseDownItem = (e: React.MouseEvent, id: string) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const n = notes.find(n => n.id === id);
    if (!n) return;
    setDrag({ id, offsetX: x - n.x, offsetY: y - n.y });
    try { (document.body as any).style.userSelect = 'none'; } catch {}
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    if (drag) {
      const x = e.clientX - rect.left - drag.offsetX;
      const y = e.clientY - rect.top - drag.offsetY;
      setNotes(prev => prev.map(n => n.id === drag.id ? { ...n, x, y } : n));
      if (y + 300 > boardHeight) setBoardHeight(y + 600);
    }
    if (resize) {
      const dx = e.clientX - rect.left - resize.startX;
      const dy = e.clientY - rect.top - resize.startY;
      setNotes(prev => prev.map(n => n.id === resize.id ? { ...n, width: Math.max(140, resize.startW + dx), height: Math.max(100, resize.startH + dy) } : n));
    }
  };

  const onMouseUp = async () => { 
    setDrag(null); 
    setResize(null); 
    try { (document.body as any).style.userSelect = ''; } catch {} 
    // Auto-save when dragging/resizing ends
    if (isLoaded) {
      await saveToFirestore(notes);
    }
  };

  const saveToFirestore = async (notesToSave: Note[]) => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        pinboard: { notes: notesToSave }
      });
    } catch (error) {
      console.error("Error saving pinboard:", error);
    }
  };


  return (
    <div style={{ height: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div
        ref={boardRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{ 
          position: "relative", 
          flex: 1, 
          width: "100%",
          height: "100%",
          background: 'radial-gradient(#d0d0d0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          userSelect: resize ? 'none' as const : 'auto' 
        }}>
        {notes.map((n) => (
          <div key={n.id} style={{ position: "absolute", left: n.x, top: n.y, width: n.width, boxShadow: selectedId === n.id ? "0 4px 10px rgba(0,0,0,0.1)" : "0 2px 6px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", borderRadius: 8, background: n.color }}>
            <div onMouseDown={(e) => onMouseDownItem(e, n.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #e5e7eb", cursor: "move" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {colors.map(c => (
                  <button key={c} onClick={async () => {
                    const updatedNotes = notes.map(x => x.id === n.id ? { ...x, color: c } : x);
                    setNotes(updatedNotes);
                    if (isLoaded) await saveToFirestore(updatedNotes);
                  }} style={{ width: 14, height: 14, borderRadius: 4, border: "1px solid #cbd5e1", background: c }} />
                ))}
              </div>
              <button onClick={async () => {
                const updatedNotes = notes.filter(x => x.id !== n.id);
                setNotes(updatedNotes);
                if (isLoaded) await saveToFirestore(updatedNotes);
              }} aria-label="Delete note" style={{ border: "none", background: "transparent", color: "#64748b", padding: 4, display: 'flex', alignItems: 'center' }}>
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              value={n.text} 
              onFocus={() => {
                setSelectedId(n.id);
                setShowFormatToolbar(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowFormatToolbar(false), 200);
              }}
              onChange={e => {
                const updatedNotes = notes.map(x => x.id === n.id ? { ...x, text: e.target.value } : x);
                setNotes(updatedNotes);
                
                // Debounced save - wait 1 second after user stops typing
                if (textSaveTimeout) clearTimeout(textSaveTimeout);
                const timeout = setTimeout(async () => {
                  if (isLoaded) await saveToFirestore(updatedNotes);
                }, 1000);
                setTextSaveTimeout(timeout);
              }} 
              style={{ 
                width: "100%", 
                height: Math.max(60, n.height - 40), 
                resize: "none", 
                padding: 10, 
                border: "none", 
                outline: "none", 
                background: "transparent", 
                fontSize: n.fontSize || 16,
                fontWeight: n.fontWeight || "normal",
                fontStyle: n.fontStyle || "normal", 
                textDecoration: n.textDecoration || "none",
                color: "#111827", 
                lineHeight: "1.6" 
              }} 
              placeholder="Write your idea..." 
            />
            <div onMouseDown={(e) => { e.stopPropagation(); if (!boardRef.current) return; const rect = boardRef.current.getBoundingClientRect(); setResize({ id: n.id, startX: e.clientX - rect.left, startY: e.clientY - rect.top, startW: n.width, startH: n.height }); try { (document.body as any).style.userSelect = 'none'; } catch {} }} style={{ position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, cursor: 'nwse-resize' }} />
          </div>
        ))}

        {/* Floating format toolbar */}
        {showFormatToolbar && selectedId && (() => {
          const selectedNote = notes.find(n => n.id === selectedId);
          if (!selectedNote) return null;
          
          const isNearTop = selectedNote.y < 80;
          const toolbarY = isNearTop ? selectedNote.y + selectedNote.height + 10 : selectedNote.y - 60;
          
          return (
            <div style={{
              position: 'absolute',
              left: selectedNote.x,
              top: toolbarY,
              zIndex: 100,
              background: '#333',
              borderRadius: 12,
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              {/* Color picker */}
              <input 
                type="color" 
                value={selectedNote.color}
                onChange={async (e) => {
                  const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, color: e.target.value } : x);
                  setNotes(updatedNotes);
                  if (isLoaded) await saveToFirestore(updatedNotes);
                }}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer' }}
              />
              
              {/* Font size */}
              <select 
                value={selectedNote.fontSize || 16}
                onChange={async (e) => {
                  const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, fontSize: parseInt(e.target.value) } : x);
                  setNotes(updatedNotes);
                  if (isLoaded) await saveToFirestore(updatedNotes);
                }}
                style={{ 
                  background: '#444', color: 'white', border: 'none', borderRadius: 6, 
                  padding: '6px 8px', fontSize: 12, cursor: 'pointer' 
                }}
              >
                <option value={12}>12</option>
                <option value={14}>14</option>
                <option value={16}>16</option>
                <option value={18}>18</option>
                <option value={20}>20</option>
                <option value={24}>24</option>
              </select>
              
              {/* Bold */}
              <button 
                onClick={async () => {
                  const newWeight = selectedNote.fontWeight === 'bold' ? 'normal' : 'bold';
                  const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, fontWeight: newWeight } : x);
                  setNotes(updatedNotes);
                  if (isLoaded) await saveToFirestore(updatedNotes);
                }}
                style={{ 
                  background: selectedNote.fontWeight === 'bold' ? '#555' : 'transparent',
                  color: 'white', border: 'none', borderRadius: 6, padding: '8px', 
                  cursor: 'pointer', fontWeight: 'bold', fontSize: 14 
                }}
              >B</button>
              
              {/* Italic */}
              <button 
                onClick={async () => {
                  const newStyle = selectedNote.fontStyle === 'italic' ? 'normal' : 'italic';
                  const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, fontStyle: newStyle } : x);
                  setNotes(updatedNotes);
                  if (isLoaded) await saveToFirestore(updatedNotes);
                }}
                style={{ 
                  background: selectedNote.fontStyle === 'italic' ? '#555' : 'transparent',
                  color: 'white', border: 'none', borderRadius: 6, padding: '8px', 
                  cursor: 'pointer', fontStyle: 'italic', fontSize: 14 
                }}
              >I</button>
              
              {/* Underline */}
              <button 
                onClick={async () => {
                  const newDecoration = selectedNote.textDecoration === 'underline' ? 'none' : 'underline';
                  const updatedNotes = notes.map(x => x.id === selectedId ? { ...x, textDecoration: newDecoration } : x);
                  setNotes(updatedNotes);
                  if (isLoaded) await saveToFirestore(updatedNotes);
                }}
                style={{ 
                  background: selectedNote.textDecoration === 'underline' ? '#555' : 'transparent',
                  color: 'white', border: 'none', borderRadius: 6, padding: '8px', 
                  cursor: 'pointer', textDecoration: 'underline', fontSize: 14 
                }}
              >U</button>
              
              {/* Link placeholder */}
              <button 
                style={{ 
                  background: 'transparent', color: 'white', border: 'none', 
                  borderRadius: 6, padding: '8px', cursor: 'pointer', fontSize: 14 
                }}
              >🔗</button>
            </div>
          );
        })()}
      </div>
        
      {/* Figma-style bottom toolbar */}
      <div style={{ 
        position: 'fixed', 
        bottom: 20, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 50,
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 12,
        padding: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
      }}>
        <button onClick={addNote} style={{ 
          background: 'transparent', 
          color: '#333', 
          border: 'none', 
          borderRadius: 8, 
          padding: '10px 12px', 
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '16px' }}>📝</span> Note
        </button>
      </div>
    </div>
  );
}


