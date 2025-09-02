"use client";
import { useState, useRef, useEffect, useCallback, Suspense, forwardRef, useImperativeHandle } from "react";
import type { FormEvent, Ref, KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Edges, PointerLockControls, Text, useGLTF, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from 'three';
import {GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ChevronUp, ChevronDown, Pencil, RotateCcw, RotateCw, Sofa, DoorOpen, Bed, RectangleHorizontal, Armchair, Package, Archive, Utensils, ChefHat, Laptop, BookOpen, Users, ShoppingBag, Send, AtSign, Search, FileText } from 'lucide-react';
import { db } from "@/lib/firebase/firebase";
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { TransformControls } from "@react-three/drei";
import ShareModal, { ShareUser, LinkSharing } from "@/components/ShareModal";
import { useAuth } from '@/context/AuthContext';
import MultiAgentProgress from '@/components/MultiAgentProgress';
import { modelDirection } from "three/src/nodes/TSL.js";
import { MessageStorage } from '@/lib/messages/messageStorage';

// Lightweight, isolated chat input to avoid page re-render on each keystroke
const ChatInputBar = forwardRef(function ChatInputBar(
  {
    isLoading,
    multiAgentMode,
    onSubmit,
  }: {
    isLoading: boolean;
    multiAgentMode: boolean;
    onSubmit: (text: string) => void;
  },
  ref: Ref<{ setValue: (v: string) => void; focus: () => void }>
) {
  const [localValue, setLocalValue] = useState('');
  const [showPinboardSearch, setShowPinboardSearch] = useState(false);
  const [pinboards, setPinboards] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useAuth();

  useImperativeHandle(ref, () => ({
    setValue: (v: string) => setLocalValue(v ?? ''),
    focus: () => textareaRef.current?.focus(),
  }), []);

  // Fetch user's pinboards
  const fetchPinboards = useCallback(async () => {
    if (!user) return;
    
    try {
      const pinboardsRef = collection(db, "pinboards");
      const q = query(
        pinboardsRef,
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const pinboardList: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate?.() || 
                         data.pinboard?.updatedAt?.toDate?.() || 
                         new Date(data.updatedAt) || 
                         data.createdAt?.toDate?.() ||
                         new Date();
        
        pinboardList.push({
          id: doc.id,
          name: data.name || `Pinboard #${doc.id.slice(-6)}`,
          updatedAt: updatedAt,
          notes: data.pinboard?.notes || [],
          images: data.pinboard?.images || [],
          drawings: data.pinboard?.drawings || []
        });
      });
      
      setPinboards(pinboardList);
    } catch (error) {
      console.error("Error fetching pinboards:", error);
    }
  }, [user]);

  // Fetch pinboards when user changes or @ button is clicked
  useEffect(() => {
    if (showPinboardSearch && user) {
      fetchPinboards();
    }
  }, [showPinboardSearch, user, fetchPinboards]);

  // Handle @ button click
  const handleAtButtonClick = () => {
    setShowPinboardSearch(!showPinboardSearch);
    setSearchQuery('');
  };

  // Add pinboard to message

  // Filter pinboards based on search query
  const filteredPinboards = pinboards.filter(pinboard =>
    pinboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pinboard.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = localValue.trim();
      if (text.length === 0 || isLoading) return;
      onSubmit(text);
      setLocalValue('');
    }
  };

  const handleClick = () => {
    const text = localValue.trim();
    if (text.length === 0 || isLoading) return;
    onSubmit(text);
    setLocalValue('');
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      <div style={{ flex: 1, position: 'relative' }}>
                 <textarea
           ref={textareaRef}
           value={localValue}
           onChange={e => setLocalValue(e.target.value)}
           placeholder={multiAgentMode
             ? "Ask complex design questions - I'll use multiple AI agents to create your perfect room..."
             : "Ask about your room design..."}
           style={{
             width: '100%',
             minHeight: '48px',
             maxHeight: '150px',
             padding: '12px 16px',
             borderRadius: '12px',
             border: '1.5px solid #e2e8f0',
             fontSize: '14px',
             outline: 'none',
             background: '#ffffff',
             color: '#1e293b',
             resize: 'none',
             fontFamily: 'inherit',
             lineHeight: '1.5',
             transition: 'all 0.2s ease',
             boxSizing: 'border-box'
           }}
           onFocus={e => {
             e.currentTarget.style.borderColor = '#fad600';
             e.currentTarget.style.boxShadow = '0 0 0 3px rgba(250, 214, 0, 0.1)';
           }}
           onBlur={e => {
             e.currentTarget.style.borderColor = '#e2e8f0';
             e.currentTarget.style.boxShadow = 'none';
           }}
           disabled={isLoading}
           onKeyDown={handleKeyDown}
         />

        {/* Pinboard Search Dropdown */}
        {showPinboardSearch && (
          <div style={{
            position: 'absolute',
            top: '-320px',
            left: '0',
            right: '0',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {/* Search Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Search size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  Search Pinboards
                </span>
              </div>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Pinboard List */}
            {/* <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredPinboards.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px'
                }}>
                  {pinboards.length === 0 ? 'No pinboards found' : 'No matching pinboards'}
                </div>
              ) : (
                filteredPinboards.map(pinboard => (
                  <div
                    key={pinboard.id}
                    onClick={() => addPinboardToMessage(pinboard)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f8fafc',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FileText size={16} color="#64748b" />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                        {pinboard.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginLeft: '24px' }}>
                      {pinboard.notes.length} notes • {pinboard.images.length} images • {pinboard.drawings.length} drawings
                    </div>
                  </div>
                ))
              )}
            </div> */}
          </div>
        )}
             </div>



       <button
         type="button"
         disabled={isLoading || localValue.trim().length === 0}
         onClick={handleClick}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          border: 'none',
          background: isLoading || localValue.trim().length === 0 ? '#e2e8f0' : '#fad600',
          color: isLoading || localValue.trim().length === 0 ? '#94a3b8' : '#18181b',
          cursor: isLoading || localValue.trim().length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          opacity: isLoading || localValue.trim().length === 0 ? 0.5 : 1,
          transform: isLoading || localValue.trim().length === 0 ? 'scale(0.95)' : 'scale(1)',
          boxShadow: isLoading || localValue.trim().length === 0 ? 'none' : '0 2px 8px rgba(250, 214, 0, 0.2)'
        }}
      >
        {isLoading ? (
          <div style={{ fontSize: '18px' }}>⋯</div>
        ) : (
          <Send size={20} />
        )}
      </button>
    </div>
  );
});


