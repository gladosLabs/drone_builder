import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect } from "react";
import { Html } from "@react-three/drei";

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

// 3D Drone Playground (same as before, but use correct part arrays)
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

export default function Dashboard() {
  const [canvasParts, setCanvasParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [warning, setWarning] = useState("");
  // New state for advanced features
  const [showCost, setShowCost] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showFunFacts, setShowFunFacts] = useState(false);
  const [compareParts, setCompareParts] = useState([]);
  const [funFact, setFunFact] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [hoveredPartId, setHoveredPartId] = useState(null);
  const [layersOpen, setLayersOpen] = useState(true);

  // Helper: Analyze build
  function analyzeBuild() {
    // Get parts
    const frame = getFrame(canvasParts);
    const motors = getMotors(canvasParts);
    const props = getProps(canvasParts);
    const escs = getESCs(canvasParts);
    const battery = canvasParts.find((p) => p.id === "battery");
    // Basic checks
    if (!frame || motors.length !== frame.arms || props.length !== frame.arms || escs.length !== frame.arms || !battery) {
      setAnalysis({
        warnings: ["Incomplete build! Please add a frame, battery, and the correct number of motors, props, and ESCs."],
      });
      setShowAnalysis(true);
      return;
    }
    // Weight
    const frameWeight = frame.weight || 100;
    const motorWeight = 35 * motors.length;
    const propWeight = 5 * props.length;
    const escWeight = 10 * escs.length;
    const batteryWeight = 180;
    const totalWeight = frameWeight + motorWeight + propWeight + escWeight + batteryWeight;
    // Thrust
    const totalThrust = motors.reduce((sum, m) => sum + (m.thrust || 800), 0);
    // Max payload
    const maxPayload = totalThrust - totalWeight;
    // Flight time (very rough): battery (mAh) / (totalWeight * 0.8) * 0.6
    const batteryCapacity = battery.capacity || 2200;
    const flightTime = Math.max(0, Math.round((batteryCapacity / (totalWeight * 0.8)) * 0.6 * 10) / 10); // in minutes
    // Speed (mock): avg motor KV * prop factor
    const avgKV = motors.reduce((sum, m) => sum + (m.kv || 2300), 0) / motors.length;
    const speed = Math.round((avgKV / 1000) * 40); // km/h
    // Range (mock): flightTime * speed / 2
    const range = Math.round(flightTime * speed / 2);
    // Warnings
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
      // Find part in all groups
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
        // Find the motor for this prop
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
        // Find the motor for this ESC
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

  return (
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
          <div className="flex flex-wrap gap-3 mb-6">
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
                // Randomize: pick a frame, then compatible motors, props, escs
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
          {/* Playful/Exploratory Buttons (removed duplicate) */}
        </main>

        {/* Info Panel */}
        <aside className="w-80 min-w-[18rem] max-w-[22rem] bg-white/90 border-l border-gray-100 p-6 flex flex-col gap-4 shadow-md h-screen sticky top-0 overflow-y-auto">
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
          <h2 className="text-xl font-bold mb-4 text-blue-700">Part Info</h2>
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
        </aside>
      </div>
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
    </DndContext>
  );
} 