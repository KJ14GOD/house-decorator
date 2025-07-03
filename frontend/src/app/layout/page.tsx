"use client";
import { useState, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Edges, PointerLockControls, Text } from "@react-three/drei";
import * as THREE from 'three';

function RoomBox({ width, length, height, floorColor, ceilingColor, wallFrontColor, wallBackColor, wallLeftColor, wallRightColor, hideCeiling = false, hideFloor = false, blocks = [], previewBlock = null }: {
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
    created: Date
  }>;
  previewBlock?: {x: number, y: number, z: number, width: number, height: number, depth: number} | null;
}) {
  const scale = 0.35;
  const w = width * scale;
  const l = length * scale;
  const h = height * scale;

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
          <mesh key={`front-${i}-${j}`} position={[segX, segY, segZ]}>
            <planeGeometry args={[actualSegmentSizeXFront, actualSegmentSizeYFront]} />
            <meshStandardMaterial color={wallFrontColor} side={THREE.DoubleSide} />
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
          <mesh key={`back-${i}-${j}`} position={[segX, segY, segZ]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[actualSegmentSizeXFront, actualSegmentSizeYFront]} />
            <meshStandardMaterial color={wallBackColor} side={THREE.DoubleSide} />
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
          <mesh key={`left-${i}-${j}`} position={[segX, segY, segZ]} rotation={[0, -Math.PI/2, 0]}>
            <planeGeometry args={[actualSegmentSizeZLeft, actualSegmentSizeYLeft]} />
            <meshStandardMaterial color={wallLeftColor} side={THREE.DoubleSide} />
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
          <mesh key={`right-${i}-${j}`} position={[segX, segY, segZ]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[actualSegmentSizeZLeft, actualSegmentSizeYLeft]} />
            <meshStandardMaterial color={wallRightColor} side={THREE.DoubleSide} />
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
          <mesh key={`floor-${i}-${j}`} position={[segX, 0, segZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[actualSegmentSizeX, actualSegmentSizeZ]} />
            <meshStandardMaterial color={floorColor} />
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
          <mesh key={`ceiling-${i}-${j}`} position={[segX, h, segZ]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[actualSegmentSizeX, actualSegmentSizeZ]} />
            <meshStandardMaterial color={ceilingColor} />
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
      {/* Render all blocks as colored boxes inside the room */}
      {blocks.map((block, i) => (
        <mesh key={`block-${i}`} position={[
          (block.x + block.width/2) * scale - w/2,
          (block.y + block.height/2) * scale,
          (block.z + block.depth/2) * scale - l/2
        ]}>
          <boxGeometry args={[block.width * scale, block.height * scale, block.depth * scale]} />
          <meshStandardMaterial color={block.color} opacity={0.9} />
        </mesh>
      ))}
      
      {/* Render preview block if in preview mode */}
      {previewBlock && (
        <mesh position={[
          (previewBlock.x + previewBlock.width/2) * scale - w/2,
          (previewBlock.y + previewBlock.height/2) * scale,
          (previewBlock.z + previewBlock.depth/2) * scale - l/2
        ]}>
          <boxGeometry args={[previewBlock.width * scale, previewBlock.height * scale, previewBlock.depth * scale]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.5} 
            wireframe={false}
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

export default function LayoutPage() {
  // Room dimensions state
  const [widthFt, setWidthFt] = useState<number>(12);
  const [widthIn, setWidthIn] = useState<number>(0);
  const [lengthFt, setLengthFt] = useState<number>(12);
  const [lengthIn, setLengthIn] = useState<number>(0);
  const [heightFt, setHeightFt] = useState<number>(8);
  const [heightIn, setHeightIn] = useState<number>(0);
  const [showRoom, setShowRoom] = useState<boolean>(false);

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
    created: Date
  }>>([]);
  const [blockConfig, setBlockConfig] = useState({
    width: 2, height: 2, depth: 2, x: 0, y: 0, z: 0
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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
  const width = widthFt + widthIn / 12;
  const length = lengthFt + lengthIn / 12;
  const height = heightFt + heightIn / 12;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRoom(true);
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

  // Navigation functions
  const navigateToPage = (page: 'main' | 'camera' | 'builder' | 'colors' | 'objects' | 'library') => {
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
      created: new Date()
    };
    setBlocks(prev => [...prev, newBlock]);
  };

      return (
      <div style={{ 
        marginLeft: 0, 
        transition: "margin-left 0.3s ease",
        minHeight: "100vh", 
        background: "#fdfdfb", 
        color: "#222", 
        position: "relative", 
        overflow: "hidden" 
      }}>
      {showRoom && (
        <>
          {/* 3D Canvas (fullscreen in all views) */}
          {view === 'inside' ? (
            <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 10000, background: '#fdfdfb' }}>
              <button onClick={handleExitInside} style={{ position: 'absolute', bottom: 32, right: 32, zIndex: 10001, background: '#222', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Exit</button>
              <Canvas
                camera={{ position: insidePos, fov: 75 }}
                style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'fixed', top: 0, left: 0 }}
                onCreated={() => setInsideActive(true)}
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 7]} intensity={0.7} />
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
                />
                <PointerLockControls ref={pointerLockRef} />
                <InsideControls insideActive={insideActive} insidePos={insidePos} setInsidePos={setInsidePos} roomDims={roomDims} insideKeys={insideKeys} />
                {/* Move camera in render loop */}
                <CameraUpdater position={insidePos} />
              </Canvas>
            </div>
          ) : (
            <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'transparent', zIndex: 1 }}>
              <Canvas
                camera={{
                  position: cameraPositions[view as 'outside' | 'orbit' | 'topdown' | 'bottomup'],
                  fov: 50,
                  up: view === 'bottomup' ? [0, -1, 0] : [0, 1, 0],
                }}
                style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'fixed', top: 0, left: 0 }}
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 7]} intensity={0.7} />
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
                  hideCeiling={view === 'topdown'}
                  hideFloor={view === 'bottomup'}
                  blocks={blocks}
                  previewBlock={previewMode ? blockConfig : null}
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
          {/* Left Sidebar */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: sidebarCollapsed ? 60 : 280,
              height: "100vh",
              background: "#ffffff",
              borderRight: "1px solid #e5e7eb",
              transition: "width 0.3s ease",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
                          {/* Header */}
              <div style={{
                padding: sidebarCollapsed ? "8px" : "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between"
              }}>
              {!sidebarCollapsed && (
                <div>
                  <h1 style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#111827",
                    letterSpacing: "-0.025em"
                  }}>decorator</h1>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "8px",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: 16
                }}
              >
                {sidebarCollapsed ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </button>
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
                  </>
                ) : (
                  <>
                    {/* Expanded Sub-page */}
                    {/* Back Button */}
                    <button
                      onClick={goBack}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#374151",
                        marginBottom: 16
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m12 19-7-7 7-7"></path>
                        <path d="M19 12H5"></path>
                      </svg>
                      <span>Back to Menu</span>
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
                        
                        {/* Builder Mode Toggle */}
                        <div style={{ marginBottom: 16 }}>
                          <button
                            onClick={() => setBuilderMode(!builderMode)}
                            style={{
                              width: "100%",
                              background: builderMode ? "#10b981" : "#f9fafb",
                              color: builderMode ? "#ffffff" : "#6b7280",
                              border: "1px solid " + (builderMode ? "#10b981" : "#e5e7eb"),
                              borderRadius: 8,
                              padding: "12px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s ease"
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
                                      onChange={e => setBlockConfig(prev => ({...prev, [dim]: Number(e.target.value)}))}
                                      style={{
                                        width: "100%",
                                        fontSize: 13,
                                        padding: "8px 10px",
                                        borderRadius: 6,
                                        border: "1px solid #d1d5db",
                                        background: "#ffffff",
                                        outline: "none",
                                        transition: "all 0.2s ease",
                                        color: "#111827"
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
                                    <label style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{pos}</label>
                                    <input
                                      type="number"
                                      value={blockConfig[pos]}
                                      min={0}
                                      step={0.1}
                                      onChange={e => setBlockConfig(prev => ({...prev, [pos]: Number(e.target.value)}))}
                                      style={{
                                        width: "100%",
                                        fontSize: 13,
                                        padding: "8px 10px",
                                        borderRadius: 6,
                                        border: "1px solid #d1d5db",
                                        background: "#ffffff",
                                        outline: "none",
                                        transition: "all 0.2s ease",
                                        color: "#111827"
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <button
                                onClick={() => setPreviewMode(!previewMode)}
                                style={{
                                  background: previewMode ? "#f59e0b" : "#ffffff",
                                  color: previewMode ? "#ffffff" : "#6b7280",
                                  border: "1px solid " + (previewMode ? "#f59e0b" : "#d1d5db"),
                                  borderRadius: 6,
                                  padding: "10px 12px",
                                  fontSize: 12,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                Show Preview
                              </button>
                              
                              <button
                                                              onClick={() => {
                                const newBlock = {
                                  id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                  name: `Block ${blocks.length + 1}`,
                                  ...blockConfig,
                                  color: '#e3e3e3',
                                  created: new Date()
                                };
                                setBlocks(prev => [...prev, newBlock]);
                                setPreviewMode(false);
                              }}
                                style={{
                                  background: "#3b82f6",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "12px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
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
                              { label: "Floor", value: floorColor, setter: setFloorColor },
                              { label: "Ceiling", value: ceilingColor, setter: setCeilingColor },
                              { label: "Wall (Front)", value: wallFrontColor, setter: setWallFrontColor },
                              { label: "Wall (Back)", value: wallBackColor, setter: setWallBackColor },
                              { label: "Wall (Left)", value: wallLeftColor, setter: setWallLeftColor },
                              { label: "Wall (Right)", value: wallRightColor, setter: setWallRightColor }
                            ].map(color => (
                              <div key={color.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <input 
                                  type="color" 
                                  value={color.value} 
                                  onChange={e => color.setter(e.target.value)} 
                                  style={{ 
                                    width: 32, 
                                    height: 32, 
                                    border: "1px solid #d1d5db", 
                                    borderRadius: 6, 
                                    cursor: "pointer",
                                    background: "none"
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
                        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>Objects</h3>
                        <div style={{
                          background: "#ffffff",
                          borderRadius: 12,
                          padding: "16px",
                          border: "1px solid #e5e7eb"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16
                          }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#374151"
                            }}>Objects</h4>
                            <button
                              onClick={() => setBlocks([])}
                              style={{
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer"
                              }}
                            >
                              Clear All
                            </button>
                          </div>
                          
                          <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: 8,
                            maxHeight: 400,
                            overflowY: "auto"
                          }}>
                            {blocks.map((block, index) => (
                              <div
                                key={block.id}
                                style={{
                                  background: selectedBlockId === block.id ? "#eff6ff" : "#f9fafb",
                                  border: `1px solid ${selectedBlockId === block.id ? "#3b82f6" : "#e5e7eb"}`,
                                  borderRadius: 8,
                                  padding: "12px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
                                }}
                                onClick={() => setSelectedBlockId(selectedBlockId === block.id ? null : block.id)}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div
                                      style={{
                                        width: 24,
                                        height: 24,
                                        background: block.color,
                                        borderRadius: 6,
                                        border: "1px solid #d1d5db",
                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                                      }}
                                    />
                                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>
                                      {block.name}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ 
                                      fontSize: 12, 
                                      color: "#6b7280",
                                      padding: "2px 6px",
                                      background: "#f3f4f6",
                                      borderRadius: 4
                                    }}>
                                      {selectedBlockId === block.id ? "−" : "+"}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBlocks(prev => prev.filter(b => b.id !== block.id));
                                        if (selectedBlockId === block.id) setSelectedBlockId(null);
                                      }}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#9ca3af",
                                        cursor: "pointer",
                                        padding: "4px",
                                        borderRadius: 4,
                                        fontSize: 14,
                                        fontWeight: "bold"
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Expanded controls for selected block */}
                                {selectedBlockId === block.id && (
                                  <div style={{ 
                                    marginTop: 12, 
                                    paddingTop: 12, 
                                    borderTop: "1px solid #e5e7eb",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12
                                  }}>
                                    {/* Name editor */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <label style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, display: "block" }}>Name</label>
                                                                             <input
                                         type="text"
                                         value={block.name}
                                         onChange={(e) => {
                                           setBlocks(prev => prev.map(b => 
                                             b.id === block.id ? { ...b, name: e.target.value } : b
                                           ));
                                         }}
                                         onClick={(e) => e.stopPropagation()}
                                         style={{
                                           width: "100%",
                                           fontSize: 12,
                                           padding: "8px 12px",
                                           borderRadius: 6,
                                           border: "1px solid #d1d5db",
                                           background: "#ffffff",
                                           color: "#111827",
                                           fontWeight: 500
                                         }}
                                         placeholder="Enter block name"
                                       />
                                    </div>

                                    {/* Color picker - matching wall/ceiling style */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <label style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, display: "block" }}>Color</label>
                                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <input 
                                          type="color" 
                                          value={block.color} 
                                          onChange={(e) => {
                                            setBlocks(prev => prev.map(b => 
                                              b.id === block.id ? { ...b, color: e.target.value } : b
                                            ));
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ 
                                            width: 32, 
                                            height: 32, 
                                            border: "1px solid #d1d5db", 
                                            borderRadius: 6, 
                                            cursor: "pointer",
                                            background: "none"
                                          }} 
                                        />
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Block Color</div>
                                          <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{block.color}</div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Position controls */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <label style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, display: "block" }}>Position</label>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                        {(['x', 'y', 'z'] as const).map(axis => (
                                          <div key={axis}>
                                            <label style={{ fontSize: 9, color: "#9ca3af", display: "block", marginBottom: 2, textTransform: "uppercase" }}>{axis}</label>
                                                                                         <input
                                               type="number"
                                               value={block[axis]}
                                               step={0.1}
                                               onChange={(e) => {
                                                 setBlocks(prev => prev.map(b => 
                                                   b.id === block.id ? { ...b, [axis]: Number(e.target.value) } : b
                                                 ));
                                               }}
                                               onClick={(e) => e.stopPropagation()}
                                               style={{
                                                 width: "100%",
                                                 fontSize: 11,
                                                 padding: "6px 8px",
                                                 borderRadius: 4,
                                                 border: "1px solid #d1d5db",
                                                 background: "#ffffff",
                                                 color: "#111827"
                                               }}
                                             />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Size controls */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <label style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, display: "block" }}>Dimensions</label>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                        {(['width', 'height', 'depth'] as const).map(dimension => (
                                          <div key={dimension}>
                                            <label style={{ fontSize: 9, color: "#9ca3af", display: "block", marginBottom: 2, textTransform: "uppercase" }}>{dimension}</label>
                                                                                         <input
                                               type="number"
                                               value={block[dimension]}
                                               min={0.1}
                                               step={0.1}
                                               onChange={(e) => {
                                                 setBlocks(prev => prev.map(b => 
                                                   b.id === block.id ? { ...b, [dimension]: Number(e.target.value) } : b
                                                 ));
                                               }}
                                               onClick={(e) => e.stopPropagation()}
                                               style={{
                                                 width: "100%",
                                                 fontSize: 11,
                                                 padding: "6px 8px",
                                                 borderRadius: 4,
                                                 border: "1px solid #d1d5db",
                                                 background: "#ffffff",
                                                 color: "#111827"
                                               }}
                                             />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentPage === 'library' && (
                      <div>
                        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>Library</h3>
                        <div style={{
                          background: "#ffffff",
                          borderRadius: 12,
                          padding: "16px",
                          border: "1px solid #e5e7eb"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16
                          }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#374151"
                            }}>Furniture & Objects</h4>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                              Click to add to room
                            </div>
                          </div>
                          
                          <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: 8,
                            maxHeight: 400,
                            overflowY: "auto"
                          }}>
                            {/* Group items by category */}
                            {["Bedroom", "Living Room", "Dining Room", "Kitchen", "Office", "Architectural"].map(category => {
                              const categoryItems = libraryItems.filter(item => item.category === category);
                              if (categoryItems.length === 0) return null;
                              
                              return (
                                <div key={category} style={{ marginBottom: 16 }}>
                                  <div style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#6b7280",
                                    marginBottom: 8,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                  }}>
                                    {category}
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {categoryItems.map((item, index) => (
                                      <div
                                        key={`${category}-${index}`}
                                        onClick={() => addLibraryItem(item)}
                                        style={{
                                          background: "#f9fafb",
                                          border: "1px solid #e5e7eb",
                                          borderRadius: 6,
                                          padding: "10px 12px",
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between"
                                        }}
                                        onMouseEnter={e => {
                                          e.currentTarget.style.background = "#eff6ff";
                                          e.currentTarget.style.borderColor = "#3b82f6";
                                        }}
                                        onMouseLeave={e => {
                                          e.currentTarget.style.background = "#f9fafb";
                                          e.currentTarget.style.borderColor = "#e5e7eb";
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <div
                                            style={{
                                              width: 20,
                                              height: 20,
                                              background: item.color,
                                              borderRadius: 4,
                                              border: "1px solid #d1d5db",
                                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
                                            }}
                                          />
                                          <div>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                                              {item.name}
                                            </div>
                                            <div style={{ fontSize: 10, color: "#6b7280" }}>
                                              {item.width}' × {item.height}' × {item.depth}'
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{
                                          fontSize: 12,
                                          color: "#3b82f6",
                                          fontWeight: 500,
                                          opacity: 0.8
                                        }}>
                                          + Add
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
          </div>
        </>
      )}
             {/* Initial form - Centered */}
       {!showRoom && (
         <div style={{ 
           maxWidth: 1000, 
           margin: "0 auto", 
           padding: "100px 20px",
           display: "flex", 
           flexDirection: "column", 
           alignItems: "center",
           gap: 40,
           fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
         }}>
           <h1 style={{ 
             fontSize: 48, 
             fontWeight: 700, 
             textAlign: "center", 
             background: "linear-gradient(135deg, #000 0%, #444 100%)",
             WebkitBackgroundClip: "text",
             WebkitTextFillColor: "transparent",
             letterSpacing: "-2px",
             lineHeight: 1.1,
             marginBottom: 20
           }}>
             Enter Your Room Dimensions
           </h1>

           <div style={{
             display: "flex",
             flexDirection: "column",
             gap: 30,
             width: "100%",
             maxWidth: 600,
             background: "#fff",
             padding: "50px 40px",
             borderRadius: 20,
             boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
             border: "1px solid #e5e7eb"
           }}>
             {/* Width */}
             <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
               <div style={{ 
                 fontSize: 18, 
                 fontWeight: 600, 
                 minWidth: 80,
                 color: "#374151"
               }}>Width:</div>
               <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                 <input
                   type="number"
                   value={widthFt}
                   onChange={e => setWidthFt(Number(e.target.value))}
                   style={{
                     padding: "15px 20px",
                     fontSize: 18,
                     fontWeight: 600,
                     border: "2px solid #e5e7eb",
                     borderRadius: 12,
                     background: "#333",
                     color: "#fff",
                     width: 80,
                     textAlign: "center"
                   }}
                   min={1}
                 />
                 <span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>ft</span>
                 <input
                   type="number"
                   value={widthIn}
                   onChange={e => setWidthIn(Number(e.target.value))}
                   style={{
                     padding: "15px 20px",
                     fontSize: 18,
                     fontWeight: 600,
                     border: "2px solid #e5e7eb",
                     borderRadius: 12,
                     background: "#333",
                     color: "#fff",
                     width: 80,
                     textAlign: "center"
                   }}
                   min={0}
                   max={11}
                 />
                 <span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>in</span>
               </div>
             </div>

             {/* Length */}
             <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
               <div style={{ 
                 fontSize: 18, 
                 fontWeight: 600, 
                 minWidth: 80,
                 color: "#374151"
               }}>Length:</div>
               <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                 <input
                   type="number"
                   value={lengthFt}
                   onChange={e => setLengthFt(Number(e.target.value))}
                   style={{
                     padding: "15px 20px",
                     fontSize: 18,
                     fontWeight: 600,
                     border: "2px solid #e5e7eb",
                     borderRadius: 12,
                     background: "#333",
                     color: "#fff",
                     width: 80,
                     textAlign: "center"
                   }}
                   min={1}
                 />
                 <span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>ft</span>
                 <input
                   type="number"
                   value={lengthIn}
                   onChange={e => setLengthIn(Number(e.target.value))}
                   style={{
                     padding: "15px 20px",
                     fontSize: 18,
                     fontWeight: 600,
                     border: "2px solid #e5e7eb",
                     borderRadius: 12,
                     background: "#333",
                     color: "#fff",
                     width: 80,
                     textAlign: "center"
                   }}
                   min={0}
                   max={11}
                 />
                 <span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>in</span>
               </div>
             </div>

             {/* Height */}
             <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
               <div style={{ 
                 fontSize: 18, 
                 fontWeight: 600, 
                 minWidth: 80,
                 color: "#374151"
               }}>Height:</div>
               <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                 <input
                   type="number"
                   value={heightFt}
                   onChange={e => setHeightFt(Number(e.target.value))}
                   style={{
                     padding: "15px 20px",
                     fontSize: 18,
                     fontWeight: 600,
                     border: "2px solid #e5e7eb",
                     borderRadius: 12,
                     background: "#333",
                     color: "#fff",
                     width: 80,
                     textAlign: "center"
                   }}
                   min={1}
                 />
                 <span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>ft</span>
                 <input
                   type="number"
                   value={heightIn}
                   onChange={e => setHeightIn(Number(e.target.value))}
                   style={{
                     padding: "15px 20px",
                     fontSize: 18,
                     fontWeight: 600,
                     border: "2px solid #e5e7eb",
                     borderRadius: 12,
                     background: "#333",
                     color: "#fff",
                     width: 80,
                     textAlign: "center"
                   }}
                   min={0}
                   max={11}
                 />
                 <span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280" }}>in</span>
               </div>
             </div>

             <button
               onClick={() => setShowRoom(true)}
               style={{
                 background: "#333",
                 color: "#fff",
                 border: "none",
                 borderRadius: 16,
                 padding: "20px 40px",
                 fontSize: 18,
                 fontWeight: 700,
                 cursor: "pointer",
                 transition: "all 0.3s ease",
                 letterSpacing: "0.5px",
                 marginTop: 20
               }}
               onMouseEnter={e => {
                 e.currentTarget.style.background = "#000";
                 e.currentTarget.style.transform = "translateY(-2px)";
                 e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
               }}
               onMouseLeave={e => {
                 e.currentTarget.style.background = "#333";
                 e.currentTarget.style.transform = "translateY(0px)";
                 e.currentTarget.style.boxShadow = "none";
               }}
             >
               Visualize Room
             </button>
           </div>
         </div>
       )}
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