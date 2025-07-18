"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from 'three';
import { ChevronUp, ChevronDown, X, Pencil, Trash2, Search, Check, Folder, ChevronRight, Info } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { analyzeAndBuildRoomModel, RoomModelResult } from '@/lib/prebuild/imageTo3D';

// This is a simplified version of RoomBox for the preview cards
function RoomBoxPreview({ width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, blocks }: {
  width: number;
  length: number;
  height: number;
  floorColor: string;
  ceilingColor: string;
  wallFrontColor: string;
  wallBackColor: string;
  wallLeftColor: string;
  wallRightColor: string;
  blocks?: Array<{
    id: string,
    name: string,
    x: number, 
    y: number, 
    z: number, 
    width: number, 
    height: number, 
    depth: number,
    color: string,
    created: Date
  }>;
}) {
  const scale = 0.35;
  const w = width * scale;
  const l = length * scale;
  const h = height * scale;

  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, l]} />
        <meshStandardMaterial color={wallFrontColor} transparent opacity={0.5} />
      </mesh>
       {/* Render all blocks as colored boxes inside the room */}
       {blocks && blocks.map((block, i) => (
        <mesh key={`block-${i}`} position={[
          (block.x + block.width/2) * scale - w/2,
          (block.y + block.height/2) * scale,
          (block.z + block.depth/2) * scale - l/2
        ]}>
          <boxGeometry args={[block.width * scale, block.height * scale, block.depth * scale]} />
          <meshStandardMaterial color={block.color} opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function LayoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [newModelName, setNewModelName] = useState('');
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Room dimensions state
  const [width, setWidth] = useState<number>(12);
  const [length, setLength] = useState<number>(12);
  const [height, setHeight] = useState<number>(8);

  // Saved models state
  const [savedModels, setSavedModels] = useState<any[]>([]);

  // Color state
  const [floorColor, setFloorColor] = useState('#e3e3e3');
  const [ceilingColor, setCeilingColor] = useState('#e3e3e3');
  const [wallFrontColor, setWallFrontColor] = useState('#e3e3e3');
  const [wallBackColor, setWallBackColor] = useState('#e3e3e3');
  const [wallLeftColor, setWallLeftColor] = useState('#e3e3e3');
  const [wallRightColor, setWallRightColor] = useState('#e3e3e3');

  // Add state for blocks with enhanced properties
  const [blocks, setBlocks] = useState<Array<{
    id: string,
    name: string,
    x: number, 
    y: number, 
    z: number, 
    width: number, 
    height: number, 
    depth: number,
    color: string,
    created: Date
  }>>([]);
  
  type ChatMessage = {
    role: 'user' | 'assistant';
    content: string | { type: 'room_list'; rooms: any[]; preamble: string; };
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [infoPopup, setInfoPopup] = useState<{ modelId: string; message: string } | null>(null);

  useEffect(() => {
    const fetchSavedModels = async () => {
      if (!user) {
        setSavedModels([]);
        return;
      }
      setIsLoading(true);
      const q = query(collection(db, "rooms"), where("userId", "==", user.uid));
      try {
        const querySnapshot = await getDocs(q);
        const models = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedModels(models);

        // Check for info message in localStorage
        const infoMessage = localStorage.getItem('infoMessage');
        if (infoMessage) {
          const { modelId, message } = JSON.parse(infoMessage);
          setInfoPopup({ modelId, message });
          localStorage.removeItem('infoMessage');
        }

      } catch (error) {
        console.error("Error fetching saved models: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedModels();
  }, [user]);

  const navigateToModel = (roomState: any) => {
    // Ensure chat history is properly mapped from chatHistory to chatMessages
    const formattedRoomState = {
      ...roomState,
      chatMessages: roomState.chatHistory || roomState.chatMessages || [],
      meshy_model_url: roomState.meshy_model_url || (roomState.model_data ? roomState.model_data.meshy_model_url : null),
    };
    localStorage.setItem('roomState', JSON.stringify(formattedRoomState));
    router.push('/model');
  };

  const handleUpdateName = async (id: string) => {
    const docRef = doc(db, "rooms", id);
    try {
      await updateDoc(docRef, { name: newModelName });
      setSavedModels(savedModels.map(model => model.id === id ? { ...model, name: newModelName } : model));
      setEditingModelId(null);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const docRef = doc(db, "rooms", id);
    try {
      await deleteDoc(docRef);
      setSavedModels(savedModels.filter(model => model.id !== id));
      setDeletingModelId(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const saveRoom = async (roomData: any) => {
    if (!user) return;

    // Sanitize the data for Firestore by removing the 'created' Date object from blocks.
    const sanitizedBlocks = roomData.blocks.map((block: any) => {
      const { created, ...rest } = block;
      return rest;
    });

    const dataToSave = {
      ...roomData,
      blocks: sanitizedBlocks,
      userId: user.uid,
      createdAt: serverTimestamp(),
      meshy_model_url: roomData.meshy_model_url || null,
    };

    try {
      const docRef = await addDoc(collection(db, "rooms"), dataToSave);
      console.log("Document written with ID: ", docRef.id);
      setSavedModels(prev => [{ id: docRef.id, ...roomData }, ...prev]);
      return docRef.id; // Return the new document ID
    } catch (e) {
      console.error("Error adding document: ", e);
      return null;
    }
  };

  const applyActionToState = (actionObj: any, currentState: any) => {
    const { action, target, value } = actionObj;

    let {
      width,
      length,
      height,
      floorColor,
      ceilingColor,
      wallFrontColor,
      wallBackColor,
      wallLeftColor,
      wallRightColor,
      blocks
    } = currentState;

    if (action === 'set_room_dimensions') {
      width = value.width;
      length = value.length;
      height = value.height;
    } else if (action === 'change_color') {
      const colorSetters: { [key: string]: (c: string) => void } = {
        floorColor: (c: string) => floorColor = c,
        ceilingColor: (c: string) => ceilingColor = c,
        wallFrontColor: (c: string) => wallFrontColor = c,
        wallBackColor: (c: string) => wallBackColor = c,
        wallLeftColor: (c: string) => wallLeftColor = c,
        wallRightColor: (c: string) => wallRightColor = c,
      };
      if (colorSetters[target]) {
        colorSetters[target](value);
      } else {
        blocks = blocks.map((block: any) => {
          if (block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase())) {
            return { ...block, color: value };
          }
          return block;
        });
      }
    } else if (action === 'move_object') {
      blocks = blocks.map((block: any) => {
        if (block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase())) {
          return { ...block, x: value.x, y: value.y, z: value.z };
        }
        return block;
      });
    } else if (action === 'add_object') {
      const libraryItem = libraryItems.find(item => item.name.toLowerCase() === target.toLowerCase());
      if (libraryItem) {
        const newBlock = {
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: libraryItem.name,
          x: value.x,
          y: value.y,
          z: value.z,
          width: libraryItem.width,
          height: libraryItem.height,
          depth: libraryItem.depth,
          color: libraryItem.color,
          created: new Date(),
        };
        blocks = [...blocks, newBlock];
      }
    } else if (action === 'remove_object') {
      blocks = blocks.filter((block:any) => {
        const match = block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase());
        return !match;
      });
    } 

    return { width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, blocks };
  };

  const submitMessage = async (message: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!message.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: message },
    ];
    setChatMessages(newMessages);
    const currentBlocks = blocks;
    const currentWidth = width;
    const currentLength = length;
    const currentHeight = height;

    setChatInput('');
    setIsLoading(true);

    try {
      const timezoneOffset = new Date().getTimezoneOffset();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          userId: user?.uid,
          timezoneOffset,
          roomState: {
            width: currentWidth,
            length: currentLength,
            height: currentHeight,
            floorColor,
            ceilingColor,
            wallFrontColor,
            wallBackColor,
            wallLeftColor,
            wallRightColor,
            blocks: currentBlocks,
          },
          messages: newMessages.slice(0, -1), // Send all messages except the current one
        }),
      });

      const text = await response.text();
      
      try {
        const data = await JSON.parse(text);
        if(data.action === 'list_rooms') {
          setChatMessages([
            ...newMessages,
            { 
              role: 'assistant', 
              content: {
                type: 'room_list',
                rooms: data.rooms,
                preamble: data.preamble,
              } 
            }
          ]);
          return;
        }
        let initialRoomState = {
          width: width,
          length: length,
          height: height,
          floorColor,
          ceilingColor,
          wallFrontColor,
          wallBackColor,
          wallLeftColor,
          wallRightColor,
          blocks: [...blocks],
        };

        let finalRoomState;

        if (Array.isArray(data)) {
          finalRoomState = data.reduce(
            (acc, action) => applyActionToState(action, acc),
            initialRoomState
          );
        } else if (typeof data === 'object' && data !== null) {
          finalRoomState = applyActionToState(data, initialRoomState);
        }

        if (finalRoomState) {
          const roomToSave = {
            width: finalRoomState.width,
            length: finalRoomState.length,
            height: finalRoomState.height,
            floorColor: finalRoomState.floorColor,
            ceilingColor: finalRoomState.ceilingColor,
            wallFrontColor: finalRoomState.wallFrontColor,
            wallBackColor: finalRoomState.wallBackColor,
            wallLeftColor: finalRoomState.wallLeftColor,
            wallRightColor: finalRoomState.wallRightColor,
            blocks: finalRoomState.blocks,
            name: `Generated Room ${new Date().toLocaleString()}`,
          };
          const newRoomId = await saveRoom(roomToSave);
          if (newRoomId) {
            navigateToModel({
              id: newRoomId,
              ...finalRoomState,
              chatMessages: [ ...newMessages, { role: 'assistant', content: "Here is your generated room." }]
            });
          }
        } else {
           setChatMessages([ ...newMessages, { role: 'assistant', content: text }]);
        }
      } catch (e) {
        setChatMessages([ ...newMessages, { role: 'assistant', content: text }]);
      }
    } catch (error) {
      console.error('Error fetching from chat API:', error);
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    submitMessage(chatInput);
  };

  // Add collapsed state and navigation
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'camera' | 'builder' | 'colors' | 'objects' | 'library'>('main');

  // Library items with predefined furniture and objects
  const libraryItems = [
    { name: "Single Bed", width: 3, height: 2, depth: 6.5, color: "#8B4513", category: "Bedroom" },
    { name: "Double Bed", width: 4.5, height: 2, depth: 6.5, color: "#8B4513", category: "Bedroom" },
    { name: "King Bed", width: 6, height: 2, depth: 6.5, color: "#8B4513", category: "Bedroom" },
    { name: "Nightstand", width: 1.5, height: 2, depth: 1.5, color: "#654321", category: "Bedroom" },
    { name: "Dresser", width: 5, height: 3, depth: 1.5, color: "#654321", category: "Bedroom" },
    { name: "Sofa", width: 7, height: 2.5, depth: 3, color: "#4A5568", category: "Living Room" },
    { name: "Coffee Table", width: 4, height: 1.5, depth: 2, color: "#8B4513", category: "Living Room" },
    { name: "TV Stand", width: 5, height: 2, depth: 1.5, color: "#2D3748", category: "Living Room" },
    { name: "Armchair", width: 3, height: 3, depth: 3, color: "#4A5568", category: "Living Room" },
    { name: "Dining Table", width: 6, height: 2.5, depth: 3, color: "#8B4513", category: "Dining Room" },
    { name: "Dining Chair", width: 1.5, height: 3, depth: 1.5, color: "#654321", category: "Dining Room" },
    { name: "Kitchen Island", width: 6, height: 3, depth: 2.5, color: "#FFFFFF", category: "Kitchen" },
    { name: "Refrigerator", width: 2.5, height: 6, depth: 2.5, color: "#E2E8F0", category: "Kitchen" },
    { name: "Desk", width: 4, height: 2.5, depth: 2, color: "#8B4513", category: "Office" },
    { name: "Office Chair", width: 2, height: 3.5, depth: 2, color: "#2D3748", category: "Office" },
    { name: "Bookshelf", width: 3, height: 6, depth: 1, color: "#654321", category: "Office" },
    { name: "Door", width: 3, height: 7, depth: 0.2, color: "#8B4513", category: "Architectural" },
    { name: "Window", width: 4, height: 4, depth: 0.1, color: "#E2E8F0", category: "Architectural" }
  ];

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  // 1. Update mode state to support 'prebuild'
  const [mode, setMode] = useState<'ask' | 'build' | 'prebuild'>('ask');

  const sortedModels = [...savedModels]
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0);
        case 'oldest':
          return (a.createdAt?.toDate()?.getTime() || 0) - (b.createdAt?.toDate()?.getTime() || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'name', label: 'A-Z' },
  ];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelResult, setModelResult] = useState<RoomModelResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Add state for prebuild step and perspective
  const [prebuildStep, setPrebuildStep] = useState<'upload' | 'detect' | 'perspective' | 'model'>('upload');
  const [detectedRoom, setDetectedRoom] = useState<any>(null);
  const [selectedPerspective, setSelectedPerspective] = useState<string>('inside');
  const [otherPerspective, setOtherPerspective] = useState<string>('');

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered");
    const file = event.target.files && event.target.files[0];
    if (file) {
      // Clean up previous object URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setModelResult(null);
      setModelError(null);
      console.log("Selected file:", file);
      // You can add preview or upload logic here
    }
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDetectRoom = async () => {
    console.log("handleDetectRoom triggered");
    if (!selectedFile) return;
    setModelLoading(true);
    setModelError(null);
    setModelResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('/api/check-room-and-objects', { // Call the new /api/check-room endpoint
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to validate image');
      }
      const validationResult = await response.json();
      if (!validationResult.is_room) {
        throw new Error(validationResult.message || 'This image does not appear to be a room. Please upload a room photo.');
      }
      setDetectedRoom(validationResult);
      setPrebuildStep('perspective'); // Move to perspective selection step
    } catch (error: any) {
      setModelError(error.message || 'Failed to detect room.');
    } finally {
      setModelLoading(false);
    }
  };

  const handleGenerate3DModel = () => {
    if (!selectedFile || !detectedRoom) return;
    // Store file and perspective in localStorage for the loading screen to use
    localStorage.setItem('pendingModelFile', JSON.stringify({
      name: selectedFile.name,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    }));
    // Store the actual file as a blob (since localStorage only stores strings, use FileReader)
    const reader = new FileReader();
    reader.onload = function(e) {
      localStorage.setItem('pendingModelFileData', e.target?.result as string);
      localStorage.setItem('pendingModelPerspective', selectedPerspective === 'other' ? otherPerspective : selectedPerspective);
      router.push('/loading');
    };
    reader.readAsDataURL(selectedFile);
  };


  return (
    <div style={{ 
        marginLeft: 0, 
        transition: "margin-left 0.3s ease",
        minHeight: "100vh", 
        background: `
          radial-gradient(circle at 40% 90%, rgba(255, 69, 0, 0.8) 0%, transparent 60%),
          radial-gradient(circle at 75% 85%, rgba(239, 68, 68, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 60% 100%, rgba(59, 130, 246, 0.4) 0%, transparent 70%),
          #f8fafc
        `,
        color: "#222", 
        position: "relative", 
        overflow: "hidden"
      }}>
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '48px',
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            position: 'relative',
            maxWidth: 400,
            width: '90%',
          }}>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={24} color="#6b7280" />
            </button>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 24, fontWeight: 700 }}>Sign in to Use</h2>
            <p style={{ margin: '0 0 32px 0', color: '#4b5563', fontSize: 16 }}>
              Please sign in to use this feature and save your amazing designs.
            </p>
            <button
              onClick={() => router.push('/auth')}
              style={{
                background: '#fafbfc',
                color: '#222',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      )}

      {deletingModelId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: 48, borderRadius: 16, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 24, fontWeight: 700 }}>Confirm Deletion</h2>
            <p style={{ margin: '0 0 32px 0', color: '#4b5563', fontSize: 16 }}>
              Are you sure you want to delete this room? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={() => setDeletingModelId(null)}
                style={{ background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(deletingModelId)}
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notion-style greeting and single card with mode toggle chips */}
      
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0px 0px 200px 16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            marginBottom: 24,
            marginTop: 12,
          }}>
            <h1 style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: '-1.5px',
              color: '#222',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              textAlign: 'center',
              lineHeight: 1.1,
              margin: 0,
            }}>
              {getGreeting()}
            </h1>
          </div>
          {/* Mode toggle buttons always visible */}
          <div style={{ display: 'flex', gap: 4, zIndex: 2, justifyContent: 'center', marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setMode('ask')}
              style={{
                padding: '9px 25px',
                borderRadius: 15,
                border: 'none',
                fontWeight: 700,
                fontSize: 15,
                background: mode === 'ask' ? '#facc15' : '#f3f4f6',
                color: mode === 'ask' ? '#222' : '#6b7280',
                cursor: 'pointer',
                boxShadow: mode === 'ask' ? '0 2px 8px rgba(250,204,21,0.10)' : 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              disabled={mode === 'ask'}
            >
              Ask
            </button>
            <button
              type="button"
              onClick={() => setMode('build')}
              style={{
                padding: '9px 25px',
                borderRadius: 15,
                border: 'none',
                fontWeight: 700,
                fontSize: 15,
                background: mode === 'build' ? '#facc15' : '#f3f4f6',
                color: mode === 'build' ? '#222' : '#6b7280',
                cursor: 'pointer',
                boxShadow: mode === 'build' ? '0 2px 8px rgba(250,204,21,0.10)' : 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              disabled={mode === 'build'}
            >
              Build
            </button>
            <button
              type="button"
              onClick={() => setMode('prebuild')}
              style={{
                padding: '9px 25px',
                borderRadius: 15,
                border: 'none',
                fontWeight: 700,
                fontSize: 15,
                background: mode === 'prebuild' ? '#facc15' : '#f3f4f6',
                color: mode === 'prebuild' ? '#222' : '#6b7280',
                cursor: 'pointer',
                boxShadow: mode === 'prebuild' ? '0 2px 8px rgba(250,204,21,0.10)' : 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              disabled={mode === 'prebuild'}
            >
              Prebuild
            </button>
          </div>
            {/* Card content: Ask or Build */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '32px 32px 0 32px', width: '100%', maxWidth: 800}}>
              {mode === 'ask' ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ width: '100%', minHeight: 20, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 24 }}>
                    {chatMessages.length === 0 && !isLoading && (
                      <div style={{ width: '100%', marginBottom: 32, animation: 'fadeIn 0.5s ease-in-out' }}>
                        <p style={{ textAlign: 'center', fontSize: 14, color: '#4b5563', marginBottom: 16, fontWeight: 500 }}>Try one of these prompts</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {[
                            "Show me my 3 most recent rooms",
                            "Find the room named 'Living Room'",
                            "What was the last room I made?",
                            "List all rooms I created yesterday"
                          ].map(prompt => (
                            <button
                              key={prompt}
                              onClick={() => submitMessage(prompt)}
                              style={{
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                padding: '12px 16px',
                                fontSize: 14,
                                color: '#374151',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                              }}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            background: msg.role === 'user' ? '#e0e7ef' : '#fff',
                            color: '#222',
                            borderRadius: 8,
                            padding: '10px 14px',
                            maxWidth: '80%',
                            fontSize: 15,
                            boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                            border: msg.role === 'assistant' ? '1px solid #f3f4f6' : 'none',
                            marginBottom: 2,
                            fontWeight: 500,
                          }}
                        >
                          {typeof msg.content === 'string'
                           ? msg.content
                           : (
                               <div>
                                 <p style={{ fontWeight: 500, color: '#4b5563', marginBottom: '12px' }}>
                                   {msg.content.preamble}
                                 </p>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   {msg.content.rooms.map((room: any) => (
                                     <button
                                       key={room.id}
                                       onClick={() => navigateToModel(room)}
                                       style={{
                                         display: 'flex',
                                         alignItems: 'center',
                                         gap: '12px',
                                         padding: '12px',
                                         borderRadius: '10px',
                                         background: '#f9fafb',
                                         border: '1px solid #f3f4f6',
                                         cursor: 'pointer',
                                         textAlign: 'left',
                                         transition: 'background 0.2s, border-color 0.2s',
                                         width: '100%',
                                       }}
                                       onMouseEnter={(e) => {
                                           e.currentTarget.style.background = '#f3f4f6';
                                           e.currentTarget.style.borderColor = '#e5e7eb';
                                       }}
                                       onMouseLeave={(e) => {
                                           e.currentTarget.style.background = '#f9fafb';
                                           e.currentTarget.style.borderColor = '#f3f4f6';
                                       }}
                                     >
                                       <div style={{ 
                                           background: '#eef2ff', 
                                           color: '#4f46e5', 
                                           padding: '8px', 
                                           borderRadius: '6px', 
                                           display: 'flex', 
                                           alignItems: 'center', 
                                           justifyContent: 'center' 
                                       }}>
                                         <Folder size={20} />
                                       </div>
                                       <div style={{ flex: 1 }}>
                                         <p style={{ fontWeight: 600, color: '#1f2937', margin: 0, fontSize: '15px' }}>
                                           {room.name}
                                         </p>
                                         <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                                           {room.width} x {room.length} x {room.height} ft • Created {new Date(room.createdAt._seconds * 1000).toLocaleDateString()}
                                         </p>
                                       </div>
                                       <ChevronRight size={18} color="#9ca3af" />
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             )}
                        </div>
                      ))}
                      {isLoading && (
                        <div style={{
                          borderRadius: '8px',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          marginTop: 4,
                          maxWidth: '60%',
                        }}>
                          <div style={{ fontSize: '12px' }}>⋯</div>
                          <div>Thinking</div>
                        </div>
                      )}
                    </div>
                    {/* Notion-style input bar with mode toggle bottom left and send button bottom right */}
                    <form
                      onSubmit={handleChatSubmit}
                      style={{
                        marginTop: 24,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        background: '#f3f4f6',
                        borderRadius: 16,
                        border: '1.5px solid #e5e7eb',
                        boxShadow: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        minHeight: 44,
                      }}
                    >
                      
                      {/* Input field, with padding for left and right controls */}
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about your room design..."
                        style={{
                          flex: 1,
                          padding: '18px 80px 18px 18px',
                          borderRadius: '999px',
                          border: 'none',
                          fontSize: '16px',
                          outline: 'none',
                          background: 'transparent',
                          color: '#222',
                          boxShadow: 'none',
                          fontWeight: 500,
                        }}
                        onFocus={e => {
                          if (e.target.parentElement) {
                            e.target.parentElement.style.borderColor = '#facc15';
                            e.target.parentElement.style.boxShadow = '0 0 0 2px rgba(250,204,21,0.10)';
                          }
                        }}
                        onBlur={e => {
                          if (e.target.parentElement) {
                            e.target.parentElement.style.borderColor = '#e5e7eb';
                            e.target.parentElement.style.boxShadow = 'none';
                          }
                        }}
                        disabled={isLoading}
                      />
                      {/* Send button bottom right inside input bar */}
                      <button
                        type="submit"
                        disabled={isLoading || !chatInput.trim()}
                        style={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#fef08a',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'none',
                          cursor: 'not-allowed',
                          transition: 'background 0.15s, box-shadow 0.15s',
                          zIndex: 2,
                        }}
                        tabIndex={-1}
                        onMouseEnter={e => {
                          if (!(isLoading || !chatInput.trim())) {
                            e.currentTarget.style.background = '#fde047';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!(isLoading || !chatInput.trim())) {
                            e.currentTarget.style.background = '#facc15';
                          }
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              ) : mode === 'build' ? (
                <>
                  {/* Build mode: Modern, effective UI */}
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!user) {
                        setShowAuthModal(true);
                        return;
                      }
                      const newModel = {
                        name: `Room ${savedModels.length + 1}`,
                        width,
                        length,
                        height,
                        floorColor,
                        ceilingColor,
                        wallFrontColor,
                        wallBackColor,
                        wallLeftColor,
                        wallRightColor,
                        blocks,
                      };
                      const newRoomId = await saveRoom(newModel);
                      if (newRoomId) {
                        navigateToModel({
                          id: newRoomId,
                          ...newModel,
                          chatMessages: [{ role: 'assistant', content: `Configured a ${width}x${length} room with ${height}ft ceilings.` }]
                        });
                      }
                    }} style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                      marginTop: 24,
                    }}>
                      <div style={{
                        display: 'flex',
                        width: '100%',
                        background: '#fff',
                        borderRadius: 20,
                        padding: '10px 18px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.07)',
                        border: '1.5px solid #e5e7eb',
                        gap: 8,
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Width (ft)</label>
                          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} style={{ color: '#222', textAlign: 'center', width: '100%', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, outline: 'none', MozAppearance: 'textfield', appearance: 'none', WebkitAppearance: 'none' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <button type="button" onClick={() => setWidth(w => w + 1)} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer' }}><ChevronUp size={15} /></button>
                              <button type="button" onClick={() => setWidth(w => w > 1 ? w - 1 : 1)} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer' }}><ChevronDown size={15} /></button>
                            </div>
                          </div>
                        </div>
                        <div style={{width: 1, height: 24, background: '#e5e7eb'}} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Length (ft)</label>
                          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} style={{ color: '#222', textAlign: 'center', width: '100%', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, outline: 'none', MozAppearance: 'textfield', appearance: 'none', WebkitAppearance: 'none' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <button type="button" onClick={() => setLength(l => l + 1)} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer' }}><ChevronUp size={15} /></button>
                              <button type="button" onClick={() => setLength(l => l > 1 ? l - 1 : 1)} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer' }}><ChevronDown size={15} /></button>
                            </div>
                          </div>
                        </div>
                        <div style={{width: 1, height: 24, background: '#e5e7eb'}} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Height (ft)</label>
                            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                              <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ color: '#222', textAlign: 'center', width: '100%', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, outline: 'none', MozAppearance: 'textfield', appearance: 'none', WebkitAppearance: 'none' }} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <button type="button" onClick={() => setHeight(h => h + 1)} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer' }}><ChevronUp size={15} /></button>
                                <button type="button" onClick={() => setHeight(h => h > 1 ? h - 1 : 1)} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer' }}><ChevronDown size={15} /></button>
                              </div>
                            </div>
                        </div>
                        <button
                          type="submit"
                          style={{
                            padding: '10px 20px',
                            borderRadius: 15,
                            border: 'none',
                            background: '#facc15',
                            color: '#222',
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                           onMouseEnter={e => {
                            e.currentTarget.style.background = '#fde047';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '#facc15';
                          }}
                        >
                          Visualize
                        </button>
                      </div>
                      
                    </form>
                </>
              ) : mode === 'prebuild' ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '48px 0', color: '#4b5563', fontSize: 20, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {prebuildStep === 'upload' && (
                    <>
                      <div style={{ marginBottom: 24 }}>
                        Upload image of your room to create a 3D model of it
                      </div>
                      <button
                        style={{
                          padding: '12px 32px',
                          borderRadius: 12,
                          border: 'none',
                          background: '#facc15',
                          color: '#222',
                          fontWeight: 700,
                          fontSize: 16,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(250,204,21,0.10)',
                          transition: 'background 0.15s, color 0.15s',
                          marginTop: 8,
                        }}
                        onClick={handleUploadClick}
                        onMouseEnter={e => e.currentTarget.style.background = '#ffe066'}
                        onMouseLeave={e => e.currentTarget.style.background = '#facc15'}
                      >
                        Upload Image
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      {previewUrl && (
                        <>
                          <img
                            src={previewUrl}
                            alt="Room preview"
                            style={{ marginTop: 24, maxWidth: 400, maxHeight: 300, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                          />
                          <button
                            style={{
                              padding: '12px 32px',
                              borderRadius: 12,
                              border: 'none',
                              background: '#18181b',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 16,
                              cursor: selectedFile && !modelLoading ? 'pointer' : 'not-allowed',
                              boxShadow: '0 2px 8px rgba(24,24,27,0.10)',
                              transition: 'background 0.15s, color 0.15s',
                              marginTop: 24,
                              opacity: selectedFile && !modelLoading ? 1 : 0.6,
                            }}
                            onClick={handleDetectRoom}
                            disabled={!selectedFile || modelLoading}
                            onMouseEnter={e => e.currentTarget.style.background = '#000'}
                            onMouseLeave={e => e.currentTarget.style.background = '#18181b'}
                          >
                            {modelLoading ? 'Detecting Room...' : 'Detect Room'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {prebuildStep === 'perspective' && (
                    <div style={{
                      background: '#fff',
                      borderRadius: 18,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                      padding: '36px 32px 32px 32px',
                      maxWidth: 420,
                      margin: '0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0,
                    }}>
                      <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 10, color: '#18181b', letterSpacing: '-0.5px' }}>
                        What is the perspective of your photo?
                      </div>
                      <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 24, fontWeight: 500, textAlign: 'center' }}>
                        This helps us assign the correct colors to the right walls in your 3D model.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                        {[
                          { value: 'inside', label: 'Inside the room (standing near a wall, facing in)' },
                          { value: 'topdown', label: 'Top-down (from above)' },
                          { value: 'front', label: 'Facing the front wall' },
                          { value: 'left', label: 'Facing the left wall' },
                          { value: 'right', label: 'Facing the right wall' },
                          { value: 'back', label: 'Facing the back wall' },
                          { value: 'other', label: 'Other' },
                        ].map(opt => (
                          <div
                            key={opt.value}
                            onClick={() => setSelectedPerspective(opt.value)}
                            style={{
                              cursor: 'pointer',
                              background: selectedPerspective === opt.value ? '#facc15' : '#f3f4f6',
                              color: selectedPerspective === opt.value ? '#18181b' : '#374151',
                              border: selectedPerspective === opt.value ? '2px solid #facc15' : '2px solid #e5e7eb',
                              borderRadius: 14,
                              padding: '12px 18px',
                              fontWeight: 600,
                              fontSize: 15,
                              transition: 'background 0.15s, border 0.15s, color 0.15s',
                              marginBottom: 0,
                              outline: selectedPerspective === opt.value ? '2px solid #fde047' : 'none',
                              boxShadow: selectedPerspective === opt.value ? '0 2px 8px rgba(250,204,21,0.10)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedPerspective(opt.value); }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: 9, border: '2px solid #d1d5db', background: selectedPerspective === opt.value ? '#fde047' : '#fff', marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {selectedPerspective === opt.value && <div style={{ width: 10, height: 10, borderRadius: 5, background: '#facc15' }} />}
                            </div>
                            {opt.label}
                          </div>
                        ))}
                        {selectedPerspective === 'other' && (
                          <input
                            type="text"
                            value={otherPerspective}
                            onChange={e => setOtherPerspective(e.target.value)}
                            placeholder="Describe your perspective..."
                            style={{
                              marginTop: 10,
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: '1.5px solid #e5e7eb',
                              fontSize: 15,
                              width: '100%',
                              background: '#f9fafb',
                              color: '#18181b',
                              fontWeight: 500,
                              outline: 'none',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                            }}
                          />
                        )}
                      </div>
                      <button
                        style={{
                          marginTop: 32,
                          padding: '13px 0',
                          width: '100%',
                          borderRadius: 13,
                          border: 'none',
                          background: '#18181b',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 17,
                          cursor: !modelLoading ? 'pointer' : 'not-allowed',
                          boxShadow: '0 2px 8px rgba(24,24,27,0.10)',
                          transition: 'background 0.15s, color 0.15s',
                          opacity: !modelLoading ? 1 : 0.6,
                          letterSpacing: '-0.5px',
                        }}
                        onClick={handleGenerate3DModel}
                        disabled={modelLoading}
                        onMouseEnter={e => e.currentTarget.style.background = '#000'}
                        onMouseLeave={e => e.currentTarget.style.background = '#18181b'}
                      >
                        {modelLoading ? 'Creating 3D Model...' : 'Continue'}
                      </button>
                    </div>
                  )}
                  {modelError && (
                    <div style={{ marginTop: 20, color: '#ef4444', fontWeight: 600, fontSize: 16 }}>{modelError}</div>
                  )}
                </div>
              ) : null}
            </div>
        </div>
      
    {/* Saved Models Gallery - moved to bottom, styled like Vercel/Lovable */}
    <div style={{
      width: '100%',
      maxWidth: 1400,
      margin: '-160px auto 0 auto',
      padding: '32px 48px 64px 48px',
      background: '#000000',
      borderRadius: 24,
      minHeight: 320,
      display: savedModels.length > 0 ? 'block' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: "'Inter', sans-serif", margin: 0 }}>Your Rooms</h2>
        <div style={{ position: 'relative' }} ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: 140,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#222',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
            <ChevronDown size={16} style={{ color: '#6b7280', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {isSortOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '100%',
                background: '#000000',
                borderRadius: 12,
                zIndex: 10,
                padding: 8,
                boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
              }}
            >
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setIsSortOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    background: sortBy === option.value ? '#facc15' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: sortBy === option.value ? '#1f2937' : 'white',
                    fontSize: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: sortBy === option.value ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (sortBy !== option.value) e.currentTarget.style.background = '#27272a'; }}
                  onMouseLeave={e => { if (sortBy !== option.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 16, display: 'flex', alignItems: 'center' }}>
                    {sortBy === option.value && <Check size={16} />}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 24,
      }}>
        {sortedModels.map(model => (
          <div key={model.id} style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            position: 'relative',
          }}
           onClick={() => {
            const roomState = {
              id: model.id,
              name: model.name,
              width: model.width,
              length: model.length,
              height: model.height,
              floorColor: model.floorColor,
              ceilingColor: model.ceilingColor,
              wallFrontColor: model.wallFrontColor,
              wallBackColor: model.wallBackColor,
              wallLeftColor: model.wallLeftColor,
              wallRightColor: model.wallRightColor,
              blocks: model.blocks || [],
              chatMessages: model.chatHistory || [],
            };
            localStorage.setItem('roomState', JSON.stringify(roomState));
            router.push('/model');
          }}
           onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
          }}
          >
            {infoPopup && infoPopup.modelId === model.id && (
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: 12,
                zIndex: 10,
                maxWidth: 280,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Info size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{infoPopup.message}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setInfoPopup(null); }}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4, marginLeft: 8, alignSelf: 'flex-start' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
            <div style={{ height: 200, background: '#f9fafb' }}>
              <Canvas key={`${model.id}-${sortBy}`} camera={{ position: [0, 2, 5], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 10, 7]} intensity={0.8} />
                <RoomBoxPreview
                  width={model.width}
                  length={model.length}
                  height={model.height}
                  floorColor={model.floorColor}
                  ceilingColor={model.ceilingColor}
                  wallFrontColor={model.wallFrontColor}
                  wallBackColor={model.wallBackColor}
                  wallLeftColor={model.wallLeftColor}
                  wallRightColor={model.wallRightColor}
                  blocks={model.blocks}
                />
                 <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
              </Canvas>
            </div>
            <div style={{ padding: 16 }}>
              {editingModelId === model.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
                  />
                  <button onClick={() => handleUpdateName(model.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#222', color: 'white', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditingModelId(null)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#222' }}>{model.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                      {model.width}ft x {model.length}ft x {model.height}ft
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingModelId(model.id); setNewModelName(model.name); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Pencil size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingModelId(model.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
} 