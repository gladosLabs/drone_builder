import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@react-three/drei";
import { useRouter } from 'next/router';
import { supabase } from "../lib/supabase";
import { createBuild, getUserBuilds, deleteBuild, getBuild, analyzeBuild as analyzeBuildDB } from "../lib/database";
import ProtectedRoute from '../components/ProtectedRoute';

function SortableLayer({ part, index, setSelectedPart, removePartByIdAtIndex }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: part.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
      }}
      className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded shadow-sm cursor-move"
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedPart(part)}>
        <span className="text-lg">{part.emoji}</span>
        <span className="font-medium text-gray-800">{part.name}</span>
      </div>
      <button
        className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold px-2"
        onClick={() => removePartByIdAtIndex(index)}
        title="Remove"
      >✕</button>
    </div>
  );
}

const FRAME_TYPES = [
  { id: "frame-x", name: "X Frame", description: "A classic X-shaped frame, lightweight and agile.", useCase: "Best for racing and freestyle due to its symmetry and agility.", properties: "4 arms, lightweight, fast, responsive", arms: 4, emoji: "❌", cost: 60, weight: 120 },
  { id: "frame-h", name: "H Frame", description: "H-shaped frame, stable and strong.", useCase: "Great for carrying payloads and stable flight.", properties: "4 arms, stable, good for heavy lift", arms: 4, emoji: "🇭", cost: 70, weight: 140 },
  { id: "frame-cinewhoop", name: "Cinewhoop", description: "Ducted frame for safe, cinematic indoor flying.", useCase: "Perfect for indoor and close-proximity filming.", properties: "4 arms, ducted, safe, cinematic", arms: 4, emoji: "🎥", cost: 80, weight: 130 },
  { id: "frame-tinywhoop", name: "TinyWhoop", description: "Ultra-small frame for indoor fun.", useCase: "Best for beginners and indoor flying.", properties: "4 arms, tiny, lightweight, safe", arms: 4, emoji: "🪁", cost: 30, weight: 60 },
  { id: "frame-hex", name: "Hex Frame", description: "Six-arm frame for extra stability and lift.", useCase: "Great for heavy payloads and stable video.", properties: "6 arms, stable, heavy lift", arms: 6, emoji: "🔷", cost: 120, weight: 200 },
  { id: "frame-octo", name: "Octo Frame", description: "Eight-arm frame for maximum lift and redundancy.", useCase: "Used in professional filming and industrial drones.", properties: "8 arms, max lift, redundancy", arms: 8, emoji: "🛸", cost: 180, weight: 260 }
];

const MOTOR_TYPES = [
  { id: "motor-standard", name: "Standard Motor", description: "General purpose brushless motor.", compatible: ["frame-x", "frame-h", "frame-cinewhoop", "frame-tinywhoop", "frame-hex", "frame-octo"], emoji: "⚡", cost: 25, kv: 2300, thrust: 800 },
  { id: "motor-racing", name: "Racing Motor", description: "High KV motor for racing drones.", compatible: ["frame-x", "frame-h"], emoji: "🏎️", cost: 40, kv: 2700, thrust: 950 },
  { id: "motor-cinewhoop", name: "Cinewhoop Motor", description: "Optimized for cinewhoop frames.", compatible: ["frame-cinewhoop"], emoji: "🎬", cost: 35, kv: 2000, thrust: 700 },
  { id: "motor-heavy", name: "Heavy Lift Motor", description: "For hex/octo frames and heavy payloads.", compatible: ["frame-hex", "frame-octo"], emoji: "💪", cost: 60, kv: 1200, thrust: 1500 }
];

const PROPELLER_TYPES = [
  { id: "prop-standard", name: "Standard Propeller", description: "General purpose propeller.", compatible: ["motor-standard", "motor-heavy"], emoji: "🌀", cost: 3 },
  { id: "prop-racing", name: "Racing Propeller", description: "Lightweight, high-speed prop for racing.", compatible: ["motor-racing"], emoji: "🏁", cost: 5 },
  { id: "prop-cinewhoop", name: "Cinewhoop Propeller", description: "Ducted prop for cinewhoop.", compatible: ["motor-cinewhoop"], emoji: "🎦", cost: 4 }
];

const ESC_TYPES = [
  { id: "esc-standard", name: "Standard ESC", description: "Electronic speed controller for most drones.", compatible: ["motor-standard", "motor-cinewhoop", "motor-heavy"], emoji: "🔌", cost: 15 },
  { id: "esc-racing", name: "Racing ESC", description: "High current ESC for racing motors.", compatible: ["motor-racing"], emoji: "⚡", cost: 20 }
];

const OTHER_PARTS = [
  { id: "battery", name: "LiPo Battery", description: "Provides power to all the drone's parts.", emoji: "🔋", cost: 40, capacity: 2200 },
  { id: "camera", name: "Camera", description: "Lets you see from the drone's point of view.", emoji: "📷", cost: 50 },
  { id: "gps", name: "GPS Module", description: "Helps the drone know where it is in the world.", emoji: "📡", cost: 30 }
];

