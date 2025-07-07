"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Edges, PointerLockControls, Text } from "@react-three/drei";
import * as THREE from 'three';
import { ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { db } from "@/lib/firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

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

export default function ModelPage() {
  const router = useRouter();

  // Room dimensions state
  const [width, setWidth] = useState<number>(12);
  const [length, setLength] = useState<number>(12);
  const [height, setHeight] = useState<number>(8);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("Untitled Room");
  const [isEditingName, setIsEditingName] = useState(false);

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

  const [rulerMode, setRulerMode] = useState(false);
  const [rulers, setRulers] = useState<Array<[THREE.Vector3, THREE.Vector3]>>([]);
  const [rulerPreview, setRulerPreview] = useState<[THREE.Vector3, THREE.Vector3] | null>(null);
  const [rulerStartPoint, setRulerStartPoint] = useState<THREE.Vector3 | null>(null);

  const sceneRef = useRef<THREE.Scene>(null);

  // Load room state from local storage on initial render
  useEffect(() => {
    const roomStateJSON = localStorage.getItem('roomState');
    if (roomStateJSON) {
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
        setBlocks(roomState.blocks || []);
        setChatMessages(roomState.chatMessages || []);
    }
    setIsLoaded(true);
  }, []);

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
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(360);
  const [chatbotHeight, setChatbotHeight] = useState(480);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Simple debounce utility function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounced function to update room in Firestore
  const updateRoomInFirestore = useCallback(
    debounce(async (roomData: any) => {
      if (!roomId) return;
      
      try {
        const roomRef = doc(db, "rooms", roomId);
        await updateDoc(roomRef, roomData);
        console.log("Room state saved to Firestore");
      } catch (error) {
        console.error("Error saving room state to Firestore:", error);
      }
    }, 1000),
    [roomId]
  );

  // Effect to persist room state changes to Firestore
  useEffect(() => {
    if (!isLoaded || !roomId) return;

    // Prepare sanitized blocks (remove Date objects for Firestore)
    const sanitizedBlocks = blocks.map(block => {
      const { created, ...rest } = block;
      return rest;
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
      chatHistory: chatMessages,
    };

    updateRoomInFirestore(roomData);
  }, [
    isLoaded, roomId, roomName, width, length, height,
    floorColor, ceilingColor, wallFrontColor, wallBackColor, 
    wallLeftColor, wallRightColor, blocks, chatMessages, updateRoomInFirestore
  ]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const newMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...chatMessages,
      { role: 'user', content: chatInput },
    ];
    setChatMessages(newMessages);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: chatInput,
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
          messages: newMessages.slice(0, -1), // Send all messages except the current one
        }),
      });

      const text = await response.text();

      const applyAction = (actionObj: any) => {
        const { action, target, value } = actionObj;
        const colorSetters: { [key: string]: (color: string) => void } = {
          floorColor: setFloorColor,
          ceilingColor: setCeilingColor,
          wallFrontColor: setWallFrontColor,
          wallBackColor: setWallBackColor,
          wallLeftColor: setWallLeftColor,
          wallRightColor: setWallRightColor,
        };

        if (action === 'set_room_dimensions') {
          const { width, length, height } = value;
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
            setBlocks(prevBlocks => prevBlocks.map(block => {
              if (block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase())) {
                found = true;
                return { ...block, color: value };
              }
              return block;
            }));
            return found ? `I've updated the color for object(s) matching "${target}" to ${value}.` : `I couldn't find any object named "${target}".`;
          }
        } else if (action === 'move_object') {
          let found = false;
          setBlocks(prevBlocks => prevBlocks.map(block => {
            if (block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase())) {
              found = true;
              return { ...block, x: value.x, y: value.y, z: value.z };
            }
            return block;
          }));
          return found ? `I've moved the object(s) matching "${target}" to the new coordinates.` : `I couldn't find any object named "${target}" to move.`;
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
            setBlocks(prev => [...prev, newBlock]);
            return `I've added a ${target} to the room.`;
          } else {
            return `I couldn't find a "${target}" in the library.`;
          }
        } else if (action === 'remove_object') {
          let found = false;
          setBlocks(prevBlocks => prevBlocks.filter(block => {
            const match = block.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(block.name.toLowerCase());
            if (match) found = true;
            return !match;
          }));
          return found ? `I've removed the object(s) matching "${target}".` : `I couldn't find any object named "${target}" to remove.`;
        }
        return '';
      };

      try {
        // Attempt to parse the text as a single JSON object or an array of objects
        const data = JSON.parse(text);
        let summaryMsgs: string[] = [];

        if (Array.isArray(data)) {
          // Handle array of actions
          data.forEach((actionObj: any) => {
            summaryMsgs.push(applyAction(actionObj));
          });
        } else if (typeof data === 'object' && data !== null) {
          // Handle single action
          summaryMsgs.push(applyAction(data));
        }

        if (summaryMsgs.length > 0) {
          setChatMessages([
            ...newMessages,
            { role: 'assistant', content: summaryMsgs.join(' ') },
          ]);
        } else {
          // Fallback for non-action responses
          setChatMessages([
            ...newMessages,
            { role: 'assistant', content: text },
          ]);
        }
      } catch (e) {
        // If parsing fails, it might be a plain text response
        setChatMessages([
          ...newMessages,
          { role: 'assistant', content: text },
        ]);
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

  const handleSaveAndExit = async () => {
    if (!roomId) {
      router.push('/layout');
      return;
    }

    const sanitizedBlocks = blocks.map(block => {
      const { created, ...rest } = block;
      return rest;
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
    };

    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, roomData);
    } catch (error) {
      console.error("Error saving room:", error);
      // Optionally, show an error message to the user
    } finally {
      router.push('/layout');
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>; // Or a spinner
  }

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
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 48px 0 48px", fontFamily: 'TWKLausanne, sans-serif', position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#222" }}><span style={{ fontWeight: 700, fontSize: 22 }}>Decorator</span></Link>
          <button onClick={handleSaveAndExit} style={{ textDecoration: "none", color: "#222", fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>Layout</button>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button style={{ background: "none", border: "none", fontSize: 16, color: "#222", cursor: "pointer" }}>Sign in</button>
          <button style={{ background: "#222", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Book a demo</button>
        </div>
      </nav>
        <>
          {/* 3D Canvas (fullscreen in all views) */}
          {view === 'inside' ? (
            <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 1, background: '#fdfdfb' }}>
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
                <RulerRenderer rulers={rulers} preview={rulerPreview} scale={scale} />
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
              zIndex: 9999,
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
                  <button onClick={handleSaveAndExit} style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#111827",
                      letterSpacing: "-0.025em",
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
                    &larr; Back to Layout
                  </button>
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
                  <>
                    {/* Placeholder for collapsed icon */}
                    <span>☰</span>
                  </>
                ) : (
                  <>
                    {/* Placeholder for expanded icon */}
                    <span>✕</span>
                  </>
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
                        
                        <div style={{ marginBottom: 16 }}>
                          <button
                            onClick={() => setRulerMode(!rulerMode)}
                            style={{
                              width: "100%",
                              background: rulerMode ? "#10b981" : "#f9fafb",
                              color: rulerMode ? "#ffffff" : "#6b7280",
                              border: "1px solid " + (rulerMode ? "#10b981" : "#e5e7eb"),
                              borderRadius: 8,
                              padding: "12px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            Ruler Mode {rulerMode ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {rulerMode && (
                          <div style={{ marginBottom: 16 }}>
                            <button
                              onClick={() => setRulers([])}
                              style={{
                                width: "100%",
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                borderRadius: 8,
                                padding: "12px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              Clear Rulers
                            </button>
                          </div>
                        )}

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
                                      onClick={(e) => e.stopPropagation()}
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
                                    <label style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 2, textTransform: "uppercase" }}>{pos}</label>
                                    <input
                                      type="number"
                                      value={blockConfig[pos]}
                                      min={0}
                                      step={0.1}
                                      onChange={e => setBlockConfig(prev => ({...prev, [pos]: Number(e.target.value)}))}
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
                                               value={blockConfig[axis]}
                                               step={0.1}
                                               onChange={e => setBlockConfig(prev => ({...prev, [axis]: Number(e.target.value)}))}
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
                                               value={blockConfig[dimension]}
                                               min={0.1}
                                               step={0.1}
                                               onChange={e => setBlockConfig(prev => ({...prev, [dimension]: Number(e.target.value)}))}
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

          {/* Notion-style AI Assistant */}
          <div
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              position: "absolute",
              bottom: "24px",
              right: "24px",
              zIndex: 99999,
            }}
          >
            {chatbotOpen && (
              <div
                ref={chatbotRef}
                style={{
                  width: chatbotWidth,
                  height: chatbotHeight,
                  minWidth: "300px",
                  minHeight: "300px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: "12px",
                  overflow: "hidden",
                  position: "fixed",
                  right: "24px",
                  bottom: "24px",
                  top: "unset",
                  left: "unset",
                  zIndex: 99999,
                }}
              >
                {/* Resize Handle */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "16px",
                    height: "16px",
                    cursor: "nwse-resize",
                    zIndex: 10,
                    background: "transparent",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startWidth = chatbotWidth;
                    const startHeight = chatbotHeight;
                    const startX = e.clientX;
                    const startY = e.clientY;

                    const handleMouseMove = (e: MouseEvent) => {
                      e.preventDefault();
                      const deltaX = startX - e.clientX;
                      const deltaY = startY - e.clientY;
                      const newWidth = Math.max(300, Math.min(600, startWidth + deltaX));
                      const newHeight = Math.max(300, Math.min(600, startHeight + deltaY));
                      setChatbotWidth(newWidth);
                      setChatbotHeight(newHeight);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                />
                {/* Header */}
                <div
                  style={{
                    padding: "14px 20px 10px 20px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: 20, marginRight: 6 }}>✨</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#222" }}>Decorator AI</span>
                  <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}></span>
                  <button
                    onClick={() => setChatbotOpen(false)}
                    style={{
                      marginLeft: 10,
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      fontSize: 18,
                      cursor: "pointer",
                      borderRadius: 6,
                      padding: 4,
                      transition: "background 0.15s"
                    }}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                {/* Chat Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 20px",
                    background: "#fafafa",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {chatMessages.length === 0 && (
                    <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", marginTop: 40 }}>
                      Ask me anything about your room design!
                    </div>
                  )}
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
                        fontSize: 14,
                        boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                        border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                        marginBottom: 2
                      }}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div style={{
                      borderRadius: "8px",
                      background: "#f9fafb",
                      color: "#6b7280",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      marginTop: 4,
                      maxWidth: '60%',
                    }}>
                      <div style={{ fontSize: "12px" }}>⋯</div>
                      <div>Thinking</div>
                    </div>
                  )}
                </div>
                {/* Input */}
                <form
                  onSubmit={handleChatSubmit}
                  style={{
                    padding: "16px 20px",
                    background: "#ffffff",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    position: "relative",
                  }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your room design..."
                      style={{
                        flex: 1,
                        padding: "14px 20px",
                        borderRadius: "999px",
                        border: "1.5px solid #e5e7eb",
                        fontSize: "15px",
                        outline: "none",
                        background: "#f9fafb",
                        color: "#222",
                        boxShadow: "none",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        marginRight: "-44px", // overlap the button
                        zIndex: 1,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#facc15";
                        e.target.style.boxShadow = "0 0 0 2px rgba(250,204,21,0.15)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow = "none";
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !chatInput.trim()}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: isLoading || !chatInput.trim() ? "#fef08a" : "#facc15",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        right: "8px",
                        boxShadow: isLoading || !chatInput.trim() ? "none" : "0 2px 8px rgba(250,204,21,0.10)",
                        cursor: isLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                        transition: "background 0.15s, box-shadow 0.15s",
                        zIndex: 2,
                      }}
                      tabIndex={-1}
                      onMouseEnter={e => {
                        if (!(isLoading || !chatInput.trim())) {
                          e.currentTarget.style.background = "#fde047";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!(isLoading || !chatInput.trim())) {
                          e.currentTarget.style.background = "#facc15";
                        }
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Chat Button */}
            {!chatbotOpen && (
              <button
                onClick={() => setChatbotOpen(true)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "18px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 25px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                ✨
              </button>
            )}
          </div>
        </>
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
