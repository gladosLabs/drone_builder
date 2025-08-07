import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, Torus } from '@react-three/drei';
import { useRef } from 'react';

// Simple Drone Frame Component
function DroneFrame({ position = [0, 0, 0] }) {
    const meshRef = useRef();

    useFrame((state) => {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    });

    return (
        <group position={position}>
            {/* Main frame body */}
            <Box 
                ref={meshRef}
                args={[0.7, 0.08, 0.7]} 
                position={[0, 0, 0]}
            >
                <meshStandardMaterial 
                    color="#1a1a1a" 
                    metalness={0.8}
                    roughness={0.2}
                />
            </Box>

            {/* Frame arms */}
            <Box args={[0.08, 0.06, 1.1]} position={[0, 0, 0]}>
                <meshStandardMaterial 
                    color="#2d2d2d" 
                    metalness={0.6}
                    roughness={0.3}
                />
            </Box>
            <Box args={[1.1, 0.06, 0.08]} position={[0, 0, 0]}>
                <meshStandardMaterial 
                    color="#2d2d2d" 
                    metalness={0.6}
                    roughness={0.3}
                />
            </Box>

            {/* Motor mounts */}
            <Cylinder args={[0.12, 0.12, 0.08]} position={[0.55, 0.04, 0.55]}>
                <meshStandardMaterial 
                    color="#404040" 
                    metalness={0.7}
                    roughness={0.2}
                />
            </Cylinder>
            <Cylinder args={[0.12, 0.12, 0.08]} position={[-0.55, 0.04, 0.55]}>
                <meshStandardMaterial 
                    color="#404040" 
                    metalness={0.7}
                    roughness={0.2}
                />
            </Cylinder>
            <Cylinder args={[0.12, 0.12, 0.08]} position={[0.55, 0.04, -0.55]}>
                <meshStandardMaterial 
                    color="#404040" 
                    metalness={0.7}
                    roughness={0.2}
                />
            </Cylinder>
            <Cylinder args={[0.12, 0.12, 0.08]} position={[-0.55, 0.04, -0.55]}>
                <meshStandardMaterial 
                    color="#404040" 
                    metalness={0.7}
                    roughness={0.2}
                />
            </Cylinder>
        </group>
    );
}

