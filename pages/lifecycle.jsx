import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getUserBuilds } from '../lib/database';
import ProtectedRoute from '../components/ProtectedRoute';

export default function DroneLifecycle() {
  const [activeStage, setActiveStage] = useState('design');
  const [user, setUser] = useState(null);
  const [currentBuild, setCurrentBuild] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [buildParts, setBuildParts] = useState([]);
  const [buildAnalysis, setBuildAnalysis] = useState(null);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showFlightEnvelopeModal, setShowFlightEnvelopeModal] = useState(false);
  const [showTeamCollaborationModal, setShowTeamCollaborationModal] = useState(false);
  const [showVersionControlModal, setShowVersionControlModal] = useState(false);
  const [batteryOptimization, setBatteryOptimization] = useState({
    currentBattery: null,
    recommendedBatteries: [],
    powerDraw: 0,
    flightTime: 0,
    efficiency: 0
  });
  const [powerOptimization, setPowerOptimization] = useState({
    currentESC: null,
    currentPDB: null,
    recommendedESCs: [],
    recommendedPDBs: [],
    totalCurrent: 0,
    efficiency: 0,
    voltageDrop: 0
  });
  const [flightEnvelopeAnalysis, setFlightEnvelopeAnalysis] = useState({
    maxSpeed: 0,
    maxAltitude: 0,
    maxRange: 0,
    maxPayload: 0,
    maxFlightTime: 0,
    weatherConditions: [],
    performanceFactors: [],
    recommendations: []
  });
  const [teamCollaboration, setTeamCollaboration] = useState({
    teamMembers: [],
    invitations: [],
    sharedBuilds: [],
    comments: [],
    permissions: {
      canEdit: true,
      canComment: true,
      canShare: true
    }
  });
  const [versionControl, setVersionControl] = useState({
    versions: [],
    currentVersion: null,
    branches: [],
    currentBranch: 'main',
    commits: [],
    changes: []
  });
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [selectedESC, setSelectedESC] = useState(null);
  const [selectedPDB, setSelectedPDB] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [batteriesToCompare, setBatteriesToCompare] = useState([]);
  const [escsToCompare, setEscsToCompare] = useState([]);
  const [pdbsToCompare, setPdbsToCompare] = useState([]);
  const [userBuilds, setUserBuilds] = useState([]);
  const [selectedBuildId, setSelectedBuildId] = useState(null);
  const [showBuildSelector, setShowBuildSelector] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Fetch all user builds and current build data from database
  useEffect(() => {
    const fetchBuilds = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching builds for user:', user.id);
        const builds = await getUserBuilds(user.id);
        console.log('Fetched builds:', builds);
        
        // Load optimizations from localStorage for each build
        const buildsWithOptimizations = builds.map(build => {
          try {
            const localStorageKey = `build_optimizations_${build.id}`;
            const storedOptimizations = localStorage.getItem(localStorageKey);
            if (storedOptimizations) {
              const optimizationsData = JSON.parse(storedOptimizations);
              return {
                ...build,
                optimizations: optimizationsData.optimizations
              };
            }
          } catch (error) {
            console.error('Error loading optimizations from localStorage:', error);
          }
          return build;
        });
        
        setUserBuilds(buildsWithOptimizations || []);
        
        if (buildsWithOptimizations && buildsWithOptimizations.length > 0) {
          // Use the most recent build as default
          const mostRecent = buildsWithOptimizations[buildsWithOptimizations.length - 1];
          console.log('Using most recent build:', mostRecent);
          
          setCurrentBuild(mostRecent);
          setSelectedBuildId(mostRecent.id);
          setBuildParts(mostRecent.parts || []);
          
          // Calculate build analysis (same logic as dashboard)
          const analysis = analyzeBuild(mostRecent.parts || []);
          setBuildAnalysis(analysis);
          console.log('Build analysis:', analysis);
        } else {
          console.log('No builds found for user');
        }
      } catch (error) {
        console.error('Error fetching builds:', error);
      }
    };

    fetchBuilds();
  }, [user]);

  // Build analysis function (same as dashboard)
  const analyzeBuild = (parts) => {
    if (!parts || parts.length === 0) return null;

    let totalWeight = 0;
    let totalCost = 0;
    let maxThrust = 0;
    let batteryCapacity = 0;
    let warnings = [];

    parts.forEach(part => {
      // Weight calculation
      if (part.weight) totalWeight += part.weight;
      if (part.cost) totalCost += part.cost;
      
      // Thrust calculation for motors
      if (part.type === 'motor' && part.thrust) {
        maxThrust += part.thrust * 4; // Assuming 4 motors
      }
      
      // Battery capacity
      if (part.type === 'battery' && part.capacity) {
        batteryCapacity = part.capacity;
      }
    });

    // Flight time estimation (simplified)
    const estimatedFlightTime = batteryCapacity > 0 ? Math.floor(batteryCapacity / 1000 * 6) : 0;
    
    // Payload capacity (simplified)
    const payloadCapacity = maxThrust > 0 ? Math.max(0, maxThrust - totalWeight) : 0;
    
    // Speed estimation (simplified)
    const estimatedSpeed = maxThrust > 0 ? Math.min(120, Math.sqrt(maxThrust / totalWeight) * 20) : 0;
    
    // Range estimation (simplified)
    const estimatedRange = estimatedFlightTime * estimatedSpeed / 60;

    // Warnings
    if (totalWeight > maxThrust * 0.8) {
      warnings.push('High weight may affect performance');
    }
    if (batteryCapacity < 1000) {
      warnings.push('Low battery capacity');
    }
    if (parts.filter(p => p.type === 'motor').length < 4) {
      warnings.push('Insufficient motors for quadcopter');
    }

    return {
      totalWeight,
      totalCost,
      maxThrust,
      batteryCapacity,
      estimatedFlightTime,
      payloadCapacity,
      estimatedSpeed,
      estimatedRange,
      warnings
    };
  };

  // Battery optimization function
  const optimizeBattery = () => {
    if (!buildParts || buildParts.length === 0) return;

    // Calculate total power draw from components
    let totalPowerDraw = 0;
    let currentBattery = null;

    buildParts.forEach(part => {
      if (part.type === 'motor' && part.thrust) {
        // Estimate power draw from motor thrust (rough calculation)
        totalPowerDraw += (part.thrust / 1000) * 12; // Assuming 12V system
      }
      if (part.type === 'battery') {
        currentBattery = part;
      }
    });

    // Add power for other components
    totalPowerDraw += 50; // Flight controller, ESCs, etc.

    // Sample battery recommendations
    const recommendedBatteries = [
      {
        name: "Tattu 6S 6000mAh 30C",
        capacity: 6000,
        voltage: 22.2, // 6S
        weight: 850,
        cost: 89.99,
        c_rating: 30,
        max_discharge: 180, // 6000 * 30C / 1000
        flight_time: Math.floor((6000 / (totalPowerDraw * 1000 / 22.2)) * 60),
        efficiency: 95
      },
      {
        name: "Tattu 4S 4000mAh 45C",
        capacity: 4000,
        voltage: 14.8, // 4S
        weight: 450,
        cost: 49.99,
        c_rating: 45,
        max_discharge: 180, // 4000 * 45C / 1000
        flight_time: Math.floor((4000 / (totalPowerDraw * 1000 / 14.8)) * 60),
        efficiency: 92
      },
      {
        name: "Tattu 6S 10000mAh 20C",
        capacity: 10000,
        voltage: 22.2, // 6S
        weight: 1200,
        cost: 129.99,
        c_rating: 20,
        max_discharge: 200, // 10000 * 20C / 1000
        flight_time: Math.floor((10000 / (totalPowerDraw * 1000 / 22.2)) * 60),
        efficiency: 98
      },
      {
        name: "Tattu 4S 6000mAh 35C",
        capacity: 6000,
        voltage: 14.8, // 4S
        weight: 650,
        cost: 69.99,
        c_rating: 35,
        max_discharge: 210, // 6000 * 35C / 1000
        flight_time: Math.floor((6000 / (totalPowerDraw * 1000 / 14.8)) * 60),
        efficiency: 94
      }
    ];

    // Calculate efficiency based on weight and capacity
    const efficiency = currentBattery ? 
      Math.max(85, 100 - (currentBattery.weight / 1000) * 5) : 90;

    setBatteryOptimization({
      currentBattery,
      recommendedBatteries,
      powerDraw: totalPowerDraw,
      flightTime: currentBattery ? Math.floor((currentBattery.capacity / (totalPowerDraw * 1000 / (currentBattery.voltage || 14.8))) * 60) : 0,
      efficiency
    });

    setShowBatteryModal(true);
  };

  const optimizePowerDistribution = () => {
    if (!buildParts || buildParts.length === 0) return;

    // Calculate total current draw from motors
    let totalCurrent = 0;
    let currentESC = null;
    let currentPDB = null;
    let motorCount = 0;

    buildParts.forEach(part => {
      if (part.type === 'motor' && part.current_draw) {
        totalCurrent += part.current_draw;
        motorCount++;
      }
      if (part.type === 'esc') {
        currentESC = part;
      }
      if (part.type === 'pdb') {
        currentPDB = part;
      }
    });

    // Add current for other components
    totalCurrent += 5; // Flight controller, receiver, etc.

    // Sample ESC recommendations
    const recommendedESCs = [
      {
        name: "T-Motor FLAME 60A 4-in-1",
        current_rating: 60,
        voltage: "2-6S",
        weight: 45,
        cost: 89.99,
        efficiency: 95,
        features: ["BLHeli_32", "DShot1200", "Current Sensor"],
        max_current: 60,
        voltage_drop: 0.1
      },
      {
        name: "Holybro Tekko32 65A 4-in-1",
        current_rating: 65,
        voltage: "2-6S",
        weight: 42,
        cost: 79.99,
        efficiency: 94,
        features: ["BLHeli_32", "DShot1200", "Current Sensor"],
        max_current: 65,
        voltage_drop: 0.12
      },
      {
        name: "Aikon AK32PRO 35A 4-in-1",
        current_rating: 35,
        voltage: "2-6S",
        weight: 28,
        cost: 59.99,
        efficiency: 93,
        features: ["BLHeli_32", "DShot1200"],
        max_current: 35,
        voltage_drop: 0.15
      },
      {
        name: "T-Motor FLAME 80A 4-in-1",
        current_rating: 80,
        voltage: "2-8S",
        weight: 58,
        cost: 129.99,
        efficiency: 96,
        features: ["BLHeli_32", "DShot1200", "Current Sensor", "Telemetry"],
        max_current: 80,
        voltage_drop: 0.08
      }
    ];

    // Sample PDB recommendations
    const recommendedPDBs = [
      {
        name: "Holybro Power Distribution Board",
        input_voltage: "2-6S",
        output_voltage: "5V, 12V",
        max_current: 100,
        weight: 15,
        cost: 19.99,
        features: ["5V BEC", "12V BEC", "Current Sensor"],
        efficiency: 92,
        voltage_drop: 0.05
      },
      {
        name: "Matek Systems PDB-XT60",
        input_voltage: "2-6S",
        output_voltage: "5V, 12V",
        max_current: 120,
        weight: 18,
        cost: 24.99,
        features: ["5V BEC", "12V BEC", "Current Sensor", "Voltage Sensor"],
        efficiency: 94,
        voltage_drop: 0.04
      },
      {
        name: "TBS PowerCube",
        input_voltage: "2-6S",
        output_voltage: "5V, 12V",
        max_current: 150,
        weight: 25,
        cost: 39.99,
        features: ["5V BEC", "12V BEC", "Current Sensor", "Voltage Sensor", "OSD"],
        efficiency: 95,
        voltage_drop: 0.03
      },
      {
        name: "HGLRC Power Distribution Board",
        input_voltage: "2-6S",
        output_voltage: "5V, 12V",
        max_current: 80,
        weight: 12,
        cost: 14.99,
        features: ["5V BEC", "12V BEC"],
        efficiency: 90,
        voltage_drop: 0.08
      }
    ];

    // Calculate efficiency and voltage drop
    const efficiency = currentESC ? 
      Math.max(85, 100 - (totalCurrent / currentESC.current_rating) * 10) : 90;
    const voltageDrop = currentESC ? 
      (totalCurrent / currentESC.current_rating) * 0.2 : 0.1;

    setPowerOptimization({
      currentESC,
      currentPDB,
      recommendedESCs,
      recommendedPDBs,
      totalCurrent,
      efficiency,
      voltageDrop
    });

    setShowPowerModal(true);
  };

  const analyzeFlightEnvelope = () => {
    if (!buildParts || buildParts.length === 0) return;

    // Calculate basic drone parameters
    let totalWeight = 0;
    let totalThrust = 0;
    let batteryCapacity = 0;
    let motorCount = 0;
    let frameSize = 0;
    let propellerSize = 0;

    buildParts.forEach(part => {
      if (part.weight) totalWeight += part.weight;
      if (part.type === 'motor' && part.thrust) {
        totalThrust += part.thrust;
        motorCount++;
      }
      if (part.type === 'battery' && part.capacity) {
        batteryCapacity = part.capacity;
      }
      if (part.type === 'frame' && part.size) {
        frameSize = part.size;
      }
      if (part.type === 'propeller' && part.size) {
        propellerSize = part.size;
      }
    });

    // Calculate flight envelope parameters
    const thrustToWeightRatio = totalThrust / totalWeight;
    const estimatedMaxSpeed = Math.min(120, Math.sqrt(thrustToWeightRatio) * 25); // km/h
    const estimatedMaxAltitude = Math.min(4000, thrustToWeightRatio * 1000); // meters
    const estimatedMaxRange = Math.min(50, batteryCapacity / 1000 * 2); // km
    const estimatedMaxPayload = Math.max(0, totalThrust - totalWeight); // grams
    const estimatedMaxFlightTime = Math.floor(batteryCapacity / 1000 * 6); // minutes

    // Weather condition analysis
    const weatherConditions = [
      {
        condition: "Clear Sky",
        maxSpeed: estimatedMaxSpeed,
        maxAltitude: estimatedMaxAltitude,
        maxRange: estimatedMaxRange,
        risk: "Low",
        color: "#84dcc6"
      },
      {
        condition: "Light Wind (5-10 km/h)",
        maxSpeed: estimatedMaxSpeed * 0.9,
        maxAltitude: estimatedMaxAltitude * 0.95,
        maxRange: estimatedMaxRange * 0.85,
        risk: "Low",
        color: "#8b95c9"
      },
      {
        condition: "Moderate Wind (10-20 km/h)",
        maxSpeed: estimatedMaxSpeed * 0.7,
        maxAltitude: estimatedMaxAltitude * 0.8,
        maxRange: estimatedMaxRange * 0.6,
        risk: "Medium",
        color: "#acd7ec"
      },
      {
        condition: "Strong Wind (20+ km/h)",
        maxSpeed: estimatedMaxSpeed * 0.4,
        maxAltitude: estimatedMaxAltitude * 0.5,
        maxRange: estimatedMaxRange * 0.3,
        risk: "High",
        color: "#ff6b6b"
      },
      {
        condition: "Rain/Light Precipitation",
        maxSpeed: estimatedMaxSpeed * 0.6,
        maxAltitude: estimatedMaxAltitude * 0.7,
        maxRange: estimatedMaxRange * 0.5,
        risk: "Medium",
        color: "#ffa726"
      }
    ];

    // Performance factors
    const performanceFactors = [
      {
        factor: "Thrust-to-Weight Ratio",
        value: thrustToWeightRatio.toFixed(2),
        status: thrustToWeightRatio > 2 ? "Excellent" : thrustToWeightRatio > 1.5 ? "Good" : "Poor",
        impact: "High",
        description: "Determines maximum payload and maneuverability"
      },
      {
        factor: "Battery Capacity",
        value: `${batteryCapacity}mAh`,
        status: batteryCapacity > 4000 ? "Excellent" : batteryCapacity > 2000 ? "Good" : "Limited",
        impact: "High",
        description: "Affects flight time and range"
      },
      {
        factor: "Motor Count",
        value: motorCount,
        status: motorCount >= 6 ? "Excellent" : motorCount === 4 ? "Good" : "Limited",
        impact: "Medium",
        description: "More motors provide better redundancy and control"
      },
      {
        factor: "Frame Size",
        value: frameSize ? `${frameSize}mm` : "Unknown",
        status: frameSize > 400 ? "Large" : frameSize > 250 ? "Medium" : "Small",
        impact: "Medium",
        description: "Affects stability and payload capacity"
      },
      {
        factor: "Propeller Size",
        value: propellerSize ? `${propellerSize} inches` : "Unknown",
        status: propellerSize > 8 ? "Large" : propellerSize > 5 ? "Medium" : "Small",
        impact: "Medium",
        description: "Larger props provide more thrust but less speed"
      }
    ];

    // Recommendations based on analysis
    const recommendations = [];
    
    if (thrustToWeightRatio < 1.5) {
      recommendations.push({
        type: "warning",
        title: "Low Thrust-to-Weight Ratio",
        description: "Consider upgrading motors or reducing weight for better performance",
        priority: "High"
      });
    }
    
    if (batteryCapacity < 2000) {
      recommendations.push({
        type: "info",
        title: "Limited Flight Time",
        description: "Consider higher capacity battery for longer flights",
        priority: "Medium"
      });
    }
    
    if (motorCount < 4) {
      recommendations.push({
        type: "warning",
        title: "Limited Motor Configuration",
        description: "Consider adding more motors for better control and redundancy",
        priority: "Medium"
      });
    }
    
    if (estimatedMaxRange < 10) {
      recommendations.push({
        type: "info",
        title: "Limited Range",
        description: "Consider range extenders or higher capacity batteries",
        priority: "Low"
      });
    }

    setFlightEnvelopeAnalysis({
      maxSpeed: estimatedMaxSpeed,
      maxAltitude: estimatedMaxAltitude,
      maxRange: estimatedMaxRange,
      maxPayload: estimatedMaxPayload,
      maxFlightTime: estimatedMaxFlightTime,
      weatherConditions,
      performanceFactors,
      recommendations
    });

    setShowFlightEnvelopeModal(true);
  };

  const initializeTeamCollaboration = () => {
    // Initialize with sample team data
    const sampleTeamMembers = [
      {
        id: 1,
        name: "Alex Chen",
        email: "alex.chen@example.com",
        role: "Lead Engineer",
        avatar: "AC",
        status: "online",
        lastActive: "2 minutes ago",
        permissions: ["edit", "comment", "share"]
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        role: "Aerodynamics Specialist",
        avatar: "SJ",
        status: "online",
        lastActive: "5 minutes ago",
        permissions: ["comment", "share"]
      },
      {
        id: 3,
        name: "Mike Rodriguez",
        email: "mike.r@example.com",
        role: "Electronics Engineer",
        avatar: "MR",
        status: "away",
        lastActive: "1 hour ago",
        permissions: ["edit", "comment"]
      }
    ];

    const sampleComments = [
      {
        id: 1,
        userId: 1,
        userName: "Alex Chen",
        avatar: "AC",
        timestamp: "2024-01-15T10:30:00Z",
        content: "The motor selection looks good, but we should consider the ESC current rating for safety margins.",
        type: "suggestion"
      },
      {
        id: 2,
        userId: 2,
        userName: "Sarah Johnson",
        avatar: "SJ",
        timestamp: "2024-01-15T10:25:00Z",
        content: "Great choice on the frame! The aerodynamic profile will help with efficiency.",
        type: "comment"
      },
      {
        id: 3,
        userId: 3,
        userName: "Mike Rodriguez",
        avatar: "MR",
        timestamp: "2024-01-15T10:20:00Z",
        content: "I've updated the flight controller settings. Ready for testing.",
        type: "update"
      }
    ];

    const sampleInvitations = [
      {
        id: 1,
        email: "david.wilson@example.com",
        role: "Test Pilot",
        status: "pending",
        sentAt: "2024-01-15T09:00:00Z"
      },
      {
        id: 2,
        email: "emma.davis@example.com",
        role: "Project Manager",
        status: "accepted",
        sentAt: "2024-01-15T08:30:00Z"
      }
    ];

    setTeamCollaboration({
      teamMembers: sampleTeamMembers,
      invitations: sampleInvitations,
      sharedBuilds: [],
      comments: sampleComments,
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: true
      }
    });

    setShowTeamCollaborationModal(true);
  };

  const initializeVersionControl = () => {
    // Initialize with sample version control data
    const sampleVersions = [
      {
        id: 1,
        version: "v1.2.0",
        name: "Optimized Motor Configuration",
        description: "Updated motor selection for better efficiency and reduced weight",
        timestamp: "2024-01-15T14:30:00Z",
        author: "Alex Chen",
        changes: [
          "Upgraded motors from 2207 to 2306 for better efficiency",
          "Reduced frame weight by 50g",
          "Updated ESC configuration for new motors"
        ],
        buildData: {
          totalWeight: 850,
          flightTime: 18,
          maxSpeed: 95
        }
      },
      {
        id: 2,
        version: "v1.1.0",
        name: "Battery Optimization",
        description: "Implemented battery optimization with improved flight time",
        timestamp: "2024-01-14T16:45:00Z",
        author: "Sarah Johnson",
        changes: [
          "Upgraded battery from 3000mAh to 4000mAh",
          "Optimized power distribution",
          "Added battery monitoring system"
        ],
        buildData: {
          totalWeight: 900,
          flightTime: 22,
          maxSpeed: 88
        }
      },
      {
        id: 3,
        version: "v1.0.0",
        name: "Initial Design",
        description: "First complete drone design with basic components",
        timestamp: "2024-01-13T10:15:00Z",
        author: "Mike Rodriguez",
        changes: [
          "Basic frame assembly",
          "Standard motor configuration",
          "Basic battery setup"
        ],
        buildData: {
          totalWeight: 950,
          flightTime: 15,
          maxSpeed: 80
        }
      }
    ];

    const sampleBranches = [
      {
        name: "main",
        lastCommit: "v1.2.0",
        lastUpdate: "2024-01-15T14:30:00Z",
        isActive: true
      },
      {
        name: "experimental",
        lastCommit: "v1.2.1-beta",
        lastUpdate: "2024-01-15T12:00:00Z",
        isActive: false
      },
      {
        name: "feature/autonomous",
        lastCommit: "v1.3.0-alpha",
        lastUpdate: "2024-01-15T09:30:00Z",
        isActive: false
      }
    ];

    const sampleCommits = [
      {
        id: "abc123",
        message: "Optimize motor configuration for better efficiency",
        author: "Alex Chen",
        timestamp: "2024-01-15T14:30:00Z",
        changes: 3,
        additions: 15,
        deletions: 8
      },
      {
        id: "def456",
        message: "Implement battery optimization system",
        author: "Sarah Johnson",
        timestamp: "2024-01-14T16:45:00Z",
        changes: 5,
        additions: 22,
        deletions: 12
      },
      {
        id: "ghi789",
        message: "Initial drone design setup",
        author: "Mike Rodriguez",
        timestamp: "2024-01-13T10:15:00Z",
        changes: 8,
        additions: 45,
        deletions: 0
      }
    ];

    const sampleChanges = [
      {
        type: "modified",
        file: "motor-config.json",
        description: "Updated motor specifications",
        timestamp: "2024-01-15T14:30:00Z"
      },
      {
        type: "added",
        file: "battery-optimization.js",
        description: "New battery optimization algorithm",
        timestamp: "2024-01-14T16:45:00Z"
      },
      {
        type: "deleted",
        file: "old-frame-design.stl",
        description: "Removed outdated frame design",
        timestamp: "2024-01-15T14:30:00Z"
      }
    ];

    setVersionControl({
      versions: sampleVersions,
      currentVersion: sampleVersions[0],
      branches: sampleBranches,
      currentBranch: 'main',
      commits: sampleCommits,
      changes: sampleChanges
    });

    setShowVersionControlModal(true);
  };

  // Handle battery selection
  const handleBatterySelect = (battery) => {
    setSelectedBattery(battery);
    showToast(`Selected: ${battery.name}`, "success");
  };

  // Handle battery comparison
  const handleBatteryCompare = (battery) => {
    if (batteriesToCompare.find(b => b.name === battery.name)) {
      // Remove from comparison
      const updated = batteriesToCompare.filter(b => b.name !== battery.name);
      setBatteriesToCompare(updated);
      showToast(`Removed ${battery.name} from comparison`, "info");
    } else if (batteriesToCompare.length < 3) {
      // Add to comparison
      const updated = [...batteriesToCompare, battery];
      setBatteriesToCompare(updated);
      showToast(`Added ${battery.name} to comparison`, "success");
    } else {
      showToast("Maximum 3 batteries for comparison", "warning");
    }
  };

  // Handle ESC selection
  const handleESCSelect = (esc) => {
    setSelectedESC(esc);
    showToast(`Selected: ${esc.name}`, "success");
  };

  // Handle ESC comparison
  const handleESCCompare = (esc) => {
    if (escsToCompare.find(e => e.name === esc.name)) {
      // Remove from comparison
      const updated = escsToCompare.filter(e => e.name !== esc.name);
      setEscsToCompare(updated);
      showToast(`Removed ${esc.name} from comparison`, "info");
    } else if (escsToCompare.length < 3) {
      // Add to comparison
      const updated = [...escsToCompare, esc];
      setEscsToCompare(updated);
      showToast(`Added ${esc.name} to comparison`, "success");
    } else {
      showToast("Maximum 3 ESCs for comparison", "warning");
    }
  };

  // Handle PDB selection
  const handlePDBSelect = (pdb) => {
    setSelectedPDB(pdb);
    showToast(`Selected: ${pdb.name}`, "success");
  };

  // Handle PDB comparison
  const handlePDBCompare = (pdb) => {
    if (pdbsToCompare.find(p => p.name === pdb.name)) {
      // Remove from comparison
      const updated = pdbsToCompare.filter(p => p.name !== pdb.name);
      setPdbsToCompare(updated);
      showToast(`Removed ${pdb.name} from comparison`, "info");
    } else if (pdbsToCompare.length < 3) {
      // Add to comparison
      const updated = [...pdbsToCompare, pdb];
      setPdbsToCompare(updated);
      showToast(`Added ${pdb.name} to comparison`, "success");
    } else {
      showToast("Maximum 3 PDBs for comparison", "warning");
    }
  };

  // Apply battery optimization
  const handleApplyOptimization = async () => {
    if (!selectedBattery) {
      showToast("Please select a battery first", "warning");
      return;
    }

    // Update the current build with the selected battery
    const updatedParts = buildParts.map(part => {
      if (part.type === 'battery') {
        return {
          ...part,
          name: selectedBattery.name,
          capacity: selectedBattery.capacity,
          cost: selectedBattery.cost,
          weight: selectedBattery.weight,
          voltage: selectedBattery.voltage
        };
      }
      return part;
    });

    // If no battery exists, add the selected one
    if (!buildParts.find(part => part.type === 'battery')) {
      updatedParts.push({
        id: 'battery-optimized',
        type: 'battery',
        name: selectedBattery.name,
        capacity: selectedBattery.capacity,
        cost: selectedBattery.cost,
        weight: selectedBattery.weight,
        voltage: selectedBattery.voltage,
        emoji: '🔋'
      });
    }

    setBuildParts(updatedParts);
    setCurrentBuild(prev => ({
      ...prev,
      parts: updatedParts
    }));

    // Recalculate analysis
    const newAnalysis = analyzeBuild(updatedParts);
    setBuildAnalysis(newAnalysis);

    // Save the optimization to database
    const batteryOptimization = {
      type: 'battery',
      selectedBattery: selectedBattery,
      appliedAt: new Date().toISOString(),
      previousBattery: buildParts.find(part => part.type === 'battery'),
      performanceImprovement: {
        flightTime: newAnalysis.flightTime - (buildAnalysis?.flightTime || 0),
        weight: (buildAnalysis?.weight || 0) - newAnalysis.weight,
        cost: (buildAnalysis?.cost || 0) - newAnalysis.cost
      }
    };

    await saveOptimizedBuild({ batteryOptimization });

    showToast(`Applied ${selectedBattery.name} to your build and saved!`, "success");
    setShowBatteryModal(false);
    setSelectedBattery(null);
    setBatteriesToCompare([]);
  };

  // Apply power distribution optimization
  const handleApplyPowerOptimization = async () => {
    if (!selectedESC && !selectedPDB) {
      showToast("Please select an ESC or PDB first", "warning");
      return;
    }

    // Update the current build with the selected components
    const updatedParts = buildParts.map(part => {
      if (part.type === 'esc' && selectedESC) {
        return {
          ...part,
          name: selectedESC.name,
          current_rating: selectedESC.current_rating,
          cost: selectedESC.cost,
          weight: selectedESC.weight,
          efficiency: selectedESC.efficiency
        };
      }
      if (part.type === 'pdb' && selectedPDB) {
        return {
          ...part,
          name: selectedPDB.name,
          max_current: selectedPDB.max_current,
          cost: selectedPDB.cost,
          weight: selectedPDB.weight,
          efficiency: selectedPDB.efficiency
        };
      }
      return part;
    });

    // If no ESC exists and one is selected, add it
    if (!buildParts.find(part => part.type === 'esc') && selectedESC) {
      updatedParts.push({
        id: 'esc-optimized',
        type: 'esc',
        name: selectedESC.name,
        current_rating: selectedESC.current_rating,
        cost: selectedESC.cost,
        weight: selectedESC.weight,
        efficiency: selectedESC.efficiency,
        emoji: '⚡'
      });
    }

    // If no PDB exists and one is selected, add it
    if (!buildParts.find(part => part.type === 'pdb') && selectedPDB) {
      updatedParts.push({
        id: 'pdb-optimized',
        type: 'pdb',
        name: selectedPDB.name,
        max_current: selectedPDB.max_current,
        cost: selectedPDB.cost,
        weight: selectedPDB.weight,
        efficiency: selectedPDB.efficiency,
        emoji: '🔌'
      });
    }

    setBuildParts(updatedParts);
    setCurrentBuild(prev => ({
      ...prev,
      parts: updatedParts
    }));

    // Recalculate analysis
    const newAnalysis = analyzeBuild(updatedParts);
    setBuildAnalysis(newAnalysis);

    // Save the optimization to database
    const powerOptimization = {
      type: 'power_distribution',
      selectedESC: selectedESC,
      selectedPDB: selectedPDB,
      appliedAt: new Date().toISOString(),
      previousESC: buildParts.find(part => part.type === 'esc'),
      previousPDB: buildParts.find(part => part.type === 'pdb'),
      performanceImprovement: {
        efficiency: newAnalysis.efficiency - (buildAnalysis?.efficiency || 0),
        weight: (buildAnalysis?.weight || 0) - newAnalysis.weight,
        cost: (buildAnalysis?.cost || 0) - newAnalysis.cost
      }
    };

    await saveOptimizedBuild({ powerOptimization });

    showToast(`Applied power distribution optimization and saved!`, "success");
    setShowPowerModal(false);
    setSelectedESC(null);
    setSelectedPDB(null);
    setEscsToCompare([]);
    setPdbsToCompare([]);
  };

  // Apply flight envelope analysis
  const handleApplyFlightEnvelopeAnalysis = async () => {
    // Save the flight envelope analysis to database
    const flightEnvelopeOptimization = {
      type: 'flight_envelope_analysis',
      analysis: flightEnvelopeAnalysis,
      appliedAt: new Date().toISOString(),
      buildPerformance: {
        maxSpeed: flightEnvelopeAnalysis.maxSpeed,
        maxAltitude: flightEnvelopeAnalysis.maxAltitude,
        maxRange: flightEnvelopeAnalysis.maxRange,
        maxPayload: flightEnvelopeAnalysis.maxPayload,
        maxFlightTime: flightEnvelopeAnalysis.maxFlightTime
      }
    };

    await saveOptimizedBuild({ flightEnvelopeOptimization });

    showToast(`Flight envelope analysis saved!`, "success");
    setShowFlightEnvelopeModal(false);
  };

  // Team collaboration functions
  const inviteTeamMember = (email, role) => {
    const newInvitation = {
      id: Date.now(),
      email,
      role,
      status: "pending",
      sentAt: new Date().toISOString()
    };

    setTeamCollaboration(prev => ({
      ...prev,
      invitations: [...prev.invitations, newInvitation]
    }));

    showToast(`Invitation sent to ${email}`, "success");
  };

  const addComment = (content, type = "comment") => {
    const newComment = {
      id: Date.now(),
      userId: 1, // Current user ID
      userName: "You",
      avatar: "YO",
      timestamp: new Date().toISOString(),
      content,
      type
    };

    setTeamCollaboration(prev => ({
      ...prev,
      comments: [newComment, ...prev.comments]
    }));
  };

  const updateMemberPermissions = (memberId, permissions) => {
    setTeamCollaboration(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map(member =>
        member.id === memberId ? { ...member, permissions } : member
      )
    }));
  };

  // Version control functions
  const createNewVersion = (name, description) => {
    const newVersion = {
      id: Date.now(),
      version: `v1.${versionControl.versions.length + 1}.0`,
      name,
      description,
      timestamp: new Date().toISOString(),
      author: "You",
      changes: ["Auto-generated version"],
      buildData: {
        totalWeight: buildAnalysis?.totalWeight || 0,
        flightTime: buildAnalysis?.estimatedFlightTime || 0,
        maxSpeed: buildAnalysis?.estimatedSpeed || 0
      }
    };

    setVersionControl(prev => ({
      ...prev,
      versions: [newVersion, ...prev.versions],
      currentVersion: newVersion
    }));

    showToast(`New version ${newVersion.version} created!`, "success");
  };

  const switchToVersion = (version) => {
    setVersionControl(prev => ({
      ...prev,
      currentVersion: version
    }));

    showToast(`Switched to version ${version.version}`, "success");
  };

  const createNewBranch = (branchName) => {
    const newBranch = {
      name: branchName,
      lastCommit: "Initial commit",
      lastUpdate: new Date().toISOString(),
      isActive: false
    };

    setVersionControl(prev => ({
      ...prev,
      branches: [...prev.branches, newBranch]
    }));

    showToast(`New branch '${branchName}' created!`, "success");
  };

  // Handle build selection
  const handleBuildSelect = (build) => {
    setCurrentBuild(build);
    setSelectedBuildId(build.id);
    setBuildParts(build.parts || []);
    
    // Recalculate analysis for the selected build
    const analysis = analyzeBuild(build.parts || []);
    setBuildAnalysis(analysis);
    
    setShowBuildSelector(false);
    showToast(`Selected build: ${build.name}`, "success");
  };

  // Save optimized build to database
  const saveOptimizedBuild = async (optimizations = {}) => {
    if (!currentBuild || !user) {
      showToast("No build selected or user not logged in", "error");
      return;
    }

    try {
      // First, try to update just the parts (which we know exists)
      const basicUpdate = {
        parts: buildParts,
        updated_at: new Date().toISOString()
      };

      // Try to update with optimizations if possible
      const fullUpdate = {
        ...basicUpdate,
        optimizations: {
          ...currentBuild.optimizations,
          ...optimizations,
          lastUpdated: new Date().toISOString()
        }
      };

      let updateData = fullUpdate;
      let { data, error } = await supabase
        .from('builds')
        .update(updateData)
        .eq('id', currentBuild.id)
        .select();

      // If the first attempt fails, try without optimizations
      if (error) {
        console.log('Full update failed, trying basic update:', error);
        updateData = basicUpdate;
        const result = await supabase
          .from('builds')
          .update(updateData)
          .eq('id', currentBuild.id)
          .select();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving optimized build:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('column "optimizations" does not exist')) {
          showToast("Database schema needs update. Please run the SQL script to add optimizations support.", "error");
        } else if (error.message?.includes('permission denied')) {
          showToast("Permission denied. Please check your database permissions.", "error");
        } else {
          showToast(`Error saving optimized build: ${error.message || 'Unknown error'}`, "error");
        }
        return;
      }

      // Create the updated build object for local state
      const updatedBuild = {
        ...currentBuild,
        ...updateData
      };

      // Update local state
      setCurrentBuild(updatedBuild);
      
      // Update the builds list
      setUserBuilds(prev => prev.map(build => 
        build.id === currentBuild.id ? updatedBuild : build
      ));

      showToast("Optimized build saved successfully!", "success");
      return updatedBuild;
    } catch (error) {
      console.error('Error saving optimized build:', error);
      
      // Fallback: Store optimizations in localStorage
      try {
        const localStorageKey = `build_optimizations_${currentBuild.id}`;
        const optimizationsData = {
          buildId: currentBuild.id,
          optimizations: {
            ...currentBuild.optimizations,
            ...optimizations,
            lastUpdated: new Date().toISOString()
          },
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(localStorageKey, JSON.stringify(optimizationsData));
        
        // Update local state even if database save failed
        const updatedBuild = {
          ...currentBuild,
          parts: buildParts,
          optimizations: optimizationsData.optimizations
        };
        
        setCurrentBuild(updatedBuild);
        setUserBuilds(prev => prev.map(build => 
          build.id === currentBuild.id ? updatedBuild : build
        ));
        
        showToast("Optimization applied locally (database save failed)", "warning");
        return updatedBuild;
      } catch (localStorageError) {
        console.error('Error saving to localStorage:', localStorageError);
        showToast("Error saving optimized build", "error");
      }
    }
  };

  // Simple toast function
  const showToast = (message, type = "info") => {
    // For now, just use alert. In a real app, you'd use a proper toast system
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const lifecycleStages = [
    {
      id: 'design',
      title: 'Design 🧠',
      description: 'Advanced drone design with CAD export and collaboration',
      color: '#84dcc6',
      features: [
        'Frame/motor/ESC selection with compatibility checks',
        'Battery & power distribution optimization',
        'Flight time & payload analysis',
        'CAD export (STL, STEP, DXF)',
        'Flight envelope estimation',
        'Team collaboration & co-design',
        'Weather & altitude considerations'
      ]
    },
    {
      id: 'simulate',
      title: 'Simulate & Validate 📊',
      description: 'Comprehensive simulation and performance validation',
      color: '#8b95c9',
      features: [
        'PX4/Gazebo simulation export',
        'Flight performance under mission profiles',
        'Thermal & EMI analysis',
        'Signal interference estimation',
        'PID tuning presets',
        'Flight controller profiles',
        'Real-time performance monitoring'
      ]
    },
    {
      id: 'build',
      title: 'Build 🛠️',
      description: 'Streamlined build process with automated ordering',
      color: '#acd7ec',
      features: [
        'One-click parts ordering (GetFPV, AliExpress, Banggood)',
        'BOM export (PDF, JSON, KiCad-compatible)',
        'Auto-generated assembly instructions',
        'Wiring diagrams & schematics',
        '3D printable STL files',
        'Build progress tracking',
        'Quality control checklists'
      ]
    },
    {
      id: 'deploy',
      title: 'Deploy & Operate 🕹️',
      description: 'Complete deployment and mission planning',
      color: '#d6edff',
      features: [
        'Export configs (PX4, Ardupilot, Betaflight)',
        'Companion computer setup guides',
        'Mission planning presets',
        'GCS integrations (QGroundControl, MAVProxy)',
        'Autonomous mission creation',
        'Real-time telemetry monitoring',
        'Emergency procedures & failsafes'
      ]
    },
    {
      id: 'maintain',
      title: 'Maintain & Scale 🚀',
      description: 'Fleet management and enterprise operations',
      color: '#84dcc6',
      features: [
        'Fleet tracker & maintenance logs',
        'Battery cycle management',
        'Part replacement notifications',
        'Software updates manager',
        'Digital twin integration',
        'Performance analytics',
        'Enterprise fleet scaling'
      ]
    }
  ];

  const renderDesignStage = () => (
    <div className="space-y-8">
      {/* Build Selector */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Select Build</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBuildSelector(true)}
              className="px-4 py-2 bg-[#8b95c9] text-white rounded-lg text-sm hover:bg-[#7a85b8] transition-colors"
            >
              {currentBuild ? 'Change Build' : 'Select Build'}
            </button>
            <Link href="/playground" className="px-4 py-2 bg-[#84dcc6] text-white rounded-lg text-sm hover:bg-[#73cbb5] transition-colors">
              Create New Build
            </Link>
          </div>
        </div>

        {currentBuild ? (
          <div className="bg-[#d6edff]/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">{currentBuild.name}</h4>
              <span className="px-3 py-1 bg-[#84dcc6] text-white text-sm rounded-full">
                {currentBuild.parts?.length || 0} parts
              </span>
            </div>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Created</div>
                <div className="font-medium">{new Date(currentBuild.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated</div>
                <div className="font-medium">{new Date(currentBuild.updated_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Optimizations</div>
                <div className="font-medium">
                  {currentBuild.optimizations ? Object.keys(currentBuild.optimizations).filter(key => key !== 'lastUpdated').length : 0} applied
                </div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium text-[#84dcc6]">
                  {currentBuild.optimizations && Object.keys(currentBuild.optimizations).filter(key => key !== 'lastUpdated').length > 0 ? 'Optimized' : 'Ready for Optimization'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No build selected. Please select a build or create a new one.
          </div>
        )}
      </div>

      {/* Current Build Information */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Current Build</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                if (user) {
                  getUserBuilds(user.id).then(builds => {
                    if (builds && builds.length > 0) {
                      const mostRecent = builds[builds.length - 1];
                      setCurrentBuild(mostRecent);
                      setBuildParts(mostRecent.parts || []);
                      const analysis = analyzeBuild(mostRecent.parts || []);
                      setBuildAnalysis(analysis);
                    }
                  });
                }
              }}
              className="px-3 py-2 bg-[#84dcc6] text-white rounded-lg text-sm hover:bg-[#73cbb5] transition-colors"
            >
              🔄 Refresh
            </button>
            <Link href="/dashboard" className="px-4 py-2 bg-[#8b95c9] text-white rounded-lg text-sm hover:bg-[#7a85b8] transition-colors">
              Edit in Dashboard
            </Link>
          </div>
        </div>
        
        {currentBuild ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{currentBuild.name || 'Untitled Build'}</div>
                <div className="text-sm text-gray-600">{buildParts.length} components selected</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  ${buildAnalysis?.totalCost?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-600">Total Cost</div>
              </div>
            </div>
            
            {/* Build Components Summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 border border-[#d6edff] rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Selected Components</h4>
                <div className="space-y-1">
                  {buildParts.slice(0, 5).map((part, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{part.name}</span>
                      <span className="text-gray-900 font-medium">${part.cost?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                  {buildParts.length > 5 && (
                    <div className="text-sm text-gray-500">+{buildParts.length - 5} more components</div>
                  )}
                </div>
              </div>
              
              <div className="p-3 border border-[#d6edff] rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Build Warnings</h4>
                <div className="space-y-1">
                  {buildAnalysis?.warnings?.length > 0 ? (
                    buildAnalysis.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center text-sm text-orange-600">
                        <span className="mr-1">⚠️</span>
                        {warning}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-green-600">✓ No warnings</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No build data available</div>
            <Link href="/dashboard" className="px-6 py-3 bg-[#84dcc6] text-white rounded-lg hover:bg-[#73cbb5] transition-colors">
              Create a Build
            </Link>
          </div>
        )}
      </div>

      {/* Advanced Design Tools */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Component Selection</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Battery Optimization</span>
              <button 
                onClick={optimizeBattery}
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm hover:bg-[#73cbb5] transition-colors"
              >
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Power Distribution</span>
              <button 
                onClick={optimizePowerDistribution}
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm hover:bg-[#73cbb5] transition-colors"
              >
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Flight Envelope Analysis</span>
              <button 
                onClick={analyzeFlightEnvelope}
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm hover:bg-[#73cbb5] transition-colors"
              >
                Analyze
              </button>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">CAD Export & Collaboration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Export STL Files</span>
              <button 
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - STL export functionality will be available in the next update"
              >
                Export
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Team Collaboration</span>
              <button 
                onClick={initializeTeamCollaboration}
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm hover:bg-[#7a85b8] transition-colors"
              >
                Manage
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Version Control</span>
              <button 
                onClick={initializeVersionControl}
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm hover:bg-[#7a85b8] transition-colors"
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Analysis Dashboard */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Flight Performance Analysis</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#84dcc6]/20 rounded-lg">
            <div className="text-2xl font-bold text-[#84dcc6]">
              {buildAnalysis?.estimatedFlightTime || '0'}
            </div>
            <div className="text-sm text-gray-600">Flight Time (min)</div>
          </div>
          <div className="text-center p-4 bg-[#8b95c9]/20 rounded-lg">
            <div className="text-2xl font-bold text-[#8b95c9]">
              {buildAnalysis?.payloadCapacity ? (buildAnalysis.payloadCapacity / 1000).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600">Payload (kg)</div>
          </div>
          <div className="text-center p-4 bg-[#acd7ec]/20 rounded-lg">
            <div className="text-2xl font-bold text-[#acd7ec]">
              {buildAnalysis?.estimatedSpeed ? Math.round(buildAnalysis.estimatedSpeed) : '0'}
            </div>
            <div className="text-sm text-gray-600">Speed (km/h)</div>
          </div>
          <div className="text-center p-4 bg-[#d6edff]/20 rounded-lg">
            <div className="text-2xl font-bold text-[#d6edff]">
              {buildAnalysis?.estimatedRange ? buildAnalysis.estimatedRange.toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600">Range (km)</div>
          </div>
        </div>
        
        {/* Additional Build Stats */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {buildAnalysis?.totalWeight ? (buildAnalysis.totalWeight / 1000).toFixed(2) : '0'}
            </div>
            <div className="text-sm text-gray-600">Total Weight (kg)</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {buildAnalysis?.maxThrust ? Math.round(buildAnalysis.maxThrust) : '0'}
            </div>
            <div className="text-sm text-gray-600">Max Thrust (g)</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {buildAnalysis?.batteryCapacity ? buildAnalysis.batteryCapacity : '0'}
            </div>
            <div className="text-sm text-gray-600">Battery (mAh)</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSimulateStage = () => (
    <div className="space-y-8">
      {/* Simulation Tools */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Flight Simulation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">PX4 Simulation</span>
              <button 
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - PX4 simulation integration will be available in the next update"
              >
                Launch
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Gazebo Export</span>
              <button 
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Gazebo export functionality will be available in the next update"
              >
                Export
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Mission Profiles</span>
              <button 
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Mission profile testing will be available in the next update"
              >
                Test
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Thermal Analysis</span>
              <button 
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Thermal analysis will be available in the next update"
              >
                Analyze
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">EMI Testing</span>
              <button 
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - EMI testing will be available in the next update"
              >
                Test
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#d6edff]/20 rounded-lg">
              <span className="font-medium">Signal Interference</span>
              <button 
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Signal interference analysis will be available in the next update"
              >
                Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PID Tuning Presets */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">PID Tuning Presets</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-[#d6edff] rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Racing Profile</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>P: 1.2, I: 0.05, D: 0.08</div>
              <div>Response: Aggressive</div>
            </div>
            <button 
              className="mt-3 px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
              title="Coming Soon - PID tuning presets will be available in the next update"
            >
              Apply
            </button>
          </div>
          <div className="p-4 border border-[#d6edff] rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Cinematic Profile</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>P: 0.8, I: 0.03, D: 0.12</div>
              <div>Response: Smooth</div>
            </div>
            <button 
              className="mt-3 px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
              title="Coming Soon - PID tuning presets will be available in the next update"
            >
              Apply
            </button>
          </div>
          <div className="p-4 border border-[#d6edff] rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Long Range Profile</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>P: 1.0, I: 0.04, D: 0.10</div>
              <div>Response: Stable</div>
            </div>
            <button 
              className="mt-3 px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
              title="Coming Soon - PID tuning presets will be available in the next update"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBuildStage = () => (
    <div className="space-y-8">
      {/* Parts Ordering */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">One-Click Parts Ordering</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-[#d6edff] rounded-lg">
            <div className="text-2xl mb-2">🛒</div>
            <h4 className="font-semibold text-gray-900 mb-2">GetFPV</h4>
            <div className="text-sm text-gray-600 mb-3">Premium racing parts</div>
            <button 
              className="px-4 py-2 bg-[#84dcc6] text-white rounded-lg cursor-not-allowed opacity-60"
              title="Coming Soon - One-click ordering will be available in the next update"
            >
              Order All
            </button>
          </div>
          <div className="text-center p-4 border border-[#d6edff] rounded-lg">
            <div className="text-2xl mb-2">📦</div>
            <h4 className="font-semibold text-gray-900 mb-2">AliExpress</h4>
            <div className="text-sm text-gray-600 mb-3">Budget-friendly options</div>
            <button 
              className="px-4 py-2 bg-[#8b95c9] text-white rounded-lg cursor-not-allowed opacity-60"
              title="Coming Soon - One-click ordering will be available in the next update"
            >
              Order All
            </button>
          </div>
          <div className="text-center p-4 border border-[#d6edff] rounded-lg">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-semibold text-gray-900 mb-2">Banggood</h4>
            <div className="text-sm text-gray-600 mb-3">Wide selection</div>
            <button 
              className="px-4 py-2 bg-[#acd7ec] text-white rounded-lg cursor-not-allowed opacity-60"
              title="Coming Soon - One-click ordering will be available in the next update"
            >
              Order All
            </button>
          </div>
        </div>
      </div>

      {/* BOM Export */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">BOM Export</h3>
          <div className="space-y-3">
            <button 
              className="w-full p-3 bg-[#84dcc6]/20 rounded-lg text-left cursor-not-allowed opacity-60"
              title="Coming Soon - PDF report export will be available in the next update"
            >
              <div className="font-medium">PDF Report</div>
              <div className="text-sm text-gray-600">Professional build documentation</div>
            </button>
            <button 
              className="w-full p-3 bg-[#8b95c9]/20 rounded-lg text-left cursor-not-allowed opacity-60"
              title="Coming Soon - JSON export will be available in the next update"
            >
              <div className="font-medium">JSON Format</div>
              <div className="text-sm text-gray-600">Machine-readable data</div>
            </button>
            <button 
              className="w-full p-3 bg-[#acd7ec]/20 rounded-lg text-left cursor-not-allowed opacity-60"
              title="Coming Soon - KiCad integration will be available in the next update"
            >
              <div className="font-medium">KiCad Compatible</div>
              <div className="text-sm text-gray-600">PCB design integration</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">3D Printing</h3>
          <div className="space-y-3">
            <button 
              className="w-full p-3 bg-[#d6edff]/20 rounded-lg text-left cursor-not-allowed opacity-60"
              title="Coming Soon - STL file generation will be available in the next update"
            >
              <div className="font-medium">STL Files</div>
              <div className="text-sm text-gray-600">3D printable mounts & frames</div>
            </button>
            <button 
              className="w-full p-3 bg-[#84dcc6]/20 rounded-lg text-left cursor-not-allowed opacity-60"
              title="Coming Soon - Assembly guide generation will be available in the next update"
            >
              <div className="font-medium">Assembly Guide</div>
              <div className="text-sm text-gray-600">Step-by-step instructions</div>
            </button>
            <button 
              className="w-full p-3 bg-[#8b95c9]/20 rounded-lg text-left cursor-not-allowed opacity-60"
              title="Coming Soon - Wiring diagram generation will be available in the next update"
            >
              <div className="font-medium">Wiring Diagrams</div>
              <div className="text-sm text-gray-600">Auto-generated schematics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeployStage = () => (
    <div className="space-y-8">
      {/* Flight Controller Configs */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Flight Controller Configuration</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Export Configurations</h4>
            <div className="space-y-2">
              <button 
                className="w-full p-3 bg-[#84dcc6]/20 rounded-lg text-left cursor-not-allowed opacity-60"
                title="Coming Soon - PX4 configuration export will be available in the next update"
              >
                <div className="font-medium">PX4</div>
                <div className="text-sm text-gray-600">Advanced autopilot system</div>
              </button>
              <button 
                className="w-full p-3 bg-[#8b95c9]/20 rounded-lg text-left cursor-not-allowed opacity-60"
                title="Coming Soon - Ardupilot configuration export will be available in the next update"
              >
                <div className="font-medium">Ardupilot</div>
                <div className="text-sm text-gray-600">Open-source autopilot</div>
              </button>
              <button 
                className="w-full p-3 bg-[#acd7ec]/20 rounded-lg text-left cursor-not-allowed opacity-60"
                title="Coming Soon - Betaflight configuration export will be available in the next update"
              >
                <div className="font-medium">Betaflight</div>
                <div className="text-sm text-gray-600">Racing & freestyle</div>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Ground Control Station</h4>
            <div className="space-y-2">
              <button 
                className="w-full p-3 bg-[#d6edff]/20 rounded-lg text-left cursor-not-allowed opacity-60"
                title="Coming Soon - QGroundControl integration will be available in the next update"
              >
                <div className="font-medium">QGroundControl</div>
                <div className="text-sm text-gray-600">Mission planning & control</div>
              </button>
              <button 
                className="w-full p-3 bg-[#84dcc6]/20 rounded-lg text-left cursor-not-allowed opacity-60"
                title="Coming Soon - MAVProxy integration will be available in the next update"
              >
                <div className="font-medium">MAVProxy</div>
                <div className="text-sm text-gray-600">Command-line interface</div>
              </button>
              <button 
                className="w-full p-3 bg-[#8b95c9]/20 rounded-lg text-left cursor-not-allowed opacity-60"
                title="Coming Soon - Mission Planner integration will be available in the next update"
              >
                <div className="font-medium">Mission Planner</div>
                <div className="text-sm text-gray-600">Windows-based GCS</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Planning */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Mission Presets</h3>
          <div className="space-y-3">
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="font-medium text-gray-900">Surveillance Mission</div>
              <div className="text-sm text-gray-600 mb-2">Automated patrol with camera control</div>
              <button 
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Mission preset configuration will be available in the next update"
              >
                Configure
              </button>
            </div>
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="font-medium text-gray-900">Mapping Mission</div>
              <div className="text-sm text-gray-600 mb-2">Grid pattern for aerial mapping</div>
              <button 
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Mission preset configuration will be available in the next update"
              >
                Configure
              </button>
            </div>
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="font-medium text-gray-900">Delivery Mission</div>
              <div className="text-sm text-gray-600 mb-2">Point-to-point cargo delivery</div>
              <button 
                className="px-3 py-1 bg-[#acd7ec] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Mission preset configuration will be available in the next update"
              >
                Configure
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Companion Computer Setup</h3>
          <div className="space-y-3">
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="font-medium text-gray-900">Raspberry Pi</div>
              <div className="text-sm text-gray-600 mb-2">ROS & MAVROS setup guide</div>
              <button 
                className="px-3 py-1 bg-[#d6edff] text-gray-800 rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Companion computer setup guides will be available in the next update"
              >
                Setup
              </button>
            </div>
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="font-medium text-gray-900">Jetson Nano</div>
              <div className="text-sm text-gray-600 mb-2">AI & computer vision setup</div>
              <button 
                className="px-3 py-1 bg-[#84dcc6] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Companion computer setup guides will be available in the next update"
              >
                Setup
              </button>
            </div>
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="font-medium text-gray-900">Orange Cube</div>
              <div className="text-sm text-gray-600 mb-2">Advanced flight controller</div>
              <button 
                className="px-3 py-1 bg-[#8b95c9] text-white rounded-lg text-sm cursor-not-allowed opacity-60"
                title="Coming Soon - Companion computer setup guides will be available in the next update"
              >
                Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaintainStage = () => (
    <div className="space-y-8">
      {/* Fleet Management */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Fleet Management</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-[#84dcc6]/20 rounded-lg">
            <div className="text-3xl font-bold text-[#84dcc6]">12</div>
            <div className="text-sm text-gray-600">Active Drones</div>
          </div>
          <div className="text-center p-4 bg-[#8b95c9]/20 rounded-lg">
            <div className="text-3xl font-bold text-[#8b95c9]">156</div>
            <div className="text-sm text-gray-600">Total Flight Hours</div>
          </div>
          <div className="text-center p-4 bg-[#acd7ec]/20 rounded-lg">
            <div className="text-3xl font-bold text-[#acd7ec]">3</div>
            <div className="text-sm text-gray-600">Maintenance Due</div>
          </div>
        </div>
      </div>

      {/* Maintenance Tracking */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Maintenance Log</h3>
          <div className="space-y-3">
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">Drone #001</div>
                  <div className="text-sm text-gray-600">Battery replacement due</div>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Urgent</span>
              </div>
            </div>
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">Drone #003</div>
                  <div className="text-sm text-gray-600">Propeller inspection</div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Due Soon</span>
              </div>
            </div>
            <div className="p-3 border border-[#d6edff] rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">Drone #007</div>
                  <div className="text-sm text-gray-600">Software update available</div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Update</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Battery Management</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#d6edff]/20 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Battery Pack A</div>
                <div className="text-sm text-gray-600">45 cycles used</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">85%</div>
                <div className="text-xs text-gray-600">Health</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#d6edff]/20 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Battery Pack B</div>
                <div className="text-sm text-gray-600">78 cycles used</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">72%</div>
                <div className="text-xs text-gray-600">Health</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#d6edff]/20 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Battery Pack C</div>
                <div className="text-sm text-gray-600">23 cycles used</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">95%</div>
                <div className="text-xs text-gray-600">Health</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Enterprise Integration</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-[#d6edff] rounded-lg">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-semibold text-gray-900 mb-2">Digital Twin</h4>
            <div className="text-sm text-gray-600 mb-3">Real-time fleet simulation</div>
            <button 
              className="px-4 py-2 bg-[#84dcc6] text-white rounded-lg cursor-not-allowed opacity-60"
              title="Coming Soon - Digital twin integration will be available in the next update"
            >
              Connect
            </button>
          </div>
          <div className="text-center p-4 border border-[#d6edff] rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
            <div className="text-sm text-gray-600 mb-3">Performance insights</div>
            <button 
              className="px-4 py-2 bg-[#8b95c9] text-white rounded-lg cursor-not-allowed opacity-60"
              title="Coming Soon - Analytics dashboard will be available in the next update"
            >
              View
            </button>
          </div>
          <div className="text-center p-4 border border-[#d6edff] rounded-lg">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-semibold text-gray-900 mb-2">Scale</h4>
            <div className="text-sm text-gray-600 mb-3">Multi-site operations</div>
            <button 
              className="px-4 py-2 bg-[#acd7ec] text-white rounded-lg cursor-not-allowed opacity-60"
              title="Coming Soon - Multi-site scaling will be available in the next update"
            >
              Expand
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStageContent = () => {
    switch (activeStage) {
      case 'design':
        return renderDesignStage();
      case 'simulate':
        return renderSimulateStage();
      case 'build':
        return renderBuildStage();
      case 'deploy':
        return renderDeployStage();
      case 'maintain':
        return renderMaintainStage();
      default:
        return renderDesignStage();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Full-Stack Drone Lifecycle</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete drone development platform from design to deployment and maintenance
            </p>
            <p className="text-lg text-gray-500 mt-2">
              Professional-grade tools for every stage of drone development
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lifecycle Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {lifecycleStages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeStage === stage.id
                  ? 'bg-[#8b95c9] text-white shadow-coolors'
                  : 'bg-white text-gray-700 hover:bg-[#d6edff] border border-[#d6edff] shadow-coolors'
              }`}
            >
              {stage.title}
            </button>
          ))}
        </div>

        {/* Stage Description */}
        <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff] mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {lifecycleStages.find(s => s.id === activeStage)?.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {lifecycleStages.find(s => s.id === activeStage)?.description}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lifecycleStages.find(s => s.id === activeStage)?.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="mr-2">✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Stage Content */}
        {renderStageContent()}

        {/* Battery Optimization Modal */}
        {showBatteryModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Battery Optimization</h2>
                <button
                  onClick={() => setShowBatteryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current Build Analysis */}
              <div className="bg-[#d6edff]/20 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Build Analysis</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#84dcc6]">
                      {batteryOptimization.powerDraw.toFixed(1)}W
                    </div>
                    <div className="text-sm text-gray-600">Total Power Draw</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#8b95c9]">
                      {batteryOptimization.flightTime}min
                    </div>
                    <div className="text-sm text-gray-600">Current Flight Time</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#acd7ec]">
                      {batteryOptimization.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                </div>
              </div>

              {/* Current Battery */}
              {batteryOptimization.currentBattery && (
                <div className="bg-white border border-[#d6edff] rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Battery</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-gray-900">{batteryOptimization.currentBattery.name}</div>
                      <div className="text-sm text-gray-600">
                        Capacity: {batteryOptimization.currentBattery.capacity}mAh
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ${batteryOptimization.currentBattery.cost?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-600">Cost</div>
                    </div>
                  </div>
                </div>
              )}



              {/* Battery Comparison */}
              {batteriesToCompare.length > 0 && (
                <div className="bg-[#8b95c9]/10 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Comparison ({batteriesToCompare.length}/3)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#8b95c9]/20">
                          <th className="text-left py-2 font-medium text-gray-900">Battery</th>
                          <th className="text-center py-2 font-medium text-gray-900">Capacity</th>
                          <th className="text-center py-2 font-medium text-gray-900">Voltage</th>
                          <th className="text-center py-2 font-medium text-gray-900">C-Rating</th>
                          <th className="text-center py-2 font-medium text-gray-900">Flight Time</th>
                          <th className="text-center py-2 font-medium text-gray-900">Weight</th>
                          <th className="text-center py-2 font-medium text-gray-900">Cost</th>
                          <th className="text-center py-2 font-medium text-gray-900">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batteriesToCompare.map((battery, index) => (
                          <tr key={index} className="border-b border-[#8b95c9]/10">
                            <td className="py-3 font-medium text-gray-900">{battery.name}</td>
                            <td className="py-3 text-center text-gray-600">{battery.capacity}mAh</td>
                            <td className="py-3 text-center text-gray-600">{battery.voltage}V</td>
                            <td className="py-3 text-center text-gray-600">{battery.c_rating}C</td>
                            <td className="py-3 text-center text-[#84dcc6] font-semibold">{battery.flight_time}min</td>
                            <td className="py-3 text-center text-gray-600">{battery.weight}g</td>
                            <td className="py-3 text-center text-[#8b95c9] font-semibold">${battery.cost}</td>
                            <td className="py-3 text-center text-[#acd7ec] font-semibold">{battery.efficiency}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Battery Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Recommended Batteries</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {batteryOptimization.recommendedBatteries.map((battery, index) => {
                    const isSelected = selectedBattery?.name === battery.name;
                    const isInComparison = batteriesToCompare.find(b => b.name === battery.name);
                    
                    return (
                      <div key={index} className={`bg-white border rounded-lg p-4 hover:shadow-coolors transition-all duration-200 ${
                        isSelected ? 'border-[#84dcc6] bg-[#84dcc6]/5' : 'border-[#d6edff]'
                      }`}>
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="flex items-center justify-end mb-2">
                            <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs rounded-full">
                              ✓ Selected
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900">{battery.name}</div>
                            <div className="text-sm text-gray-600">
                              {battery.capacity}mAh • {battery.voltage}V • {battery.c_rating}C
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#8b95c9]">
                              ${battery.cost}
                            </div>
                            <div className="text-xs text-gray-500">{battery.weight}g</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 bg-[#84dcc6]/20 rounded">
                            <div className="text-sm font-bold text-[#84dcc6]">{battery.flight_time}min</div>
                            <div className="text-xs text-gray-600">Flight Time</div>
                          </div>
                          <div className="text-center p-2 bg-[#8b95c9]/20 rounded">
                            <div className="text-sm font-bold text-[#8b95c9]">{battery.max_discharge}A</div>
                            <div className="text-xs text-gray-600">Max Discharge</div>
                          </div>
                          <div className="text-center p-2 bg-[#acd7ec]/20 rounded">
                            <div className="text-sm font-bold text-[#acd7ec]">{battery.efficiency}%</div>
                            <div className="text-xs text-gray-600">Efficiency</div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleBatterySelect(battery)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSelected 
                                ? 'bg-[#84dcc6] text-white' 
                                : 'bg-[#84dcc6] text-white hover:bg-[#73cbb5]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select Battery'}
                          </button>
                          <button 
                            onClick={() => handleBatteryCompare(battery)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              isInComparison 
                                ? 'bg-[#8b95c9] text-white' 
                                : 'bg-[#d6edff] text-gray-700 hover:bg-[#c5dcf0]'
                            }`}
                          >
                            {isInComparison ? 'Remove' : 'Compare'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Battery Optimization Tips */}
              <div className="bg-[#d6edff]/20 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Tips</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For Longer Flight Time:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Choose higher capacity batteries</li>
                      <li>• Consider 6S for better efficiency</li>
                      <li>• Balance weight vs capacity</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For Better Performance:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Higher C-rating for burst power</li>
                      <li>• Lower weight for agility</li>
                      <li>• Match voltage to motor KV</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowBatteryModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handleApplyOptimization}
                  disabled={!selectedBattery}
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    selectedBattery 
                      ? 'bg-[#8b95c9] text-white hover:bg-[#7a85b8]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Apply Optimization
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Power Distribution Optimization Modal */}
        {showPowerModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Power Distribution Optimization</h2>
                <button
                  onClick={() => setShowPowerModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current Build Analysis */}
              <div className="bg-[#d6edff]/20 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Build Analysis</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#84dcc6]">
                      {powerOptimization.totalCurrent.toFixed(1)}A
                    </div>
                    <div className="text-sm text-gray-600">Total Current Draw</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#8b95c9]">
                      {powerOptimization.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600">Power Efficiency</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#acd7ec]">
                      {(powerOptimization.voltageDrop * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Voltage Drop</div>
                  </div>
                </div>
              </div>

              {/* Current Components */}
              {(powerOptimization.currentESC || powerOptimization.currentPDB) && (
                <div className="bg-white border border-[#d6edff] rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Components</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {powerOptimization.currentESC && (
                      <div>
                        <div className="font-medium text-gray-900">{powerOptimization.currentESC.name}</div>
                        <div className="text-sm text-gray-600">
                          {powerOptimization.currentESC.current_rating}A • {powerOptimization.currentESC.voltage}
                        </div>
                      </div>
                    )}
                    {powerOptimization.currentPDB && (
                      <div>
                        <div className="font-medium text-gray-900">{powerOptimization.currentPDB.name}</div>
                        <div className="text-sm text-gray-600">
                          {powerOptimization.currentPDB.max_current}A • {powerOptimization.currentPDB.input_voltage}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ESC Comparison */}
              {escsToCompare.length > 0 && (
                <div className="bg-[#8b95c9]/10 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ESC Comparison ({escsToCompare.length}/3)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#8b95c9]/20">
                          <th className="text-left py-2 font-medium text-gray-900">ESC</th>
                          <th className="text-center py-2 font-medium text-gray-900">Current Rating</th>
                          <th className="text-center py-2 font-medium text-gray-900">Voltage</th>
                          <th className="text-center py-2 font-medium text-gray-900">Efficiency</th>
                          <th className="text-center py-2 font-medium text-gray-900">Weight</th>
                          <th className="text-center py-2 font-medium text-gray-900">Cost</th>
                          <th className="text-center py-2 font-medium text-gray-900">Features</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escsToCompare.map((esc, index) => (
                          <tr key={index} className="border-b border-[#8b95c9]/10">
                            <td className="py-3 font-medium text-gray-900">{esc.name}</td>
                            <td className="py-3 text-center text-[#84dcc6] font-semibold">{esc.current_rating}A</td>
                            <td className="py-3 text-center text-gray-600">{esc.voltage}</td>
                            <td className="py-3 text-center text-[#8b95c9] font-semibold">{esc.efficiency}%</td>
                            <td className="py-3 text-center text-gray-600">{esc.weight}g</td>
                            <td className="py-3 text-center text-[#acd7ec] font-semibold">${esc.cost}</td>
                            <td className="py-3 text-center text-gray-600">{esc.features.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PDB Comparison */}
              {pdbsToCompare.length > 0 && (
                <div className="bg-[#acd7ec]/10 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">PDB Comparison ({pdbsToCompare.length}/3)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#acd7ec]/20">
                          <th className="text-left py-2 font-medium text-gray-900">PDB</th>
                          <th className="text-center py-2 font-medium text-gray-900">Max Current</th>
                          <th className="text-center py-2 font-medium text-gray-900">Input Voltage</th>
                          <th className="text-center py-2 font-medium text-gray-900">Efficiency</th>
                          <th className="text-center py-2 font-medium text-gray-900">Weight</th>
                          <th className="text-center py-2 font-medium text-gray-900">Cost</th>
                          <th className="text-center py-2 font-medium text-gray-900">Features</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdbsToCompare.map((pdb, index) => (
                          <tr key={index} className="border-b border-[#acd7ec]/10">
                            <td className="py-3 font-medium text-gray-900">{pdb.name}</td>
                            <td className="py-3 text-center text-[#84dcc6] font-semibold">{pdb.max_current}A</td>
                            <td className="py-3 text-center text-gray-600">{pdb.input_voltage}</td>
                            <td className="py-3 text-center text-[#8b95c9] font-semibold">{pdb.efficiency}%</td>
                            <td className="py-3 text-center text-gray-600">{pdb.weight}g</td>
                            <td className="py-3 text-center text-[#acd7ec] font-semibold">${pdb.cost}</td>
                            <td className="py-3 text-center text-gray-600">{pdb.features.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ESC Recommendations */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Recommended ESCs</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {powerOptimization.recommendedESCs.map((esc, index) => {
                    const isSelected = selectedESC?.name === esc.name;
                    const isInComparison = escsToCompare.find(e => e.name === esc.name);
                    
                    return (
                      <div key={index} className={`bg-white border rounded-lg p-4 hover:shadow-coolors transition-all duration-200 ${
                        isSelected ? 'border-[#84dcc6] bg-[#84dcc6]/5' : 'border-[#d6edff]'
                      }`}>
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="flex items-center justify-end mb-2">
                            <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs rounded-full">
                              ✓ Selected
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900">{esc.name}</div>
                            <div className="text-sm text-gray-600">
                              {esc.current_rating}A • {esc.voltage}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#8b95c9]">
                              ${esc.cost}
                            </div>
                            <div className="text-xs text-gray-500">{esc.weight}g</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 bg-[#84dcc6]/20 rounded">
                            <div className="text-sm font-bold text-[#84dcc6]">{esc.efficiency}%</div>
                            <div className="text-xs text-gray-600">Efficiency</div>
                          </div>
                          <div className="text-center p-2 bg-[#8b95c9]/20 rounded">
                            <div className="text-sm font-bold text-[#8b95c9]">{esc.current_rating}A</div>
                            <div className="text-xs text-gray-600">Max Current</div>
                          </div>
                          <div className="text-center p-2 bg-[#acd7ec]/20 rounded">
                            <div className="text-sm font-bold text-[#acd7ec]">{(esc.voltage_drop * 100).toFixed(1)}%</div>
                            <div className="text-xs text-gray-600">Voltage Drop</div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1">Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {esc.features.map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-[#d6edff] text-gray-700 text-xs rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleESCSelect(esc)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSelected 
                                ? 'bg-[#84dcc6] text-white' 
                                : 'bg-[#84dcc6] text-white hover:bg-[#73cbb5]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select ESC'}
                          </button>
                          <button 
                            onClick={() => handleESCCompare(esc)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              isInComparison 
                                ? 'bg-[#8b95c9] text-white' 
                                : 'bg-[#d6edff] text-gray-700 hover:bg-[#c5dcf0]'
                            }`}
                          >
                            {isInComparison ? 'Remove' : 'Compare'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PDB Recommendations */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Recommended Power Distribution Boards</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {powerOptimization.recommendedPDBs.map((pdb, index) => {
                    const isSelected = selectedPDB?.name === pdb.name;
                    const isInComparison = pdbsToCompare.find(p => p.name === pdb.name);
                    
                    return (
                      <div key={index} className={`bg-white border rounded-lg p-4 hover:shadow-coolors transition-all duration-200 ${
                        isSelected ? 'border-[#84dcc6] bg-[#84dcc6]/5' : 'border-[#d6edff]'
                      }`}>
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="flex items-center justify-end mb-2">
                            <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs rounded-full">
                              ✓ Selected
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900">{pdb.name}</div>
                            <div className="text-sm text-gray-600">
                              {pdb.max_current}A • {pdb.input_voltage}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#8b95c9]">
                              ${pdb.cost}
                            </div>
                            <div className="text-xs text-gray-500">{pdb.weight}g</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 bg-[#84dcc6]/20 rounded">
                            <div className="text-sm font-bold text-[#84dcc6]">{pdb.efficiency}%</div>
                            <div className="text-xs text-gray-600">Efficiency</div>
                          </div>
                          <div className="text-center p-2 bg-[#8b95c9]/20 rounded">
                            <div className="text-sm font-bold text-[#8b95c9]">{pdb.max_current}A</div>
                            <div className="text-xs text-gray-600">Max Current</div>
                          </div>
                          <div className="text-center p-2 bg-[#acd7ec]/20 rounded">
                            <div className="text-sm font-bold text-[#acd7ec]">{(pdb.voltage_drop * 100).toFixed(1)}%</div>
                            <div className="text-xs text-gray-600">Voltage Drop</div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1">Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {pdb.features.map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-[#d6edff] text-gray-700 text-xs rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handlePDBSelect(pdb)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSelected 
                                ? 'bg-[#84dcc6] text-white' 
                                : 'bg-[#84dcc6] text-white hover:bg-[#73cbb5]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select PDB'}
                          </button>
                          <button 
                            onClick={() => handlePDBCompare(pdb)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              isInComparison 
                                ? 'bg-[#8b95c9] text-white' 
                                : 'bg-[#d6edff] text-gray-700 hover:bg-[#c5dcf0]'
                            }`}
                          >
                            {isInComparison ? 'Remove' : 'Compare'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Power Optimization Tips */}
              <div className="bg-[#d6edff]/20 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Tips</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For Better Efficiency:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Choose ESCs with higher efficiency ratings</li>
                      <li>• Match ESC current rating to motor requirements</li>
                      <li>• Consider 4-in-1 ESCs for cleaner wiring</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For Power Distribution:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Ensure PDB can handle total current draw</li>
                      <li>• Look for built-in BEC and current sensors</li>
                      <li>• Consider voltage and current monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowPowerModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handleApplyPowerOptimization}
                  disabled={!selectedESC && !selectedPDB}
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    (selectedESC || selectedPDB)
                      ? 'bg-[#8b95c9] text-white hover:bg-[#7a85b8]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Apply Optimization
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flight Envelope Analysis Modal */}
        {showFlightEnvelopeModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Flight Envelope Analysis</h2>
                <button
                  onClick={() => setShowFlightEnvelopeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Flight Performance Overview */}
              <div className="bg-[#d6edff]/20 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Performance Overview</h3>
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#84dcc6]">
                      {flightEnvelopeAnalysis.maxSpeed.toFixed(0)} km/h
                    </div>
                    <div className="text-sm text-gray-600">Max Speed</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#8b95c9]">
                      {flightEnvelopeAnalysis.maxAltitude.toFixed(0)} m
                    </div>
                    <div className="text-sm text-gray-600">Max Altitude</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#acd7ec]">
                      {flightEnvelopeAnalysis.maxRange.toFixed(1)} km
                    </div>
                    <div className="text-sm text-gray-600">Max Range</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#ff6b6b]">
                      {flightEnvelopeAnalysis.maxPayload.toFixed(0)} g
                    </div>
                    <div className="text-sm text-gray-600">Max Payload</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-[#ffa726]">
                      {flightEnvelopeAnalysis.maxFlightTime} min
                    </div>
                    <div className="text-sm text-gray-600">Max Flight Time</div>
                  </div>
                </div>
              </div>

              {/* Weather Conditions Analysis */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Weather Conditions Impact</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {flightEnvelopeAnalysis.weatherConditions.map((condition, index) => (
                    <div key={index} className="bg-white border border-[#d6edff] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{condition.condition}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          condition.risk === 'Low' ? 'bg-green-100 text-green-800' :
                          condition.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {condition.risk} Risk
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-bold" style={{ color: condition.color }}>
                            {condition.maxSpeed.toFixed(0)} km/h
                          </div>
                          <div className="text-gray-600">Speed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold" style={{ color: condition.color }}>
                            {condition.maxAltitude.toFixed(0)} m
                          </div>
                          <div className="text-gray-600">Altitude</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold" style={{ color: condition.color }}>
                            {condition.maxRange.toFixed(1)} km
                          </div>
                          <div className="text-gray-600">Range</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Factors */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Performance Factors</h3>
                <div className="bg-white border border-[#d6edff] rounded-lg p-4">
                  <div className="space-y-3">
                    {flightEnvelopeAnalysis.performanceFactors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{factor.factor}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              factor.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                              factor.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                              factor.status === 'Poor' || factor.status === 'Limited' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {factor.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{factor.description}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-gray-900">{factor.value}</div>
                          <div className="text-xs text-gray-500">Impact: {factor.impact}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {flightEnvelopeAnalysis.recommendations.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
                  <div className="space-y-3">
                    {flightEnvelopeAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        rec.type === 'warning' ? 'bg-red-50 border-red-400' :
                        rec.type === 'info' ? 'bg-blue-50 border-blue-400' :
                        'bg-yellow-50 border-yellow-400'
                      }`}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {rec.type === 'warning' ? (
                              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                Priority: {rec.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flight Envelope Tips */}
              <div className="bg-[#d6edff]/20 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Envelope Tips</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For Better Performance:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Maintain thrust-to-weight ratio above 2:1</li>
                      <li>• Consider weather conditions before flight</li>
                      <li>• Monitor battery capacity for range planning</li>
                      <li>• Use appropriate propellers for your motors</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Safety Considerations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Always check weather conditions</li>
                      <li>• Maintain safe distance from obstacles</li>
                      <li>• Monitor battery levels during flight</li>
                      <li>• Have emergency procedures ready</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowFlightEnvelopeModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handleApplyFlightEnvelopeAnalysis}
                  className="px-6 py-3 bg-[#8b95c9] text-white rounded-lg hover:bg-[#7a85b8] transition-colors"
                >
                  Save Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Collaboration Modal */}
        {showTeamCollaborationModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Team Collaboration</h2>
                <button
                  onClick={() => setShowTeamCollaborationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Team Members */}
                <div className="md:col-span-1">
                  <div className="bg-white border border-[#d6edff] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                      <span className="text-sm text-gray-500">{teamCollaboration.teamMembers.length} members</span>
                    </div>
                    
                    <div className="space-y-3">
                      {teamCollaboration.teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="relative">
                            <div className="w-10 h-10 bg-[#84dcc6] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                              {member.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              member.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'
                            }`}></div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.role}</div>
                            <div className="text-xs text-gray-500">{member.lastActive}</div>
                          </div>
                          <div className="flex space-x-1">
                            {member.permissions.includes('edit') && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Edit</span>
                            )}
                            {member.permissions.includes('comment') && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Comment</span>
                            )}
                            {member.permissions.includes('share') && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Share</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invite New Member */}
                    <div className="mt-4 p-4 bg-[#d6edff]/20 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Invite New Member</h4>
                      <div className="space-y-3">
                        <input
                          type="email"
                          placeholder="Email address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84dcc6] focus:border-transparent"
                        />
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84dcc6] focus:border-transparent">
                          <option>Select Role</option>
                          <option>Engineer</option>
                          <option>Designer</option>
                          <option>Test Pilot</option>
                          <option>Project Manager</option>
                          <option>Viewer</option>
                        </select>
                        <button 
                          onClick={() => inviteTeamMember("new.member@example.com", "Engineer")}
                          className="w-full px-4 py-2 bg-[#84dcc6] text-white rounded-lg hover:bg-[#73cbb5] transition-colors"
                        >
                          Send Invitation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments & Activity */}
                <div className="md:col-span-2">
                  <div className="bg-white border border-[#d6edff] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Comments & Activity</h3>
                      <span className="text-sm text-gray-500">{teamCollaboration.comments.length} comments</span>
                    </div>

                    {/* Add Comment */}
                    <div className="mb-6">
                      <textarea
                        placeholder="Add a comment or suggestion..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84dcc6] focus:border-transparent"
                        rows="3"
                      ></textarea>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => addComment("Sample comment", "comment")}
                            className="px-3 py-1 bg-[#8b95c9] text-white rounded text-sm hover:bg-[#7a85b8] transition-colors"
                          >
                            Comment
                          </button>
                          <button 
                            onClick={() => addComment("Sample suggestion", "suggestion")}
                            className="px-3 py-1 bg-[#acd7ec] text-white rounded text-sm hover:bg-[#9bc6db] transition-colors"
                          >
                            Suggestion
                          </button>
                          <button 
                            onClick={() => addComment("Sample update", "update")}
                            className="px-3 py-1 bg-[#ff6b6b] text-white rounded text-sm hover:bg-[#e55a5a] transition-colors"
                          >
                            Update
                          </button>
                        </div>
                        <button className="px-4 py-2 bg-[#84dcc6] text-white rounded-lg hover:bg-[#73cbb5] transition-colors">
                          Post
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {teamCollaboration.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              comment.type === 'suggestion' ? 'bg-[#acd7ec]' :
                              comment.type === 'update' ? 'bg-[#ff6b6b]' :
                              'bg-[#8b95c9]'
                            }`}>
                              {comment.avatar}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{comment.userName}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{comment.content}</p>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  comment.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                                  comment.type === 'update' ? 'bg-red-100 text-red-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {comment.type.charAt(0).toUpperCase() + comment.type.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invitations */}
              <div className="mt-6 bg-white border border-[#d6edff] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h3>
                <div className="space-y-3">
                  {teamCollaboration.invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{invitation.email}</div>
                        <div className="text-sm text-gray-600">Role: {invitation.role}</div>
                        <div className="text-xs text-gray-500">
                          Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </span>
                        {invitation.status === 'pending' && (
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaboration Tips */}
              <div className="mt-6 bg-[#d6edff]/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Tips</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Effective Communication:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use comments to discuss design decisions</li>
                      <li>• Tag team members with @mentions</li>
                      <li>• Provide context for suggestions</li>
                      <li>• Keep feedback constructive and specific</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Team Management:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Assign appropriate permissions to team members</li>
                      <li>• Use roles to define responsibilities</li>
                      <li>• Monitor activity and engagement</li>
                      <li>• Set clear project milestones</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowTeamCollaborationModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    showToast("Team collaboration settings saved!", "success");
                    setShowTeamCollaborationModal(false);
                  }}
                  className="px-6 py-3 bg-[#8b95c9] text-white rounded-lg hover:bg-[#7a85b8] transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Version Control Modal */}
        {showVersionControlModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Version Control</h2>
                <button
                  onClick={() => setShowVersionControlModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Version History */}
                <div className="md:col-span-2">
                  <div className="bg-white border border-[#d6edff] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
                      <button 
                        onClick={() => createNewVersion("New Version", "Auto-generated version")}
                        className="px-4 py-2 bg-[#84dcc6] text-white rounded-lg text-sm hover:bg-[#73cbb5] transition-colors"
                      >
                        Create Version
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {versionControl.versions.map((version) => (
                        <div key={version.id} className={`border rounded-lg p-4 ${
                          versionControl.currentVersion?.id === version.id 
                            ? 'border-[#84dcc6] bg-[#84dcc6]/5' 
                            : 'border-gray-200 hover:border-[#8b95c9]'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{version.version} - {version.name}</h4>
                              <p className="text-sm text-gray-600">{version.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{version.author}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(version.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-3 mb-3">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-gray-900">{version.buildData.totalWeight}g</div>
                              <div className="text-xs text-gray-600">Weight</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-gray-900">{version.buildData.flightTime}min</div>
                              <div className="text-xs text-gray-600">Flight Time</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-gray-900">{version.buildData.maxSpeed}km/h</div>
                              <div className="text-xs text-gray-600">Max Speed</div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Changes:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {version.changes.map((change, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => switchToVersion(version)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                versionControl.currentVersion?.id === version.id
                                  ? 'bg-[#84dcc6] text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-[#8b95c9] hover:text-white'
                              }`}
                            >
                              {versionControl.currentVersion?.id === version.id ? 'Current' : 'Switch to'}
                            </button>
                            <div className="flex space-x-2">
                              <button className="px-3 py-1 bg-[#acd7ec] text-white rounded text-sm hover:bg-[#9bc6db] transition-colors">
                                Compare
                              </button>
                              <button className="px-3 py-1 bg-[#ff6b6b] text-white rounded text-sm hover:bg-[#e55a5a] transition-colors">
                                Revert
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Branches & Commits */}
                <div className="md:col-span-1">
                  <div className="space-y-6">
                    {/* Branches */}
                    <div className="bg-white border border-[#d6edff] rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Branches</h3>
                        <button 
                          onClick={() => createNewBranch("feature/new-feature")}
                          className="px-3 py-1 bg-[#84dcc6] text-white rounded text-sm hover:bg-[#73cbb5] transition-colors"
                        >
                          New
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {versionControl.branches.map((branch) => (
                          <div key={branch.name} className={`flex items-center justify-between p-3 rounded-lg ${
                            branch.isActive ? 'bg-[#84dcc6]/10 border border-[#84dcc6]' : 'bg-gray-50'
                          }`}>
                            <div>
                              <div className="font-medium text-gray-900">{branch.name}</div>
                              <div className="text-sm text-gray-600">{branch.lastCommit}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(branch.lastUpdate).toLocaleDateString()}
                              </div>
                            </div>
                            {branch.isActive && (
                              <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Commits */}
                    <div className="bg-white border border-[#d6edff] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Commits</h3>
                      <div className="space-y-3">
                        {versionControl.commits.map((commit) => (
                          <div key={commit.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{commit.message}</span>
                              <span className="text-xs text-gray-500">{commit.id.substring(0, 7)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>{commit.author}</span>
                              <span>{new Date(commit.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{commit.changes} files changed</span>
                              <span className="text-green-600">+{commit.additions}</span>
                              <span className="text-red-600">-{commit.deletions}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Changes */}
                    <div className="bg-white border border-[#d6edff] rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Changes</h3>
                      <div className="space-y-3">
                        {versionControl.changes.map((change, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                            <div className={`w-2 h-2 rounded-full ${
                              change.type === 'added' ? 'bg-green-400' :
                              change.type === 'modified' ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`}></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{change.file}</div>
                              <div className="text-xs text-gray-600">{change.description}</div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(change.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version Control Tips */}
              <div className="mt-6 bg-[#d6edff]/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Version Control Best Practices</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Version Management:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Create versions for major design changes</li>
                      <li>• Use descriptive version names and descriptions</li>
                      <li>• Keep track of performance improvements</li>
                      <li>• Document significant changes in each version</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Branch Strategy:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use main branch for stable designs</li>
                      <li>• Create feature branches for experiments</li>
                      <li>• Merge successful features back to main</li>
                      <li>• Keep experimental branches separate</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowVersionControlModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    showToast("Version control settings saved!", "success");
                    setShowVersionControlModal(false);
                  }}
                  className="px-6 py-3 bg-[#8b95c9] text-white rounded-lg hover:bg-[#7a85b8] transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Build Selector Modal */}
        {showBuildSelector && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Select Build</h2>
                <button
                  onClick={() => setShowBuildSelector(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {userBuilds.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {userBuilds.map((build) => {
                    const isSelected = selectedBuildId === build.id;
                    const optimizationCount = build.optimizations ? 
                      Object.keys(build.optimizations).filter(key => key !== 'lastUpdated').length : 0;
                    
                    return (
                      <div 
                        key={build.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-[#84dcc6] bg-[#84dcc6]/5' 
                            : 'border-gray-200 hover:border-[#8b95c9] hover:bg-[#8b95c9]/5'
                        }`}
                        onClick={() => handleBuildSelect(build)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{build.name}</h3>
                          {isSelected && (
                            <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-gray-600">Parts</div>
                            <div className="font-medium">{build.parts?.length || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Optimizations</div>
                            <div className="font-medium">{optimizationCount}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Created</div>
                            <div className="font-medium">{new Date(build.created_at).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Updated</div>
                            <div className="font-medium">{new Date(build.updated_at).toLocaleDateString()}</div>
                          </div>
                        </div>

                        {optimizationCount > 0 && (
                          <div className="bg-[#d6edff]/20 rounded p-2 text-xs">
                            <div className="font-medium text-gray-900 mb-1">Applied Optimizations:</div>
                            <div className="space-y-1">
                              {Object.keys(build.optimizations || {})
                                .filter(key => key !== 'lastUpdated')
                                .map((optimization, index) => (
                                  <div key={index} className="flex items-center text-gray-600">
                                    <span className="mr-1">✓</span>
                                    {optimization === 'batteryOptimization' ? 'Battery Optimization' : optimization}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">No builds found</div>
                  <Link href="/playground" className="px-6 py-3 bg-[#84dcc6] text-white rounded-lg hover:bg-[#73cbb5] transition-colors">
                    Create Your First Build
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowBuildSelector(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
} 