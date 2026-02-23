import { useState, useEffect } from 'react';
import Head from 'next/head';
import DroneViewport from '../components/DroneViewport';
import SimpleTest from '../components/SimpleTest';

export default function UEPlayground() {
    const [selectedComponents, setSelectedComponents] = useState({
        frame: { id: 2, name: 'QAV-R 2', size: '6"', weight: 150, price: 99.99, image: '/images/frame-qav-r2.jpg' },
        motors: [
            { id: 1, name: 'Lumenier ZIP V2 2407', kv: 1700, weight: 32, price: 29.99, image: '/images/motor-zip-v2.jpg' },
            { id: 1, name: 'Lumenier ZIP V2 2407', kv: 1700, weight: 32, price: 29.99, image: '/images/motor-zip-v2.jpg' },
            { id: 1, name: 'Lumenier ZIP V2 2407', kv: 1700, weight: 32, price: 29.99, image: '/images/motor-zip-v2.jpg' },
            { id: 1, name: 'Lumenier ZIP V2 2407', kv: 1700, weight: 32, price: 29.99, image: '/images/motor-zip-v2.jpg' }
        ],
        escs: [
            { id: 1, name: 'T-Motor FLAME 60A', current: 60, weight: 8, price: 45.99, image: '/images/esc-flame.jpg' },
            { id: 1, name: 'T-Motor FLAME 60A', current: 60, weight: 8, price: 45.99, image: '/images/esc-flame.jpg' },
            { id: 1, name: 'T-Motor FLAME 60A', current: 60, weight: 8, price: 45.99, image: '/images/esc-flame.jpg' },
            { id: 1, name: 'T-Motor FLAME 60A', current: 60, weight: 8, price: 45.99, image: '/images/esc-flame.jpg' }
        ],
        props: [
            { id: 1, name: 'Gate Breaker 5x5.3x3', size: '5"', pitch: 5.3, blades: 3, price: 12.99, image: '/images/prop-gate-breaker.jpg' },
            { id: 1, name: 'Gate Breaker 5x5.3x3', size: '5"', pitch: 5.3, blades: 3, price: 12.99, image: '/images/prop-gate-breaker.jpg' },
            { id: 1, name: 'Gate Breaker 5x5.3x3', size: '5"', pitch: 5.3, blades: 3, price: 12.99, image: '/images/prop-gate-breaker.jpg' },
            { id: 1, name: 'Gate Breaker 5x5.3x3', size: '5"', pitch: 5.3, blades: 3, price: 12.99, image: '/images/prop-gate-breaker.jpg' }
        ],
        battery: null,
        flightController: null
    });
    
    const [simulationMode, setSimulationMode] = useState('design'); // 'design' or 'simulate'
    const [performanceMetrics, setPerformanceMetrics] = useState({
        thrust: 0,
        efficiency: 0,
        flightTime: 0,
        maxSpeed: 0
    });

    // Mock component data (this would come from your scraper)
    const mockComponents = {
        frames: [
            { id: 1, name: 'QAV-S 2', size: '5"', weight: 120, price: 89.99, image: '/images/frame-qav-s2.jpg' },
            { id: 2, name: 'QAV-R 2', size: '6"', weight: 150, price: 99.99, image: '/images/frame-qav-r2.jpg' },
            { id: 3, name: 'QAV-Pro', size: '7"', weight: 180, price: 129.99, image: '/images/frame-qav-pro.jpg' }
        ],
        motors: [
            { id: 1, name: 'Lumenier ZIP V2 2407', kv: 1700, weight: 32, price: 29.99, image: '/images/motor-zip-v2.jpg' },
            { id: 2, name: 'T-Motor U11-II', kv: 120, weight: 320, price: 89.99, image: '/images/motor-u11.jpg' },
            { id: 3, name: 'EMAX RS2205', kv: 2300, weight: 28, price: 24.99, image: '/images/motor-rs2205.jpg' }
        ],
        escs: [
            { id: 1, name: 'T-Motor FLAME 60A', current: 60, weight: 8, price: 45.99, image: '/images/esc-flame.jpg' },
            { id: 2, name: 'Lumenier BLHeli_32 35A', current: 35, weight: 6, price: 32.99, image: '/images/esc-blheli.jpg' }
        ],
        props: [
            { id: 1, name: 'Gate Breaker 5x5.3x3', size: '5"', pitch: 5.3, blades: 3, price: 12.99, image: '/images/prop-gate-breaker.jpg' },
            { id: 2, name: 'HQProp 6x4.5', size: '6"', pitch: 4.5, blades: 2, price: 8.99, image: '/images/prop-hqprop.jpg' }
        ]
    };

    const addComponent = (type, component) => {
        setSelectedComponents(prev => ({
            ...prev,
            [type]: type === 'motors' || type === 'escs' || type === 'props' 
                ? [...prev[type], component]
                : component
        }));
    };

    const removeComponent = (type, componentId) => {
        setSelectedComponents(prev => ({
            ...prev,
            [type]: type === 'motors' || type === 'escs' || type === 'props'
                ? prev[type].filter(c => c.id !== componentId)
                : null
        }));
    };

    const calculatePerformance = () => {
        // Mock performance calculation
        const totalWeight = (selectedComponents.frame?.weight || 0) +
            selectedComponents.motors.reduce((sum, m) => sum + m.weight, 0) +
            selectedComponents.escs.reduce((sum, e) => sum + e.weight, 0) +
            selectedComponents.props.reduce((sum, p) => sum + 3, 0); // ~3g per prop

        const totalThrust = selectedComponents.motors.reduce((sum, m) => sum + (m.kv * 0.1), 0);
        const efficiency = totalThrust / totalWeight;
        const flightTime = Math.max(0, 15 - (totalWeight / 100)); // Mock calculation
        const maxSpeed = totalThrust / (totalWeight * 0.01);

        setPerformanceMetrics({
            thrust: Math.round(totalThrust),
            efficiency: Math.round(efficiency * 100) / 100,
            flightTime: Math.round(flightTime * 10) / 10,
            maxSpeed: Math.round(maxSpeed)
        });
    };

    useEffect(() => {
        if (simulationMode === 'simulate') {
            calculatePerformance();
        }
    }, [selectedComponents, simulationMode]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>UE Playground - DroneBuilder</title>
                <meta name="description" content="Unreal Engine powered drone building playground" />
            </Head>

            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">UE Playground</h1>
                            <p className="text-gray-600">Build and simulate drones in 3D</p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setSimulationMode('design')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    simulationMode === 'design'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Design Mode
                            </button>
                            <button
                                onClick={() => setSimulationMode('simulate')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    simulationMode === 'simulate'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Simulate Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Component Library */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Library</h2>
                            
                            {/* Frames */}
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-700 mb-3">Frames</h3>
                                <div className="space-y-2">
                                    {mockComponents.frames.map(frame => (
                                        <div
                                            key={frame.id}
                                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            onClick={() => addComponent('frame', frame)}
                                        >
                                            <div className="w-12 h-12 bg-gray-200 rounded mr-3"></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{frame.name}</div>
                                                <div className="text-xs text-gray-500">{frame.size} • {frame.weight}g</div>
                                            </div>
                                            <div className="text-sm font-medium text-green-600">${frame.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Motors */}
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-700 mb-3">Motors</h3>
                                <div className="space-y-2">
                                    {mockComponents.motors.map(motor => (
                                        <div
                                            key={motor.id}
                                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            onClick={() => addComponent('motors', motor)}
                                        >
                                            <div className="w-12 h-12 bg-gray-200 rounded mr-3"></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{motor.name}</div>
                                                <div className="text-xs text-gray-500">{motor.kv}KV • {motor.weight}g</div>
                                            </div>
                                            <div className="text-sm font-medium text-green-600">${motor.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ESCs */}
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-700 mb-3">ESCs</h3>
                                <div className="space-y-2">
                                    {mockComponents.escs.map(esc => (
                                        <div
                                            key={esc.id}
                                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            onClick={() => addComponent('escs', esc)}
                                        >
                                            <div className="w-12 h-12 bg-gray-200 rounded mr-3"></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{esc.name}</div>
                                                <div className="text-xs text-gray-500">{esc.current}A • {esc.weight}g</div>
                                            </div>
                                            <div className="text-sm font-medium text-green-600">${esc.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Props */}
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-700 mb-3">Propellers</h3>
                                <div className="space-y-2">
                                    {mockComponents.props.map(prop => (
                                        <div
                                            key={prop.id}
                                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            onClick={() => addComponent('props', prop)}
                                        >
                                            <div className="w-12 h-12 bg-gray-200 rounded mr-3"></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{prop.name}</div>
                                                <div className="text-xs text-gray-500">{prop.size} • {prop.pitch}" pitch</div>
                                            </div>
                                            <div className="text-sm font-medium text-green-600">${prop.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3D Viewport / Simulation */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {simulationMode === 'design' ? '3D Design Viewport' : 'Flight Simulation'}
                                </h2>
                                <div className="text-sm text-gray-500">
                                    {simulationMode === 'design' ? 'Drag components to build' : 'Real-time simulation'}
                                </div>
                            </div>

                            {/* Real 3D Viewport */}
                            <DroneViewport 
                                components={selectedComponents}
                                simulationMode={simulationMode}
                            />

                            {/* Performance Metrics */}
                            {simulationMode === 'simulate' && (
                                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-blue-600">Total Thrust</div>
                                        <div className="text-2xl font-bold text-blue-900">{performanceMetrics.thrust}g</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-green-600">Efficiency</div>
                                        <div className="text-2xl font-bold text-green-900">{performanceMetrics.efficiency}</div>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-yellow-600">Flight Time</div>
                                        <div className="text-2xl font-bold text-yellow-900">{performanceMetrics.flightTime}min</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-purple-600">Max Speed</div>
                                        <div className="text-2xl font-bold text-purple-900">{performanceMetrics.maxSpeed}km/h</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Components */}
                        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Components</h3>
                            
                            <div className="space-y-4">
                                {/* Frame */}
                                {selectedComponents.frame && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
                                            <div>
                                                <div className="font-medium">{selectedComponents.frame.name}</div>
                                                <div className="text-sm text-gray-500">Frame</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeComponent('frame')}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {/* Motors */}
                                {selectedComponents.motors.map((motor, index) => (
                                    <div key={`${motor.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
                                            <div>
                                                <div className="font-medium">{motor.name}</div>
                                                <div className="text-sm text-gray-500">Motor {index + 1}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeComponent('motors', motor.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                {/* ESCs */}
                                {selectedComponents.escs.map((esc, index) => (
                                    <div key={`${esc.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
                                            <div>
                                                <div className="font-medium">{esc.name}</div>
                                                <div className="text-sm text-gray-500">ESC {index + 1}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeComponent('escs', esc.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                {/* Props */}
                                {selectedComponents.props.map((prop, index) => (
                                    <div key={`${prop.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
                                            <div>
                                                <div className="font-medium">{prop.name}</div>
                                                <div className="text-sm text-gray-500">Prop {index + 1}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeComponent('props', prop.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                {!selectedComponents.frame && selectedComponents.motors.length === 0 && 
                                 selectedComponents.escs.length === 0 && selectedComponents.props.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        <div className="text-4xl mb-4">🚁</div>
                                        <div className="text-lg font-medium mb-2">No components selected</div>
                                        <div className="text-sm">Start building your drone by selecting components from the library</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 