const FC_TYPES = [
  { id: "fc-pixhawk", name: "Pixhawk", description: "Popular open-source flight controller for all types of drones.", emoji: "🦅", cost: 120 },
  { id: "fc-orangecube", name: "OrangeCube", description: "High-end flight controller for professional and industrial drones.", emoji: "🟧", cost: 200 },
  { id: "fc-matek", name: "Matek", description: "Affordable, reliable FC for racing and freestyle.", emoji: "🟦", cost: 60 },
  { id: "fc-betaflight", name: "BetaFlight", description: "Widely used FC for FPV racing and freestyle.", emoji: "🦋", cost: 40 }
];

const COMPANION_TYPES = [
  { id: "companion-rpi", name: "Raspberry Pi", description: "Versatile companion computer for AI, vision, and autonomy.", emoji: "🍓", cost: 70 },
  { id: "companion-jetson", name: "Jetson Nano", description: "NVIDIA Jetson Nano for advanced AI and computer vision.", emoji: "🤖", cost: 120 },
  { id: "companion-odroid", name: "Odroid", description: "Powerful SBC for robotics and drones.", emoji: "🟩", cost: 90 }
];

const PART_GROUPS = [
  { label: "Frames", parts: FRAME_TYPES },
  { label: "Motors", parts: MOTOR_TYPES },
  { label: "Propellers", parts: PROPELLER_TYPES },
  { label: "ESCs", parts: ESC_TYPES },
  { label: "Flight Controllers", parts: FC_TYPES },
  { label: "Companion Computers", parts: COMPANION_TYPES },
  { label: "Other Parts", parts: OTHER_PARTS }
];

function DraggablePart({ part }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: part.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-3 mb-3 rounded-lg shadow cursor-grab bg-white hover:bg-blue-50 border border-gray-200 transition ${isDragging ? "opacity-50" : ""}`}
      style={{ touchAction: "none" }}
    >
      <span className="text-2xl">{part.emoji}</span>
      <span className="font-semibold">{part.name}</span>
    </div>
  );
}

function DroppableCanvas({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[400px] bg-gradient-to-br from-blue-100 to-white rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center p-6 transition ${isOver ? "bg-blue-50 border-blue-500" : ""}`}
    >
      {children}
      {isOver && <div className="absolute inset-0 bg-blue-100/40 rounded-2xl pointer-events-none" />}
    </div>
  );
}