// Helper function to create subtle procedural textures
const createProceduralTexture = (type: 'wall' | 'floor' | 'ceiling') => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return null;
  
  // Create base pattern based on surface type
  if (type === 'wall') {
    // Subtle wall texture
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 50 + 70}, ${Math.random() * 50 + 70}, ${Math.random() * 50 + 70}, 0.1)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 20 + 5, Math.random() * 20 + 5);
    }
  } else if (type === 'floor') {
    // Wood-like floor pattern
    ctx.fillStyle = '#606060';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 40 + 40}, ${Math.random() * 40 + 40}, ${Math.random() * 40 + 40}, 0.2)`;
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * 256);
      ctx.lineTo(256, Math.random() * 256);
      ctx.stroke();
    }
  } else {
    // Ceiling texture
    ctx.fillStyle = '#707070';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 30 + 60}, ${Math.random() * 30 + 60}, ${Math.random() * 30 + 60}, 0.05)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 15 + 3, Math.random() * 15 + 3);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
};

function RulerDisplay({ points, scale, isPreview = false }: { points: [THREE.Vector3, THREE.Vector3], scale: number, isPreview?: boolean }) {
  const [start, end] = points;
  const length = start.distanceTo(end) / scale;
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([...start.toArray(), ...end.toArray()]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={isPreview ? "#3b82f6" : "#dc2626"} linewidth={3} />
      </line>
      <Text
        position={midPoint.add(new THREE.Vector3(0, 0.1, 0))}
        fontSize={0.15}
        color="#111827"
        anchorX="center"
        anchorY="middle"
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        {`${length.toFixed(2)} ft`}
      </Text>
    </group>
  );
}

function RulerRenderer({ rulers, preview, scale }: { rulers: Array<[THREE.Vector3, THREE.Vector3]>, preview: [THREE.Vector3, THREE.Vector3] | null, scale: number }) {
  return (
    <group>
      {rulers.map((ruler: [THREE.Vector3, THREE.Vector3], i: number) => (
        <RulerDisplay key={i} points={ruler} scale={scale} />
      ))}
      {preview && <RulerDisplay points={preview} scale={scale} isPreview />}
    </group>
  );
}

// GLB Model Component
function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(`/api/model-proxy?url=${encodeURIComponent(url)}`);

  // Calculate the model's bounding box to position it correctly
  const box = new THREE.Box3().setFromObject(scene);
  const modelBottom = box.min.y;

  // Position the model so its bottom is slightly above floor level (y=0) to prevent z-fighting
  const floorOffset = -modelBottom + 0.5;

  return (
    <primitive
      object={scene}
      position={[0, floorOffset, 0]}
    />
  );
}

// Optimized library preview - only show 3D when hovering
function LibraryItemPreview({ modelPath, isHovered }: { modelPath: string; isHovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Auto-rotation only when hovered (performance optimization)
  useFrame((state, delta) => {
    if (meshRef.current && isHovered) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Only load model when hovered to reduce initial load
  if (!isHovered) {
    return null;
  }

  try {
    const { scene } = useGLTF(modelPath);
    const clonedScene = scene.clone();
    
    // Calculate bounding box to center and scale the model
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Make the model larger - scale to fit better in preview
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.2 / maxDim;
    
    return (
      <group ref={meshRef} rotation={[-0.15, 0, 0]}>
        <primitive
          object={clonedScene}
          position={[-center.x * scale, -center.y * scale, -center.z * scale]}
          scale={[scale, scale, scale]}
        />
      </group>
    );
  } catch (error) {
    return null;
  }
}

function GLBBlockModel({ block, scale, roomWidth, roomLength, onBlockClick }: {
  block: any;
  scale: number;
  roomWidth: number;
  roomLength: number;
  onBlockClick?: (blockId: string) => void;
}) {
  console.log('Loading GLB model:', block.modelPath, 'for block:', block.name);
  const gltfResult = useGLTF(block.modelPath);
  console.log('GLTF result:', gltfResult);
  const scene = (gltfResult as any).scene as THREE.Group;
  console.log('GLB model loaded successfully:', block.modelPath);
  
  // Clone the scene to avoid reusing the same instance
  const clonedScene = scene.clone();
  
  // Calculate original model bounding box
  const originalBox = new THREE.Box3().setFromObject(clonedScene);
  const modelWidth = originalBox.max.x - originalBox.min.x;
  const modelHeight = originalBox.max.y - originalBox.min.y;
  const modelDepth = originalBox.max.z - originalBox.min.z;
  
  // Calculate scale to fit block dimensions
  const scaleX = (block.width * scale) / modelWidth;
  const scaleY = (block.height * scale) / modelHeight;
  const scaleZ = (block.depth * scale) / modelDepth;
  
  // Center the model's origin
  const modelCenterX = (originalBox.max.x + originalBox.min.x) / 2;
  const modelCenterY = (originalBox.max.y + originalBox.min.y) / 2;
  const modelCenterZ = (originalBox.max.z + originalBox.min.z) / 2;
  
  // Calculate the final position to match box geometry positioning
  const glbPosition = [
    (block.x + block.width/2) * scale - roomWidth/2,
    (block.y + block.height/2) * scale,
    (block.z + block.depth/2) * scale - roomLength/2
  ] as [number, number, number];
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onBlockClick) {
      onBlockClick(block.id);
    }
  };

  return (
    <group 
      position={glbPosition}
      rotation={[0, block.rotation || 0, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      <primitive
        object={clonedScene}
        position={[-modelCenterX * scaleX, -modelCenterY * scaleY, -modelCenterZ * scaleZ]}
        scale={[scaleX, scaleY, scaleZ]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

function BlockRenderer({ block, scale, roomWidth, roomLength, onBlockClick }: { 
  block: any; 
  scale: number; 
  roomWidth: number; 
  roomLength: number; 
  onBlockClick?: (blockId: string) => void;
}) {
  // Position for box geometry (centered)
  const boxPosition = [
    (block.x + block.width/2) * scale - roomWidth/2,
    (block.y + block.height/2) * scale,
    (block.z + block.depth/2) * scale - roomLength/2
  ] as [number, number, number];

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onBlockClick) {
      onBlockClick(block.id);
    }
  };

  if (block.modelPath) {
    return (
      <GLBBlockModel 
        block={block}
        scale={scale}
        roomWidth={roomWidth}
        roomLength={roomLength}
        onBlockClick={onBlockClick}
      />
    );
  }

  // Default box geometry fallback
  return (
    <mesh 
      position={boxPosition} 
      rotation={[0, block.rotation || 0, 0]} 
      castShadow 
      receiveShadow
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={[block.width * scale, block.height * scale, block.depth * scale]} />
      <meshStandardMaterial 
        color={block.color} 
        roughness={0.4}
        metalness={0.1}
        opacity={0.95}
        transparent
      />
    </mesh>
  );
}

function RoomBox({ width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, hideCeiling = false, hideFloor = false, blocks = [], previewBlock = null, meshyModelUrl = null, onBlockClick }: {
  meshyModelUrl?: string | null;
  onBlockClick?: (blockId: string) => void;
  width: number;
  length: number;
  height: number;
  floorColor: string;
  ceilingColor: string;
  wallFrontColor: string;
  wallBackColor: string;
  wallLeftColor: string;
  wallRightColor: string;
  hideCeiling?: boolean;
  hideFloor?: boolean;
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
    rotation: number,
    created: Date
  }>;
  previewBlock?: {x: number, y: number, z: number, width: number, height: number, depth: number} | null;
}) {
  const scale = 0.35;
  const w = width * scale;
  const l = length * scale;
  const h = height * scale;

  // Generate textures for enhanced realism
  const wallTexture = createProceduralTexture('wall');
  const floorTexture = createProceduralTexture('floor');
  const ceilingTexture = createProceduralTexture('ceiling');

  // Restore original segment-based logic for room box, but skip segments inside any cutout
  const buildWallSegments = () => {
    const segments = [];
    const segmentSize = 0.3;
    
    // Front Wall (z = l/2)
    const numSegmentsXFront = Math.ceil(w / segmentSize);
    const numSegmentsYFront = Math.ceil(h / segmentSize);
    const actualSegmentSizeXFront = w / numSegmentsXFront;
    const actualSegmentSizeYFront = h / numSegmentsYFront;
    
    for (let i = 0; i < numSegmentsXFront; i++) {
      for (let j = 0; j < numSegmentsYFront; j++) {
        const segX = -w/2 + (i + 0.5) * actualSegmentSizeXFront;
        const segY = (j + 0.5) * actualSegmentSizeYFront;
        const segZ = l/2;
        segments.push(
          <mesh key={`front-${i}-${j}`} position={[segX, segY, segZ]} receiveShadow castShadow>
            <planeGeometry args={[actualSegmentSizeXFront, actualSegmentSizeYFront]} />
            <meshStandardMaterial 
              color={wallFrontColor} 
              side={THREE.DoubleSide}
              roughness={0.15}
              metalness={0}
              opacity={1}
              emissive={wallFrontColor}
              emissiveIntensity={0.15}
            />
            
          </mesh>
        );
      }
    }
    
    // Back Wall (z = -l/2)
    for (let i = 0; i < numSegmentsXFront; i++) {
      for (let j = 0; j < numSegmentsYFront; j++) {
        const segX = -w/2 + (i + 0.5) * actualSegmentSizeXFront;
        const segY = (j + 0.5) * actualSegmentSizeYFront;
        const segZ = -l/2;
        segments.push(
          <mesh key={`back-${i}-${j}`} position={[segX, segY, segZ]} rotation={[0, Math.PI, 0]} receiveShadow castShadow>
            <planeGeometry args={[actualSegmentSizeXFront, actualSegmentSizeYFront]} />
            <meshStandardMaterial 
              color={wallBackColor} 
              side={THREE.DoubleSide}
              roughness={0.15}
              metalness={0}
              opacity={1}
              emissive={wallBackColor}
              emissiveIntensity={0.15}
            />
          </mesh>
        );
      }
    }
    
    // Left Wall (x = -w/2)
    const numSegmentsZLeft = Math.ceil(l / segmentSize);
    const numSegmentsYLeft = Math.ceil(h / segmentSize);
    const actualSegmentSizeZLeft = l / numSegmentsZLeft;
    const actualSegmentSizeYLeft = h / numSegmentsYLeft;
    
    for (let i = 0; i < numSegmentsZLeft; i++) {
      for (let j = 0; j < numSegmentsYLeft; j++) {
        const segX = -w/2;
        const segY = (j + 0.5) * actualSegmentSizeYLeft;
        const segZ = -l/2 + (i + 0.5) * actualSegmentSizeZLeft;
        segments.push(
          <mesh key={`left-${i}-${j}`} position={[segX, segY, segZ]} rotation={[0, -Math.PI/2, 0]} receiveShadow castShadow>
            <planeGeometry args={[actualSegmentSizeZLeft, actualSegmentSizeYLeft]} />
            <meshStandardMaterial 
              color={wallLeftColor} 
              side={THREE.DoubleSide}
              roughness={0.15}
              metalness={0}
              opacity={1}
              emissive={wallLeftColor}
              emissiveIntensity={0.15}
            />
            
          </mesh>
        );
      }
    }
    
    // Right Wall (x = w/2)
    for (let i = 0; i < numSegmentsZLeft; i++) {
      for (let j = 0; j < numSegmentsYLeft; j++) {
        const segX = w/2;
        const segY = (j + 0.5) * actualSegmentSizeYLeft;
        const segZ = -l/2 + (i + 0.5) * actualSegmentSizeZLeft;
        segments.push(
          <mesh key={`right-${i}-${j}`} position={[segX, segY, segZ]} rotation={[0, Math.PI/2, 0]} receiveShadow castShadow>
            <planeGeometry args={[actualSegmentSizeZLeft, actualSegmentSizeYLeft]} />
            <meshStandardMaterial 
              color={wallRightColor} 
              side={THREE.DoubleSide}
              roughness={0.15}
              metalness={0}
              opacity={1}
              emissive={wallRightColor}
              emissiveIntensity={0.15}
            />
            
          </mesh>
        );
      }
    }
    return segments;
  };

  // For floor and ceiling, skip segments inside any cutout
  const buildFloorSegments = () => {
    const segments = [];
    const segmentSize = 0.3;
    const numSegmentsX = Math.ceil(w / segmentSize);
    const numSegmentsZ = Math.ceil(l / segmentSize);
    const actualSegmentSizeX = w / numSegmentsX;
    const actualSegmentSizeZ = l / numSegmentsZ;
    
    for (let i = 0; i < numSegmentsX; i++) {
      for (let j = 0; j < numSegmentsZ; j++) {
        const segX = -w/2 + (i + 0.5) * actualSegmentSizeX;
        const segZ = -l/2 + (j + 0.5) * actualSegmentSizeZ;
        segments.push(
          <mesh key={`floor-${i}-${j}`} position={[segX, 0, segZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[actualSegmentSizeX, actualSegmentSizeZ]} />
            <meshStandardMaterial 
              color={floorColor}
              roughness={0.15}
              metalness={0}
              opacity={1}
              emissive={floorColor}
              emissiveIntensity={0.15}
            />
            
          </mesh>
        );
      }
    }
    return segments;
  };

  const buildCeilingSegments = () => {
    const segments = [];
    const segmentSize = 0.3;
    const numSegmentsX = Math.ceil(w / segmentSize);
    const numSegmentsZ = Math.ceil(l / segmentSize);
    const actualSegmentSizeX = w / numSegmentsX;
    const actualSegmentSizeZ = l / numSegmentsZ;
    
    for (let i = 0; i < numSegmentsX; i++) {
      for (let j = 0; j < numSegmentsZ; j++) {
        const segX = -w/2 + (i + 0.5) * actualSegmentSizeX;
        const segZ = -l/2 + (j + 0.5) * actualSegmentSizeZ;
        segments.push(
          <mesh key={`ceiling-${i}-${j}`} position={[segX, h, segZ]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[actualSegmentSizeX, actualSegmentSizeZ]} />
            <meshStandardMaterial 
              color={ceilingColor}
              roughness={0.15}
              metalness={0}
              opacity={1}
              emissive={ceilingColor}
              emissiveIntensity={0.15}
            />
          </mesh>
        );
      }
    }
    return segments;
  };

  return (
    <group>
      {/* Floor segments */}
      {!hideFloor && buildFloorSegments()}
      {/* Ceiling segments */}
      {!hideCeiling && buildCeilingSegments()}
      {/* Walls built as segments - only render segments not in cutouts */}
      {buildWallSegments()}
      {/* Edges for box outline */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, l]} />
        <meshStandardMaterial color="#000" transparent opacity={0} />
        <Edges scale={1.01} color="#444" />
      </mesh>
      {/* Labels (unchanged) */}
      <Text
        position={[0, h + 0.05, 0]}
        fontSize={0.18}
        color="#222"
        anchorX="center"
        anchorY="bottom"
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        Ceiling
      </Text>
      <Text
        position={[0, -0.05, 0]}
        fontSize={0.18}
        color="#222"
        anchorX="center"
        anchorY="top"
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        Floor
      </Text>
      <Text
        position={[0, h / 2, l / 2 + 0.05]}
        fontSize={0.16}
        color="#222"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        Wall
      </Text>
      <Text
        position={[0, h / 2, -l / 2 - 0.05]}
        fontSize={0.16}
        color="#222"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        Wall
      </Text>
      <Text
        position={[-w / 2 - 0.05, h / 2, 0]}
        fontSize={0.16}
        color="#222"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        Wall
      </Text>
      <Text
        position={[w / 2 + 0.05, h / 2, 0]}
        fontSize={0.16}
        color="#222"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        outlineColor="#fff"
        outlineWidth={0.01}
      >
        Wall
      </Text>
      {/* Render all blocks as colored boxes or GLB models inside the room */}
      {blocks.map((block, i) => (
        <Suspense 
          key={`block-${i}`} 
          fallback={
            <mesh 
              position={[
                (block.x + block.width/2) * scale - w/2,
                (block.y + block.height/2) * scale,
                (block.z + block.depth/2) * scale - l/2
              ]} 
              rotation={[0, block.rotation || 0, 0]} 
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[block.width * scale, block.height * scale, block.depth * scale]} />
              <meshStandardMaterial 
                color={block.color} 
                roughness={0.4}
                metalness={0.1}
                opacity={0.95}
                transparent
              />
            </mesh>
          }
        >
          <BlockRenderer 
            block={block}
            scale={scale}
            roomWidth={w}
            roomLength={l}
            onBlockClick={onBlockClick}
          />
        </Suspense>
      ))}
      
      {/* Render preview block if in preview mode */}
      {previewBlock && (
        <mesh position={[
          (previewBlock.x + previewBlock.width/2) * scale - w/2,
          (previewBlock.y + previewBlock.height/2) * scale,
          (previewBlock.z + previewBlock.depth/2) * scale - l/2
        ]} castShadow receiveShadow>
          <boxGeometry args={[previewBlock.width * scale, previewBlock.height * scale, previewBlock.depth * scale]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.6} 
            wireframe={false}
            roughness={0.3}
            metalness={0.2}
            emissive="#1e40af"
            emissiveIntensity={0.1}
          />
          <Edges scale={1.01} color="#1d4ed8" />
        </mesh>
      )}
    </group>
  );
}

const VIEWS = [
  { key: "outside", label: "Outside", icon: "⌂" },
  { key: "orbit", label: "Orbit", icon: "◉" },
  { key: "topdown", label: "Top Down", icon: "⬇" },
  { key: "bottomup", label: "Bottom Up", icon: "⬆" },
  { key: "inside", label: "Inside", icon: "👁" },
];

// Clarification Component for multi-select questions
interface ClarificationComponentProps {
  message: string;
  questions: Array<{ text: string; action: string }>;
  onSubmit: (selectedActions: string[]) => void;
}

const ClarificationComponent: React.FC<ClarificationComponentProps> = ({ message, questions, onSubmit }) => {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());

  const toggleOption = (index: number) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedOptions(newSelected);
  };

  const handleSubmit = () => {
    const selectedActions = Array.from(selectedOptions).map(index => questions[index].action);
    if (selectedActions.length > 0) {
      onSubmit(selectedActions);
    }
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '16px',
      marginBottom: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        fontSize: 14,
        color: '#374151',
        marginBottom: 12,
        fontWeight: 500
      }}>
        {message}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 16
      }}>
        {questions.map((question, qIndex) => (
          <label
            key={qIndex}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: selectedOptions.has(qIndex) ? '#f0f9ff' : '#f8fafc',
              border: `1px solid ${selectedOptions.has(qIndex) ? '#0ea5e9' : '#e2e8f0'}`,
              borderRadius: 6,
              padding: '12px 16px',
              fontSize: 13,
              color: '#374151',
              cursor: 'pointer',
              textAlign: 'left' as const,
              transition: 'all 0.2s'
            }}
          >
            <input
              type="checkbox"
              checked={selectedOptions.has(qIndex)}
              onChange={() => toggleOption(qIndex)}
              style={{
                width: 16,
                height: 16,
                accentColor: '#0ea5e9'
              }}
            />
            <span>{question.text}</span>
          </label>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedOptions.size === 0}
        style={{
          background: selectedOptions.size > 0 ? '#0ea5e9' : '#9ca3af',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 500,
          cursor: selectedOptions.size > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s'
        }}
      >
        Apply Changes ({selectedOptions.size} selected)
      </button>
    </div>
  );
};

export default function ModelPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Room dimensions state
  const [meshyModelUrl, setMeshyModelUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(12);
  const [length, setLength] = useState<number>(12);
  const [height, setHeight] = useState<number>(8);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("Untitled Room");
  const [isEditingName, setIsEditingName] = useState(false);
  const [userPermission, setUserPermission] = useState<'edit' | 'view'>('edit');
  const [isOwner, setIsOwner] = useState(true); // Default to true until we determine otherwise
  
  // Library state
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('All');
  const [librarySortBy, setLibrarySortBy] = useState('Name');

  // Pinboard state for main component
  const [showPinboardSearch, setShowPinboardSearch] = useState(false);
  const [pinboards, setPinboards] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPinboards, setSelectedPinboards] = useState<Array<{
    id: string, 
    name: string, 
    context: string,
    notes?: Array<{id: string, text: string}>,
    images?: Array<{
      id: string,
      srcType: 'data-url' | 'url' | 'unknown',
      src?: string,
      left: number,
      top: number,
      scaleX: number,
      scaleY: number,
      angle: number,
      description?: string
    }>,
    drawings?: Array<{
      id: string,
      path?: string,
      left: number,
      top: number,
      stroke: string,
      strokeWidth: number,
      description?: string
    }>,
    totalImages?: number,
    totalDrawings?: number
  }>>([]);
  // One-row chip bar with +N overflow; Agent Mode wraps below when needed
  const chipsRowRef = useRef<HTMLDivElement | null>(null);
  const [maxChipsRow, setMaxChipsRow] = useState<number>(6);
  const [showOverflow, setShowOverflow] = useState<boolean>(false);
  const overflowHideTimerRef = useRef<any>(null);

  useEffect(() => {
    const recalc = () => {
      let w = chipsRowRef.current?.clientWidth || 0;
      if (w === 0 && typeof window !== 'undefined') {
        // Fallback when ref width not ready: estimate usable width from window
        const reserved = 52 + 160 + 48; // @ button + Agent Mode + spacing
        w = Math.max(240, window.innerWidth - reserved);
      }
      const approxChip = 150; // avg chip width (icon + text + close + padding)
      const n = Math.max(1, Math.floor(w / approxChip));
      setMaxChipsRow(n);
    };
    const id = requestAnimationFrame(recalc);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('resize', recalc);
      cancelAnimationFrame(id);
    };
  }, [selectedPinboards.length]);

  // Load meshyModelUrl from localStorage on mount
  useEffect(() => {
    const storedModelUrl = localStorage.getItem('meshyModelUrl');
    if (storedModelUrl) {
      setMeshyModelUrl(storedModelUrl);
    }
  }, []);

  // Camera and interaction state
  const [view, setView] = useState<'outside' | 'orbit' | 'inside' | 'topdown' | 'bottomup'>("outside");
  const [panelOpen, setPanelOpen] = useState(true);
  const [insideActive, setInsideActive] = useState(false);
  const [insidePos, setInsidePos] = useState<[number, number, number]>([0, 1.9, 0]);
  const insideKeys = useRef<{ [key: string]: boolean }>({});
  
  // Color state
  const [floorColor, setFloorColor] = useState('#e3e3e3');
  const [ceilingColor, setCeilingColor] = useState('#e3e3e3');
  const [wallFrontColor, setWallFrontColor] = useState('#e3e3e3');
  const [wallBackColor, setWallBackColor] = useState('#e3e3e3');
  const [wallLeftColor, setWallLeftColor] = useState('#e3e3e3');
  const [wallRightColor, setWallRightColor] = useState('#e3e3e3');

  // Add builder mode state and proper room features
  const [builderMode, setBuilderMode] = useState(false);
  
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
    rotation: number,
    modelPath?: string,
    created: Date
  }>>([]);
  const [blockConfig, setBlockConfig] = useState({
    width: 2, height: 2, depth: 2, x: 0, y: 0, z: 0
  });

  const [rotateMode, setRotateMode] = useState(false);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  // Ref for the horizontal scroll container
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll to selected object type
  const scrollToSelectedObject = (blockId: string) => {
    if (!blockId) return;
    
    const selectedBlock = blocks.find(b => b.id === blockId);
    if (!selectedBlock) return;
    
    const uniqueNames = [...new Set(blocks.map(block => block.name))];
    const selectedIndex = uniqueNames.findIndex(name => name === selectedBlock.name);
    
    if (selectedIndex === -1) return;
    
    // Retry function to wait for the objects page to render
    const tryScroll = (attempts = 0) => {
      if (attempts > 20) return; // Give up after 2 seconds (20 * 100ms)
      
      if (!horizontalScrollRef.current) {
        // Container not ready yet, try again in 100ms
        setTimeout(() => tryScroll(attempts + 1), 100);
        return;
      }
      
      const buttons = horizontalScrollRef.current.querySelectorAll('button');
      if (buttons.length === 0) {
        // Buttons not rendered yet, try again
        setTimeout(() => tryScroll(attempts + 1), 100);
        return;
      }
      
      const selectedButton = buttons[selectedIndex] as HTMLElement;
      
      if (selectedButton) {
        const containerWidth = horizontalScrollRef.current.offsetWidth;
        const buttonLeft = selectedButton.offsetLeft;
        const buttonWidth = selectedButton.offsetWidth;
        const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        horizontalScrollRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    };
    
    // Start trying to scroll after a short delay
    setTimeout(() => tryScroll(), 150);
  };

  // Auto-select first object when blocks change
  useEffect(() => {
    if (blocks.length > 0 && !selectedBlockId) {
      setSelectedBlockId(blocks[0].id);
    } else if (blocks.length === 0) {
      setSelectedBlockId(null);
    } else if (selectedBlockId && !blocks.find(b => b.id === selectedBlockId)) {
      // If selected block was deleted, select first available
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks, selectedBlockId]);

  const [rulerMode, setRulerMode] = useState(false);
  const [rulers, setRulers] = useState<Array<[THREE.Vector3, THREE.Vector3]>>([]);
  const [rulerPreview, setRulerPreview] = useState<[THREE.Vector3, THREE.Vector3] | null>(null);
  const [rulerStartPoint, setRulerStartPoint] = useState<THREE.Vector3 | null>(null);

  const sceneRef = useRef<THREE.Scene>(null);

  // UNDO/REDO STATE MANAGEMENT SYSTEM
  type RoomSnapshot = {
    timestamp: number;
    action: string;
    roomName: string;
    width: number;
    length: number;
    height: number;
    floorColor: string;
    ceilingColor: string;
    wallFrontColor: string;
    wallBackColor: string;
    wallLeftColor: string;
    wallRightColor: string;
    blocks: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      z: number;
      width: number;
      height: number;
      depth: number;
      color: string;
      rotation: number;
    }>;
  };

  const [undoStack, setUndoStack] = useState<RoomSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<RoomSnapshot[]>([]);
  const [lastAction, setLastAction] = useState<string>("");

  const isRenameAction = useCallback((action: string) => /\brename(d)?\b/i.test(action), []);

  // Create a snapshot of the current room state
  const createSnapshot = useCallback((actionDescription: string): RoomSnapshot => {
    return {
      timestamp: Date.now(),
      action: actionDescription,
      roomName,
      width,
      length,
      height,
      floorColor,
      ceilingColor,
      wallFrontColor,
      wallBackColor,
      wallLeftColor,
      wallRightColor,
      blocks: blocks.map(block => ({
        id: block.id,
        name: block.name,
        x: block.x,
        y: block.y,
        z: block.z,
        width: block.width,
        height: block.height,
        depth: block.depth,
        color: block.color,
        rotation: block.rotation,
      })),
    };
  }, [roomName, width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, blocks]);

  // Save current state to undo stack
  const saveStateToHistory = useCallback((actionDescription: string) => {
    // Never track rename actions in history
    if (isRenameAction(actionDescription)) {
      return;
    }
    const snapshot = createSnapshot(actionDescription);
    setUndoStack(prev => {
      const newStack = [...prev, snapshot];
      // Limit stack size to 50 actions
      return newStack.length > 50 ? newStack.slice(1) : newStack;
    });
    // Clear redo stack when new action is performed
    setRedoStack([]);
    setLastAction(actionDescription);
  }, [createSnapshot, isRenameAction]);

  // Restore state from snapshot
  const restoreFromSnapshot = useCallback((snapshot: RoomSnapshot) => {
    setRoomName(snapshot.roomName);
    setWidth(snapshot.width);
    setLength(snapshot.length);
    setHeight(snapshot.height);
    setFloorColor(snapshot.floorColor);
    setCeilingColor(snapshot.ceilingColor);
    setWallFrontColor(snapshot.wallFrontColor);
    setWallBackColor(snapshot.wallBackColor);
    setWallLeftColor(snapshot.wallLeftColor);
    setWallRightColor(snapshot.wallRightColor);
    // Restore structural/visual properties, but preserve current names for existing IDs
    setBlocks(prevBlocks => {
      return snapshot.blocks.map(block => {
        // Look up existing block (if any) to keep its name untouched
        const current = prevBlocks.find(b => b.id === block.id);
        const lib = (libraryItems || []).find(item => item.name.toLowerCase() === String(block.name).toLowerCase());
        return {
          ...block,
          name: current?.name ?? block.name,
          rotation: (block as any).rotation ?? 0,
          modelPath: (block as any).modelPath ?? lib?.modelPath,
          created: new Date(),
        } as any;
      });
    });
  }, []);

  // Undo function
  const undo = useCallback(() => {
    let stack = undoStack;
    if (stack.length === 0) return;
    // Skip rename-only entries
    while (stack.length > 0 && isRenameAction(stack[stack.length - 1].action)) {
      stack = stack.slice(0, -1);
    }
    if (stack.length === 0) return;

    const currentState = createSnapshot("Current State");
    const stateToRestore = stack[stack.length - 1];

    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, prev.length - (undoStack.length - stack.length + 1)));

    restoreFromSnapshot(stateToRestore);
    setLastAction(`Undid: ${stateToRestore.action}`);
  }, [undoStack, createSnapshot, restoreFromSnapshot, isRenameAction]);

  // Redo function
  const redo = useCallback(() => {
    let stack = redoStack;
    if (stack.length === 0) return;
    while (stack.length > 0 && isRenameAction(stack[stack.length - 1].action)) {
      stack = stack.slice(0, -1);
    }
    if (stack.length === 0) return;

    const currentState = createSnapshot("Current State");
    const stateToRestore = stack[stack.length - 1];

    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, prev.length - (redoStack.length - stack.length + 1)));

    restoreFromSnapshot(stateToRestore);
    setLastAction(`Redid: ${stateToRestore.action}`);
  }, [redoStack, createSnapshot, restoreFromSnapshot, isRenameAction]);

  // Enhanced state setters that save to history
  const setWidthWithHistory = useCallback((value: number) => {
    saveStateToHistory(`Changed room width to ${value}ft`);
    setWidth(value);
  }, [saveStateToHistory]);

  const setLengthWithHistory = useCallback((value: number) => {
    saveStateToHistory(`Changed room length to ${value}ft`);
    setLength(value);
  }, [saveStateToHistory]);

  const setHeightWithHistory = useCallback((value: number) => {
    saveStateToHistory(`Changed room height to ${value}ft`);
    setHeight(value);
  }, [saveStateToHistory]);

  const setFloorColorWithHistory = useCallback((color: string) => {
    saveStateToHistory(`Changed floor color`);
    setFloorColor(color);
  }, [saveStateToHistory]);

  const setCeilingColorWithHistory = useCallback((color: string) => {
    saveStateToHistory(`Changed ceiling color`);
    setCeilingColor(color);
  }, [saveStateToHistory]);

  const setWallFrontColorWithHistory = useCallback((color: string) => {
    saveStateToHistory(`Changed front wall color`);
    setWallFrontColor(color);
  }, [saveStateToHistory]);

  const setWallBackColorWithHistory = useCallback((color: string) => {
    saveStateToHistory(`Changed back wall color`);
    setWallBackColor(color);
  }, [saveStateToHistory]);

  const setWallLeftColorWithHistory = useCallback((color: string) => {
    saveStateToHistory(`Changed left wall color`);
    setWallLeftColor(color);
  }, [saveStateToHistory]);

  const setWallRightColorWithHistory = useCallback((color: string) => {
    saveStateToHistory(`Changed right wall color`);
    setWallRightColor(color);
  }, [saveStateToHistory]);

  const setBlocksWithHistory = useCallback((newBlocks: typeof blocks | ((prev: typeof blocks) => typeof blocks), actionDescription: string) => {
    saveStateToHistory(actionDescription);
    if (typeof newBlocks === 'function') {
      setBlocks(newBlocks);
    } else {
      setBlocks(newBlocks);
    }
  }, [saveStateToHistory, blocks]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Check for Cmd+Y (Mac) or Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      else if (((e.metaKey || e.ctrlKey) && e.key === 'y') || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Load room state from local storage on initial render
  useEffect(() => {
    const roomStateJSON = localStorage.getItem('roomState');
    if (roomStateJSON) {
        try {
            const roomState = JSON.parse(roomStateJSON);
            setRoomId(roomState.id);
            setRoomName(roomState.name || 'Untitled Room');
            setWidth(roomState.width);
            setLength(roomState.length);
            setHeight(roomState.height);
            setFloorColor(roomState.floorColor);
            setCeilingColor(roomState.ceilingColor);
            setWallFrontColor(roomState.wallFrontColor);
            setWallBackColor(roomState.wallBackColor);
            setWallLeftColor(roomState.wallLeftColor);
            setWallRightColor(roomState.wallRightColor);
            console.log('Loading blocks from localStorage:', roomState.blocks);
            setBlocks(roomState.blocks || []);
            setChatMessages(roomState.chatMessages || []);
            setMeshyModelUrl(roomState.meshy_model_url || null);
            setSharedWith(roomState.sharedWith || []);
            
            // Determine user's permission level
            const isOwner = roomState.userId === user?.uid || !roomState.userId; // If no userId, assume owner (new room)
            const userPermission = roomState.permission || (isOwner ? 'edit' : 'view');
            setIsOwner(isOwner);
            setUserPermission(userPermission);
            
            // Load shared users from Firebase if roomId exists
            if (roomState.id) {
                loadSharedUsers(roomState.id);
            }
        } catch (error) {
            console.error('Error loading room state from localStorage:', error);
            // If there's an error, try to load from backup
            const backupStateJSON = localStorage.getItem('roomStateBackup');
            if (backupStateJSON) {
                try {
                    const backupState = JSON.parse(backupStateJSON);
                    setRoomId(backupState.id);
                    setRoomName(backupState.name || 'Untitled Room');
                    setWidth(backupState.width);
                    setLength(backupState.length);
                    setHeight(backupState.height);
                    setFloorColor(backupState.floorColor);
                    setCeilingColor(backupState.ceilingColor);
                    setWallFrontColor(backupState.wallFrontColor);
                    setWallBackColor(backupState.wallBackColor);
                    setWallLeftColor(backupState.wallLeftColor);
                    setWallRightColor(backupState.wallRightColor);
                    console.log('Loading blocks from localStorage backup:', backupState.blocks);
                    setBlocks(backupState.blocks || []);
                    setChatMessages(backupState.chatMessages || []);
                    setSharedWith(backupState.sharedWith || []);
                    
                    // Load shared users from Firebase if roomId exists
                    if (backupState.id) {
                        loadSharedUsers(backupState.id);
                    }
                } catch (backupError) {
                    console.error('Error loading backup room state:', backupError);
                }
            }
        }
    }
    setIsLoaded(true);
  }, []);

  // Function to load shared users from Firebase
  const loadSharedUsers = async (roomId: string) => {
    if (!user) return;
    
    try {
      const roomDoc = await getDoc(doc(db, "rooms", roomId));
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        if (roomData.sharedWith && Array.isArray(roomData.sharedWith)) {
          // Load shared users with their permissions
          console.log('Loading shared users:', roomData.sharedWith);
          setSharedWith(roomData.sharedWith);
        } else if (roomData.sharedWithEmails && Array.isArray(roomData.sharedWithEmails)) {
          // Legacy support: convert old sharedWithEmails to new format
          const sharedUsers: ShareUser[] = roomData.sharedWithEmails.map((email: string) => ({
            email,
            permission: "view"
          }));
          console.log('Loading legacy shared users:', sharedUsers);
          setSharedWith(sharedUsers);
        } else {
          console.log('No shared users found in room data');
        }
      }
    } catch (error) {
      console.error('Error loading shared users:', error);
    }
  };

  const findSnapPoint = useCallback((intersectPoint: THREE.Vector3, threshold = 0.2): THREE.Vector3 => {
    if (!sceneRef.current) return intersectPoint;

    let closestVertex: THREE.Vector3 | null = null;
    let minDistance = Infinity;

    sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        const position = geometry.attributes.position;
        if (position) {
          const worldMatrix = object.matrixWorld;
          for (let i = 0; i < position.count; i++) {
            const localVertex = new THREE.Vector3().fromBufferAttribute(position, i);
            const worldVertex = localVertex.applyMatrix4(worldMatrix);
            const distance = intersectPoint.distanceTo(worldVertex);
            if (distance < minDistance) {
              minDistance = distance;
              closestVertex = worldVertex;
            }
          }
        }
      }
    });

    if (closestVertex && minDistance < threshold) {
      return closestVertex;
    }

    return intersectPoint;
  }, []);

  function SceneEvents({
    rulerMode,
    rulerStartPoint,
    setRulerStartPoint,
    setRulers,
    setRulerPreview,
  }: {
    rulerMode: boolean;
    rulerStartPoint: THREE.Vector3 | null;
    setRulerStartPoint: React.Dispatch<React.SetStateAction<THREE.Vector3 | null>>;
    setRulers: React.Dispatch<React.SetStateAction<[THREE.Vector3, THREE.Vector3][]>>;
    setRulerPreview: React.Dispatch<React.SetStateAction<[THREE.Vector3, THREE.Vector3] | null>>;
  }) {
    const { scene } = useThree();
    useEffect(() => {
      (sceneRef as any).current = scene;
    }, [scene]);

    const handlePointerDown = (event: any) => {
      if (!rulerMode) return;
      event.stopPropagation();

      const intersectPoint = event.point;
      const snapPoint = findSnapPoint(intersectPoint);

      if (!rulerStartPoint) {
        setRulerStartPoint(snapPoint);
      } else {
        setRulers((prev) => [...prev, [rulerStartPoint, snapPoint]]);
        setRulerStartPoint(null);
        setRulerPreview(null);
      }
    };

    const handlePointerMove = (event: any) => {
      if (!rulerMode || !rulerStartPoint) return;
      event.stopPropagation();

      const intersectPoint = event.point;
      const snapPoint = findSnapPoint(intersectPoint);
      setRulerPreview([rulerStartPoint, snapPoint]);
    };

    return (
      <mesh
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial />
      </mesh>
    );
  }

  // Add state for menu sections and search
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    views: true,
    builder: true,
    colors: true
  });

  const scale = 0.35;
  const insideViewYaw = useRef(0);

  // Convert to total feet
  const widthFt = width;
  const lengthFt = length;
  const heightFt = height;
  // Now safe to use width, length, height
  const roomDims = {
    x: (width * scale) / 2 - 0.2,
    y: (height * scale),
    z: (length * scale) / 2 - 0.2,
  };

  // Key listeners for inside view
  useEffect(() => {
    if (!insideActive) return;
    const down = (e: KeyboardEvent) => { insideKeys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { insideKeys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [insideActive]);

  // Track yaw for movement direction
  const pointerLockRef = useRef<any>(null);
  useEffect(() => {
    if (!insideActive) return;
    const controls = pointerLockRef.current;
    if (!controls) return;
    const onChange = () => {
      if (controls) {
        insideViewYaw.current = controls.getObject().rotation.y;
      }
    };
    controls?.addEventListener("change", onChange);
    return () => controls?.removeEventListener("change", onChange);
  }, [insideActive]);

  // Exit button handler
  const handleExitInside = () => {
    setView("outside");
    setInsideActive(false);
  };

  // Camera positions for different views
  const roomSize = Math.max(width, length, height) * scale;
  const cameraPositions: { [key in 'outside' | 'orbit' | 'topdown' | 'bottomup']: [number, number, number] } = {
    outside: [0, roomSize, roomSize * 2.2], // outside, looking in
    orbit: [roomSize * 1.2, roomSize * 1.2, roomSize * 1.2], // isometric/orbit
    topdown: [0, roomSize * 2, 0], // above, looking down (was bottomup)
    bottomup: [0, -roomSize * 2, 0], // below, looking up (was topdown)
  };

  // Add toggle function for sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [chatbotOpen, setChatbotOpen] = useState(true);
  type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    agent?: string;
    confidence?: number;
    reasoning?: string;
    amazonResults?: any;
    showAllProducts?: boolean;
    // Optional fields used by multi-agent streaming
    progressData?: any;
    clarificationNeeded?: boolean;
    clarificationType?: string;
    questions?: Array<{ text: string; action: string } | string>;
  };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // Agentic system state
  const [isAgenticProcessing, setIsAgenticProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(360);
  const [chatbotHeight, setChatbotHeight] = useState(480);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputBarRef = useRef<{ setValue: (v: string) => void; focus: () => void }>(null);

  // Auto-scroll to bottom when AI tab is clicked or new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);



  // AGENTIC SPECIALIZATION SYSTEM
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [agentContext, setAgentContext] = useState<{
    designStyle?: string;
    userPreferences?: string[];
    roomPurpose?: string;
    budget?: string;
    constraints?: string[];
    designHistory?: Array<{action: string, agent: string, timestamp: number, confidence: number}>;
    currentFocus?: string;
  }>({
    designHistory: []
  });

  // Agent Definitions and Capabilities
  const agentSystem = {
    "design-specialist": {
      name: "Design Specialist",
      emoji: "🎨",
      specialties: ["color theory", "style coordination", "aesthetic balance", "mood creation"],
      confidence: {
        "color schemes": 0.95,
        "style matching": 0.90,
        "aesthetic appeal": 0.92,
        "trend awareness": 0.88
      },
      systemPrompt: `You are Maya, an expert Interior Design Specialist with 15+ years of experience in residential design. Your expertise includes:
