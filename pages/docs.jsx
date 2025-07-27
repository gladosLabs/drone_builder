import { useState } from 'react';
import Link from 'next/link';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeSubsection, setActiveSubsection] = useState('');

  const sections = {
    'getting-started': {
      title: 'Getting Started',
      icon: '🚀',
      subsections: {
        'what-is-a-drone': 'What is a Drone?',
        'drone-types': 'Types of Drones',
        'first-build': 'Your First Build',
        'safety-first': 'Safety Guidelines'
      }
    },
    'components': {
      title: 'Drone Components',
      icon: '⚙️',
      subsections: {
        'frames': 'Frames & Structure',
        'motors': 'Motors & Propellers',
        'electronics': 'Flight Controllers & ESCs',
        'power': 'Batteries & Power Systems',
        'sensors': 'Sensors & GPS',
        'cameras': 'Cameras & FPV Systems',
        'companion-computers': 'Companion Computers'
      }
    },
    'physics': {
      title: 'Physics & Math',
      icon: '🔬',
      subsections: {
        'aerodynamics': 'Aerodynamics',
        'thrust-calculations': 'Thrust Calculations',
        'battery-math': 'Battery Mathematics',
        'weight-distribution': 'Weight & Balance',
        'flight-dynamics': 'Flight Dynamics'
      }
    },
    'building-guides': {
      title: 'Building Guides',
      icon: '🔧',
      subsections: {
        'racing-drone': 'Racing Drone',
        'cinematic-drone': 'Cinematic Drone',
        'long-range': 'Long Range Drone',
        'payload-drone': 'Payload Drone',
        'educational': 'Educational Drone'
      }
    },
    'parts-sourcing': {
      title: 'Parts & Sourcing',
      icon: '🛒',
      subsections: {
        'where-to-buy': 'Where to Buy Parts',
        'quality-guide': 'Quality Guide',
        'cost-breakdown': 'Cost Breakdown',
        'alternatives': 'Budget Alternatives'
      }
    },
    'robotics-basics': {
      title: 'Robotics Basics',
      icon: '🤖',
      subsections: {
        'control-systems': 'Control Systems',
        'pid-tuning': 'PID Tuning',
        'autonomous-flight': 'Autonomous Flight',
        'computer-vision': 'Computer Vision'
      }
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return renderGettingStarted();
      case 'components':
        return renderComponents();
      case 'physics':
        return renderPhysics();
      case 'building-guides':
        return renderBuildingGuides();
      case 'parts-sourcing':
        return renderPartsSourcing();
      case 'robotics-basics':
        return renderRoboticsBasics();
      default:
        return renderGettingStarted();
    }
  };

  const renderGettingStarted = () => {
    switch (activeSubsection) {
      case 'what-is-a-drone':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">What is a Drone?</h2>
            <p className="text-gray-700 leading-relaxed">
              A drone, also known as an Unmanned Aerial Vehicle (UAV), is an aircraft without a human pilot aboard. 
              Drones can be controlled remotely or fly autonomously using onboard computers and sensors.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-8">Key Characteristics:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Multi-rotor design:</strong> Most consumer drones use 4-8 rotors for stability</li>
              <li><strong>Electric power:</strong> Powered by lithium-polymer (LiPo) batteries</li>
              <li><strong>Flight controller:</strong> Computer that stabilizes and controls the aircraft</li>
              <li><strong>Remote control:</strong> Manual control via radio transmitter</li>
              <li><strong>Autonomous capabilities:</strong> GPS navigation, return-to-home, waypoint flying</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-8">Why Build Your Own?</h3>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900">Customization</h4>
                <p className="text-blue-700 text-sm">Choose exactly the components you need for your specific use case</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900">Learning</h4>
                <p className="text-green-700 text-sm">Understand the technology and principles behind flight</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900">Performance</h4>
                <p className="text-purple-700 text-sm">Achieve better performance than off-the-shelf options</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900">Repairability</h4>
                <p className="text-orange-700 text-sm">Easy to repair and upgrade when you understand the system</p>
              </div>
            </div>
          </div>
        );

      case 'drone-types':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Types of Drones</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Racing Drones</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Lightweight carbon fiber frames</li>
                  <li>• High KV motors (2300-2800 KV)</li>
                  <li>• 4-6 inch propellers</li>
                  <li>• FPV camera system</li>
                  <li>• Flight times: 3-5 minutes</li>
                  <li>• Top speeds: 80-120 mph</li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  Built for speed and agility in competitive racing environments.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Cinematic Drones</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Larger, stable frames</li>
                  <li>• Low KV motors (400-800 KV)</li>
                  <li>• 10-15 inch propellers</li>
                  <li>• High-quality camera gimbal</li>
                  <li>• Flight times: 15-30 minutes</li>
                  <li>• Smooth, stable flight</li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  Designed for professional video and photography applications.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Long Range Drones</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Efficient aerodynamic design</li>
                  <li>• Large capacity batteries</li>
                  <li>• Low KV motors for efficiency</li>
                  <li>• GPS navigation system</li>
                  <li>• Flight times: 30-60 minutes</li>
                  <li>• Range: 10-50+ km</li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  Built for extended flight times and long-distance operations.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Payload Drones</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Heavy-duty frames</li>
                  <li>• High-torque motors</li>
                  <li>• Large propellers</li>
                  <li>• Reinforced landing gear</li>
                  <li>• Payload capacity: 2-20 kg</li>
                  <li>• Industrial applications</li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  Designed to carry heavy loads for delivery or industrial use.
                </p>
              </div>
            </div>
          </div>
        );

      case 'first-build':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your First Build</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800">
                <strong>Beginner Tip:</strong> Start with a simple 5-inch racing drone build. It's the most common 
                and well-documented type, with plenty of community support.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800">Step-by-Step Process:</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Research & Planning</h4>
                  <p className="text-gray-700">Understand your requirements, budget, and skill level. Choose your frame size and motor configuration.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Component Selection</h4>
                  <p className="text-gray-700">Select compatible parts: frame, motors, ESCs, flight controller, propellers, battery, and radio system.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Assembly</h4>
                  <p className="text-gray-700">Mount motors, install ESCs, wire the flight controller, and attach propellers. Follow wiring diagrams carefully.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Configuration</h4>
                  <p className="text-gray-700">Configure your flight controller using Betaflight or similar software. Calibrate sensors and set up radio.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Testing</h4>
                  <p className="text-gray-700">Test without propellers first, then with propellers in a safe area. Gradually increase flight envelope.</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-8">Essential Tools:</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Soldering</h4>
                <p className="text-sm text-gray-600">Soldering iron, solder, flux, helping hands</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Assembly</h4>
                <p className="text-sm text-gray-600">Hex drivers, screwdrivers, wire strippers</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Testing</h4>
                <p className="text-sm text-gray-600">Multimeter, smoke stopper, battery checker</p>
              </div>
            </div>
          </div>
        );

      case 'safety-first':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Safety Guidelines</h2>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-800">
                <strong>⚠️ Critical:</strong> Drones can be dangerous. Always prioritize safety for yourself and others.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Pre-Flight Safety</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Always test without propellers first</li>
                  <li>• Check all connections and wiring</li>
                  <li>• Verify battery voltage and condition</li>
                  <li>• Ensure radio system is working</li>
                  <li>• Check for loose screws and parts</li>
                  <li>• Test in a safe, open area</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Flight Safety</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Never fly near people or animals</li>
                  <li>• Stay away from airports and restricted areas</li>
                  <li>• Keep line of sight with your drone</li>
                  <li>• Monitor battery levels closely</li>
                  <li>• Have an emergency landing plan</li>
                  <li>• Follow local regulations</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-8">Battery Safety:</h3>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <ul className="space-y-2 text-orange-800">
                <li>• Never charge damaged or swollen batteries</li>
                <li>• Use a proper LiPo charger with balance charging</li>
                <li>• Charge in a fire-safe container</li>
                <li>• Never leave charging batteries unattended</li>
                <li>• Store batteries at 3.8V per cell</li>
                <li>• Dispose of damaged batteries properly</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Getting Started with Drone Building</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to the world of drone building! This guide will help you understand the fundamentals 
              and get started with your first build. Choose a topic from the sidebar to begin learning.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">New to Drones?</h3>
                <p className="text-blue-700 mb-4">Start with "What is a Drone?" to understand the basics of how drones work and why you might want to build one.</p>
                <button 
                  onClick={() => setActiveSubsection('what-is-a-drone')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Learn the Basics
                </button>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-3">Ready to Build?</h3>
                <p className="text-green-700 mb-4">If you understand the basics, jump into "Your First Build" for a step-by-step guide to building your first drone.</p>
                <button 
                  onClick={() => setActiveSubsection('first-build')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Start Building
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderComponents = () => {
    switch (activeSubsection) {
      case 'frames':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Frames & Structure</h2>
            
            <p className="text-gray-700 leading-relaxed">
              The frame is the backbone of your drone, providing structure and mounting points for all components. 
              Frame choice affects performance, durability, and flight characteristics.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-8">Frame Types:</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">X-Frame (Most Common)</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Motors at 45° angles</li>
                  <li>• Good balance of efficiency and agility</li>
                  <li>• Standard for racing and freestyle</li>
                  <li>• Easy to find parts and support</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">H-Frame</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Motors in H configuration</li>
                  <li>• Better for long-range and efficiency</li>
                  <li>• Reduced drag in forward flight</li>
                  <li>• Good for cinematic applications</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Y-Frame</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Three arms in Y pattern</li>
                  <li>• Unique flight characteristics</li>
                  <li>• Less common, more experimental</li>
                  <li>• Can be more efficient in some cases</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Hexacopter/Octocopter</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• 6 or 8 motors for redundancy</li>
                  <li>• Better payload capacity</li>
                  <li>• Can fly with one motor failure</li>
                  <li>• Used for professional applications</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-8">Frame Materials:</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-4 h-4 bg-gray-800 rounded"></div>
                <div>
                  <h4 className="font-semibold text-gray-800">Carbon Fiber</h4>
                  <p className="text-sm text-gray-600">Lightweight, strong, expensive. Best for performance builds.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <div>
                  <h4 className="font-semibold text-gray-800">Aluminum</h4>
                  <p className="text-sm text-gray-600">Heavy, durable, conductive. Good for industrial applications.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <div>
                  <h4 className="font-semibold text-gray-800">Plastic/3D Printed</h4>
                  <p className="text-sm text-gray-600">Cheap, easy to replace, less durable. Good for learning.</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-8">Frame Sizes:</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Size</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Propeller</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Use Case</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Motor KV</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">2-3 inch</td>
                    <td className="border border-gray-300 px-4 py-2">2-3 inch</td>
                    <td className="border border-gray-300 px-4 py-2">Indoor, micro racing</td>
                    <td className="border border-gray-300 px-4 py-2">4000-6000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">5 inch</td>
                    <td className="border border-gray-300 px-4 py-2">5 inch</td>
                    <td className="border border-gray-300 px-4 py-2">Racing, freestyle</td>
                    <td className="border border-gray-300 px-4 py-2">2300-2800</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">7 inch</td>
                    <td className="border border-gray-300 px-4 py-2">7 inch</td>
                    <td className="border border-gray-300 px-4 py-2">Long range</td>
                    <td className="border border-gray-300 px-4 py-2">1500-2000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">10+ inch</td>
                    <td className="border border-gray-300 px-4 py-2">10+ inch</td>
                    <td className="border border-gray-300 px-4 py-2">Cinematic, payload</td>
                    <td className="border border-gray-300 px-4 py-2">400-800</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      // Add more component subsections here...
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Drone Components</h2>
            <p className="text-gray-700 leading-relaxed">
              Understanding each component is crucial for building a successful drone. Each part has specific 
              functions and compatibility requirements.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Start with Frames</h3>
                <p className="text-blue-700 mb-4">The frame is the foundation of your build. Learn about different types, materials, and sizes.</p>
                <button 
                  onClick={() => setActiveSubsection('frames')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Learn About Frames
                </button>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-3">Power Systems</h3>
                <p className="text-green-700 mb-4">Motors, ESCs, and batteries work together to provide thrust and flight time.</p>
                <button 
                  onClick={() => setActiveSubsection('motors')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Learn About Motors
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderPhysics = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Physics & Mathematics</h2>
        <p className="text-gray-700 leading-relaxed">
          Understanding the physics behind drone flight helps you make informed decisions about component selection 
          and predict performance characteristics.
        </p>
        
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">Coming Soon</h3>
          <p className="text-blue-700">
            Detailed physics content including aerodynamics, thrust calculations, battery mathematics, 
            weight distribution, and flight dynamics will be added here.
          </p>
        </div>
      </div>
    );
  };

  const renderBuildingGuides = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Building Guides</h2>
        <p className="text-gray-700 leading-relaxed">
          Step-by-step guides for building different types of drones, from beginner-friendly builds 
          to advanced professional applications.
        </p>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-green-900 mb-3">Coming Soon</h3>
          <p className="text-green-700">
            Comprehensive building guides for racing drones, cinematic drones, long-range builds, 
            payload drones, and educational drones will be added here.
          </p>
        </div>
      </div>
    );
  };

  const renderPartsSourcing = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Parts & Sourcing</h2>
        <p className="text-gray-700 leading-relaxed">
          Where to buy quality parts, how to evaluate component quality, and understanding cost breakdowns 
          for different build types.
        </p>
        
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-900 mb-3">Coming Soon</h3>
          <p className="text-purple-700">
            Detailed sourcing guides, quality evaluation criteria, cost breakdowns, and budget alternatives 
            will be added here.
          </p>
        </div>
      </div>
    );
  };

  const renderRoboticsBasics = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Robotics Basics</h2>
        <p className="text-gray-700 leading-relaxed">
          Fundamental concepts in robotics that apply to drone systems, including control theory, 
          autonomous navigation, and computer vision.
        </p>
        
        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-orange-900 mb-3">Coming Soon</h3>
          <p className="text-orange-700">
            Robotics fundamentals including control systems, PID tuning, autonomous flight algorithms, 
            and computer vision applications will be added here.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Documentation</h1>
              
              <nav className="space-y-2">
                {Object.entries(sections).map(([key, section]) => (
                  <div key={key}>
                    <button
                      onClick={() => {
                        setActiveSection(key);
                        setActiveSubsection('');
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeSection === key
                          ? 'bg-blue-100 text-blue-900 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{section.icon}</span>
                        <span>{section.title}</span>
                      </div>
                    </button>
                    
                    {activeSection === key && (
                      <div className="ml-8 mt-2 space-y-1">
                        {Object.entries(section.subsections).map(([subKey, subTitle]) => (
                          <button
                            key={subKey}
                            onClick={() => setActiveSubsection(subKey)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              activeSubsection === subKey
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {subTitle}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 