// Updated Motor with corrected propeller rotation and positioning
function Motor({ position = [0, 0, 0] }) {
    const propRef = useRef();

    useFrame((state) => {
        propRef.current.rotation.y = state.clock.elapsedTime * 8;
    });

    return (
        <group position={position}>
            {/* Motor base */}
            <Cylinder args={[0.09, 0.09, 0.03]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#2c2c2c" metalness={0.8} roughness={0.2} />
            </Cylinder>

            {/* Motor body */}
            <Cylinder args={[0.08, 0.08, 0.12]} position={[0, 0.075, 0]}>
                <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
            </Cylinder>

            {/* Propellers (rotating) */}
            <group ref={propRef} position={[0, 0.22, 0]}>
                {/* Propeller hub */}
                <Cylinder args={[0.02, 0.02, 0.015]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#95a5a6" metalness={0.3} roughness={0.7} />
                </Cylinder>
                
                {/* Blade 1 - horizontal */}
                <Box args={[0.45, 0.012, 0.006]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#e74c3c" metalness={0.05} roughness={0.95} />
                </Box>
                
                {/* Blade 2 - perpendicular */}
                <Box args={[0.012, 0.45, 0.006]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#e74c3c" metalness={0.05} roughness={0.95} />
                </Box>
                
                {/* Hub mounting hole */}
                <Cylinder args={[0.002, 0.002, 0.02]} position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <meshStandardMaterial color="#34495e" />
                </Cylinder>
            </group>
        </group>
    );
}

// Simple ESC Component
function ESC({ position = [0, 0, 0] }) {
    return (
        <group position={position}>
            {/* ESC main body */}
            <Box args={[0.15, 0.1, 0.03]}>
                <meshStandardMaterial 
                    color="#3498db" 
                    metalness={0.4}
                    roughness={0.6}
                />
            </Box>
            
            {/* ESC heat sink fins */}
            <Box args={[0.15, 0.02, 0.05]} position={[0, 0.06, 0]}>
                <meshStandardMaterial 
                    color="#2980b9" 
                    metalness={0.7}
                    roughness={0.3}
                />
            </Box>
            <Box args={[0.15, 0.02, 0.05]} position={[0, -0.06, 0]}>
                <meshStandardMaterial 
                    color="#2980b9" 
                    metalness={0.7}
                    roughness={0.3}
                />
            </Box>
        </group>
    );
}

// Main Drone Assembly Component
function DroneAssembly({ components }) {
    // Check if we have any components to render
    const hasComponents = components.frame || 
                         components.motors.length > 0 || 
                         components.escs.length > 0 || 
                         components.props.length > 0;
    
    if (!hasComponents) {
        return (
            <>
                {/* Lighting */}
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                <directionalLight position={[-10, -10, -5]} intensity={0.8} />
                
                {/* Empty state message */}
                <Text
                    position={[0, 0, 0]}
                    fontSize={0.15}
                    color="#6b7280"
                    anchorX="center"
                    anchorY="middle"
                >
                    Select components to build your drone
                </Text>
            </>
        );
    }
    
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.8} />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />
            
            {/* Frame */}
            {components.frame && (
                <DroneFrame position={[0, 0, 0]} />
            )}
            
            {/* Motors */}
            {components.motors.map((motor, index) => {
                const positions = [
                    [0.55, 0.12, 0.55],   // Front right
                    [-0.55, 0.12, 0.55],  // Front left
                    [0.55, 0.12, -0.55],  // Back right
                    [-0.55, 0.12, -0.55]  // Back left
                ];
                
                if (index < 4) {
                    return (
                        <Motor 
                            key={`motor-${index}`}
                            position={positions[index]}
                        />
                    );
                }
                return null;
            })}
            
            {/* ESCs */}
            {components.escs.map((esc, index) => {
                const positions = [
                    [0.3, -0.05, 0.3],
                    [-0.3, -0.05, 0.3],
                    [0.3, -0.05, -0.3],
                    [-0.3, -0.05, -0.3]
                ];
                
                if (index < 4) {
                    return (
                        <ESC 
                            key={`esc-${index}`}
                            position={positions[index]}
                        />
                    );
                }
                return null;
            })}
            
            {/* Props are now integrated with motors - no separate propellers needed */}
            
            {/* Component Labels */}
            {components.frame && (
                <Text
                    position={[0, 0.6, 0]}
                    fontSize={0.08}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {components.frame.name}
                </Text>
            )}
        </>
    );
}

// Main Viewport Component
export default function DroneViewport({ components, simulationMode }) {
    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg h-96 relative overflow-hidden">
            <Canvas
                camera={{ position: [4, 3, 4], fov: 45 }}
                style={{ background: 'radial-gradient(ellipse at center, #1a202c 0%, #0f1419 100%)' }}
            >
                <OrbitControls 
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    maxPolarAngle={Math.PI / 2}
                    minDistance={2}
                    maxDistance={10}
                    dampingFactor={0.05}
                />
                
                <DroneAssembly components={components} />
                
                {/* Grid for reference */}
                <gridHelper args={[8, 8, '#4a5568', '#2d3748']} />
                
                {/* Mode indicator */}
                <Text
                    position={[-2.5, 2, 0]}
                    fontSize={0.12}
                    color={simulationMode === 'simulate' ? '#48bb78' : '#4299e1'}
                    anchorX="left"
                    anchorY="top"
                >
                    {simulationMode === 'simulate' ? 'SIMULATION MODE' : 'DESIGN MODE'}
                </Text>
            </Canvas>
            
            {/* Controls overlay */}
            <div className="absolute top-4 left-4 text-white text-sm bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400">🖱️</span>
                    <span>Drag to rotate</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400">🔍</span>
                    <span>Scroll to zoom</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400">📱</span>
                    <span>Right-click to pan</span>
                </div>
            </div>
            
            {/* Component count overlay */}
            <div className="absolute top-4 right-4 text-white text-sm bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                    <span className={components.frame ? 'text-green-400' : 'text-red-400'}>
                        {components.frame ? '✓' : '✗'}
                    </span>
                    <span>Frame</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400">{components.motors.length}/4</span>
                    <span>Motors</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-400">{components.escs.length}/4</span>
                    <span>ESCs</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-orange-400">{components.props.length}/4</span>
                    <span>Props</span>
                </div>
            </div>
        </div>
    );
} 