function CollapsibleGroup({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button className="w-full flex items-center justify-between px-2 py-2 font-semibold text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition" onClick={() => setOpen((v) => !v)}>
        <span>{label}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function getFrame(canvasParts) {
  return canvasParts.find((p) => p.id.startsWith("frame-"));
}
function getMotors(canvasParts) {
  return canvasParts.filter((p) => p.id.startsWith("motor-"));
}
function getProps(canvasParts) {
  return canvasParts.filter((p) => p.id.startsWith("prop-"));
}
function getESCs(canvasParts) {
  return canvasParts.filter((p) => p.id.startsWith("esc-"));
}
function getFC(canvasParts) {
  return canvasParts.find((p) => p.id.startsWith("fc-"));
}
function getCompanion(canvasParts) {
  return canvasParts.find((p) => p.id.startsWith("companion-"));
}

// 3D Drone Playground
function Drone3D({ parts, onSelect, onRemove, hoveredPartId, setHoveredPartId }) {
  const frame = getFrame(parts);
  const motors = getMotors(parts);
  const props = getProps(parts);
  const battery = parts.find((p) => p.id === "battery");
  const camera = parts.find((p) => p.id === "camera");
  const fc = getFC(parts);
  const companion = getCompanion(parts);
  let armCount = frame?.arms || 4;
  const armPositions = Array.from({ length: armCount }, (_, i) => {
    const angle = (i / armCount) * Math.PI * 2;
    return [Math.cos(angle) * 2, 0, Math.sin(angle) * 2];
  });

  return (
    <Canvas camera={{ position: [0, 6, 10], fov: 50 }} style={{ width: 500, height: 400, background: 'transparent' }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 7]} intensity={0.7} />
      <OrbitControls enablePan={false} />
      {frame && (
        <group onClick={() => onSelect(frame)}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 0.3, 32]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
          </mesh>
          {armPositions.map((pos, i) => (
            <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]} onClick={(e) => { e.stopPropagation(); onSelect(frame); }}>
              <boxGeometry args={[2.5, 0.18, 0.18]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          ))}
        </group>
      )}
      {/* Motors */}
      {frame && motors.map((motor, i) => (
        <group
          key={i}
          position={armPositions[i] || [0, 0, 0]}
          onPointerOver={() => setHoveredPartId(motor.id)}
          onPointerOut={() => setHoveredPartId(null)}
        >
          <mesh
            onClick={(e) => { e.stopPropagation(); onSelect(motor); }}
            onDoubleClick={(e) => { e.stopPropagation(); onRemove(motor.id); }}
          >
            <cylinderGeometry args={[0.25, 0.25, 0.4, 24]} />
            <meshStandardMaterial color="#888" metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Propellers - more realistic: hub + 2 blades per propeller */}
      {frame && props.map((prop, i) => (
        <group
          key={i}
          position={armPositions[i] ? [armPositions[i][0], 0.5, armPositions[i][2]] : [0, 0.5, 0]}
          rotation={[0, (i % 2 === 0 ? 0 : Math.PI / 2), 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(prop); }}
          onPointerOver={() => setHoveredPartId(prop.id)}
          onPointerOut={() => setHoveredPartId(null)}
        >
          {/* Hub */}
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Blade 1 */}
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 12]}>
            <boxGeometry args={[0.8, 0.03, 0.12]} />
            <meshStandardMaterial color="#4fc3f7" />
          </mesh>
          {/* Blade 2 (opposite side) */}
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -Math.PI / 12]}>
            <boxGeometry args={[0.8, 0.03, 0.12]} />
            <meshStandardMaterial color="#4fc3f7" />
          </mesh>
        </group>
      ))}
      {/* Battery */}
      {frame && battery && (
        <mesh
          position={[0, -0.5, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(battery); }}
          onPointerOver={() => setHoveredPartId(battery.id)}
          onPointerOut={() => setHoveredPartId(null)}
        >
          <boxGeometry args={[0.7, 0.3, 1.2]} />
          <meshStandardMaterial color="#fbc02d" />
        </mesh>
      )}
      {/* Camera - always between two propellers */}
      {frame && camera && armPositions.length >= 2 && (
        (() => {
          // Calculate midpoint between arm 0 and arm 1
          const [x1, y1, z1] = armPositions[0];
          const [x2, y2, z2] = armPositions[1];
          // Midpoint, slightly forward and above
          const camX = (x1 + x2) / 2 * 1.1;
          const camY = 0.4;
          const camZ = (z1 + z2) / 2 * 1.1;
          return (
            <group
              position={[camX, camY, camZ]}
              onClick={(e) => { e.stopPropagation(); onSelect(camera); }}
              onPointerOver={() => setHoveredPartId(camera.id)}
              onPointerOut={() => setHoveredPartId(null)}
            >
              {/* Camera body */}
              <mesh>
                <boxGeometry args={[0.3, 0.2, 0.2]} />
                <meshStandardMaterial color="#fff" />
              </mesh>
              {/* Camera lens */}
              <mesh position={[0, 0, 0.15]}>
                <cylinderGeometry args={[0.07, 0.07, 0.08, 32]} />
                <meshStandardMaterial color="#2196f3" metalness={0.7} roughness={0.2} />
              </mesh>
            </group>
          );
        })()
      )}
      {/* Flight Controller - center of frame, slightly above */}
      {frame && fc && (
        <mesh
          position={[0, 0.55, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(fc); }}
          onDoubleClick={(e) => { e.stopPropagation(); onRemove(fc.id); }}
          onPointerOver={() => setHoveredPartId(fc.id)}
          onPointerOut={() => setHoveredPartId(null)}
        >
          <boxGeometry args={[0.4, 0.15, 0.4]} />
          <meshStandardMaterial color="#ff9800" />
        </mesh>
      )}
      {/* Companion Computer - next to FC, offset on X axis */}
      {frame && companion && (
        <mesh
          position={[0.6, 0.55, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(companion); }}
          onDoubleClick={(e) => { e.stopPropagation(); onRemove(companion.id); }}
          onPointerOver={() => setHoveredPartId(companion.id)}
          onPointerOut={() => setHoveredPartId(null)}
        >
          <boxGeometry args={[0.5, 0.18, 0.5]} />
          <meshStandardMaterial color="#43a047" />
        </mesh>
      )}
    </Canvas>
  );
}