- Advanced color theory and psychology
- Style coordination (modern, traditional, minimalist, etc.)
- Creating harmonious aesthetic experiences
- Understanding design trends and timeless principles

When responding:
1. Always consider the psychological impact of design choices
2. Provide specific color codes and style recommendations
3. Explain the reasoning behind aesthetic decisions
4. Consider lighting and how it affects colors/materials
5. Balance current trends with timeless design principles

PINBOARD INTEGRATION:
When pinboard context is provided in the user's message (look for "@pinboard[Name]: content" sections), you should:
- Use the pinboard content as reference material for your design advice
- Incorporate the user's saved notes, ideas, and inspiration from their pinboards
- Reference specific elements mentioned in the pinboard context
- Build upon the user's documented design preferences and ideas
- Treat pinboard content as the user's saved design thoughts and inspiration

AMAZON PRODUCT INTEGRATION:
When Amazon product data is provided in the user's message, you should:
- Analyze the products and provide personalized recommendations
- Consider the user's room context, style preferences, and budget
- Explain why specific products would work well for their needs
- Reference product URLs, prices, and ratings in your recommendations
- Suggest how products would fit into their overall design vision
- Provide styling tips and complementary items

Your responses should be confident but collaborative, acknowledging when other specialists should weigh in.`
    },
    "space-planner": {
      name: "Space Planner",
      emoji: "📐",
      specialties: ["spatial optimization", "furniture placement", "traffic flow", "ergonomics"],
      confidence: {
        "furniture placement": 0.93,
        "space efficiency": 0.91,
        "traffic flow": 0.89,
        "ergonomics": 0.87
      },
      systemPrompt: `You are Alex, a certified Space Planning specialist with expertise in optimizing room layouts for both function and beauty. Your core competencies:
- Spatial analysis and optimization
- Furniture placement for maximum functionality
- Traffic flow and circulation patterns
- Ergonomic considerations and accessibility
- Proportion and scale relationships

PINBOARD INTEGRATION:
When pinboard context is provided in the user's message (look for "@pinboard[Name]: content" sections), you should:
- Use the pinboard content as reference for spatial planning decisions
- Consider the user's saved layout ideas and furniture preferences from pinboards
- Incorporate dimensional requirements and placement notes from their saved content
- Reference specific spatial concepts mentioned in the pinboard context

CRITICAL: When Amazon product data is provided in the user's message (look for "Here are some Amazon products that match your request:" section), you MUST use that data to give specific recommendations. Do NOT say you cannot browse the internet or recommend checking online retailers - the product data is provided directly to you.

When responding:
1. Always consider practical usage patterns
2. Optimize for both aesthetics and functionality
3. Consider clearance requirements and building codes
4. Think about how people will move through and use the space
5. Balance multiple functional needs

PINBOARD INTEGRATION:
When pinboard context is provided in the user's message (look for "@pinboard[Name]: content" sections), you should:
- Use the pinboard content to understand technical requirements and constraints
- Consider saved measurements, specifications, and technical notes from pinboards
- Reference structural or installation considerations mentioned in the pinboard context
- Incorporate budget constraints or material preferences from their saved content

AMAZON PRODUCT INTEGRATION:
When Amazon product data is provided in the user's message, you should:
- Analyze product dimensions and how they would fit in the user's space
- Consider traffic flow and ergonomic placement of suggested products
- Recommend optimal positioning based on room layout and dimensions
- Suggest complementary furniture arrangements
- Consider clearance requirements and accessibility for each product
- Reference product URLs and specifications in your spatial recommendations

Provide specific measurements and spatial relationships. Collaborate with other agents on style while focusing on spatial intelligence.`
    },
    "technical-advisor": {
      name: "Technical Advisor",
      emoji: "🔧",
      specialties: ["measurements", "structural considerations", "building codes", "practical constraints"],
      confidence: {
        "measurements": 0.96,
        "building codes": 0.88,
        "structural analysis": 0.85,
        "material properties": 0.90
      },
      systemPrompt: `You are Jordan, a Technical Advisor with background in architecture and construction. Your expertise covers:
- Precise measurements and spatial calculations
- Building codes and safety requirements
- Structural considerations and limitations
- Material properties and installation requirements
- Cost estimation and practical feasibility

When responding:
1. Always verify measurements and proportions
2. Flag potential structural or code issues
3. Consider real-world implementation challenges
4. Provide cost-effective alternatives when needed
5. Ensure safety and building compliance

PINBOARD INTEGRATION:
When pinboard context is provided in the user's message (look for "@pinboard[Name]: content" sections), you should:
- Use the pinboard content to understand technical requirements and constraints
- Consider saved measurements, specifications, and technical notes from pinboards
- Reference structural or installation considerations mentioned in the pinboard context
- Incorporate budget constraints or material preferences from their saved content

AMAZON PRODUCT INTEGRATION:
When Amazon product data is provided in the user's message, you should:
- Analyze product specifications and technical requirements
- Consider installation requirements and compatibility with existing structures
- Evaluate material quality and durability based on product descriptions
- Assess cost-effectiveness and value for money
- Check for any safety or compliance considerations
- Provide technical insights about product features and limitations
- Reference product URLs and technical specifications in your analysis

