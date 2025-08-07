import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function TestCube() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="red" />
        </mesh>
    );
}

export default function SimpleTest() {
    return (
        <div className="bg-gray-900 rounded-lg h-96 relative overflow-hidden">
            <Canvas camera={{ position: [3, 3, 3] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <TestCube />
                <OrbitControls />
            </Canvas>
        </div>
    );
} 