const Playground = forwardRef(function Playground(props, ref) {
  const [canvasParts, setCanvasParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [warning, setWarning] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [hoveredPartId, setHoveredPartId] = useState(null);
  const [layersOpen, setLayersOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("info"); // "success", "error", "info", "warning"
  const [isEditing, setIsEditing] = useState(false);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const router = useRouter();
  const { buildName, setBuildName, setSavedBuilds: propSetSavedBuilds } = props;

  // Debug logging for buildName
  useEffect(() => {
    console.log('Playground buildName:', buildName);
    console.log('Playground user:', user);
  }, [buildName, user]);

  // Toast auto-hide with different durations
  useEffect(() => {
    if (toast) {
      const duration = toastType === 'error' ? 5000 : 3000; // Longer for errors
      const t = setTimeout(() => {
        setToast("");
        setToastType("info");
      }, duration);
      return () => clearTimeout(t);
    }
  }, [toast, toastType]);

  // Helper function to show toast
  const showToast = (message, type = "info") => {
    setToast(message);
    setToastType(type);
  };

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('builds')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Database connection error:', error);
        return false;
      }
      
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database test failed:', error);
      return false;
    }
  };

  // Debug function to test build loading
  const testBuildLoading = async () => {
    if (!user) return;
    
    try {
      console.log('Testing build loading...');
      const userBuilds = await getUserBuilds(user.id);
      console.log('User builds found:', userBuilds.length);
      
      if (userBuilds.length > 0) {
        const firstBuild = userBuilds[0];
        console.log('Testing load of first build:', firstBuild.id);
        const loadedBuild = await getBuild(firstBuild.id);
        console.log('Successfully loaded build:', loadedBuild);
        showToast(`Test: Loaded build "${loadedBuild.name}" successfully`, "success");
      } else {
        console.log('No builds found to test');
      }
    } catch (error) {
      console.error('Build loading test failed:', error);
      showToast('Build loading test failed', "error");
    }
  };

  // On mount: check user and load build if editing
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('User loaded:', user);
      if (user) {
        loadUserBuilds(user.id);
        // Test database connection
        await testDatabaseConnection();
        // Test build loading
        await testBuildLoading();
      }
    };
    checkUser();

    // Check if we're editing an existing build
    const { id } = router.query;
    if (id) {
      console.log('URL contains build ID:', id);
      loadBuildForEditing(id);
    }
  }, [router.query]);

  // Handle AI-generated specs from dashboard
  useEffect(() => {
    const aiSpecs = localStorage.getItem('ai_generated_specs');
    const aiPrompt = localStorage.getItem('ai_prompt');
    
    if (aiSpecs && aiPrompt) {
      try {
        const specs = JSON.parse(aiSpecs);
        console.log('AI specs found:', specs);
        console.log('AI prompt:', aiPrompt);
        
        // Apply AI specs to the playground
        applyAiSpecs(specs, aiPrompt);
        
        // Clear the localStorage
        localStorage.removeItem('ai_generated_specs');
        localStorage.removeItem('ai_prompt');
      } catch (error) {
        console.error('Error parsing AI specs:', error);
      }
    }
  }, []);

  // Function to apply AI-generated specs
  const applyAiSpecs = (specs, prompt) => {
    const newParts = [];
    
    // Map AI specs to actual parts
    if (specs.frame) {
      // Find matching frame based on AI recommendation
      const frameType = specs.frame.type.toLowerCase();
      let framePart = null;
      
      if (frameType.includes('racing') || frameType.includes('5-inch')) {
        framePart = FRAME_TYPES.find(f => f.id === 'frame-x');
      } else if (frameType.includes('cinewhoop')) {
        framePart = FRAME_TYPES.find(f => f.id === 'frame-cinewhoop');
      } else if (frameType.includes('tinywhoop')) {
        framePart = FRAME_TYPES.find(f => f.id === 'frame-tinywhoop');
      } else if (frameType.includes('hex')) {
        framePart = FRAME_TYPES.find(f => f.id === 'frame-hex');
      } else if (frameType.includes('octo')) {
        framePart = FRAME_TYPES.find(f => f.id === 'frame-octo');
      } else {
        framePart = FRAME_TYPES.find(f => f.id === 'frame-h');
      }
      
      if (framePart) {
        newParts.push(framePart);
      }
    }
    
    if (specs.motors) {
      const motorType = specs.motors.type.toLowerCase();
      let motorPart = null;
      
      if (motorType.includes('racing') || motorType.includes('2207')) {
        motorPart = MOTOR_TYPES.find(m => m.id === 'motor-racing');
      } else if (motorType.includes('cinewhoop')) {
        motorPart = MOTOR_TYPES.find(m => m.id === 'motor-cinewhoop');
      } else if (motorType.includes('heavy') || motorType.includes('lift')) {
        motorPart = MOTOR_TYPES.find(m => m.id === 'motor-heavy');
      } else {
        motorPart = MOTOR_TYPES.find(m => m.id === 'motor-standard');
      }
      
      if (motorPart) {
        newParts.push(motorPart);
      }
    }
    
    if (specs.escs) {
      const escType = specs.escs.type.toLowerCase();
      let escPart = null;
      
      if (escType.includes('racing') || escType.includes('40a')) {
        escPart = ESC_TYPES.find(e => e.id === 'esc-racing');
      } else {
        escPart = ESC_TYPES.find(e => e.id === 'esc-standard');
      }
      
      if (escPart) {
        newParts.push(escPart);
      }
    }
    
    if (specs.flightController) {
      const fcType = specs.flightController.type.toLowerCase();
      let fcPart = null;
      
      if (fcType.includes('pixhawk')) {
        fcPart = FC_TYPES.find(f => f.id === 'fc-pixhawk');
      } else if (fcType.includes('orange') || fcType.includes('cube')) {
        fcPart = FC_TYPES.find(f => f.id === 'fc-orangecube');
      } else if (fcType.includes('matek')) {
        fcPart = FC_TYPES.find(f => f.id === 'fc-matek');
      } else if (fcType.includes('betaflight') || fcType.includes('f7')) {
        fcPart = FC_TYPES.find(f => f.id === 'fc-betaflight');
      } else {
        fcPart = FC_TYPES.find(f => f.id === 'fc-matek');
      }
      
      if (fcPart) {
        newParts.push(fcPart);
      }
    }
    
    if (specs.props) {
      const propType = specs.props.type.toLowerCase();
      let propPart = null;
      
      if (propType.includes('racing') || propType.includes('tri-blade')) {
        propPart = PROPELLER_TYPES.find(p => p.id === 'prop-racing');
      } else if (propType.includes('cinewhoop') || propType.includes('ducted')) {
        propPart = PROPELLER_TYPES.find(p => p.id === 'prop-cinewhoop');
      } else {
        propPart = PROPELLER_TYPES.find(p => p.id === 'prop-standard');
      }
      
      if (propPart) {
        newParts.push(propPart);
      }
    }
    
    // Add battery and camera
    const batteryPart = OTHER_PARTS.find(p => p.id === 'battery');
    const cameraPart = OTHER_PARTS.find(p => p.id === 'camera');
    
    if (batteryPart) newParts.push(batteryPart);
    if (cameraPart) newParts.push(cameraPart);
    
    // Apply the parts to the canvas
    setCanvasParts(newParts);
    
    // Set build name based on AI prompt
    const buildName = `AI Generated - ${prompt.substring(0, 30)}...`;
    if (setBuildName) {
      setBuildName(buildName);
    }
    
    showToast(`Applied AI-generated specifications for: "${prompt}"`, "success");
  };

  const loadUserBuilds = async (userId) => {
    try {
      const builds = await getUserBuilds(userId);
      setSavedBuilds(builds);
      if (propSetSavedBuilds) {
        propSetSavedBuilds(builds);
      }
    } catch (error) {
      console.error('Error loading builds:', error);
    }
  };

  // Load build for editing from URL parameter
  const loadBuildForEditing = async (buildId) => {
    if (!buildId) return;
    
    console.log('Loading build for editing:', buildId);
    console.log('Current user:', user);
    console.log('Current user ID:', user?.id);
    setLoading(true);
    try {
      const build = await getBuild(buildId);
      console.log('Build data received:', build);
      console.log('Build user ID:', build?.user_id);
      
      if (build) {
        // Check if the current user owns this build
        console.log('Comparing user IDs:', {
          buildUserId: build.user_id,
          currentUserId: user?.id,
          match: build.user_id === user?.id
        });
        
        // TEMPORARY: Bypass user check for debugging - REMOVE THIS LATER
        console.log('TEMPORARY: Bypassing user ownership check for debugging');
        /*
        if (build.user_id !== user?.id) {
          console.error('User mismatch:', { buildUserId: build.user_id, currentUserId: user?.id });
          showToast("Access denied. You can only load your own builds.", "error");
          return;
        }
        */
        
        console.log('Setting canvas parts:', build.parts);
        console.log('Setting build name:', build.name);
        
        // Validate parts data
        if (!build.parts || !Array.isArray(build.parts)) {
          console.error('Invalid parts data:', build.parts);
          showToast("Build data is corrupted. Parts not found.", "error");
          return;
        }
        
        setCanvasParts(build.parts || []);
        if (setBuildName) {
          setBuildName(build.name || '');
        }
        setIsEditing(true);
        setCurrentBuildId(buildId);
        showToast(`Loaded build: ${build.name}`, "success");
      } else {
        console.error('No build found for ID:', buildId);
        showToast("Build not found", "error");
      }
    } catch (error) {
      console.error('Error loading build for editing:', error);
      
      // Try to provide more specific error messages
      if (error.message.includes('policy') || error.code === 'PGRST116') {
        showToast("Access denied. You can only load your own builds.", "error");
      } else if (error.message.includes('not found')) {
        showToast("Build not found. It may have been deleted.", "error");
      } else {
        showToast(`Error loading build: ${error.message}`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Save build to database
  const saveBuild = async () => {
    console.log('Save build called with:', { buildName, user, canvasParts: canvasParts.length });
    
    if (!buildName) {
      showToast("Please enter a build name", "warning");
      console.log('Build name is missing');
      return;
    }
    
    if (!user) {
      showToast("Please ensure you're logged in", "warning");
      console.log('User is missing');
      return;
    }
    
    if (canvasParts.length === 0) {
      showToast("Please add at least one part to your build", "warning");
      console.log('No parts added');
      return;
    }
    
    setLoading(true);
    try {
      const analysis = analyzeBuildDB(canvasParts);
      const buildData = {
        user_id: user.id,
        name: buildName,
        parts: canvasParts,
        total_cost: analysis.totalCost,
        total_weight: analysis.totalWeight,
        flight_time: analysis.flightTime,
        max_payload: analysis.maxPayload,
        estimated_speed: analysis.estimatedSpeed,
        estimated_range: analysis.estimatedRange
      };
      
      console.log('Saving build data:', buildData);
      
      let savedBuild;
      if (isEditing && currentBuildId) {
        // Update existing build
        console.log('Updating existing build:', currentBuildId);
        savedBuild = await updateBuild(currentBuildId, buildData);
        showToast("Build updated successfully!", "success");
      } else {
        // Create new build
        console.log('Creating new build');
        savedBuild = await createBuild(buildData);
        showToast("Build saved successfully!", "success");
      }
      
      // Refresh builds list in playground
      await loadUserBuilds(user.id);
      
      // Update parent component's builds list
      if (propSetSavedBuilds) {
        const updatedBuilds = await getUserBuilds(user.id);
        propSetSavedBuilds(updatedBuilds);
      }
      
      // Reset form
      if (setBuildName) {
        setBuildName("");
      }
      setIsEditing(false);
      setCurrentBuildId(null);
      
      console.log('Build saved successfully:', savedBuild);
    } catch (error) {
      console.error('Error saving build:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Show more specific error message
      if (error.message) {
        showToast(`Error: ${error.message}`, "error");
      } else {
        showToast("Error saving build. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load build from database
  const loadBuild = async (buildId) => {
    setLoading(true);
    try {
      const build = await getBuild(buildId);
      if (build) {
        setCanvasParts(build.parts || []);
        setBuildName(build.name || '');
        setIsEditing(true);
        setCurrentBuildId(buildId);
        showToast(`Loaded build: ${build.name}`, "success");
      }
    } catch (error) {
      console.error('Error loading build:', error);
      showToast("Error loading build", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete build from database
  const deleteUserBuild = async (buildId) => {
    if (!confirm('Are you sure you want to delete this build? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteBuild(buildId);
      await loadUserBuilds(user.id);
      showToast("Build deleted successfully", "success");
      
      // If we're editing the deleted build, clear the form
      if (currentBuildId === buildId) {
        setCanvasParts([]);
        setBuildName("");
        setIsEditing(false);
        setCurrentBuildId(null);
      }
    } catch (error) {
      console.error('Error deleting build:', error);
      showToast("Error deleting build", "error");
    }
  };

  // Enhanced Export functions
  const exportJSON = () => {
    const analysis = analyzeBuildDB(canvasParts);
    const exportData = {
      buildName: buildName || 'Untitled Build',
      createdAt: new Date().toISOString(),
      parts: canvasParts,
      analysis: {
        totalCost: analysis.totalCost,
        totalWeight: analysis.totalWeight,
        flightTime: analysis.flightTime,
        maxPayload: analysis.maxPayload,
        estimatedSpeed: analysis.estimatedSpeed,
        estimatedRange: analysis.estimatedRange,
        warnings: analysis.warnings
      },
      metadata: {
        partsCount: canvasParts.length,
        frameType: canvasParts.find(p => p.category === 'frame')?.name || 'None',
        motorCount: canvasParts.filter(p => p.category === 'motor').length
      }
    };
    
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildName || 'drone-build'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Build exported as JSON", "success");
  };

  const exportCSV = () => {
    const analysis = analyzeBuildDB(canvasParts);
    
    // Create comprehensive CSV with parts and analysis
    const partsData = canvasParts.map(p => ({
      Name: p.name,
      Type: p.category || 'other',
      Cost: p.cost || 0,
      Weight: p.weight || 0,
      Description: p.description || ''
    }));
    
    // Add summary row
    const summaryRow = {
      Name: 'TOTAL',
      Type: 'SUMMARY',
      Cost: analysis.totalCost,
      Weight: analysis.totalWeight,
      Description: `Flight Time: ${analysis.flightTime}min, Max Payload: ${analysis.maxPayload}g`
    };
    
    const allData = [...partsData, summaryRow];
    
    // Convert to CSV
    const headers = ['Name', 'Type', 'Cost', 'Weight', 'Description'];
    const csvContent = [
      headers.join(','),
      ...allData.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildName || 'drone-build'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Build exported as CSV", "success");
  };

  // Helper: Analyze build
  function analyzeBuild() {
    const frame = getFrame(canvasParts);
    const motors = getMotors(canvasParts);
    const props = getProps(canvasParts);
    const escs = getESCs(canvasParts);
    const battery = canvasParts.find((p) => p.id === "battery");
    
    if (!frame || motors.length !== frame.arms || props.length !== frame.arms || escs.length !== frame.arms || !battery) {
      setAnalysis({
        warnings: ["Incomplete build! Please add a frame, battery, and the correct number of motors, props, and ESCs."],
      });
      setShowAnalysis(true);
      return;
    }
    
    const frameWeight = frame.weight || 100;
    const motorWeight = 35 * motors.length;
    const propWeight = 5 * props.length;
    const escWeight = 10 * escs.length;
    const batteryWeight = 180;
    const totalWeight = frameWeight + motorWeight + propWeight + escWeight + batteryWeight;
    
    const totalThrust = motors.reduce((sum, m) => sum + (m.thrust || 800), 0);
    const maxPayload = totalThrust - totalWeight;
    const batteryCapacity = battery.capacity || 2200;
    const flightTime = Math.max(0, Math.round((batteryCapacity / (totalWeight * 0.8)) * 0.6 * 10) / 10);
    
    const avgKV = motors.reduce((sum, m) => sum + (m.kv || 2300), 0) / motors.length;
    const speed = Math.round((avgKV / 1000) * 40);
    const range = Math.round(flightTime * speed / 2);
    
    const warnings = [];
    if (totalThrust < totalWeight * 1.5) warnings.push("Underpowered build! Thrust-to-weight ratio is too low.");
    if (flightTime < 5) warnings.push("Very short flight time!");
    if (maxPayload < 0) warnings.push("Cannot lift any payload!");
    
    setAnalysis({
      totalWeight,
      totalThrust,
      maxPayload,
      flightTime,
      speed,
      range,
      warnings,
    });
    setShowAnalysis(true);
  }

  function handleDragEnd(event) {
    setWarning("");
    const { over, active } = event;
    if (over && over.id === "canvas") {
      const part = [
        ...FRAME_TYPES,
        ...MOTOR_TYPES,
        ...PROPELLER_TYPES,
        ...ESC_TYPES,
        ...FC_TYPES,
        ...COMPANION_TYPES,
        ...OTHER_PARTS
      ].find((p) => p.id === active.id);
      if (!part) return;
      
      const frame = getFrame(canvasParts);
      const motors = getMotors(canvasParts);
      const props = getProps(canvasParts);
      const escs = getESCs(canvasParts);
      const fc = getFC(canvasParts);
      const companion = getCompanion(canvasParts);
      
      // Frame logic
      if (part.id.startsWith("frame-")) {
        setCanvasParts([
          ...canvasParts.filter((p) => !p.id.startsWith("frame-")),
          part
        ]);
        return;
      }
      
      // Motor logic
      if (part.id.startsWith("motor-")) {
        if (!frame) {
          setWarning("Add a frame first!");
          return;
        }
        if (!Array.isArray(part.compatible) || !part.compatible.includes(frame.id)) {
          setWarning("This motor is not compatible with the selected frame.");
          return;
        }
        if (motors.length >= frame.arms) {
          setWarning(`This frame supports only ${frame.arms} motors.`);
          return;
        }
        setCanvasParts([...canvasParts, part]);
        return;
      }
      
      // Propeller logic
      if (part.id.startsWith("prop-")) {
        if (!frame) {
          setWarning("Add a frame first!");
          return;
        }
        if (props.length >= frame.arms) {
          setWarning(`This frame supports only ${frame.arms} propellers.`);
          return;
        }
        const motor = motors[props.length];
        if (!motor) {
          setWarning("Add a compatible motor before adding a propeller.");
          return;
        }
        if (!Array.isArray(part.compatible) || !part.compatible.includes(motor.id)) {
          setWarning("This propeller is not compatible with the selected motor.");
          return;
        }
        setCanvasParts([...canvasParts, part]);
        return;
      }
      
      // ESC logic
      if (part.id.startsWith("esc-")) {
        if (!frame) {
          setWarning("Add a frame first!");
          return;
        }
        if (escs.length >= frame.arms) {
          setWarning(`This frame supports only ${frame.arms} ESCs.`);
          return;
        }
        const motor = motors[escs.length];
        if (!motor) {
          setWarning("Add a compatible motor before adding an ESC.");
          return;
        }
        if (!Array.isArray(part.compatible) || !part.compatible.includes(motor.id)) {
          setWarning("This ESC is not compatible with the selected motor.");
          return;
        }
        setCanvasParts([...canvasParts, part]);
        return;
      }
      
      // Flight Controller logic
      if (part.id.startsWith("fc-")) {
        if (fc) {
          setWarning("Only one flight controller can be added.");
          return;
        }
        setCanvasParts([...canvasParts, part]);
        return;
      }
      
      // Companion Computer logic
      if (part.id.startsWith("companion-")) {
        if (companion) {
          setWarning("Only one companion computer can be added.");
          return;
        }
        setCanvasParts([...canvasParts, part]);
        return;
      }

      // Other parts: only one of each
      if (canvasParts.some((p) => p.id === part.id)) {
        setWarning("This part is already added.");
        return;
      }
      setCanvasParts([...canvasParts, part]);
    }
  }

  // Remove part by id (removes only the first occurrence)
  function removePartByIdAtIndex(index) {
    setCanvasParts(parts => parts.slice(0, index).concat(parts.slice(index + 1)));
  }

  // Expose handlers for Navbar
  useImperativeHandle(ref, () => ({
    saveBuild,
    loadBuild,
    exportJSON,
    exportCSV,
    deleteUserBuild
  }));

  return (
    <ProtectedRoute>
      {/* Loading overlay for build loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading build...</p>
          </div>
        </div>
      )}
      
      <DndContext onDragEnd={handleDragEnd}>
        <div className="min-h-screen w-full flex flex-row bg-gradient-to-br from-blue-50 to-white overflow-x-auto">
          {/* Sidebar */}
          <aside className="w-72 min-w-[16rem] max-w-[18rem] bg-white/80 border-r border-gray-100 p-6 flex flex-col gap-4 shadow-md h-screen sticky top-0 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Drone Parts</h2>
            {PART_GROUPS.map((group) => (
              <CollapsibleGroup key={group.label} label={group.label} defaultOpen={group.label === "Frames"}>
                {group.parts.map((part) => (
                  <div key={part.id} onClick={() => setSelectedPart(part)}>
                    <DraggablePart part={part} />
                  </div>
                ))}
              </CollapsibleGroup>
            ))}
            <div className="mt-8 text-xs text-gray-500">Drag parts to the playground →</div>
          </aside>

          {/* Main Playground */}
          <main className="flex-1 flex flex-col items-center justify-center p-8 relative min-w-[600px] max-w-[900px] mx-auto overflow-x-auto">
            {/* UI controls above playground */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <button
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition"
                onClick={() => { setCanvasParts([]); setWarning(""); }}
              >
                Clear Playground
              </button>
              <button
                className="px-6 py-3 rounded-lg bg-green-500 text-white font-bold shadow hover:bg-green-600 transition"
                onClick={() => {
                  setWarning("");
                  const frame = FRAME_TYPES[Math.floor(Math.random() * FRAME_TYPES.length)];
                  const motors = MOTOR_TYPES.filter(m => Array.isArray(m.compatible) && m.compatible.includes(frame.id));
                  const motor = motors[Math.floor(Math.random() * motors.length)];
                  const props = PROPELLER_TYPES.filter(p => Array.isArray(p.compatible) && p.compatible.includes(motor.id));
                  const prop = props[Math.floor(Math.random() * props.length)];
                  const escs = ESC_TYPES.filter(e => Array.isArray(e.compatible) && e.compatible.includes(motor.id));
                  const esc = escs[Math.floor(Math.random() * escs.length)];
                  setCanvasParts([
                    frame,
                    ...Array(frame.arms).fill(motor),
                    ...Array(frame.arms).fill(prop),
                    ...Array(frame.arms).fill(esc),
                    OTHER_PARTS[0], // battery
                    OTHER_PARTS[1], // camera
                  ]);
                }}
              >
                Surprise Me!
              </button>
              <button className="px-6 py-3 rounded-lg bg-purple-600 text-white font-bold shadow hover:bg-purple-700 transition" onClick={analyzeBuild}>Analyze Build</button>
              <div className="ml-4 text-lg font-semibold text-gray-700">Total Cost: <span className="text-blue-700">${canvasParts.reduce((sum, p) => sum + (p.cost || 0), 0)}</span></div>
            </div>
            <DroppableCanvas>
              <div className="w-full flex items-center justify-center">
                <div className="max-w-[700px] min-w-[500px] mx-auto">
                  <Drone3D parts={canvasParts} onSelect={setSelectedPart} onRemove={removePartByIdAtIndex} hoveredPartId={hoveredPartId} setHoveredPartId={setHoveredPartId} />
                </div>
              </div>
              {canvasParts.length === 0 && (
                <div className="text-gray-400 text-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Drag parts here to start building your drone!</div>
              )}
            </DroppableCanvas>
            {warning && (
              <div className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded shadow text-center font-semibold">{warning}</div>
            )}
          </main>

          {/* Info Panel */}
          <aside className="w-80 min-w-[18rem] max-w-[22rem] bg-white/90 border-l border-gray-100 p-6 flex flex-col gap-4 shadow-md h-screen sticky top-0 overflow-y-auto">
            {/* Build Status Header */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isEditing ? 'Editing Build' : 'New Build'}
                </h2>
                {buildName && (
                  <p className="text-sm text-gray-600 truncate">
                    {buildName}
                  </p>
                )}
              </div>
              {isEditing && currentBuildId && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-mono">
                  {currentBuildId.slice(0, 8)}...
                </span>
              )}
            </div>
            
            {/* Part Info */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-700">Part Info</h2>
            </div>
            {selectedPart ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{selectedPart.emoji}</span>
                  <span className="font-semibold text-lg">{selectedPart.name}</span>
                </div>
                <div className="text-gray-700 mt-2">{selectedPart.description}</div>
                {selectedPart.useCase && (
                  <div className="text-blue-600 text-sm mt-2">Use case: {selectedPart.useCase}</div>
                )}
                {selectedPart.properties && (
                  <div className="text-gray-500 text-xs mt-1">Properties: {selectedPart.properties}</div>
                )}
                {selectedPart.funFact && (
                  <div className="text-blue-500 text-sm mt-2">💡 {selectedPart.funFact}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-400">Click a part to learn more!</div>
            )}
            <div className="mt-8 text-xs text-gray-400">Tip: Click any part to see what it does.</div>

            {/* Layers */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-700">Layers</h2>
              <button
                className="text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                onClick={() => setLayersOpen((v) => !v)}
                title={layersOpen ? 'Collapse' : 'Expand'}
              >{layersOpen ? '▲' : '▼'}</button>
            </div>
            {layersOpen && (
              <div className="flex flex-col gap-2 mb-6">
                {canvasParts.map((part, i) => (
                  <div key={part.id + '-' + i} className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded shadow-sm">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedPart(part)}>
                      <span className="text-lg">{part.emoji}</span>
                      <span className="font-medium text-gray-800">{part.name}</span>
                    </div>
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold px-2"
                      onClick={() => removePartByIdAtIndex(i)}
                      title="Remove"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
        
        {/* Analysis Modal */}
        {showAnalysis && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Build Analysis</h2>
              {analysis && (
                <>
                  <div className="mb-2">Total Weight: <b>{analysis.totalWeight}g</b></div>
                  <div className="mb-2">Total Thrust: <b>{analysis.totalThrust}g</b></div>
                  <div className="mb-2">Max Payload: <b>{analysis.maxPayload}g</b></div>
                  <div className="mb-2">Estimated Flight Time: <b>{analysis.flightTime} min</b></div>
                  <div className="mb-2">Estimated Speed: <b>{analysis.speed} km/h</b></div>
                  <div className="mb-2">Estimated Range: <b>{analysis.range} m</b></div>
                  {analysis.warnings && analysis.warnings.length > 0 && (
                    <div className="mt-4 text-red-600 font-semibold">
                      {analysis.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                    </div>
                  )}
                </>
              )}
              <button className="mt-6 px-4 py-2 rounded bg-blue-600 text-white font-bold" onClick={() => setShowAnalysis(false)}>Close</button>
            </div>
          </div>
        )}
        
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fade-in text-white font-medium ${
            toastType === 'success' ? 'toast-success' :
            toastType === 'error' ? 'toast-error' :
            toastType === 'warning' ? 'toast-warning' :
            'toast-info'
          }`}>
            <div className="flex items-center space-x-2">
              {toastType === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toastType === 'warning' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {toastType === 'info' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{toast}</span>
            </div>
          </div>
        )}
      </DndContext>
    </ProtectedRoute>
  );
});

export default Playground; 