Your role is to ground creative ideas in practical reality while supporting the overall design vision.`
    }
  };

  // Agent Intelligence and Coordination Functions
  const analyzeUserIntent = (message: string) => {
    const colorKeywords = /color|paint|hue|shade|tone|bright|dark|warm|cool|palette/i;
    const spaceKeywords = /place|move|position|layout|arrange|furniture|space|room|flow|organize/i;
    const technicalKeywords = /measure|size|dimensions|fit|budget|cost|code|structural|wall|ceiling|floor/i;
    const styleKeywords = /style|design|look|feel|theme|modern|traditional|minimalist|contemporary|aesthetic/i;

    const intents = [];
    if (colorKeywords.test(message) || styleKeywords.test(message)) {
      intents.push("design-specialist");
    }
    if (spaceKeywords.test(message)) {
      intents.push("space-planner");
    }
    if (technicalKeywords.test(message)) {
      intents.push("technical-advisor");
    }

    // Default to design specialist for general questions
    if (intents.length === 0) {
      intents.push("design-specialist");
    }

    return intents;
  };

  const selectPrimaryAgent = (intents: string[], context: any): "design-specialist" | "space-planner" | "technical-advisor" => {
    // Logic to select the most appropriate primary agent
    if (intents.length === 1) {
      const intent = intents[0];
      if (intent === "design-specialist" || intent === "space-planner" || intent === "technical-advisor") {
        return intent;
      }
    }
    
    // Priority based on current context and conversation flow
    if (context.currentFocus === "color-scheme" && intents.includes("design-specialist")) {
      return "design-specialist";
    }
    if (context.currentFocus === "furniture-placement" && intents.includes("space-planner")) {
      return "space-planner";
    }
    
    // Default intelligent routing
    if (intents.includes("technical-advisor")) return "technical-advisor";
    if (intents.includes("space-planner")) return "space-planner";
    return "design-specialist";
  };

  // INTELLIGENT CONTEXT LEARNING SYSTEM
  const updateContextFromInteraction = useCallback((userMessage: string, agentResponse: string, selectedAgent: string) => {
    // Extract design preferences from interactions
    const colorMentions = userMessage.match(/\b(warm|cool|bright|dark|neutral|bold|subtle|vibrant|muted)\b/gi);
    const styleMentions = userMessage.match(/\b(modern|traditional|minimalist|contemporary|rustic|industrial|scandinavian|bohemian)\b/gi);
    const roomPurposeMentions = userMessage.match(/\b(bedroom|living room|kitchen|office|dining room|bathroom|studio)\b/gi);
    const budgetMentions = userMessage.match(/\b(budget|cheap|expensive|affordable|luxury|premium|cost)\b/gi);

    setAgentContext(prev => {
      const updated = { ...prev };

      // Learn style preferences
      if (styleMentions && styleMentions.length > 0) {
        updated.designStyle = styleMentions[0].toLowerCase();
      }

      // Learn user preferences
      const newPreferences = [];
      if (colorMentions) newPreferences.push(...colorMentions.map(m => m.toLowerCase()));
      if (styleMentions) newPreferences.push(...styleMentions.map(m => m.toLowerCase()));
      
      if (newPreferences.length > 0) {
        updated.userPreferences = [...new Set([...(updated.userPreferences || []), ...newPreferences])].slice(-10);
      }

      // Learn room purpose
      if (roomPurposeMentions && roomPurposeMentions.length > 0) {
        updated.roomPurpose = roomPurposeMentions[0].toLowerCase();
      }

      // Learn budget considerations
      if (budgetMentions && budgetMentions.length > 0) {
        updated.budget = budgetMentions[0].toLowerCase();
      }

      // Update design history with learning insights
      const learningInsights = [];
      if (colorMentions?.length) learningInsights.push(`color preference: ${colorMentions.join(', ')}`);
      if (styleMentions?.length) learningInsights.push(`style preference: ${styleMentions.join(', ')}`);
      if (roomPurposeMentions?.length) learningInsights.push(`room purpose: ${roomPurposeMentions.join(', ')}`);

      if (learningInsights.length > 0) {
        updated.designHistory = [
          ...(updated.designHistory || []),
          {
            action: `Learned: ${learningInsights.join('; ')}`,
            agent: 'context-learner',
            timestamp: Date.now(),
            confidence: 0.7
          }
        ].slice(-15); // Keep last 15 learning events
      }

      return updated;
    });
  }, []);

  // Smart context suggestions based on learned preferences
  const getContextualSuggestions = useCallback(() => {
    const suggestions = [];
    
    if (agentContext.designStyle) {
      suggestions.push(`💡 Continue with ${agentContext.designStyle} style elements`);
    }
    
    if (agentContext.userPreferences?.length) {
      const topPrefs = agentContext.userPreferences.slice(-3).join(', ');
      suggestions.push(`🎯 Based on your preferences: ${topPrefs}`);
    }
    
    if (agentContext.roomPurpose) {
      suggestions.push(`🏠 Optimizing for ${agentContext.roomPurpose} functionality`);
    }

    if (agentContext.budget) {
      suggestions.push(`💰 Considering ${agentContext.budget} options`);
    }

    return suggestions;
  }, [agentContext]);

  // Simple debounce utility function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });

  // Debounced function to update room in Firestore
  const updateRoomInFirestore = useCallback(
    debounce(async (roomData: any) => {
      if (!roomId || userPermission !== 'edit') return; // Only users with edit permission can update rooms
      
      try {
        const roomRef = doc(db, "rooms", roomId);
        await updateDoc(roomRef, roomData);
        console.log("Room state saved to Firestore");
      } catch (error) {
        console.error("Error saving room state to Firestore:", error);
      }
    }, 1000),
    [roomId, userPermission]
  );

  // Fetch user's pinboards for main component
  const fetchPinboardsMain = useCallback(async () => {
    if (!user) return;
    
    try {
      const pinboardsRef = collection(db, "pinboards");
      const q = query(
        pinboardsRef,
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const pinboardList: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate?.() || 
                         data.pinboard?.updatedAt?.toDate?.() || 
                         new Date(data.updatedAt) || 
                         data.createdAt?.toDate?.() ||
                         new Date();
        
        pinboardList.push({
          id: doc.id,
          name: data.name || `Pinboard #${doc.id.slice(-6)}`,
          updatedAt: updatedAt,
          notes: data.pinboard?.notes || [],
          images: data.pinboard?.images || [],
          drawings: data.pinboard?.drawings || []
        });
      });
      
      setPinboards(pinboardList);
    } catch (error) {
      console.error("Error fetching pinboards:", error);
    }
  }, [user]);

  // Handle @ button click for main component
  const handleAtButtonClickMain = () => {
    setShowPinboardSearch(!showPinboardSearch);
    setSearchQuery('');
    if (!showPinboardSearch && user) {
      fetchPinboardsMain();
    }
  };

  // Add pinboard to message for main component
  const addPinboardToMessageMain = useCallback(async (pinboard: any) => {
    try {
      // Get pinboard notes using the extract-notes API
      const response = await fetch('/api/extract-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinboardId: pinboard.id }),
      });

      if (response.ok) {
        const notesData = await response.json();
        
        // Create enhanced context with image information
        let contextText = '';
        
        if (notesData.notes && notesData.notes.length > 0) {
          contextText += `Notes: ${notesData.notes.map((n: any) => n.text).join(', ')}`;
        }
        
        if (notesData.images && notesData.images.length > 0) {
          const imageDescriptions = notesData.images.map((img: any) => {
            const description = img.description || 'Image present';
            const position = `at (${Math.round(img.left)}, ${Math.round(img.top)})`;
            const scale = img.scaleX !== 1 || img.scaleY !== 1 ? ` scaled ${img.scaleX}x${img.scaleY}` : '';
            const rotation = img.angle ? ` rotated ${Math.round(img.angle)}°` : '';
            return `${description} ${position}${scale}${rotation}`;
          }).join(', ');
          
          if (contextText) contextText += ' | ';
          contextText += `Images: ${imageDescriptions}`;
        }
        
        if (notesData.drawings && notesData.drawings.length > 0) {
          const drawingDescriptions = notesData.drawings.map((drawing: any) => {
            const description = drawing.description || 'Hand-drawn sketch';
            const position = `at (${Math.round(drawing.left)}, ${Math.round(drawing.top)})`;
            const strokeInfo = drawing.stroke !== '#111111' ? ` in ${drawing.stroke}` : '';
            return `${description} ${position}${strokeInfo}`;
          }).join(', ');
          
          if (contextText) contextText += ' | ';
          contextText += `Drawings: ${drawingDescriptions}`;
        }
        
        if (!contextText) {
          contextText = 'Empty pinboard';
        }
        
        // Add to selected pinboards (Cursor-style)
        setSelectedPinboards(prev => {
          // Check if pinboard is already selected
          const exists = prev.find(p => p.id === pinboard.id);
          if (exists) return prev;
          
          return [...prev, {
            id: pinboard.id,
            name: pinboard.name,
            context: contextText,
            notes: notesData.notes || [],
            images: notesData.images || [],
            drawings: notesData.drawings || [],
            totalImages: notesData.totalImages || 0,
            totalDrawings: notesData.totalDrawings || 0
          }];
        });
        
        setShowPinboardSearch(false);
        chatInputBarRef.current?.focus();
      }
    } catch (error) {
      console.error('Error adding pinboard context:', error);
    }
  }, []);

  // Effect to persist room state changes to Firestore
  useEffect(() => {
    if (!isLoaded || !roomId) return;

    // Prepare sanitized blocks (remove Date objects and undefined values for Firestore)
    const sanitizedBlocks = blocks.map(block => {
      const { created, ...rest } = block;
      // Remove undefined values
      return Object.fromEntries(
        Object.entries(rest).filter(([_, value]) => value !== undefined)
      );
    });

    const roomData = {
      name: roomName,
      width,
      length,
      height,
      floorColor,
      ceilingColor,
      wallFrontColor,
      wallBackColor,
      wallLeftColor,
      wallRightColor,
      blocks: sanitizedBlocks,
      // chatHistory: chatMessages,
      // move chatMessages to a separate doc so that it doesnt need to be rendered on any chat page
    };

    updateRoomInFirestore(roomData);
  }, [
    isLoaded, roomId, userPermission, roomName, width, length, height,
    floorColor, ceilingColor, wallFrontColor, wallBackColor, 
    wallLeftColor, wallRightColor, blocks, chatMessages, updateRoomInFirestore
  ]);

  // Load chat messages from subcollection when room loads
  useEffect(() => {
    const loadMessages = async () => {
      if (!roomId || messagesLoaded) return;
      
      try {
        console.log('🔄 Loading messages from subcollection for room:', roomId);
        const messages = await MessageStorage.getRecentMessages(roomId, 50);
        console.log('✅ Loaded messages:', messages.length);
        setChatMessages(messages);
        setMessagesLoaded(true);
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        setMessagesLoaded(true); // Still mark as loaded to prevent retry loops
      }
    };

    loadMessages();
  }, [roomId, messagesLoaded]);

  // Helper function to save any message to subcollection
  const saveMessageToSubcollection = async (message: any) => {
    if (roomId) {
      try {
        await MessageStorage.addMessage(roomId, {
          ...message,
          userId: user?.uid || 'unknown'
        });
        console.log('✅ Message saved to subcollection:', message.role);
      } catch (error) {
        console.error('❌ Error saving message:', error);
      }
    }
  };

  const handleChatSubmit = async (e: FormEvent | null, inputOverride?: string) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const rawInput = inputOverride !== undefined ? inputOverride : chatInput;
    if (!rawInput || !rawInput.trim() || isLoading) return;

    const userMessage = rawInput.trim();
    console.log('🔍 Debug - roomId:', roomId, 'user:', user?.uid, 'message:', userMessage);
    
    // TEST: Save user message to new subcollection system
    await saveMessageToSubcollection({
      role: 'user',
      content: userMessage
    });
    
    const newMessages: Array<{ role: 'user' | 'assistant'; content: string; agent?: string; confidence?: number; reasoning?: string; amazonResults?: any; showAllProducts?: boolean }> = [
      ...chatMessages,
      { role: 'user', content: userMessage },
    ];
    setChatMessages(newMessages);
    setChatInput('');
    setIsLoading(true);

  
    
    // MULTI-AGENT SYSTEM
    if (multiAgentMode) {
      // Prefer live streaming from backend for ReAct traces and incremental actions
      const USE_STREAMING_MULTI_AGENT = true;
      if (USE_STREAMING_MULTI_AGENT) {
        try {
          // Include pinboard context in the user message if any pinboards are selected
          let enhancedUserMessage = userMessage;
          if (selectedPinboards.length > 0) {
            const pinboardContext = selectedPinboards.map(p => `@pinboard[${p.name}]: ${p.context}`).join('\n\n');
            enhancedUserMessage = `${pinboardContext}\n\nUser question: ${userMessage}`;
          }

          const multiAgentRequest = {
            user_input: enhancedUserMessage,
            userId: user?.uid, // Add userId for memory integration
            room_state: {
              width,
              length,
              height,
              floorColor,
              ceilingColor,
              wallFrontColor,
              wallBackColor,
              wallLeftColor,
              wallRightColor,
              blocks: blocks.map((b: any) => ({
                name: b.name,
                width: b.width,
                height: b.height,
                depth: b.depth,
                x: b.x,
                y: b.y,
                z: b.z,
                color: b.color,
              })),
            },
            conversation_history: [],
            user_preferences: { style: 'modern', room_purpose: 'living room' },
          };

          console.log('🔍 CALLING BACKEND directly:', 'http://127.0.0.1:8001/multi-agent-design-stream');
          console.log('🔍 Request payload:', multiAgentRequest);
          
          const response = await fetch('http://127.0.0.1:8001/multi-agent-design-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(multiAgentRequest),
          });
          
          console.log('🔍 Response received:', response.ok, response.status);

          if (!response.ok || !response.body) {
            throw new Error(`Multi-agent stream error: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          // Initialize progress data structure
          let progressData = {
            orchestratorPlan: '',
            orchestratorStatus: 'pending' as 'pending' | 'running' | 'completed',
            routingInfo: null as any,
            agents: [] as any[],
            finalMessage: '',
            isComplete: false
          };

          // Create initial progress message
          const progressMessageIndex = newMessages.length;
          const initialProgressMessage = {
            role: 'assistant' as const,
            content: 'multi-agent-progress',
            progressData: { ...progressData }
          };
          setChatMessages(prev => [...prev, initialProgressMessage]);
          
          // Don't save yet - wait until complete

          const updateProgress = async (updatedData: any) => {
            const updatedMessage = {
              role: 'assistant' as const,
              content: 'multi-agent-progress',
              progressData: { ...updatedData }
            };
            
            setChatMessages(prev => prev.map((msg, idx) => 
              idx === progressMessageIndex 
                ? updatedMessage
                : msg
            ));
            
            // Only save when complete to avoid duplicates
            if (updatedData.isComplete) {
              await saveMessageToSubcollection(updatedMessage);
            }
          };

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.trim()) continue;
              let evt: any;
              try { evt = JSON.parse(line); } catch { continue; }

              console.log('🔍 RAW EVENT RECEIVED:', evt.type, evt);

              switch (evt.type) {
                case 'orchestrator_plan': {
                  progressData.orchestratorPlan = evt.content || '';
                  progressData.orchestratorStatus = 'completed';
                  await updateProgress(progressData);
                  break;
                }
                case 'routing': {
                  progressData.routingInfo = {
                    agents_needed: evt.agents_needed || [],
                    reasoning: evt.reasoning || '',
                    complexity: evt.complexity || 'simple'
                  };
                  await updateProgress(progressData);
                  break;
                }
                case 'agent_start': {
                  const agentName = evt.agent || '';
                  let agent = progressData.agents.find(a => a.name === agentName);
                  if (!agent) {
                    agent = { name: agentName, status: 'running', events: [] };
                    progressData.agents.push(agent);
                  } else {
                    agent.status = 'running';
                  }
                  await updateProgress(progressData);
                  break;
                }
                case 'thought': {
                  const agentName = evt.agent || '';
                  let agent = progressData.agents.find(a => a.name === agentName);
                  if (!agent) {
                    agent = { name: agentName, status: 'running', events: [] };
                    progressData.agents.push(agent);
                  }
                  agent.events.push({
                    type: 'thought',
                    agent: agentName,
                    content: evt.content || ''
                  });
                  await updateProgress(progressData);
                  break;
                }
                case 'action': {
                  const agentName = evt.agent || '';
                  let agent = progressData.agents.find(a => a.name === agentName);
                  if (!agent) {
                    agent = { name: agentName, status: 'running', events: [] };
                    progressData.agents.push(agent);
                  }
                  agent.events.push({
                    type: 'action',
                    agent: agentName,
                    tool: evt.tool || '',
                    args: evt.args || {}
                  });
                  await updateProgress(progressData);
                  break;
                }
                case 'actions': {
                  const actions = evt.actions || [];
                  for (const action of actions) {
                    if (action.action === 'change_color') {
                      if (action.target === 'wallFrontColor') setWallFrontColorWithHistory(action.value);
                      else if (action.target === 'wallBackColor') setWallBackColorWithHistory(action.value);
                      else if (action.target === 'wallLeftColor') setWallLeftColorWithHistory(action.value);
                      else if (action.target === 'wallRightColor') setWallRightColorWithHistory(action.value);
                      else if (action.target === 'floorColor') setFloorColorWithHistory(action.value);
                      else if (action.target === 'ceilingColor') setCeilingColorWithHistory(action.value);
                    } else if (action.action === 'add_object') {
                      // Find the library item to get proper properties including modelPath
                      const libraryItem = libraryItems.find(item => 
                        item.name.toLowerCase() === action.target.toLowerCase()
                      );
                      
                      if (libraryItem) {
                        console.log(`Multi-agent adding ${action.target} with GLB model:`, libraryItem.modelPath);
                      } else {
                        console.warn(`Multi-agent adding ${action.target} but no library item found - using fallback`);
                      }
                      
                      const newBlock = {
                        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: action.target,
                        x: action.value.x || 0,
                        y: action.value.y || 0,
                        z: action.value.z || 0,
                        width: action.value.width || (libraryItem?.width || 1),
                        height: action.value.height || (libraryItem?.height || 1),
                        depth: action.value.depth || (libraryItem?.depth || 1),
                        color: action.value.color || (libraryItem?.color || '#888888'),
                        rotation: action.value.rotation || 0,
                        modelPath: libraryItem?.modelPath, // This is the key missing property!
                        created: new Date()
                      } as any;
                      setBlocksWithHistory(prev => [...prev, newBlock], `AI added ${action.target}`);
                    } else if (action.action === 'move_object') {
                      setBlocksWithHistory(prevBlocks => prevBlocks.map(block => {
                        if (block.name.toLowerCase().includes(action.target.toLowerCase()) || action.target.toLowerCase().includes(block.name.toLowerCase())) {
                          return { ...block, x: action.value.x, y: action.value.y, z: action.value.z };
                        }
                        return block;
                      }), `AI moved ${action.target}`);
                    } else if (action.action === 'remove_object') {
                      setBlocksWithHistory(prevBlocks => {
                        const idsToRemove = prevBlocks
                          .filter((b: any) => b.name.toLowerCase().includes(action.target.toLowerCase()) || action.target.toLowerCase().includes(b.name.toLowerCase()))
                          .map((b: any) => b.id);
                        return prevBlocks.filter((b: any) => !idsToRemove.includes(b.id));
                      }, `AI removed ${action.target}`);
                    }
                  }
                  break;
                }
                case 'agent_complete': {
                  const agentName = evt.agent || '';
                  const agent = progressData.agents.find(a => a.name === agentName);
                  if (agent) {
                    agent.status = 'completed';
                    agent.actions = evt.actions || [];
                  }
                  await updateProgress(progressData);
                  break;
                }
                case 'search_results': {
                  // Append a new assistant message that contains the search results payload
                  const resultsMessage = {
                    role: 'assistant' as const,
                    content: 'search-results',
                    results: {
                      query: evt.query || '',
                      items: Array.isArray(evt.items) ? evt.items.slice(0, 10) : []
                    }
                  } as any;
                  setChatMessages(prev => [...prev, resultsMessage]);
                  break;
                }
                case 'final': {
                  console.log('🔍 FINAL EVENT RECEIVED:', evt);
                  console.log('🔍 evt.message:', evt.message);
                  console.log('🔍 evt.results:', evt.results);
                  
                  progressData.finalMessage = evt.message || 'Multi-agent analysis complete.';
                  progressData.isComplete = true;
                  await updateProgress(progressData);
                  
                  // Handle search results in final response
                  if (evt.results && evt.message === 'search-results') {
                    console.log('🔍 ✅ SEARCH RESULTS CONDITION MET! Creating message...');
                    const searchResultsMessage = {
                      role: 'assistant' as const,
                      content: 'search-results',
                      results: evt.results
                    } as any;
                    console.log('🔍 Message to add:', searchResultsMessage);
                    setChatMessages(prev => {
                      const newMessages = [...prev, searchResultsMessage];
                      console.log('🔍 All chat messages after adding:', newMessages);
                      return newMessages;
                    });
                  } else {
                    console.log('🔍 ❌ CONDITION FAILED');
                    console.log('🔍 Has results?', !!evt.results);
                    console.log('🔍 Message equals "search-results"?', evt.message === 'search-results');
                    console.log('🔍 evt.message type:', typeof evt.message);
                    console.log('🔍 evt.message value:', JSON.stringify(evt.message));
                  }
                  break;
                }
                case 'clarification_needed': {
                  // Show clarification questions to user
                  const clarificationMessage = {
                    role: 'assistant' as const,
                    content: evt.message || 'I need clarification to proceed.',
                    clarificationNeeded: true,
                    clarificationType: evt.clarification_type,
                    questions: evt.questions || []
                  };
                  setChatMessages(prev => [...prev, clarificationMessage]);
                  await saveMessageToSubcollection(clarificationMessage);
                  setIsLoading(false);
                  return; // Stop processing until user responds
                }
              }
            }
          }

          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Multi-agent stream error:', error);
          const errorMessage = { role: 'assistant' as const, content: 'Error running multi-agent workflow.' };
          setChatMessages(prev => [...prev, errorMessage]);
          await saveMessageToSubcollection(errorMessage);
          setIsLoading(false);
          return;
        }
      }
      try {
        const response = await fetch('/api/multi-agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userMessage,
            roomState: {
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
            },
            messages: chatMessages,
            multiAgentMode: true,
            userPreferences: {
              style: 'modern',
              room_purpose: 'living room'
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`Multi-agent API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle questions from the multi-agent system
        if (data.type === 'questions') {
          const assistantMessage = {
            role: 'assistant' as const,
            content: `${data.message}\n\n**Questions:**\n${data.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n\n*Please answer these questions so I can create the perfect room for you.*`
          };
          setChatMessages([...newMessages, assistantMessage]);
          setIsLoading(false);
          return;
        }

        // Handle multi-agent actions
        if (data.type === 'multi_agent_actions' && data.actions) {
          // Apply all room actions
          for (const action of data.actions) {
            // Apply action directly to room state
            if (action.action === 'change_color') {
              if (action.target === 'wallFrontColor') setWallFrontColorWithHistory(action.value);
              else if (action.target === 'wallBackColor') setWallBackColorWithHistory(action.value);
              else if (action.target === 'wallLeftColor') setWallLeftColorWithHistory(action.value);
              else if (action.target === 'wallRightColor') setWallRightColorWithHistory(action.value);
              else if (action.target === 'floorColor') setFloorColorWithHistory(action.value);
              else if (action.target === 'ceilingColor') setCeilingColorWithHistory(action.value);
            } else if (action.action === 'add_object') {
              // Find the library item to get proper properties including modelPath
              const libraryItem = libraryItems.find(item => 
                item.name.toLowerCase() === action.target.toLowerCase()
              );
              
              if (libraryItem) {
                console.log(`Multi-agent adding ${action.target} with GLB model:`, libraryItem.modelPath);
              } else {
                console.warn(`Multi-agent adding ${action.target} but no library item found - using fallback`);
              }
              
              const newBlock = {
                id: `block-${Date.now()}`,
                name: action.target,
                x: action.value.x || 0,
                y: action.value.y || 0,
                z: action.value.z || 0,
                width: action.value.width || (libraryItem?.width || 1),
                height: action.value.height || (libraryItem?.height || 1),
                depth: action.value.depth || (libraryItem?.depth || 1),
                color: action.value.color || (libraryItem?.color || '#888888'),
                rotation: action.value.rotation || 0,
                modelPath: libraryItem?.modelPath, // This is the key missing property!
                created: new Date()
              };
              setBlocksWithHistory(prev => [...prev, newBlock], `AI added ${action.target}`);
            } else if (action.action === 'move_object') {
              setBlocksWithHistory(prevBlocks => prevBlocks.map(block => {
                if (block.name.toLowerCase().includes(action.target.toLowerCase()) || action.target.toLowerCase().includes(block.name.toLowerCase())) {
                  return { ...block, x: action.value.x, y: action.value.y, z: action.value.z };
                }
                return block;
              }), `AI moved ${action.target}`);
            }
          }

          // Create summary message
          const summaryMessage = `${data.message}\n\n🤖 **Multi-Agent Analysis Summary:**\n• **Agents Used:** ${data.agents_used.join(', ')}\n• **Total Actions:** ${data.actions.length}\n• **Complexity:** ${data.summary.complexity}\n\n**Actions Performed:**\n${data.actions.map((action: any, i: number) => `${i + 1}. ${action.action}: ${action.target} → ${JSON.stringify(action.value)}`).join('\n')}`;
          
          const assistantMessage = {
            role: 'assistant' as const,
            content: summaryMessage
          };
          setChatMessages([...newMessages, assistantMessage]);
          setIsLoading(false);
          return;
        }

        // Handle text response
        if (data.type === 'text_response') {
          const assistantMessage: any = {
            role: 'assistant' as const,
            content: data.message || 'Multi-agent analysis complete.'
          };
          
          // Preserve results field if present (for search results display)
          if (data.results) {
            assistantMessage.results = data.results;
          }
          
          setChatMessages([...newMessages, assistantMessage]);
          setIsLoading(false);
          return;
        }

        // Handle any other response type
        const assistantMessage: any = {
          role: 'assistant' as const,
          content: data.message || 'Multi-agent analysis complete.'
        };
        
        // Preserve results field if present (for search results display)
        if (data.results) {
          assistantMessage.results = data.results;
        }
        
        setChatMessages([...newMessages, assistantMessage]);
        setIsLoading(false);
        return;

      } catch (error) {
        console.error('Multi-agent system error:', error);
        const errorMessage = {
          role: 'assistant' as const,
          content: 'Sorry, the multi-agent system encountered an error. Please try again.'
        };
        setChatMessages([...newMessages, errorMessage]);
        setIsLoading(false);
        return;
      }
    }
    
    // AMAZON KNOWLEDGE BASE AGENT
    if (amazonKnowledgeBaseEnabled) {
      try {
        const results = await searchAmazonProducts(userMessage);
  
        if (results && results.products && results.products.length > 0) {
          const productContext = results.products.map((product: any) => 
            `Product: ${product.title}
  Price: ${product.price.current_price}
  Rating: ${product.rating}/5 (${product.ratings_total} reviews)
  Prime: ${product.prime ? 'Yes' : 'No'}
  URL: ${product.link}`
          ).join('\n\n');
  
          const amazonSystemPrompt = `You are an Amazon shopping assistant. A user has searched for products and you have been provided with a list of results. Your task is to summarize the findings in a helpful and natural way.
  - Do not act as an interior designer.
  - Do not make recommendations about style or placement.
  - Simply summarize the products that were found.
  - Mention the number of products found.
  - You can highlight 1-3 products that seem like a good match based on the user's query.
  - Keep your response concise and easy to read.
  - Do not include the product URLs in your response, the user can see them in the full results.`;
  
          const enhancedUserMessage = `User query: "${userMessage}"
  
  Here are the Amazon products that were found:
  
  ${productContext}`;
  
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: enhancedUserMessage,
              userId: user?.uid, // Add userId for Pinecone storage
              agentSystem: {
                systemPrompt: amazonSystemPrompt,
                selectedAgent: 'amazon-knowledge-base',
                agentName: 'Amazon Shopping Assistant',
                agentEmoji: '🛒',
                specialties: ['product search', 'shopping recommendations', 'price comparison'],
                confidence: {
                  'product search': 0.95,
                  'shopping recommendations': 0.90,
                  'price comparison': 0.85
                },
              },
              roomState: {}, // Not needed for this agent
              messages: [], // History not needed for this agent
            }),
          });
  
          const text = await response.text();
          setChatMessages([
            ...newMessages,
            { 
              role: 'assistant', 
              content: text, 
              agent: 'amazon-knowledge-base',
              amazonResults: results,
              showAllProducts: false // Initial state for the toggle
            },
          ]);
  
        } else {
          setChatMessages([
            ...newMessages,
            { 
              role: 'assistant', 
              content: "I couldn't find any products matching your search.", 
              agent: 'amazon-knowledge-base',
              amazonResults: null,
              showAllProducts: false
            },
          ]);
        }
      } catch (error) {
        console.error('Amazon search failed:', error);
        setChatMessages([
          ...newMessages,
          { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error while searching for products.',
            amazonResults: null,
            showAllProducts: false
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return; // Stop execution to prevent other agents from running
    }
  
    // SIMPLE 3-AGENT SYSTEM
    try {
      // Include pinboard context for regular chat as well
      let enhancedUserMessage = userMessage;
      if (selectedPinboards.length > 0) {
        const pinboardContext = selectedPinboards.map(p => `@pinboard[${p.name}]: ${p.context}`).join('\n\n');
        enhancedUserMessage = `${pinboardContext}\n\nUser question: ${userMessage}`;
      }

      // Analyze user intent to select the appropriate agent
      const intents = analyzeUserIntent(enhancedUserMessage);
      const primaryAgent = selectPrimaryAgent(intents, agentContext);
      
      // Prepare enhanced context for the specialized agent
      const agentResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedUserMessage,
          userId: user?.uid, // Add userId for Pinecone storage
          agentSystem: {
            systemPrompt: agentSystem[primaryAgent].systemPrompt,
            selectedAgent: primaryAgent,
            agentName: agentSystem[primaryAgent].name,
            agentEmoji: agentSystem[primaryAgent].emoji,
            specialties: agentSystem[primaryAgent].specialties,
            confidence: agentSystem[primaryAgent].confidence,
          },
          roomState: {
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
          },
          messages: newMessages.slice(0, -1).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            agent: msg.agent
          })),
        }),
      });
  
      const text = await agentResponse.text();
  
      // Define applyAction function inside handleChatSubmit
      const applyAction = (actionObj: any) => {
        const { action, target, value } = actionObj;
        const colorSetters: { [key: string]: (color: string) => void } = {
          floorColor: setFloorColorWithHistory,
          ceilingColor: setCeilingColorWithHistory,
          wallFrontColor: setWallFrontColorWithHistory,
          wallBackColor: setWallBackColorWithHistory,
          wallLeftColor: setWallLeftColorWithHistory,
          wallRightColor: setWallRightColorWithHistory,
        };
  
        if (action === 'set_room_dimensions') {
          const { width, length, height } = value;
          saveStateToHistory(`AI changed room dimensions to ${width}x${length}x${height}ft`);
          setWidth(width);
          setLength(length);
          setHeight(height);
          return `I've set the room dimensions to ${width}ft x ${length}ft x ${height}ft.`;
        }
  
        if (action === 'change_color') {
          if (colorSetters[target]) {
            colorSetters[target](value);
            const friendlyTarget = target.replace(/([A-Z])/g, ' $1').toLowerCase();
            return `Alright, I've changed the ${friendlyTarget} to a lovely ${value}.`;
          } else {
            let found = false;
            const foundObjects: string[] = [];
            setBlocksWithHistory(prevBlocks => prevBlocks.map(block => {
              if (block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase())) {
                found = true;
                foundObjects.push(block.name);
                return { ...block, color: value };
              }
              return block;
            }), `AI changed color of ${foundObjects.join(', ')} to ${value}`);
            return found ? `I've updated the color for object(s) matching "${target}" to ${value}.` : `I couldn't find any object named "${target}".`;
          }
        }
  
        if (action === 'move_object') {
          let found = false;
          const foundObjects: string[] = [];
          setBlocksWithHistory(prevBlocks => prevBlocks.map(block => {
            if (block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase())) {
              found = true;
              foundObjects.push(block.name);
              return { ...block, x: value.x, y: value.y, z: value.z };
            }
            return block;
          }), `AI moved ${foundObjects.join(', ')} to new position`);
          return found ? `I've moved the object(s) matching "${target}" to the new coordinates.` : `I couldn't find any object named "${target}" to move.`;
        }
  
        if (action === 'add_object') {
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
              rotation: 0,
              modelPath: libraryItem.modelPath,
              created: new Date(),
            };
            setBlocksWithHistory(prev => [...prev, newBlock], `AI added ${target} to room`);
            return `I've added a ${target} to the room.`;
          } else {
            return `I couldn't find a "${target}" in the library.`;
          }
        }
  
        if (action === 'remove_object') {
          let found = false;
          const removedObjects: string[] = [];
          setBlocksWithHistory(prevBlocks => prevBlocks.filter(block => {
            const match = block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase());
            if (match) {
              found = true;
              removedObjects.push(block.name);
            }
            return !match;
          }), `AI removed ${removedObjects.join(', ')} from room`);
          return found ? `I've removed the object(s) matching "${target}".` : `I couldn't find any object named "${target}" to remove.`;
        }
        return '';
      };
  
          // Try to parse the response as JSON to check for actions
    let actionExecuted = false;
    let responseMessage = text;

    try {
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        // Handle array of actions
        const results = [];
        for (const actionObj of data) {
          if (actionObj && actionObj.action) {
            const result = applyAction(actionObj);
            if (result) results.push(result);
          }
        }
        if (results.length > 0) {
          responseMessage = results.join(' ');
          actionExecuted = true;
        }
      } else if (data.action) {
        // Handle single action
        const result = applyAction(data);
        if (result) {
          responseMessage = result;
          actionExecuted = true;
        }
      }
    } catch (e) {
      // Not JSON, treat as regular text response
      responseMessage = text;
    }
  
      const assistantMessage = {
        role: 'assistant' as const,
        content: responseMessage,
        agent: primaryAgent,
        confidence: 0.8,
      };
      
      setChatMessages([
        ...newMessages,
        assistantMessage,
      ]);
      
      // TEST: Save assistant response to subcollection  
      await saveMessageToSubcollection(assistantMessage);
  
      // Update context from this interaction
      updateContextFromInteraction(userMessage, responseMessage, primaryAgent);
  
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
      // Clear selected pinboards after message is sent
      // if (selectedPinboards.length > 0) {
      //   setSelectedPinboards([]);
      // }
    }
  };

  // Add collapsed state and navigation
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'camera' | 'builder' | 'colors' | 'objects' | 'library' | 'dimensions'>('main');

  // Library items with predefined furniture and objects
  const libraryItems = [
    { name: "Single Bed", width: 3, height: 2, depth: 6.5, color: "#8B4513", category: "Bedroom", modelPath: "/models/single_bed.glb" },
    { name: "Double Bed", width: 4.5, height: 2, depth: 6.5, color: "#8B4513", category: "Bedroom", modelPath: "/models/double_bed.glb"},
    { name: "King Bed", width: 6, height: 2, depth: 6.5, color: "#8B4513", category: "Bedroom", modelPath: "/models/king_bed.glb"},
    { name: "Nightstand", width: 1.5, height: 2, depth: 1.5, color: "#654321", category: "Bedroom", modelPath: "/models/nightstand.glb"},
    { name: "Dresser", width: 5, height: 3, depth: 1.5, color: "#654321", category: "Bedroom", modelPath: "/models/dresser.glb"},
    { name: "Sofa", width: 3, height: 2.5, depth: 7, color: "#4A5568", category: "Living Room", modelPath: "/models/sofa.glb"},
    { name: "Coffee Table", width: 4, height: 1.5, depth: 2, color: "#8B4513", category: "Living Room", modelPath: "/models/coffee_table.glb"},
    { name: "TV Stand", width: 5, height: 2, depth: 1.5, color: "#2D3748", category: "Living Room", modelPath: "/models/tv_stand.glb"},
    { name: "Armchair", width: 3, height: 3, depth: 3, color: "#4A5568", category: "Living Room", modelPath: "/models/armchair.glb"},
    { name: "Dining Table", width: 6, height: 2.5, depth: 3, color: "#8B4513", category: "Dining Room", modelPath: "/models/dining_table.glb"},
    { name: "Dining Chair", width: 1.5, height: 3, depth: 1.5, color: "#654321", category: "Dining Room", modelPath: "/models/chair.glb"},
    { name: "Kitchen Island", width: 6, height: 3, depth: 2.5, color: "#FFFFFF", category: "Kitchen", modelPath: "/models/kitchen_island.glb" },
    { name: "Refrigerator", width: 2.5, height: 6, depth: 2.5, color: "#E2E8F0", category: "Kitchen", modelPath: "/models/refrigerator.glb" },
    { name: "Desk", width: 4, height: 2.5, depth: 2, color: "#8B4513", category: "Office", modelPath: "/models/desk.glb" },
    { name: "Office Chair", width: 2, height: 3.5, depth: 2, color: "#2D3748", category: "Office", modelPath: "/models/office_chair.glb" },
    { name: "Bookshelf", width: 3, height: 6, depth: 1, color: "#654321", category: "Office", modelPath: "/models/bookshelf.glb" },
    // { name: "Door", width: 3, height: 7, depth: 0.2, color: "#8B4513", category: "Architectural", modelPath: "/models/door.glb" },
    // { name: "Window", width: 4, height: 4, depth: 0.1, color: "#E2E8F0", category: "Architectural", modelPath: "/models/window.glb" }
  ];

  // Navigation functions
  const navigateToPage = (page: 'main' | 'camera' | 'builder' | 'colors' | 'objects' | 'library' | 'dimensions') => {
    setCurrentPage(page);
  };

  const goBack = () => {
    setCurrentPage('main');
  };

  // Add item from library to room
  const addLibraryItem = (item: typeof libraryItems[0]) => {
    const newBlock = {
      id: Date.now().toString(),
      name: item.name,
      x: 0,
      y: 0,
      z: 0,
      width: item.width,
      height: item.height,
      depth: item.depth,
      color: item.color,
      rotation: 0,
      created: new Date(),
      modelPath: item.modelPath,
    };
    setBlocksWithHistory(prev => [...prev, newBlock], `Added ${item.name} from library`);
  };

  const handleSaveAndExit = async () => {
    if (!roomId) {
      router.push('/layout');
      return;
    }

    // Only users with edit permission can save changes to Firebase
    if (userPermission === 'edit') {
      const sanitizedBlocks = blocks.map(block => {
        const { created, ...rest } = block;
        // Remove undefined values
        return Object.fromEntries(
          Object.entries(rest).filter(([_, value]) => value !== undefined)
        );
      });

      const roomData = {
        name: roomName,
        width,
        length,
        height,
        floorColor,
        ceilingColor,
        wallFrontColor,
        wallBackColor,
        wallLeftColor,
        wallRightColor,
        blocks: sanitizedBlocks,
        sharedWith: sharedWith,
        sharedWithEmails: sharedWith.map(user => user.email), // Keep for backward compatibility
        editorEmails: sharedWith.filter(user => user.permission === 'edit').map(user => user.email), // Separate array for editors
      };

      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, roomData);
      } catch (error) {
        console.error("Error saving room:", error);
        // Optionally, show an error message to the user
      }
    }
    
    router.push('/layout');
  };

  // Add state for sidebar tab
  const [sidebarTab, setSidebarTab] = useState<'menu' | 'ai'>('menu');

  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatMessagesRef.current) return;
    const el = chatMessagesRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
    if (atBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages]);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharedWith, setSharedWith] = useState<ShareUser[]>([]);
  const [linkSharing, setLinkSharing] = useState<LinkSharing>({
    enabled: false,
    permission: "view",
    link: typeof window !== 'undefined' ? window.location.href : ""
  });
  
  // Amazon Knowledge Base state
  const [amazonKnowledgeBaseEnabled, setAmazonKnowledgeBaseEnabled] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  const owner = { email: user?.email || "you@example.com", name: "You" };

  // Message Content Renderer
  const renderMessageContent = (content: string) => {
    // Split content into lines
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Handle numbered lists (1. 2. 3. etc.)
      const numberedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numberedListMatch) {
        const [, number, text] = numberedListMatch;
        return (
          <div key={index} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <span style={{ 
              fontWeight: 'bold', 
              color: '#4f46e5',
              minWidth: '20px'
            }}>
              {number}.
            </span>
            <span>{renderFormattedText(text)}</span>
          </div>
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•')) {
        return (
          <div key={index} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#4f46e5' }}>•</span>
            <span>{renderFormattedText(line.substring(1).trim())}</span>
          </div>
        );
      }
      
      // Handle bold text (remove ** and make it bold)
      if (line.includes('**')) {
        return (
          <div key={index} style={{ marginBottom: '8px' }}>
            {renderFormattedText(line)}
          </div>
        );
      }
      
      // Regular text
      return (
        <div key={index} style={{ marginBottom: '8px' }}>
          {renderFormattedText(line)}
        </div>
      );
    });
  };

  // Function to highlight @search keyword with special styling
  const highlightSearchKeyword = (text: string) => {
    if (!text.includes('@search')) return text;
    
    const parts = text.split(/(@search\w*)/g);
    return (
      <span>
        {parts.map((part, index) => {
          if (part.startsWith('@search')) {
            return (
              <span key={index} style={{
                backgroundColor: '#facc14',
                color: '#18181b',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '0.9em',
                fontFamily: 'Menlo, Monaco, monospace',
                border: '1px solid #eab308',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                display: 'inline-block',
                margin: '0 2px',
                textTransform: 'none',
                letterSpacing: '0.5px'
              }}>
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  // Helper function to render formatted text with links
  const renderFormattedText = (text: string) => {
    // Handle URLs - make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        );
      }
      
      // Handle bold text (remove ** and make it bold)
      if (part.includes('**')) {
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((boldPart, boldIndex) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            return (
              <strong key={boldIndex} style={{ fontWeight: '600' }}>
                {boldPart.slice(2, -2)}
              </strong>
            );
          }
          return boldPart;
        });
      }
      
      // Handle @search keywords
      if (part.includes('@search')) {
        return highlightSearchKeyword(part);
      }
      
      return <span key={index}>{part}</span>;
    });
    
  };

  // Amazon Product Search Function
  const searchAmazonProducts = async (query: string) => {
    if (!amazonKnowledgeBaseEnabled) return null;
    
    setIsSearchingProducts(true);
    try {
      // For now, we'll use a simple approach - you'll need to add your Rainforest API key
      const response = await fetch('/api/amazon-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Failed to search Amazon products');
        return null;
      }
    } catch (error) {
      console.error('Error searching Amazon products:', error);
      return null;
    } finally {
      setIsSearchingProducts(false);
    }
  };

  // Function to save room state to localStorage
  const saveRoomStateToStorage = useCallback(() => {
    const roomState = {
      id: roomId,
      name: roomName,
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
      chatMessages,
      sharedWith
    };
    
    try {
      // Save current state
      localStorage.setItem('roomState', JSON.stringify(roomState));
      // Save backup
      localStorage.setItem('roomStateBackup', JSON.stringify(roomState));
    } catch (error) {
      console.error('Error saving room state to localStorage:', error);
    }
  }, [roomId, roomName, width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, blocks, chatMessages, sharedWith]);

  // Update owner status when user loads
  useEffect(() => {
    if (user && roomId) {
      const roomStateJSON = localStorage.getItem('roomState');
      if (roomStateJSON) {
        try {
          const roomState = JSON.parse(roomStateJSON);
          const isOwner = roomState.userId === user.uid || !roomState.userId;
          setIsOwner(isOwner);
          setUserPermission(isOwner ? 'edit' : (roomState.permission || 'view'));
        } catch (error) {
          console.error('Error updating owner status:', error);
        }
      }
    }
  }, [user, roomId]);

  // Refresh shared users when share modal opens
  useEffect(() => {
    if (shareModalOpen && roomId) {
      loadSharedUsers(roomId);
    }
  }, [shareModalOpen, roomId]);

  // Auto-save room state whenever important state changes
  useEffect(() => {
    if (isLoaded) { // Only save after initial load
      saveRoomStateToStorage();
    }
  }, [width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, blocks, chatMessages, sharedWith, saveRoomStateToStorage, isLoaded]);

  // Periodic save every 30 seconds as additional safety
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      saveRoomStateToStorage();
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [isLoaded, saveRoomStateToStorage]);

  if (!isLoaded) {
    return <div>Loading...</div>; // Or a spinner
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fdfdfb',
      color: '#222',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top left controls: Back, Room Name (editable), Share */}
      <div style={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Back Button */}
        <button
          onClick={handleSaveAndExit}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          title="Back to Layout"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        {/* Room Name (editable) */}
        {isEditingName ? (
          <form onSubmit={async e => {
            e.preventDefault();
            if (!roomId) return setIsEditingName(false);
            try {
              const roomRef = doc(db, 'rooms', roomId);
              await updateDoc(roomRef, { name: roomName });
            } catch (err) { console.error(err); }
            setIsEditingName(false);
          }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              autoFocus
              style={{
                fontSize: 18,
                fontWeight: 600,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '6px 12px',
                outline: 'none',
                minWidth: 120,
                background: '#fff',
                color: '#222',
              }}
              onBlur={e => setIsEditingName(false)}
            />
            <button type="submit" style={{ background: '#222', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#222', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomName}</span>
            {isOwner && (
              <button onClick={() => setIsEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, borderRadius: 6 }} title="Edit Room Name">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              </button>
            )}
          </div>
        )}
        {/* Permission Indicator */}
        {!isOwner && (
          <div style={{
            background: '#e5e7eb',
            color: '#6b7280',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            marginLeft: 8
          }}>
            {userPermission === 'edit' ? 'Editor' : 'Viewer'}
          </div>
        )}
        
        {/* Share Button - Only for owners */}
        {isOwner && (
          <button
            onClick={() => setShareModalOpen(true)}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              marginLeft: 4,
              transition: 'background 0.2s',
            }}
            title="Share Room"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51l-6.82 3.98"/></svg>
          </button>
        )}
      </div>

      {/* 3D Canvas (centered in area left of sidebar) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'calc(100vw - 380px)', // leave space for sidebar
        height: '100vh',
        zIndex: 1,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {view === 'inside' ? (
          <div style={{ width: '100%', height: '100%' }}>
            <button onClick={handleExitInside} style={{ position: 'absolute', bottom: 32, right: 32, zIndex: 10001, background: '#222', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Exit</button>
            <Canvas
              camera={{ position: insidePos, fov: 75 }}
              style={{
                width: '100%',
                height: '100vh',
                background: '#fff',
              }}
              onCreated={() => setInsideActive(true)}
              shadows
            >
              {/* Enhanced Lighting Setup for Inside View */}
              <ambientLight intensity={1.2} color="#ffffff" />
              <directionalLight 
                position={[10, 20, 10]} 
                intensity={1.2} 
                color="#ffffff"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
              />
              <directionalLight 
                position={[-5, 15, -5]} 
                intensity={0.5} 
                color="#e6f3ff"
              />
              <pointLight 
                position={[0, height * scale + 2, 0]} 
                intensity={0.3} 
                color="#fff8e1"
                distance={50}
                decay={2}
              />
              {/* Environmental lighting for depth */}
              <hemisphereLight
                args={["#87CEEB", "#8B7355", 0.2]}
              />
              <RoomBox
                width={width}
                length={length}
                height={height}
                floorColor={floorColor}
                ceilingColor={ceilingColor}
                wallFrontColor={wallFrontColor}
                wallBackColor={wallBackColor}
                wallLeftColor={wallRightColor}
                wallRightColor={wallLeftColor}
                blocks={blocks}
                previewBlock={previewMode ? blockConfig : null}
                onBlockClick={(blockId) => {
                  setSelectedBlockId(blockId);
                  setCurrentPage('objects');
                  if (sidebarTab === 'ai'){
                    setSidebarTab('menu');
                  }
                  scrollToSelectedObject(blockId);
                }}
              />
              {meshyModelUrl && (
                <Suspense fallback={null}>
                  <GLBModel url={meshyModelUrl} />
                </Suspense>
              )}
              <RulerRenderer rulers={rulers} preview={rulerPreview} scale={scale} />
              <PointerLockControls ref={pointerLockRef} />
              <InsideControls insideActive={insideActive} insidePos={insidePos} setInsidePos={setInsidePos} roomDims={roomDims} insideKeys={insideKeys} />
              {/* Move camera in render loop */}
              <CameraUpdater position={insidePos} />
            </Canvas>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            <Canvas
              camera={{
                position: cameraPositions[view as 'outside' | 'orbit' | 'topdown' | 'bottomup'],
                fov: 50,
                up: view === 'bottomup' ? [0, -1, 0] : [0, 1, 0],
              }}
              style={{
                width: '100%',
                height: '100vh',
                background: '#fff',
              }}
              shadows
              gl={{ logarithmicDepthBuffer: true }}
            >
              {/* Enhanced Lighting Setup for Outside View */}
              <ambientLight intensity={1.2} color="#ffffff" />
              <directionalLight 
                position={[10, 20, 10]} 
                intensity={1.2} 
                color="#ffffff"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
              />
              <directionalLight 
                position={[-5, 15, -5]} 
                intensity={0.5} 
                color="#e6f3ff"
              />
              <pointLight 
                position={[0, height * scale + 2, 0]} 
                intensity={0.3} 
                color="#fff8e1"
                distance={50}
                decay={2}
              />
              {/* Environmental lighting for depth */}
              <hemisphereLight
                args={["#87CEEB", "#8B7355", 0.2]}
              />
              <RoomBox
                width={width}
                length={length}
                height={height}
                floorColor={floorColor}
                ceilingColor={ceilingColor}
                wallFrontColor={wallFrontColor}
                wallBackColor={wallBackColor}
                wallLeftColor={wallLeftColor}
                wallRightColor={wallRightColor}
                blocks={blocks}
                previewBlock={previewMode ? blockConfig : null}
                onBlockClick={(blockId) => {
                  setSelectedBlockId(blockId);
                  setCurrentPage('objects');
                  
                  if (sidebarTab === 'ai'){
                    setSidebarTab('menu');
                  }
                  scrollToSelectedObject(blockId);
                }}
              />
              {meshyModelUrl && (
                <Suspense fallback={null}>
                  <GLBModel url={meshyModelUrl} />
                </Suspense>
              )}
              <RulerRenderer rulers={rulers} preview={rulerPreview} scale={scale} />
              <SceneEvents
                rulerMode={rulerMode}
                rulerStartPoint={rulerStartPoint}
                setRulerStartPoint={setRulerStartPoint}
                setRulers={setRulers}
                setRulerPreview={setRulerPreview}
              />
              <OrbitControls
                enablePan={false}
                target={
                  view === 'bottomup'
                    ? [0, height * scale, 0] // center of ceiling
                    : [0, height * scale / 2, 0] // center of room
                }
                maxPolarAngle={view === 'topdown' ? 0 : view === 'bottomup' ? Math.PI : Math.PI}
                minPolarAngle={view === 'topdown' ? 0 : view === 'bottomup' ? Math.PI : 0}
              />
            </Canvas>
          </div>
        )}
      </div>

      {/* Right Sidebar with Tabs */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          height: '100vh',
          background: '#fff',
          borderLeft: '1px solid #e5e7eb',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.04)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: '#fafafa',
        }}>
          <button
            onClick={() => setSidebarTab('menu')}
            style={{
              flex: 1,
              padding: '16px 0',
              fontWeight: 600,
              fontSize: 16,
              background: sidebarTab === 'menu' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: sidebarTab === 'menu' ? '2px solid #facc15' : '2px solid transparent',
              color: sidebarTab === 'menu' ? '#222' : '#9ca3af',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Menu
          </button>
          <button
            onClick={() => {
              setSidebarTab('ai');
              // Immediate jump to bottom without reflow delay
              requestAnimationFrame(() => {
                if (chatMessagesRef.current) {
                  chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
                } else {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                }
              });
            }}
            style={{
              flex: 1,
              padding: '16px 0',
              fontWeight: 600,
              fontSize: 16,
              background: sidebarTab === 'ai' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: sidebarTab === 'ai' ? '2px solid #facc15' : '2px solid transparent',
              color: sidebarTab === 'ai' ? '#222' : '#9ca3af',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            AI
          </button>
        </div>
        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {sidebarTab === 'menu' ? (
            // Main menu content (camera views, builder tools, color palette, library, dimensions, etc)
            <>
                
                          {/* Header */}
              <div style={{
                padding: 0,
                display: "none"
              }}>
              </div>

                          {/* Navigation Content */}
              <div style={{
                flex: 1,
                padding: sidebarCollapsed ? "16px 8px" : "20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflowY: "auto",
                overflowX: "hidden"
              }}>
                {sidebarCollapsed ? (
                  <>
                    {/* Collapsed Menu - Always show icons */}
                    {/* Camera Views */}
                    <button
                      onClick={() => navigateToPage('camera')}
                      title="Camera Views"
                      style={{
                        width: "100%",
                        padding: "12px 8px",
                        background: currentPage === 'camera' ? "#f9fafb" : "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: currentPage === 'camera' ? "#3b82f6" : "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        if (currentPage !== 'camera') {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={e => {
                        if (currentPage !== 'camera') {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </button>

                    {/* Builder Tools */}
                    <button
                      onClick={() => navigateToPage('builder')}
                      title="Builder Tools"
                      style={{
                        width: "100%",
                        padding: "12px 8px",
                        background: currentPage === 'builder' ? "#f9fafb" : "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: currentPage === 'builder' ? "#3b82f6" : "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        if (currentPage !== 'builder') {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={e => {
                        if (currentPage !== 'builder') {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                      </svg>
                    </button>

                    {/* Color Palette */}
                    <button
                      onClick={() => navigateToPage('colors')}
                      title="Color Palette"
                      style={{
                        width: "100%",
                        padding: "12px 8px",
                        background: currentPage === 'colors' ? "#f9fafb" : "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: currentPage === 'colors' ? "#3b82f6" : "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        if (currentPage !== 'colors') {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={e => {
                        if (currentPage !== 'colors') {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="13.5" cy="6.5" r=".5"></circle>
                        <circle cx="17.5" cy="10.5" r=".5"></circle>
                        <circle cx="8.5" cy="7.5" r=".5"></circle>
                        <circle cx="6.5" cy="12.5" r=".5"></circle>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                      </svg>
                    </button>
                  </>
                ) : currentPage === 'main' ? (
                  <>
                    {/* Expanded Main Menu */}
                    {/* Camera Views */}
                    <button
                      onClick={() => navigateToPage('camera')}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        <span>Camera Views</span>
                      </div>
                    </button>

                    {/* 3D Model Status */}
                    {meshyModelUrl && (
                      <div
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: "#f0f9ff",
                          border: "1px solid #0ea5e9",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#0369a1"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                          </svg>
                          <span>3D Model Loaded</span>
                        </div>
                      </div>
                    )}

                    {/* Builder Tools */}
                    <button
                      onClick={() => navigateToPage('builder')}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                        </svg>
                        <span>Builder Tools</span>
                      </div>
                    </button>

                    {/* Color Palette */}
                    <button
                      onClick={() => navigateToPage('colors')}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="13.5" cy="6.5" r=".5"></circle>
                          <circle cx="17.5" cy="10.5" r=".5"></circle>
                          <circle cx="8.5" cy="7.5" r=".5"></circle>
                          <circle cx="6.5" cy="12.5" r=".5"></circle>
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                        </svg>
                        <span>Color Palette</span>
                      </div>
                    </button>

                    {/* Objects - Only show when objects exist */}
                    {blocks.length > 0 && (
                      <button
                        onClick={() => navigateToPage('objects')}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: "transparent",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#374151",
                          borderRadius: 6,
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                          </svg>
                          <span>Objects ({blocks.length})</span>
                        </div>
                      </button>
                    )}

                    {/* Library */}
                    <button
                      onClick={() => navigateToPage('library')}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        <span>Library</span>
                      </div>
                    </button>

                    {/* Dimensions */}
                    <button
                      onClick={() => navigateToPage('dimensions')}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#374151",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span>Dimensions</span>
                      </div>
                    </button>

                    {/* Undo/Redo Controls */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8, 
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #e5e7eb"
                    }}>
                      <button
                        onClick={undo}
                        disabled={undoStack.length === 0}
                        title={undoStack.length > 0 ? `Undo: ${undoStack[undoStack.length - 1]?.action}` : "Nothing to undo"}
                        style={{
                          flex: 1,
                          background: undoStack.length > 0 ? "#f3f4f6" : "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          padding: "8px 12px",
                          cursor: undoStack.length > 0 ? "pointer" : "not-allowed",
                          color: undoStack.length > 0 ? "#374151" : "#9ca3af",
                          fontSize: 13,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6
                        }}
                        onMouseEnter={e => {
                          if (undoStack.length > 0) {
                            e.currentTarget.style.background = "#e5e7eb";
                          }
                        }}
                        onMouseLeave={e => {
                          if (undoStack.length > 0) {
                            e.currentTarget.style.background = "#f3f4f6";
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 4v6h6"></path>
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                        <span>⌘Z</span>
                      </button>
                      
                      <button
                        onClick={redo}
                        disabled={redoStack.length === 0}
                        title={redoStack.length > 0 ? `Redo: ${redoStack[redoStack.length - 1]?.action}` : "Nothing to redo"}
                        style={{
                          flex: 1,
                          background: redoStack.length > 0 ? "#f3f4f6" : "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          padding: "8px 12px",
                          cursor: redoStack.length > 0 ? "pointer" : "not-allowed",
                          color: redoStack.length > 0 ? "#374151" : "#9ca3af",
                          fontSize: 13,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6
                        }}
                        onMouseEnter={e => {
                          if (redoStack.length > 0) {
                            e.currentTarget.style.background = "#e5e7eb";
                          }
                        }}
                        onMouseLeave={e => {
                          if (redoStack.length > 0) {
                            e.currentTarget.style.background = "#f3f4f6";
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 4v6h-6"></path>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        <span>⌘Y</span>
                      </button>
                    </div>

                    {/* Last Action Indicator */}
                    {lastAction && (
                      <div style={{
                        fontSize: 11,
                        color: "#6b7280",
                        textAlign: "center",
                        marginTop: 8,
                        padding: "4px 8px",
                        background: "#f9fafb",
                        borderRadius: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {lastAction}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Expanded Sub-page */}
                    {/* Back Button */}
                    <button
                      onClick={goBack}
                      style={{
                        padding: "4px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        cursor: "pointer",
                        color: "#374151",
                        marginBottom: 8,
                        width: "auto",
                        alignSelf: "flex-start"
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m12 19-7-7 7-7"></path>
                        <path d="M19 12H5"></path>
                      </svg>
                    </button>

                    {/* Page Content */}
                    {currentPage === 'camera' && (
                      <div>
                        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>Camera Views</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: 8 }}>
                          {VIEWS.map(v => (
                            <button
                              key={v.key}
                              onClick={() => setView(v.key as 'outside' | 'orbit' | 'inside' | 'topdown' | 'bottomup')}
                              style={{
                                background: view === v.key ? "#3b82f6" : "#f9fafb",
                                color: view === v.key ? "#ffffff" : "#6b7280",
                                border: "1px solid " + (view === v.key ? "#3b82f6" : "#e5e7eb"),
                                borderRadius: 8,
                                padding: "12px 8px",
                                fontSize: 12,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                                fontWeight: 500
                              }}
                            >
                              <div style={{ fontSize: 14 }}>
                                {v.key === 'outside' && '⌂'}
                                {v.key === 'orbit' && '◉'}
                                {v.key === 'topdown' && '↓'}
                                {v.key === 'bottomup' && '↑'}
                                {v.key === 'inside' && '👁'}
                              </div>
                              <span style={{ fontSize: 10 }}>{v.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentPage === 'builder' && (
                      <div>
                        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>Builder Tools</h3>
                        
                        <div style={{ marginBottom: 16 }}>
                          <button
                            onClick={() => userPermission === 'edit' && setRulerMode(!rulerMode)}
                            disabled={userPermission !== 'edit'}
                                                          style={{
                                width: "100%",
                                background: userPermission === 'edit' ? (rulerMode ? "#10b981" : "#f9fafb") : "#f3f4f6",
                                color: userPermission === 'edit' ? (rulerMode ? "#ffffff" : "#6b7280") : "#9ca3af",
                                border: "1px solid " + (userPermission === 'edit' ? (rulerMode ? "#10b981" : "#e5e7eb") : "#e5e7eb"),
                                borderRadius: 8,
                                padding: "12px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                opacity: userPermission === 'edit' ? 1 : 0.5
                              }}
                          >
                            Ruler Mode {rulerMode ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {rulerMode && (
                          <div style={{ marginBottom: 16 }}>
                            <button
                              onClick={() => userPermission === 'edit' && setRulers([])}
                              disabled={userPermission !== 'edit'}
                                                              style={{
                                  width: "100%",
                                  background: userPermission === 'edit' ? "#fef2f2" : "#f3f4f6",
                                  color: userPermission === 'edit' ? "#dc2626" : "#9ca3af",
                                  border: "1px solid #fecaca",
                                  borderRadius: 8,
                                  padding: "12px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                  transition: "all 0.2s ease",
                                  opacity: userPermission === 'edit' ? 1 : 0.5
                                }}
                            >
                              Clear Rulers
                            </button>
                          </div>
                        )}

                        {/* Builder Mode Toggle */}
                        <div style={{ marginBottom: 16 }}>
                          <button
                            onClick={() => userPermission === 'edit' && setBuilderMode(!builderMode)}
                            disabled={userPermission !== 'edit'}
                                                          style={{
                                width: "100%",
                                background: userPermission === 'edit' ? (builderMode ? "#10b981" : "#f9fafb") : "#f3f4f6",
                                color: userPermission === 'edit' ? (builderMode ? "#ffffff" : "#6b7280") : "#9ca3af",
                                border: "1px solid " + (userPermission === 'edit' ? (builderMode ? "#10b981" : "#e5e7eb") : "#e5e7eb"),
                                borderRadius: 8,
                                padding: "12px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                opacity: userPermission === 'edit' ? 1 : 0.5
                              }}
                          >
                            Builder Mode {builderMode ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* Builder Controls */}
                        {builderMode && (
                          <div style={{
                            background: "#f9fafb",
                            borderRadius: 12,
                            padding: "16px",
                            border: "1px solid #e5e7eb"
                          }}>
                            <h4 style={{
                              margin: "0 0 16px",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#374151"
                            }}>Add Objects</h4>
                            
                            {/* Block Size */}
                            <div style={{ marginBottom: 16 }}>
                              <label style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#6b7280",
                                marginBottom: 8
                              }}>Dimensions</label>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                {(["width", "height", "depth"] as const).map(dim => (
                                  <div key={dim}>
                                    <label style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{dim}</label>
                                    <input
                                      type="number"
                                      value={blockConfig[dim]}
                                      min={0.1}
                                      step={0.1}
                                      onChange={e => userPermission === 'edit' && setBlockConfig(prev => ({...prev, [dim]: Number(e.target.value)}))}
                                      onClick={(e) => e.stopPropagation()}
                                      onWheel={(e) => e.stopPropagation()}
                                      disabled={userPermission !== 'edit'}
                                                                              style={{
                                          width: "100%",
                                          fontSize: 13,
                                          padding: "8px 10px",
                                          borderRadius: 6,
                                          border: "1px solid #d1d5db",
                                          background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                          outline: "none",
                                          transition: "all 0.2s ease",
                                          color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                          cursor: userPermission === 'edit' ? "text" : "not-allowed"
                                        }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Position */}
                            <div style={{ marginBottom: 16 }}>
                              <label style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#6b7280",
                                marginBottom: 8
                              }}>Position</label>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                              
                                  {(["x", "y", "z"] as const).map(pos => (
                                    <div key={pos}>
                                      <label style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 2, textTransform: "uppercase" }}>{pos}</label>
                                      <input
                                        type="number"
                                        value={blockConfig[pos]}
                                        min={0}
                                        step={0.1}
                                        onChange={e => {
                                          userPermission === 'edit' && setBlockConfig(prev => ({...prev, [pos]: Number(e.target.value)}));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onWheel={(e) => e.stopPropagation()}
                                        disabled={userPermission !== 'edit'}
                                        style={{
                                          width: "100%",
                                          fontSize: 11,
                                          padding: "6px 8px",
                                          borderRadius: 4,
                                          border: "1px solid #d1d5db",
                                          background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                          color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                          cursor: userPermission === 'edit' ? "text" : "not-allowed"
                                        }}
                                      />
                                    </div>
                                  ))}
                              
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <button
                                onClick={() => userPermission === 'edit' && setPreviewMode(!previewMode)}
                                disabled={userPermission !== 'edit'}
                                                                  style={{
                                    background: userPermission === 'edit' ? (previewMode ? "#f59e0b" : "#ffffff") : "#f3f4f6",
                                    color: userPermission === 'edit' ? (previewMode ? "#ffffff" : "#6b7280") : "#9ca3af",
                                    border: "1px solid " + (userPermission === 'edit' ? (previewMode ? "#f59e0b" : "#d1d5db") : "#e5e7eb"),
                                    borderRadius: 6,
                                    padding: "10px 12px",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                    transition: "all 0.2s ease",
                                    opacity: userPermission === 'edit' ? 1 : 0.5
                                  }}
                              >
                                Show Preview
                              </button>
                              
                              <button
                                                              onClick={() => {
                                if (userPermission === 'edit') {
                                  const newBlock = {
                                    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    name: `Block ${blocks.length + 1}`,
                                    ...blockConfig,
                                    color: '#e3e3e3',
                                    rotation: 0,
                                    created: new Date()
                                  };
                                  setBlocksWithHistory(prev => [...prev, newBlock], `Added ${newBlock.name}`);
                                  setPreviewMode(false);
                                }
                              }}
                                disabled={userPermission !== 'edit'}
                                style={{
                                  background: userPermission === 'edit' ? "#3b82f6" : "#f3f4f6",
                                  color: userPermission === 'edit' ? "#ffffff" : "#9ca3af",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "12px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                  transition: "all 0.2s ease",
                                  opacity: userPermission === 'edit' ? 1 : 0.5
                                }}
                              >
                                + Add Block
                              </button>
                              
                              <div style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                textAlign: "center",
                                marginTop: 4
                              }}>
                                Objects: {blocks.length}
                              </div>
                            </div>
                          </div>
                        )}


                      </div>
                    )}

                    {currentPage === 'colors' && (
                      <div>
                        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>Color Palette</h3>
                        <div style={{
                          background: "#f9fafb",
                          borderRadius: 12,
                          padding: "16px",
                          border: "1px solid #e5e7eb"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                              { label: "Floor", value: floorColor, setter: setFloorColorWithHistory },
                              { label: "Ceiling", value: ceilingColor, setter: setCeilingColorWithHistory },
                              { label: "Wall (Front)", value: wallFrontColor, setter: setWallFrontColorWithHistory },
                              { label: "Wall (Back)", value: wallBackColor, setter: setWallBackColorWithHistory },
                              { label: "Wall (Left)", value: wallLeftColor, setter: setWallLeftColorWithHistory },
                              { label: "Wall (Right)", value: wallRightColor, setter: setWallRightColorWithHistory }
                            ].map(color => (
                              <div key={color.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <input 
                                  type="color" 
                                  value={color.value} 
                                  onChange={e => color.setter(e.target.value)} 
                                  disabled={userPermission !== 'edit'}
                                  style={{ 
                                    width: 32, 
                                    height: 32, 
                                    border: "1px solid #d1d5db", 
                                    borderRadius: 6, 
                                    cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                    background: "none",
                                    opacity: userPermission === 'edit' ? 1 : 0.5
                                  }} 
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{color.label}</div>
                                  <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{color.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>


                      </div>
                    )}

{currentPage === 'objects' && (
                                             <div>
                         <div style={{ 
                           display: "flex", 
                           alignItems: "center", 
                           justifyContent: "space-between", 
                           marginBottom: 16 
                         }}>
                           <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#111827" }}>Objects</h3>
                           <button
                             onClick={() => setBlocksWithHistory([], 'Cleared all objects')}
                             disabled={userPermission !== 'edit'}
                             style={{
                               background: userPermission === 'edit' ? "#fef2f2" : "#f3f4f6",
                               color: userPermission === 'edit' ? "#dc2626" : "#9ca3af",
                               border: "1px solid #fecaca",
                               borderRadius: 6,
                               padding: "4px 8px",
                               fontSize: 11,
                               fontWeight: 500,
                               cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                               opacity: userPermission === 'edit' ? 1 : 0.5
                             }}
                           >
                             Clear All
                           </button>
                                                  </div>
                         
                         {/* Horizontal Object Type Buttons */}
                         {blocks.length > 0 && (
                                                     <div 
                            ref={horizontalScrollRef}
                            style={{
                              display: "flex",
                              gap: 12,
                              marginBottom: 16,
                              overflowX: "auto",
                              paddingBottom: 8,
                              scrollbarWidth: "none", // Firefox
                              msOverflowStyle: "none", // IE/Edge
                            }}>
                             <style jsx>{`
                               div::-webkit-scrollbar {
                                 display: none;
                               }
                             `}</style>
                             {(() => {
                               const nameToIndex: Record<string, number> = {};
                               return blocks.map((block) => {
                                 const idx = (nameToIndex[block.name] || 0) + 1;
                                 nameToIndex[block.name] = idx;
                                 const label = idx > 1 ? `${block.name} ${idx}` : block.name;
                                 const isSelected = selectedBlockId === block.id;
                                 return (
                                   <button
                                     key={block.id}
                                     onClick={() => {
                                       if (userPermission === 'edit') {
                                         setSelectedBlockId(block.id);
                                       }
                                     }}
                                     style={{
                                       display: "flex",
                                       alignItems: "center",
                                       gap: 8,
                                       padding: "10px 12px",
                                       background: isSelected ? "#111827" : "#f8f9fa",
                                       border: `1px solid ${isSelected ? "#111827" : "#e5e7eb"}`,
                                       borderRadius: 6,
                                       cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                       fontSize: 14,
                                       fontWeight: 500,
                                       color: isSelected ? "#ffffff" : "#374151",
                                       transition: "all 0.2s ease",
                                       whiteSpace: "nowrap",
                                       minWidth: "fit-content",
                                       opacity: userPermission === 'edit' ? 1 : 0.5
                                     }}
                                     onMouseEnter={e => {
                                       if (userPermission === 'edit' && !isSelected) {
                                         (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
                                         (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
                                       }
                                     }}
                                     onMouseLeave={e => {
                                       if (userPermission === 'edit' && !isSelected) {
                                         (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fa";
                                         (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                                       }
                                     }}
                                   >
                                     {block.name === 'Sofa' ? <Sofa size={18} /> : 
                                      block.name === 'Door' ? <DoorOpen size={18} /> : 
                                      block.name === 'Window' ? <RectangleHorizontal size={18} /> :
                                      block.name.includes('Bed') ? <Bed size={18} /> :
                                      block.name === 'Armchair' ? <Armchair size={18} /> :
                                      block.name === 'Nightstand' ? <Archive size={18} /> :
                                      block.name === 'Dresser' ? <Archive size={18} /> :
                                      block.name.includes('Table') ? <Utensils size={18} /> :
                                      block.name.includes('Kitchen') ? <ChefHat size={18} /> :
                                      block.name === 'Desk' ? <Laptop size={18} /> :
                                      block.name === 'Bookshelf' ? <BookOpen size={18} /> :
                                      <Package size={18} />}
                                     {label}
                                   </button>
                                 );
                               });
                             })()}
                           </div>
                                                  )}

                         {/* Inspector Card for Selected Object */}
                         {selectedBlockId && blocks.find(b => b.id === selectedBlockId) && (
                           <div style={{
                             background: "#ffffff",
                             border: "1px solid #e5e7eb",
                             borderRadius: 12,
                             padding: "20px",
                             marginTop: 16
                           }}>
                             {(() => {
                               const selectedBlock = blocks.find(b => b.id === selectedBlockId);
                               if (!selectedBlock) return null;
                               
                               return (
                                 <div>
                                   {/* Object Header */}
                                   <div style={{
                                     display: "flex",
                                     alignItems: "center",
                                     justifyContent: "space-between",
                                     marginBottom: 20
                                   }}>
                                     <div style={{
                                       display: "flex",
                                       alignItems: "center",
                                       gap: 12
                                     }}>
                                       {/* Object Icon */}
                                       <div style={{
                                         width: 48,
                                         height: 48,
                                         background: selectedBlock.modelPath ? "#f3f4f6" : selectedBlock.color,
                                         borderRadius: 12,
                                         border: "1px solid #e5e7eb",
                                         display: "flex",
                                         alignItems: "center",
                                         justifyContent: "center",
                                         overflow: "hidden"
                                       }}>
                                         <div style={{
                                           width: "100%",
                                           height: "100%",
                                           background: `linear-gradient(135deg, ${selectedBlock.color}cc, ${selectedBlock.color})`,
                                           display: "flex",
                                           alignItems: "center",
                                           justifyContent: "center",
                                           fontSize: 18,
                                           position: "relative"
                                         }}>
                                           {selectedBlock.name === 'Sofa' ? '🛋️' : 
                                            selectedBlock.name.includes('Bed') ? '🛏️' :
                                            selectedBlock.name === 'Armchair' ? '🪑' :
                                            selectedBlock.name === 'Dresser' ? '🗄️' :
                                            selectedBlock.name.includes('Table') ? '🪑' :
                                            selectedBlock.name.includes('Chair') ? '🪑' :
                                            selectedBlock.name.includes('Kitchen') ? '🏠' :
                                            selectedBlock.name === 'Refrigerator' ? '❄️' :
                                            selectedBlock.name === 'Desk' ? '🖥️' :
                                            selectedBlock.name === 'Bookshelf' ? '📚' :
                                            selectedBlock.name === 'Door' ? '🚪' :
                                            selectedBlock.name === 'Window' ? '🪟' :
                                            '📦'}
                                           {selectedBlock.modelPath && (
                                             <div style={{
                                               position: 'absolute',
                                               top: 4,
                                               right: 4,
                                               background: 'rgba(34, 197, 94, 0.9)',
                                               color: 'white',
                                               borderRadius: '50%',
                                               width: 12,
                                               height: 12,
                                               display: 'flex',
                                               alignItems: 'center',
                                               justifyContent: 'center',
                                               fontSize: 6,
                                               fontWeight: 'bold'
                                             }}>
                                               3D
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                       
                                       <h3 style={{
                                         fontSize: 18,
                                         fontWeight: 600,
                                         color: "#111827",
                                         margin: 0
                                       }}>
                                         {selectedBlock.name}
                                       </h3>
                                     </div>
                                     
                                     {/* Delete Button */}
                                     <button
                                       onClick={() => {
                                         if (userPermission === 'edit') {
                                           setBlocksWithHistory(prev => prev.filter(b => b.id !== selectedBlock.id), `Deleted ${selectedBlock.name}`);
                                           setSelectedBlockId(null);
                                         }
                                       }}
                                       disabled={userPermission !== 'edit'}
                                       style={{
                                         width: 32,
                                         height: 32,
                                         background: "transparent",
                                         border: "none",
                                         borderRadius: 8,
                                         cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                         display: "flex",
                                         alignItems: "center",
                                         justifyContent: "center",
                                         fontSize: 18,
                                         color: userPermission === 'edit' ? "#6b7280" : "#d1d5db",
                                         opacity: userPermission === 'edit' ? 1 : 0.5,
                                         transition: "all 0.2s ease"
                                       }}
                                       onMouseEnter={e => {
                                         if (userPermission === 'edit') {
                                           e.currentTarget.style.background = "#fee2e2";
                                           e.currentTarget.style.color = "#dc2626";
                                         }
                                       }}
                                       onMouseLeave={e => {
                                         if (userPermission === 'edit') {
                                           e.currentTarget.style.background = "transparent";
                                           e.currentTarget.style.color = "#6b7280";
                                         }
                                       }}
                                     >
                                       ×
                                     </button>
                                   </div>

                                   {/* Inspector Form */}
                                   <div style={{
                                     display: "flex",
                                     flexDirection: "column",
                                     gap: 20
                                   }}>
                                     {/* Name Field */}
                                     <div>
                                       <label style={{
                                         display: "block",
                                         fontSize: 14,
                                         fontWeight: 500,
                                         color: "#374151",
                                         marginBottom: 8
                                       }}>
                                         Name
                                       </label>
                                       <input
                                         type="text"
                                         value={selectedBlock.name}
                                         onChange={(e) => {
                                           if (userPermission === 'edit') {
                                             const newName = e.target.value;
                                             setBlocksWithHistory(prev => prev.map(b => 
                                               b.id === selectedBlock.id ? { ...b, name: newName } : b
                                             ), `Renamed ${selectedBlock.name} to ${newName}`);
                                           }
                                         }}
                                         disabled={userPermission !== 'edit'}
                                         style={{
                                           width: "100%",
                                           padding: "12px 16px",
                                           fontSize: 16,
                                           borderRadius: 12,
                                           border: "1px solid #d1d5db",
                                           background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                           color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                           outline: "none",
                                           cursor: userPermission === 'edit' ? "text" : "not-allowed"
                                         }}
                                       />
                                     </div>

                                     {/* Color */}
                                     <div>
                                       <label style={{
                                         display: "block",
                                         fontSize: 14,
                                         fontWeight: 500,
                                         color: "#374151",
                                         marginBottom: 8
                                       }}>
                                         Color
                                       </label>
                                       <div style={{
                                         display: "flex",
                                         alignItems: "center",
                                         gap: 12
                                       }}>
                                         <input
                                           type="color"
                                           value={selectedBlock.color}
                                           onChange={(e) => {
                                             if (userPermission === 'edit') {
                                               const newColor = e.target.value;
                                               setBlocksWithHistory(prev => prev.map(b => 
                                                 b.id === selectedBlock.id ? { ...b, color: newColor } : b
                                               ), `Changed ${selectedBlock.name} color`);
                                             }
                                           }}
                                           disabled={userPermission !== 'edit'}
                                           style={{
                                             width: 48,
                                             height: 48,
                                             border: "1px solid #d1d5db",
                                             borderRadius: 12,
                                             cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                             background: "none"
                                           }}
                                         />
                                         <div>
                                           <div style={{
                                             fontSize: 14,
                                             fontWeight: 500,
                                             color: "#111827"
                                           }}>
                                             Block color
                                           </div>
                                           <div style={{
                                             fontSize: 12,
                                             color: "#6b7280",
                                             fontFamily: "monospace"
                                           }}>
                                             {selectedBlock.color}
                                           </div>
                                         </div>
                                       </div>
                                     </div>

                                     {/* Position */}
                                     <div>
                                       <label style={{
                                         display: "block",
                                         fontSize: 14,
                                         fontWeight: 500,
                                         color: "#374151",
                                         marginBottom: 8
                                       }}>
                                         Position
                                       </label>
                                       <div style={{
                                         display: "grid",
                                         gridTemplateColumns: "1fr 1fr 1fr",
                                         gap: 12
                                       }}>
                                         {(['x', 'y', 'z'] as const).map(axis => (
                                           <div key={axis}>
                                             <label style={{
                                               display: "block",
                                               fontSize: 12,
                                               fontWeight: 500,
                                               color: "#6b7280",
                                               marginBottom: 4,
                                               textTransform: "uppercase"
                                             }}>
                                               {axis}
                                             </label>
                                             <div style={{ 
                                               display: "flex", 
                                               alignItems: "stretch",
                                               width: "100%",
                                               maxWidth: "100%",
                                               overflow: "hidden"
                                             }}>
                                               <input
                                                 type="text"
                                                 value={selectedBlock[axis]}
                                                 onChange={(e) => {
                                                   if (userPermission === 'edit') {
                                                     const value = parseFloat(e.target.value);
                                                     if (!isNaN(value)) {
                                                       setBlocksWithHistory(prev => prev.map(b => 
                                                         b.id === selectedBlock.id ? { ...b, [axis]: value } : b
                                                       ), `Moved ${selectedBlock.name} ${axis.toUpperCase()} to ${value}`);
                                                     }
                                                   }
                                                 }}
                                                 disabled={userPermission !== 'edit'}
                                                 style={{
                                                   flex: 1,
                                                   padding: "6px 8px",
                                                   fontSize: 13,
                                                   borderRadius: "6px 0 0 6px",
                                                   border: "1px solid #d1d5db",
                                                   borderRight: "none",
                                                   background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                                   color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                                   outline: "none",
                                                   textAlign: "center",
                                                   cursor: userPermission === 'edit' ? "text" : "not-allowed",
                                                   minWidth: 0,
                                                   width: 0
                                                 }}
                                               />
                                               <div style={{ 
                                                 display: "flex", 
                                                 flexDirection: "column",
                                                 flexShrink: 0
                                               }}>
                                                 <button
                                                   type="button"
                                                   onClick={() => {
                                                     if (userPermission === 'edit') {
                                                       setBlocksWithHistory(prev => prev.map(b => 
                                                         b.id === selectedBlock.id ? { ...b, [axis]: Number((b[axis] + 0.1).toFixed(1)) } : b
                                                       ), `Nudged ${selectedBlock.name} ${axis.toUpperCase()} +0.1`);
                                                     }
                                                   }}
                                                   disabled={userPermission !== 'edit'}
                                                   style={{
                                                     width: 20,
                                                     height: 18,
                                                     background: userPermission === 'edit' ? "#f3f4f6" : "#f9fafb",
                                                     border: "1px solid #d1d5db",
                                                     borderRadius: "0 3px 0 0",
                                                     borderLeft: "none",
                                                     cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                                     display: "flex",
                                                     alignItems: "center",
                                                     justifyContent: "center",
                                                     fontSize: 8,
                                                     color: userPermission === 'edit' ? "#374151" : "#9ca3af",
                                                     fontWeight: "bold",
                                                     lineHeight: 1
                                                   }}
                                                 >
                                                   ▲
                                                 </button>
                                                 <button
                                                   type="button"
                                                   onClick={() => {
                                                     if (userPermission === 'edit') {
                                                       setBlocksWithHistory(prev => prev.map(b => 
                                                         b.id === selectedBlock.id ? { ...b, [axis]: Number((b[axis] - 0.1).toFixed(1)) } : b
                                                       ), `Nudged ${selectedBlock.name} ${axis.toUpperCase()} -0.1`);
                                                     }
                                                   }}
                                                   disabled={userPermission !== 'edit'}
                                                   style={{
                                                     width: 20,
                                                     height: 18,
                                                     background: userPermission === 'edit' ? "#f3f4f6" : "#f9fafb",
                                                     border: "1px solid #d1d5db",
                                                     borderRadius: "0 0 3px 0",
                                                     borderTop: "none",
                                                     borderLeft: "none",
                                                     cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                                     display: "flex",
                                                     alignItems: "center",
                                                     justifyContent: "center",
                                                     fontSize: 8,
                                                     color: userPermission === 'edit' ? "#374151" : "#9ca3af",
                                                     fontWeight: "bold",
                                                     lineHeight: 1
                                                   }}
                                                 >
                                                   ▼
                                                 </button>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>

                                     {/* Dimensions */}
                                     <div>
                                       <label style={{
                                         display: "block",
                                         fontSize: 14,
                                         fontWeight: 500,
                                         color: "#374151",
                                         marginBottom: 8
                                       }}>
                                         Dimensions
                                       </label>
                                       <div style={{
                                         display: "grid",
                                         gridTemplateColumns: "1fr 1fr 1fr",
                                         gap: 12
                                       }}>
                                         {(['width', 'height', 'depth'] as const).map(dimension => (
                                           <div key={dimension}>
                                             <label style={{
                                               display: "block",
                                               fontSize: 12,
                                               fontWeight: 500,
                                               color: "#6b7280",
                                               marginBottom: 4,
                                               textTransform: "uppercase"
                                             }}>
                                               {dimension}
                                             </label>
                                             <div style={{ 
                                               display: "flex", 
                                               alignItems: "stretch",
                                               width: "100%",
                                               maxWidth: "100%",
                                               overflow: "hidden"
                                             }}>
                                               <input
                                                 type="text"
                                                 value={selectedBlock[dimension]}
                                                 onChange={(e) => {
                                                   if (userPermission === 'edit') {
                                                     const value = parseFloat(e.target.value);
                                                     if (!isNaN(value) && value >= 0.1) {
                                                       setBlocksWithHistory(prev => prev.map(b => 
                                                         b.id === selectedBlock.id ? { ...b, [dimension]: value } : b
                                                       ), `Resized ${selectedBlock.name} ${dimension} to ${value}`);
                                                     }
                                                   }
                                                 }}
                                                 disabled={userPermission !== 'edit'}
                                                 style={{
                                                   flex: 1,
                                                   padding: "6px 8px",
                                                   fontSize: 13,
                                                   borderRadius: "6px 0 0 6px",
                                                   border: "1px solid #d1d5db",
                                                   borderRight: "none",
                                                   background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                                   color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                                   outline: "none",
                                                   textAlign: "center",
                                                   cursor: userPermission === 'edit' ? "text" : "not-allowed",
                                                   minWidth: 0,
                                                   width: 0
                                                 }}
                                               />
                                               <div style={{ 
                                                 display: "flex", 
                                                 flexDirection: "column",
                                                 flexShrink: 0
                                               }}>
                                                 <button
                                                   type="button"
                                                   onClick={() => {
                                                     if (userPermission === 'edit') {
                                                       setBlocksWithHistory(prev => prev.map(b => 
                                                         b.id === selectedBlock.id ? { ...b, [dimension]: Number((Math.max(0.1, b[dimension] + 0.1)).toFixed(1)) } : b
                                                       ), `Increased ${selectedBlock.name} ${dimension} by 0.1`);
                                                     }
                                                   }}
                                                   disabled={userPermission !== 'edit'}
                                                   style={{
                                                     width: 20,
                                                     height: 18,
                                                     background: userPermission === 'edit' ? "#f3f4f6" : "#f9fafb",
                                                     border: "1px solid #d1d5db",
                                                     borderRadius: "0 3px 0 0",
                                                     borderLeft: "none",
                                                     cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                                     display: "flex",
                                                     alignItems: "center",
                                                     justifyContent: "center",
                                                     fontSize: 8,
                                                     color: userPermission === 'edit' ? "#374151" : "#9ca3af",
                                                     fontWeight: "bold",
                                                     lineHeight: 1
                                                   }}
                                                 >
                                                   ▲
                                                 </button>
                                                 <button
                                                   type="button"
                                                   onClick={() => {
                                                     if (userPermission === 'edit') {
                                                       setBlocksWithHistory(prev => prev.map(b => 
                                                         b.id === selectedBlock.id ? { ...b, [dimension]: Number((Math.max(0.1, b[dimension] - 0.1)).toFixed(1)) } : b
                                                       ), `Decreased ${selectedBlock.name} ${dimension} by 0.1`);
                                                     }
                                                   }}
                                                   disabled={userPermission !== 'edit'}
                                                   style={{
                                                     width: 20,
                                                     height: 18,
                                                     background: userPermission === 'edit' ? "#f3f4f6" : "#f9fafb",
                                                     border: "1px solid #d1d5db",
                                                     borderRadius: "0 0 3px 0",
                                                     borderTop: "none",
                                                     borderLeft: "none",
                                                     cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                                     display: "flex",
                                                     alignItems: "center",
                                                     justifyContent: "center",
                                                     fontSize: 8,
                                                     color: userPermission === 'edit' ? "#374151" : "#9ca3af",
                                                     fontWeight: "bold",
                                                     lineHeight: 1
                                                   }}
                                                 >
                                                   ▼
                                                 </button>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>

                                     {/* Rotation */}
                                     <div>
                                       <label style={{
                                         display: "block",
                                         fontSize: 14,
                                         fontWeight: 500,
                                         color: "#374151",
                                         marginBottom: 8
                                       }}>
                                         Rotation
                                       </label>
                                       <div style={{
                                         display: "flex",
                                         alignItems: "center",
                                         gap: 12
                                       }}>
                                         <span style={{ fontSize: 20 }}>⟲</span>
                                         <input
                                           type="number"
                                           min={0}
                                           max={360}
                                           step={1}
                                           value={selectedBlock.rotation !== undefined ? Math.round(selectedBlock.rotation * 180 / Math.PI) : 0}
                                           onChange={e => {
                                             if (userPermission === 'edit') {
                                               const deg = Number(e.target.value);
                                               setBlocksWithHistory(prev => prev.map(b =>
                                                 b.id === selectedBlock.id ? { ...b, rotation: deg * Math.PI / 180 } : b
                                               ), `Rotated ${selectedBlock.name} to ${deg}°`);
                                             }
                                           }}
                                           disabled={userPermission !== 'edit'}
                                           style={{
                                             width: 100,
                                             padding: "8px 12px",
                                             fontSize: 14,
                                             borderRadius: 8,
                                             border: "1px solid #d1d5db",
                                             background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                             color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                             outline: "none",
                                             textAlign: "center",
                                             cursor: userPermission === 'edit' ? "text" : "not-allowed"
                                           }}
                                         />
                                         <span style={{ fontSize: 14, color: "#6b7280" }}>°</span>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               );
                             })()}
                           </div>
                         )}
                     
                      </div>
                    )}

                    {currentPage === 'dimensions' && (
                      <div>
                        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>Room Dimensions</h3>
                        <div style={{
                          background: "#f9fafb",
                          borderRadius: 12,
                          padding: "16px",
                          border: "1px solid #e5e7eb"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {[
                              { label: "Width", value: width, setter: setWidthWithHistory },
                              { label: "Length", value: length, setter: setLengthWithHistory },
                              { label: "Height", value: height, setter: setHeightWithHistory },
                            ].map(dim => (
                              <div key={dim.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{dim.label}</div>
                                  <div style={{ fontSize: 10, color: "#9ca3af" }}>ft</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    step={0.1}
                                    value={dim.value}
                                    onChange={(e) => dim.setter(Number(e.target.value))}
                                    onWheel={(e) => e.stopPropagation()}
                                    disabled={userPermission !== 'edit'}
                                    style={{
                                      flex: 1,
                                      padding: "8px 12px",
                                      borderRadius: 6,
                                      border: "1px solid #d1d5db",
                                      background: userPermission === 'edit' ? "#ffffff" : "#f9fafb",
                                      color: userPermission === 'edit' ? "#111827" : "#9ca3af",
                                      fontSize: 14,
                                      fontWeight: 500,
                                      textAlign: "center",
                                      cursor: userPermission === 'edit' ? "text" : "not-allowed"
                                    }}
                                  />
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <button
                                      onClick={() => dim.setter(Math.min(50, dim.value + 0.5))}
                                      disabled={userPermission !== 'edit'}
                                      style={{
                                        width: 24,
                                        height: 20,
                                        background: userPermission === 'edit' ? "#f3f4f6" : "#f9fafb",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "4px 4px 0 0",
                                        cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        color: userPermission === 'edit' ? "#374151" : "#9ca3af",
                                        fontWeight: "bold",
                                        opacity: userPermission === 'edit' ? 1 : 0.5
                                      }}
                                      onMouseEnter={e => userPermission === 'edit' && (e.currentTarget.style.background = "#e5e7eb")}
                                      onMouseLeave={e => userPermission === 'edit' && (e.currentTarget.style.background = "#f3f4f6")}
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => dim.setter(Math.max(1, dim.value - 0.5))}
                                      disabled={userPermission !== 'edit'}
                                      style={{
                                        width: 24,
                                        height: 20,
                                        background: userPermission === 'edit' ? "#f3f4f6" : "#f9fafb",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "0 0 4px 4px",
                                        cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        color: userPermission === 'edit' ? "#374151" : "#9ca3af",
                                        fontWeight: "bold",
                                        opacity: userPermission === 'edit' ? 1 : 0.5
                                      }}
                                      onMouseEnter={e => userPermission === 'edit' && (e.currentTarget.style.background = "#e5e7eb")}
                                      onMouseLeave={e => userPermission === 'edit' && (e.currentTarget.style.background = "#f3f4f6")}
                                    >
                                      ▼
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentPage === 'library' && (
                      <div>
                        {/* Library Header */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: 20 
                        }}>
                          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#111827" }}>
                            Library
                          </h3>
                          
                          {/* Search Input */}
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Search furniture..."
                              value={librarySearchTerm}
                              onChange={(e) => setLibrarySearchTerm(e.target.value)}
                              style={{
                                background: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                padding: '8px 40px 8px 12px',
                                fontSize: 14,
                                color: '#374151',
                                width: 200,
                                outline: 'none'
                              }}
                            />
                            <svg 
                              style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#6b7280'
                              }}
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Filter and Sort Row */}
                        <div style={{ 
                          display: 'flex', 
                          gap: 12, 
                          marginBottom: 20 
                        }}>
                          {/* Category Filter */}
                          <div style={{ position: 'relative' }}>
                            <select
                              value={libraryCategory}
                              onChange={(e) => setLibraryCategory(e.target.value)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                padding: '8px 32px 8px 12px',
                                fontSize: 14,
                                color: '#374151',
                                cursor: 'pointer',
                                appearance: 'none',
                                minWidth: 120
                              }}
                            >
                              <option value="All">📂 All</option>
                              <option value="Bedroom">🛏️ Beds</option>
                              <option value="Living Room">🛋️ Living Room</option>
                              <option value="Dining Room">🍽️ Dining Room</option>
                              <option value="Kitchen">👩‍🍳 Kitchen</option>
                              <option value="Office">💼 Office</option>
                              <option value="Architectural">🏗️ Architectural</option>
                            </select>
                            <svg style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none'
                            }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                          </div>
                          
                          {/* Sort Dropdown */}
                          <div style={{ position: 'relative' }}>
                            <select
                              value={librarySortBy}
                              onChange={(e) => setLibrarySortBy(e.target.value)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                padding: '8px 32px 8px 12px',
                                fontSize: 14,
                                color: '#374151',
                                cursor: 'pointer',
                                appearance: 'none',
                                minWidth: 140
                              }}
                            >
                              <option value="Name">Sort by Name</option>
                              <option value="Category">Sort by Category</option>
                              <option value="Size">Sort by Size</option>
                            </select>
                            <svg style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none'
                            }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Items Grid */}
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                          gap: 16,
                          maxHeight: '60vh',
                          overflowY: 'auto',
                          paddingRight: 8
                        }}>
                          {(() => {
                            // Filter and sort items
                            let filteredItems = libraryCategory === 'All' 
                              ? libraryItems 
                              : libraryItems.filter(item => item.category === libraryCategory);
                            
                            // Apply search filter
                            if (librarySearchTerm) {
                              filteredItems = filteredItems.filter(item => 
                                item.name.toLowerCase().includes(librarySearchTerm.toLowerCase())
                              );
                            }
                            
                            // Sort items
                            if (librarySortBy === 'Name') {
                              filteredItems = filteredItems.sort((a, b) => a.name.localeCompare(b.name));
                            } else if (librarySortBy === 'Category') {
                              filteredItems = filteredItems.sort((a, b) => a.category.localeCompare(b.category));
                            } else if (librarySortBy === 'Size') {
                              filteredItems = filteredItems.sort((a, b) => (a.width * a.height * a.depth) - (b.width * b.height * b.depth));
                            }
                            
                            return filteredItems.map((item, index) => (
                              <div
                                key={`${item.name}-${index}`}
                                onClick={() => userPermission === 'edit' && addLibraryItem(item)}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 12,
                                  padding: 16,
                                  cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                  transition: "all 0.2s ease",
                                  textAlign: "center",
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                  opacity: userPermission === 'edit' ? 1 : 0.5
                                }}
                              >
                                {/* Optimized 2D Preview - No Canvas lag */}
                                <div style={{ 
                                  width: "100%", 
                                  height: 160, 
                                  marginBottom: 12,
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  border: "1px solid #eef2f7",
                                  background: `linear-gradient(135deg, ${item.color}cc, ${item.color})`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  gap: 8,
                                  position: "relative"
                                }}>
                                  {/* Icon based on item type */}
                                  <div style={{ fontSize: 32, opacity: 0.9 }}>
                                    {item.name === 'Sofa' ? '🛋️' : 
                                     item.name.includes('Bed') ? '🛏️' :
                                     item.name === 'Armchair' ? '🪑' :
                                     item.name === 'Dresser' ? '🗄️' :
                                     item.name.includes('Table') ? '🪑' :
                                     item.name.includes('Chair') ? '🪑' :
                                     item.name.includes('Kitchen') ? '🏠' :
                                     item.name === 'Refrigerator' ? '❄️' :
                                     item.name === 'Desk' ? '🖥️' :
                                     item.name === 'Bookshelf' ? '📚' :
                                     item.name === 'Door' ? '🚪' :
                                     item.name === 'Window' ? '🪟' :
                                     '📦'}
                                  </div>
                                  {/* Subtle dimension indicator */}
                                  <div style={{
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.8)',
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontFamily: 'monospace'
                                  }}>
                                    {item.width}×{item.height}×{item.depth}
                                  </div>
                                  {/* Model indicator */}
                                  {item.modelPath && (
                                    <div style={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      background: 'rgba(34, 197, 94, 0.9)',
                                      color: 'white',
                                      borderRadius: '50%',
                                      width: 16,
                                      height: 16,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 8,
                                      fontWeight: 'bold'
                                    }}>
                                      3D
                                    </div>
                                  )}
                                </div>
                                
                                {/* Item Name */}
                                <h4 style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: "#111827",
                                  margin: "0 0 4px 0",
                                  lineHeight: "1.2"
                                }}>
                                  {item.name}
                                </h4>
                                
                                {/* Dimensions */}
                                <p style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  margin: "0 0 12px 0"
                                }}>
                                  {item.width}' × {item.height}' × {item.depth}'
                                </p>
                                
                                {/* Add Button */}
                                <button style={{
                                  background: "#fbbf24",
                                  color: "#92400e",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "8px 16px",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor: userPermission === 'edit' ? "pointer" : "not-allowed",
                                  width: "100%",
                                  transition: "all 0.2s ease"
                                }}
                                onMouseEnter={e => {
                                  if (userPermission === 'edit') {
                                    e.currentTarget.style.background = "#f59e0b";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (userPermission === 'edit') {
                                    e.currentTarget.style.background = "#fbbf24";
                                  }
                                }}
                                >
                                  + Add
                                </button>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            // AI Chatbot content
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: '#fff',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              borderLeft: 'none',
              borderRadius: 0,
              boxShadow: 'none',
            }}>

              
              {/* Header */}
              {/* <div
                onClick={() => router.push('/chat')}
                style={{
                  padding: '14px 20px 10px 20px',
                  borderBottom: '1px solid #e5e7eb',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: 0,
                  userSelect: 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
                title="Open full chat interface"
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f3f4f6';
                  const title = e.currentTarget.querySelector('.chat-header-title');
                  if (title && title instanceof HTMLElement) title.style.color = '#111';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fafafa';
                  const title = e.currentTarget.querySelector('.chat-header-title');
                  if (title && title instanceof HTMLElement) title.style.color = '#222';
                }}
              >
                <span style={{ fontSize: 20, marginRight: 6 }}>✨</span>
                <span className="chat-header-title" style={{ fontWeight: 600, fontSize: 15, color: '#222', transition: 'color 0.2s' }}>Decorator AI</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 16, color: '#bdbdbd', marginLeft: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
                </span>
              </div> */}
              {/* Chat Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 12px',
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
              ref={chatMessagesRef}
              >
                {/* Active Agents Indicator */}
                {activeAgents.length > 0 && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      🤖 Active Specialists
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {activeAgents.map(agent => {
                        const agentInfo = agentSystem[agent as keyof typeof agentSystem];
                        return (
                          <span
                            key={agent}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '12px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {agentInfo?.emoji} {agentInfo?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                

                {/* Contextual Suggestions */}
                {getContextualSuggestions().length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '1px solid #0ea5e9',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600, marginBottom: '6px' }}>
                      🧠 Smart Context
                    </div>
                    {getContextualSuggestions().map((suggestion, i) => (
                      <div key={i} style={{
                        fontSize: '11px',
                        color: '#0f172a',
                        marginBottom: '2px',
                        lineHeight: '1.3',
                      }}>{suggestion}</div>
                    ))}
                  </div>
                )}
                {/* Empty state */}
                {chatMessages.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
                    🎨 Ask me anything about your room design!<br />
                    <span style={{ fontSize: 12 }}>I'll connect you with the right specialist</span>
                  </div>
                )}
                {/* Chat messages */}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {/* Special handling for multi-agent progress messages */}
                    {msg.content === 'multi-agent-progress' && msg.progressData ? (
                      <MultiAgentProgress
                        orchestratorPlan={msg.progressData.orchestratorPlan}
                        orchestratorStatus={msg.progressData.orchestratorStatus}
                        routingInfo={msg.progressData.routingInfo}
                        agents={msg.progressData.agents}
                        finalMessage={msg.progressData.finalMessage}
                        isComplete={msg.progressData.isComplete}
                      />
                    ) : msg.clarificationNeeded && Array.isArray(msg.questions) ? (
                      /* Special handling for clarification questions */
                      <ClarificationComponent 
                        message={msg.content} 
                        questions={(msg.questions as any[]).map(q => typeof q === 'string' ? { text: q, action: q } : q)}
                        onSubmit={(selectedActions) => {
                          const combinedResponse = selectedActions.join('; ');
                          chatInputBarRef.current?.setValue(combinedResponse);
                          setTimeout(() => {
                            handleChatSubmit(null, combinedResponse);
                          }, 50);
                        }}
                      />
                    ) : (console.log('🔍 CHECKING MESSAGE:', msg, 'content:', msg.content, 'results:', (msg as any).results), msg.content === 'search-results' && (msg as any).results) ? (
                      /* Special handling for search results */
                      <div style={{
                        marginTop: 16,
                        marginBottom: 16,
                        padding: '20px 0',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}>
                                              {/* Search Results Header */}
                      <div style={{
                        marginBottom: 16,
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: 8
                        }}>
                          Here are the search results for your query
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: '#6b7280',
                          marginBottom: 16
                        }}>
                          Found {((msg as any).results.items || []).length} results. Pick one you like, or ask me to search for more options.
                        </div>
                      </div>

                        {/* Results Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: 16,
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden'
                        }}>
                          {((msg as any).results.items || []).map((item: any, idx: number) => (
                            <div key={idx} style={{
                              background: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              overflow: 'hidden',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'border-color 0.2s ease',
                              cursor: 'pointer',
                              position: 'relative',
                              width: '100%',
                              maxWidth: '100%'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }}>
                              
                              {/* Image Section */}
                              <div style={{
                                position: 'relative',
                                height: 160,
                                background: '#f9fafb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                {(() => { let imgSrc: string | null = null; try { if (item && item.image && item.image !== 'No image URL') { imgSrc = item.image; } else if (item && item.url) { const host = new URL(item.url).hostname; imgSrc = `https://www.google.com/s2/favicons?sz=128&domain=${host}`; } } catch {} return imgSrc; })() ? (
                                  <img
                                    src={(function(){ try { if (item && item.image && item.image !== 'No image URL') return item.image; if (item && item.url) { const host = new URL(item.url).hostname; return `https://www.google.com/s2/favicons?sz=128&domain=${host}`; } } catch {} return ''; })()}
                                    alt={item.title || 'Product'}
                                    loading="lazy"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (placeholder) placeholder.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div style={{
                                  display: item.image && item.image !== 'No image URL' ? 'none' : 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 6,
                                  color: '#9ca3af'
                                }}>
                                  <span style={{ fontSize: 24 }}>📷</span>
                                  <span style={{ fontSize: 11, fontWeight: 400 }}>No image</span>
                                </div>
                                
                                {/* Source Badge */}
                                <div style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  background: '#374151',
                                  color: '#fff',
                                  padding: '3px 6px',
                                  borderRadius: 4,
                                  fontSize: 9,
                                  fontWeight: 500,
                                  textTransform: 'uppercase'
                                }}>
                                  {(() => { 
                                    try { 
                                      return new URL(item.url || '').hostname.replace('www.', '').split('.')[0]; 
                                    } catch { 
                                      return 'web'; 
                                    } 
                                  })()}
                                </div>
                              </div>

                              {/* Content Section */}
                              <div style={{ padding: '20px 16px', width: '100%' }}>
                                {/* Title */}
                                <div style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: '#111827',
                                  marginBottom: 8,
                                  lineHeight: 1.4,
                                  height: '2.8em',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  wordBreak: 'break-word',
                                  maxWidth: '100%'
                                }}>
                                  {item.title || 'Product Title'}
                                </div>

                                {/* Description */}
                                {item.content && !(typeof item.content === 'string' && item.content.startsWith('Image')) && (
                                  <div style={{
                                    fontSize: 12,
                                    color: '#6b7280',
                                    marginBottom: 16,
                                    lineHeight: 1.4,
                                    height: '2.4em',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word',
                                    maxWidth: '100%'
                                  }}>
                                    {item.content}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ 
                                  display: 'flex', 
                                  gap: 8, 
                                  width: '100%',
                                  minWidth: 0
                                }}>
                                  {item.url && (
                                    <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={{
                                        flex: 1,
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 6,
                                        padding: '8px 12px',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        minWidth: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      View Product
                                    </a>
                                  )}
                                  <button
                                    onClick={async (ev) => {
                                      const btn = ev.currentTarget as HTMLButtonElement;
                                      try {
                                        btn.disabled = true; btn.textContent = 'Generating…';
                                        // 1) Find dimensions for the object we are generating
                                        


                                        // 1) Resolve image URL
                                        const imgUrl = item.image || '';
                                        if (!imgUrl) throw new Error('No image available');
                                        // 2) Download image as blob and build FormData
                                        const imgRes = await fetch(imgUrl, { mode: 'cors' });
                                        const blob = await imgRes.blob();
                                        const file = new File([blob], 'product.png', { type: blob.type || 'image/png' });
                                        const fd = new FormData();
                                        fd.append('file', file);
                                        fd.append('photo_perspective', 'front');
                                        // 3) Call clip_server generate endpoint
                                        const clipUrl = (process.env.NEXT_PUBLIC_CLIP_SERVER_URL || 'http://localhost:8000') + '/generate-object';
                                        const resp = await fetch(clipUrl, { method: 'POST', body: fd });
                                        const data = await resp.json();
                                        const modelUrl = data?.model_data?.meshy_model_url || data?.meshy_model_url || data?.model_url;
                                        if (!resp.ok || !modelUrl) throw new Error(data?.error || 'Meshy generation failed');
                                        // 4) Add GLB to scene using proxy to avoid CORS
                                        const proxied = `/api/model-proxy?url=${encodeURIComponent(modelUrl)}`;
                                        const newBlock: any = {
                                          id: `meshy-${Date.now()}`,
                                          name: item.title || 'Generated Model',
                                          x: 0, y: 0, z: 0,
                                          depth: item.dimensions?.depth || 4,
                                          width: item.dimensions?.width || 4,
                                          height: item.dimensions?.height || 2,
                                          color: '#cccccc',
                                          modelPath: proxied,
                                        };
                                        setBlocksWithHistory(prev => [...prev, newBlock], `Added ${newBlock.name} (Meshy)`);
                                      } catch (e) {
                                        console.error('Meshy generation error', e);
                                      } finally {
                                        btn.disabled = false; btn.textContent = 'Generate 3D Model';
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      background: '#111827',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '8px 12px',
                                      fontSize: 12,
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      minWidth: 0,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    Generate 3D Model
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* No Results Message */}
                        {((msg as any).results.items || []).length === 0 && (
                          <div style={{
                            textAlign: 'center',
                            padding: '32px 20px',
                            color: '#6b7280',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            background: '#f9fafb'
                          }}>
                            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No results found</div>
                            <div style={{ fontSize: 14 }}>Try adjusting your search terms or check your spelling</div>
                          </div>
                        )}

                        {/* User Guidance Footer */}
                        {((msg as any).results.items || []).length > 0 && (
                          <div style={{
                            marginTop: 20,
                            padding: '16px 20px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            textAlign: 'center'
                          }}>
                            <div style={{
                              fontSize: 14,
                              color: '#475569',
                              marginBottom: 8
                            }}>
                              💡 <strong>What's next?</strong>
                            </div>
                            <div style={{
                              fontSize: 13,
                              color: '#64748b',
                              lineHeight: 1.4
                            }}>
                              Click "Generate 3D Model" on any item you like, or ask me to search for more options. 
                              I'll use Meshy to create a 3D model and add it to your room!
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          background: msg.role === 'user' ? '#e0e7ef' : '#fff',
                          color: '#222',
                          borderRadius: 8,
                          padding: msg.role === 'user' ? '8px 14px 0px 14px' : '12px 16px',
                          maxWidth: msg.role === 'assistant' && msg.content.includes('Amazon') ? '98%' : '80%',
                          width: 'fit-content',
                          fontSize: 14,
                          boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                          border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                          marginBottom: 0,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                    {/* Agent header for assistant messages */}
                    {msg.role === 'assistant' && msg.agent && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        paddingBottom: '4px',
                        borderBottom: '1px solid #f3f4f6',
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#4f46e5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          {agentSystem[msg.agent as keyof typeof agentSystem]?.emoji || '🤖'} {agentSystem[msg.agent as keyof typeof agentSystem]?.name || 'Assistant'}
                        </span>
                        {msg.confidence && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            backgroundColor: msg.confidence > 0.8 ? '#dcfce7' : msg.confidence > 0.6 ? '#fef3c7' : '#fecaca',
                            color: msg.confidence > 0.8 ? '#166534' : msg.confidence > 0.6 ? '#92400e' : '#991b1b',
                          }}>
                            {Math.round(msg.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    {/* Message content */}
                    <div style={{ 
                      lineHeight: '1.5',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {renderMessageContent(msg.content)}
                    </div>
                    {/* Reasoning footer for assistant messages */}
                    {msg.role === 'assistant' && msg.reasoning && (
                      <div style={{
                        marginTop: '6px',
                        paddingTop: '4px',
                        borderTop: '1px solid #f3f4f6',
                        fontSize: '11px',
                        color: '#6b7280',
                        fontStyle: 'italic',
                      }}>
                        💭 {msg.reasoning}
                      </div>
                    )}
                    
                    {/* Amazon Knowledge Base footer with toggle button */}
                    {msg.role === 'assistant' && msg.agent === 'amazon-knowledge-base' && msg.amazonResults && (
                      <div style={{
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid #f3f4f6',
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginBottom: '8px',
                        }}>
                          <img 
                            src="/images/amazonlogo.png" 
                            alt="Amazon" 
                            style={{ width: '12px', height: '12px' }} 
                          />
                          Amazon Knowledge Base
                        </div>
                        
                        {/* Toggle button inside the message */}
                        {msg.amazonResults.products && msg.amazonResults.products.length > 0 && (
                          <button
                            onClick={() => {
                              const updatedMessages = chatMessages.map((message, index) => {
                                if (message === msg) {
                                  const nextState = !message.showAllProducts;
                                  return { ...(message as any), showAllProducts: nextState, visibleProductCount: nextState ? ((message as any).visibleProductCount || 5) : (message as any).visibleProductCount };
                                }
                                return message;
                              });
                              setChatMessages(updatedMessages);
                            }}
                            style={{
                              background: msg.showAllProducts ? '#fef3c7' : '#f3f4f6',
                              border: msg.showAllProducts ? '2px solid #f59e0b' : '1px solid #d1d5db',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: msg.showAllProducts ? '#92400e' : '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: msg.showAllProducts ? '0 2px 4px rgba(245, 158, 11, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = msg.showAllProducts 
                                ? '0 4px 8px rgba(245, 158, 11, 0.3)' 
                                : '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = msg.showAllProducts 
                                ? '0 2px 4px rgba(245, 158, 11, 0.2)' 
                                : '0 1px 2px rgba(0, 0, 0, 0.05)';
                            }}
                          >
                            {msg.showAllProducts ? 'Hide Products' : `Show All ${msg.amazonResults.total_results} Products`}
                          </button>
                        )}
                        
                        {/* Products list inside the message */}
                        {msg.showAllProducts && msg.amazonResults.products && (
                          <div style={{
                            marginTop: '12px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '16px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                          }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#111827',
                              marginBottom: '12px',
                            }}>
                              All Amazon Products ({msg.amazonResults.total_results} results)
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {(msg.amazonResults.products.slice(0, (msg as any).visibleProductCount || 5)).map((product: any, index: number) => (
                                <div key={index} style={{
                                  background: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  padding: '16px',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#d1d5db';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-start',
                                  }}>
                                    {product.image && (
                                      <img 
                                        src={product.image} 
                                        alt={product.title}
                                        loading="lazy"
                                        width={80}
                                        height={80}
                                        style={{
                                          width: '80px',
                                          height: '80px',
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                          border: '1px solid #e5e7eb',
                                          flexShrink: 0,
                                        }}
                                      />
                                    )}
                                    
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#111827',
                                        marginBottom: '6px',
                                        lineHeight: '1.4',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                      }}>
                                        {product.title}
                                      </div>
                                      
                                      <div style={{ 
                                        color: '#059669', 
                                        fontWeight: '600', 
                                        marginBottom: '4px',
                                        fontSize: '16px',
                                      }}>
                                        ${product.price.current_price}
                                      </div>
                                      
                                      <div style={{ 
                                        color: '#6b7280', 
                                        fontSize: '12px',
                                        marginBottom: '6px',
                                      }}>
                                        {product.rating}★ ({product.ratings_total} reviews) • {product.prime ? 'Prime' : 'Not Prime'}
                                      </div>
                                      
                                      <a
                                        href={product.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: '#3b82f6',
                                          textDecoration: 'none',
                                          fontSize: '12px',
                                          fontWeight: '500',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.textDecoration = 'underline';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.textDecoration = 'none';
                                        }}
                                      >
                                        View on Amazon →
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {(((msg as any).visibleProductCount || 5) < msg.amazonResults.products.length) && (
                              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                                <button
                                  onClick={() => {
                                    const updatedMessages = chatMessages.map((message) => {
                                      if (message === msg) {
                                        const current = (message as any).visibleProductCount || 5;
                                        const next = Math.min(current + 10, msg.amazonResults.products.length);
                                        return { ...(message as any), visibleProductCount: next };
                                      }
                                      return message;
                                    });
                                    setChatMessages(updatedMessages);
                                  }}
                                  style={{
                                    background: '#f3f4f6',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    padding: '8px 12px',
                                    fontSize: 12,
                                    color: '#374151',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Load more
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                    )}
                  </div>
                ))}
                

                
                {/* Loading indicator */}
                {isLoading && (
                  <div style={{
                    borderRadius: '8px',
                    background: '#f9fafb',
                    color: '#6b7280',
                    fontSize: '13px',
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
                
                {/* Scroll target for auto-scroll */}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <div style={{
                padding: '16px 20px 20px',
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                position: 'relative',
              }}>
                {/* Mode Toggles - Separate individual toggles */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  {/* @ Add Pinboard Button */}
                  <button
                    type="button"
                    onClick={handleAtButtonClickMain}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: showPinboardSearch ? '1px solid #fad600' : '1px solid #e2e8f0',
                      background: showPinboardSearch ? '#fad600' : '#ffffff',
                      color: showPinboardSearch ? '#18181b' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: showPinboardSearch ? '0 1px 3px rgba(250, 214, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    title="Add pinboard context"
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>@</span>
                  </button>

                  {/* Selected Pinboard Chips - single row; overflow -> +N and Agent Mode moves to next line */}
                  <div
                    ref={chipsRowRef}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'nowrap',
                      overflow: 'visible',
                      maxWidth: '100%'
                    }}
                  >
                    {(() => {
                      const capacity = Math.max(1, maxChipsRow);
                      const needsOverflow = selectedPinboards.length > capacity;
                      const visible = needsOverflow
                        ? [selectedPinboards[0], ...selectedPinboards.slice(1, 1 + Math.max(0, capacity - 2))]
                        : selectedPinboards;
                      return visible.map((pinboard) => (
                        <div
                          key={pinboard.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 8px', borderRadius: '6px',
                            border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b',
                            fontSize: '11px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <FileText size={12} color="#64748b" />
                          <span>{pinboard.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPinboards(prev => prev.filter(p => p.id !== pinboard.id));
                            }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              marginLeft: '2px', color: '#64748b', fontSize: '14px', lineHeight: '1'
                            }}
                            title="Remove pinboard"
                          >
                            ×
                          </button>
                        </div>
                      ));
                    })()}
                    {(() => {
                      const capacity = Math.max(1, maxChipsRow);
                      const visibleCount = selectedPinboards.length > capacity
                        ? 1 + Math.max(0, capacity - 2)
                        : selectedPinboards.length;
                      const overflow = Math.max(0, selectedPinboards.length - visibleCount);
                      if (overflow <= 0) return null;
                      const overflowItems = selectedPinboards.slice(visibleCount);
                      return (
                        <div
                          onMouseEnter={() => {
                            if (overflowHideTimerRef.current) clearTimeout(overflowHideTimerRef.current);
                            setShowOverflow(true);
                          }}
                          onMouseLeave={() => {
                            overflowHideTimerRef.current = setTimeout(() => setShowOverflow(false), 120);
                          }}
                          style={{ position: 'relative' }}
                        >
                          <div
                            style={{
                              padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0',
                              background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: 600,
                              whiteSpace: 'nowrap', cursor: 'default'
                            }}
                          >
                            +{overflow}
                          </div>
                          {showOverflow && (
                            <div
                              onMouseEnter={() => {
                                if (overflowHideTimerRef.current) clearTimeout(overflowHideTimerRef.current);
                                setShowOverflow(true);
                              }}
                              onMouseLeave={() => {
                                overflowHideTimerRef.current = setTimeout(() => setShowOverflow(false), 120);
                              }}
                              style={{
                                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.12)', padding: '8px',
                                zIndex: 1000, minWidth: '220px'
                              }}
                            >
                              {overflowItems.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={12} color="#64748b" />
                                    <span style={{ fontSize: '12px', color: '#1e293b' }}>{p.name}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPinboards(prev => prev.filter(x => x.id !== p.id));
                                    }}
                                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 6px', fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Agent Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setMultiAgentMode(!multiAgentMode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: multiAgentMode ? '1px solid #fad600' : '1px solid #e2e8f0',
                      background: multiAgentMode ? '#fad600' : '#ffffff',
                      color: multiAgentMode ? '#18181b' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: multiAgentMode ? '0 1px 3px rgba(250, 214, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <Users size={12} />
                    <span>Agent Mode</span>
                  </button>

                  {/* Amazon Knowledge Base Toggle */}
                  {/* <button
                    type="button"
                    onClick={() => {
                      const newState = !amazonKnowledgeBaseEnabled;
                      setAmazonKnowledgeBaseEnabled(newState);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: amazonKnowledgeBaseEnabled ? '1px solid #000' : '1px solid #e2e8f0',
                      background: amazonKnowledgeBaseEnabled ? '#000' : '#ffffff',
                      color: amazonKnowledgeBaseEnabled ? '#fff' : '#64748b',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: amazonKnowledgeBaseEnabled ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <ShoppingBag size={16} />
                    <span>{isSearchingProducts ? 'Searching...' : 'Amazon'}</span>
                  </button> */}

                  {/* Status Indicator */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {multiAgentMode && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fad600',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                    {amazonKnowledgeBaseEnabled && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#000'
                      }} />
                    )}
                  </div>

                  {/* Pinboard Search Modal */}
                  {showPinboardSearch && (
                    <>
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          width: '100vw',
                          height: '100vh',
                          zIndex: 999,
                          background: 'transparent',
                        }}
                        onClick={() => setShowPinboardSearch(false)}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '150px',
                        left: '0',
                        width: '320px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        maxHeight: '300px',
                        zIndex: 1000,
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <input
                          type="text"
                          placeholder="Search by name..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            borderBottom: '1px solid #f1f5f9',
                            borderRadius: '0',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: '#ffffff',
                            color: '#1e293b'
                          }}
                        />

                        {/* Pinboard List */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {pinboards.filter(pinboard =>
                            pinboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            pinboard.id.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 ? (
                            <div style={{
                              padding: '20px',
                              textAlign: 'center',
                              color: '#64748b',
                              fontSize: '14px'
                            }}>
                              {pinboards.length === 0 ? 'No pinboards found' : 'No matching pinboards'}
                            </div>
                          ) : (
                            pinboards.filter(pinboard =>
                              pinboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              pinboard.id.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map(pinboard => (
                              <div
                                key={pinboard.id}
                                onClick={() => addPinboardToMessageMain(pinboard)}
                                style={{
                                  padding: '12px 16px',
                                  borderBottom: '1px solid #f8fafc',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '16px' }}>📋</span>
                                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                                    {pinboard.name}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginLeft: '24px' }}>
                                  {pinboard.notes.length} notes • {pinboard.images.length} images • {pinboard.drawings.length} drawings
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Input Container */}
                <ChatInputBar
                  ref={chatInputBarRef}
                  isLoading={isLoading}
                  multiAgentMode={multiAgentMode}
                  onSubmit={(text) => handleChatSubmit(null, text)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        roomId={roomId || ""}
        roomName={roomName}
        owner={owner}
        sharedWith={sharedWith}
        linkSharing={linkSharing}
        onUpdateShare={async ({ sharedWith, linkSharing }) => {
          setSharedWith(sharedWith);
          setLinkSharing(linkSharing);
          
          // Save shared users with permissions to Firebase (only for owners)
          if (roomId && user && isOwner) {
            try {
              const roomRef = doc(db, "rooms", roomId);
              
              // Update the room document with sharedWith (includes emails and permissions)
              await updateDoc(roomRef, {
                sharedWith: sharedWith,
                sharedWithEmails: sharedWith.map(user => user.email), // Keep for backward compatibility
                editorEmails: sharedWith.filter(user => user.permission === 'edit').map(user => user.email) // Separate array for editors
              });
              
              console.log("Shared users updated in Firebase:", sharedWith);
            } catch (error) {
              console.error("Error updating shared users in Firebase:", error);
            }
          }
        }}
      />
    </div>
  );
}

// Helper component to update camera position in render loop
function CameraUpdater({ position }: { position: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...position);
  }, [position, camera]);
  return null;
}

// InsideControls: Handles camera-relative movement inside the Canvas
function InsideControls({ insideActive, insidePos, setInsidePos, roomDims, insideKeys }: {
  insideActive: boolean;
  insidePos: [number, number, number];
  setInsidePos: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  roomDims: { x: number; y: number; z: number };
  insideKeys: React.MutableRefObject<{ [key: string]: boolean }>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    if (!insideActive) return;
    let frame: number;
    const speed = 0.08;
    const update = () => {
      setInsidePos(pos => {
        let [x, y, z] = pos;
        let moveForward = 0, moveRight = 0;
        if (insideKeys.current["w"] || insideKeys.current["ArrowUp"]) moveForward += 1;
        if (insideKeys.current["s"] || insideKeys.current["ArrowDown"]) moveForward -= 1;
        if (insideKeys.current["a"] || insideKeys.current["ArrowLeft"]) moveRight -= 1;
        if (insideKeys.current["d"] || insideKeys.current["ArrowRight"]) moveRight += 1;
        // Get camera direction and right vector
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0; // lock to horizontal plane
        dir.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(dir, camera.up).normalize();
        // Move in camera-relative direction
        x += (dir.x * moveForward + right.x * moveRight) * speed;
        z += (dir.z * moveForward + right.z * moveRight) * speed;
        // Clamp to room
        x = Math.max(-roomDims.x, Math.min(roomDims.x, x));
        z = Math.max(-roomDims.z, Math.min(roomDims.z, z));
        return [x, y, z];
      });
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [insideActive, roomDims.x, roomDims.z, camera, setInsidePos, insideKeys]);
  return null;
}

// (A duplicate definition of ChatInputBar existed near the bottom; removed to avoid redeclare errors)


