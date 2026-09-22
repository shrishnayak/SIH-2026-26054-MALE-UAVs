import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural curved tube geometry generator
function createTubeGeometry(points, radius = 0.022, tubularSegments = 32) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
}

export const UavEngineInternals = ({ 
  isExploded = false, 
  explosionFactor = 0, // Continuous slider 0.0 to 1.0
  selectedHotspot, 
  onSelectHotspot, 
  telemetry, 
  xrayMode = 'STEALTH_CARBON', // 'STEALTH_CARBON' | 'CAD_BLUEPRINT' | 'FLIR_THERMAL' | 'METALLIC_ALLOY' | 'WIREFRAME_XRAY'
  isolatedPart = 'ALL' // 'ALL' | 'ENGINE_BLOCK' | 'CYLINDERS' | 'TURBOCHARGER' | 'FUEL_SYSTEM' | 'OIL_SYSTEM' | 'AVIONICS_ECU'
}) => {
  const groupRef = useRef();
  const crankRef = useRef();
  const turboRotorRef = useRef();
  const pistonRefs = [useRef(), useRef(), useRef(), useRef()];

  const egtRes = telemetry?.residuals?.egtResiduals || [0, 0, 0, 0];
  const activeFault = telemetry?.health?.activeFault || 'NONE';
  const rpm = telemetry?.engine?.rpm || 4800;

  // Compute effective explosion expansion factor (0.0 to 1.0)
  const exp = typeof explosionFactor === 'number' && explosionFactor > 0 
    ? explosionFactor 
    : (isExploded ? 0.85 : 0.0);

  // Animation frame for rotating crankshaft, reciprocating pistons, and spinning turbo
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const cycleSpeed = (rpm / 60) * delta * Math.PI * 2;

    // Rotate internal crankshaft
    if (crankRef.current) {
      crankRef.current.rotation.y += cycleSpeed * 0.5;
    }

    // Spin Turbocharger turbine at high speed
    if (turboRotorRef.current) {
      turboRotorRef.current.rotation.x += cycleSpeed * 2.2;
    }

    // Animate 4 reciprocating pistons with opposed phase offsets
    // Cyl 1 & 2 move outward/inward in boxer opposition with Cyl 3 & 4
    const pistonStroke = 0.06;
    if (pistonRefs[0].current) {
      pistonRefs[0].current.position.x = -0.32 - Math.sin(time * 12) * pistonStroke;
    }
    if (pistonRefs[1].current) {
      pistonRefs[1].current.position.x = 0.32 + Math.sin(time * 12) * pistonStroke;
    }
    if (pistonRefs[2].current) {
      pistonRefs[2].current.position.x = -0.32 - Math.sin(time * 12 + Math.PI) * pistonStroke;
    }
    if (pistonRefs[3].current) {
      pistonRefs[3].current.position.x = 0.32 + Math.sin(time * 12 + Math.PI) * pistonStroke;
    }
  });

  // Dynamic Shader & MatCap material generator based on selected mode
  const getMaterial = (id, baseColor = '#475569', metalness = 0.85, roughness = 0.35, faultCondition = false, residualVal = 0, currentTemp = 840) => {
    const isSelected = selectedHotspot === id;
    const isFaulty = faultCondition || Math.abs(residualVal) > 40;

    // 1. Fault Overheat Alert Material (Muted Defense Crimson)
    if (isFaulty) {
      return new THREE.MeshStandardMaterial({
        color: '#9E2A2B',
        emissive: '#5C1D1E',
        emissiveIntensity: 0.75,
        metalness: 0.6,
        roughness: 0.3,
        wireframe: xrayMode === 'WIREFRAME_XRAY'
      });
    }

    // 2. Active User Selected Hotspot (Champagne Titanium Bronze)
    if (isSelected) {
      return new THREE.MeshStandardMaterial({
        color: '#C59B27',
        emissive: '#785A12',
        emissiveIntensity: 0.45,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: xrayMode === 'WIREFRAME_XRAY'
      });
    }

    // 3. FLIR Thermal Infrared Heatmap Mode
    if (xrayMode === 'FLIR_THERMAL') {
      const tempRatio = Math.max(0, Math.min(1, (currentTemp - 700) / 300));
      const thermalColor = new THREE.Color().setHSL(0.6 - tempRatio * 0.55, 0.7, 0.45);
      return new THREE.MeshStandardMaterial({
        color: thermalColor,
        emissive: thermalColor,
        emissiveIntensity: 0.3 + tempRatio * 0.3,
        metalness: 0.4,
        roughness: 0.5
      });
    }

    // 4. CAD Blueprint Shading Mode
    if (xrayMode === 'CAD_BLUEPRINT') {
      return new THREE.MeshStandardMaterial({
        color: '#1E293B',
        emissive: '#0F172A',
        emissiveIntensity: 0.15,
        metalness: 0.7,
        roughness: 0.4,
        wireframe: false
      });
    }

    // 5. Metallic Chrome / Alloy Precision Mode
    if (xrayMode === 'METALLIC_ALLOY') {
      return new THREE.MeshStandardMaterial({
        color: '#CBD5E1',
        metalness: 0.96,
        roughness: 0.15
      });
    }

    // 6. Wireframe X-Ray Mode
    if (xrayMode === 'WIREFRAME_XRAY') {
      return new THREE.MeshStandardMaterial({
        color: '#C59B27',
        wireframe: true,
        transparent: true,
        opacity: 0.55
      });
    }

    // 7. Default: Stealth Titanium & Matte Carbon
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: metalness,
      roughness: roughness
    });
  };

  // Materials for each individual subsystem
  const crankMat = getMaterial('ENGINE_BLOCK', '#334155', 0.85, 0.3);
  const darkAlloyMat = getMaterial('ENGINE_BLOCK', '#1E293B', 0.92, 0.25);
  const internalPistonMat = getMaterial('ENGINE_BLOCK', '#94A3B8', 0.95, 0.12);
  const wiringMat = getMaterial('AVIONICS_ECU', '#475569', 0.3, 0.6);
  const goldAccentMat = new THREE.MeshStandardMaterial({ color: '#C59B27', metalness: 0.9, roughness: 0.25 });

  const cyl1Mat = getMaterial('CYLINDER_1', '#475569', 0.8, 0.35, activeFault === 'COOLING_DEGRADATION', egtRes[0], telemetry?.engine?.egt?.[0]);
  const cyl2Mat = getMaterial('CYLINDER_2', '#475569', 0.8, 0.35, activeFault === 'COOLING_DEGRADATION' || activeFault === 'BLOW_BY', egtRes[1], telemetry?.engine?.egt?.[1]);
  const cyl3Mat = getMaterial('CYLINDER_3', '#475569', 0.8, 0.35, activeFault === 'CYL3_INJECTOR', egtRes[2], telemetry?.engine?.egt?.[2]);
  const cyl4Mat = getMaterial('CYLINDER_4', '#475569', 0.8, 0.35, activeFault === 'COOLING_DEGRADATION', egtRes[3], telemetry?.engine?.egt?.[3]);

  const turboMat = getMaterial('TURBOCHARGER', '#1E293B', 0.9, 0.25, activeFault === 'TURBO_WASTEGATE_STUCK', telemetry?.residuals?.mapResidual || 0, 880);
  const oilMat = getMaterial('OIL_SYSTEM', '#334155', 0.75, 0.4, activeFault === 'OIL_PUMP_CAVITATION' || activeFault === 'BLOW_BY', telemetry?.residuals?.oilPressResidual || 0);
  const fuelMat = getMaterial('FUEL_SYSTEM', '#1E293B', 0.85, 0.3);
  const ecuMat = getMaterial('AVIONICS_ECU', '#1E293B', 0.8, 0.3);

  // Filter components based on isolated solo focus
  const showBlock = isolatedPart === 'ALL' || isolatedPart === 'ENGINE_BLOCK';
  const showCylinders = isolatedPart === 'ALL' || isolatedPart === 'CYLINDERS' || isolatedPart === 'ENGINE_BLOCK';
  const showTurbo = isolatedPart === 'ALL' || isolatedPart === 'TURBOCHARGER';
  const showFuel = isolatedPart === 'ALL' || isolatedPart === 'FUEL_SYSTEM';
  const showOil = isolatedPart === 'ALL' || isolatedPart === 'OIL_SYSTEM';
  const showAvionics = isolatedPart === 'ALL' || isolatedPart === 'AVIONICS_ECU';

  return (
    <group ref={groupRef} position={[0, 0.4, 0]}>
      {/* =========================================================================
          1. CENTRAL BOXER CRANKCASE & INTERNAL ROTATING CRANKSHAFT
         ========================================================================= */}
      {showBlock && (
        <group 
          position={[0, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot('ENGINE_BLOCK'); }}
        >
          {/* Main Die-Cast Aluminum Crankcase Body */}
          <mesh position={[0, 0, 0]} material={crankMat} castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.68, 0.46]} />
          </mesh>

          {/* Stiffening Web Ribs on Upper Crankcase */}
          {[-0.18, 0, 0.18].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0.24]} material={darkAlloyMat}>
              <boxGeometry args={[0.52, 0.04, 0.04]} />
            </mesh>
          ))}

          {/* Sump Flange Perimeter Lip */}
          <mesh position={[0, 0, -0.22]} material={darkAlloyMat}>
            <boxGeometry args={[0.58, 0.72, 0.03]} />
          </mesh>

          {/* Front Reduction Gearbox Bellhousing */}
          <mesh position={[0, -0.42, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={darkAlloyMat}>
            <cylinderGeometry args={[0.19, 0.24, 0.24, 28]} />
          </mesh>

          {/* Precision Driveshaft Propeller Spindle */}
          <mesh position={[0, -0.58, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={internalPistonMat}>
            <cylinderGeometry args={[0.075, 0.075, 0.18, 20]} />
          </mesh>

          {/* Propeller Hub Spline Teeth */}
          <mesh position={[0, -0.66, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={goldAccentMat}>
            <cylinderGeometry args={[0.082, 0.082, 0.04, 16]} />
          </mesh>

          {/* Internal Crankshaft Axis (Visible in cutaway / X-Ray) */}
          <group ref={crankRef} position={[0, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={internalPistonMat}>
              <cylinderGeometry args={[0.04, 0.04, 0.6, 16]} />
            </mesh>
            {/* Crankshaft Counterweights */}
            {[-0.15, 0.15].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} rotation={[0, 0, idx * Math.PI]} material={darkAlloyMat}>
                <boxGeometry args={[0.16, 0.05, 0.08]} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* =========================================================================
          2. FOUR BOXER COMBUSTION CHAMBERS WITH RECIPROCATING PISTONS
         ========================================================================= */}
      {showCylinders && (
        <>
          {/* ----------------- CYLINDER 1 (Left Forward) ----------------- */}
          <group 
            position={[-0.38 - exp * 0.55, -0.16, 0.06]} 
            rotation={[0, 0, 0.38]}
            onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_1'); }}
          >
            {/* Cylinder Barrel Body */}
            <mesh material={cyl1Mat}>
              <cylinderGeometry args={[0.125, 0.125, 0.34, 24]} />
            </mesh>

            {/* NiCaSil Plated Cylinder Cooling Fins Array */}
            {[-0.1, -0.04, 0.02, 0.08, 0.14].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} material={darkAlloyMat}>
                <cylinderGeometry args={[0.152, 0.152, 0.016, 24]} />
              </mesh>
            ))}

            {/* Cylinder Head / Dual Overhead Cam Valve Cover */}
            <mesh position={[0, 0.22, 0]} material={cyl1Mat}>
              <boxGeometry args={[0.24, 0.14, 0.24]} />
            </mesh>

            {/* Dual Spark Plug Boots & Ignition Leads */}
            <mesh position={[-0.09, 0.29, 0.04]} rotation={[0, 0, -0.35]} material={darkAlloyMat}>
              <cylinderGeometry args={[0.024, 0.024, 0.09, 10]} />
            </mesh>
            <mesh position={[0.09, 0.29, -0.04]} rotation={[0, 0, 0.35]} material={darkAlloyMat}>
              <cylinderGeometry args={[0.024, 0.024, 0.09, 10]} />
            </mesh>

            {/* Reciprocating Forged Aluminum Piston Inside Chamber */}
            <group ref={pistonRefs[0]} position={[-0.32, 0, 0]}>
              <mesh material={internalPistonMat}>
                <cylinderGeometry args={[0.11, 0.11, 0.12, 18]} />
              </mesh>
              {/* Piston Compression Rings */}
              <mesh position={[0, 0.03, 0]} material={goldAccentMat}>
                <torusGeometry args={[0.112, 0.005, 8, 20]} />
              </mesh>
              {/* Connecting Rod Wrist Pin */}
              <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={darkAlloyMat}>
                <cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
              </mesh>
            </group>

            {/* Combustion Chamber Core Flame Glow Pulse */}
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.08, 16, 12]} />
              <meshBasicMaterial 
                color={activeFault === 'COOLING_DEGRADATION' ? '#EF4444' : '#F59E0B'} 
                transparent 
                opacity={0.35} 
              />
            </mesh>
          </group>

          {/* ----------------- CYLINDER 2 (Right Forward) ----------------- */}
          <group 
            position={[0.38 + exp * 0.55, -0.16, 0.06]} 
            rotation={[0, 0, -0.38]}
            onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_2'); }}
          >
            <mesh material={cyl2Mat}>
              <cylinderGeometry args={[0.125, 0.125, 0.34, 24]} />
            </mesh>
            {[-0.1, -0.04, 0.02, 0.08, 0.14].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} material={darkAlloyMat}>
                <cylinderGeometry args={[0.152, 0.152, 0.016, 24]} />
              </mesh>
            ))}
            <mesh position={[0, 0.22, 0]} material={cyl2Mat}>
              <boxGeometry args={[0.24, 0.14, 0.24]} />
            </mesh>
            <mesh position={[0.09, 0.29, 0.04]} rotation={[0, 0, 0.35]} material={darkAlloyMat}>
              <cylinderGeometry args={[0.024, 0.024, 0.09, 10]} />
            </mesh>

            {/* Reciprocating Piston 2 */}
            <group ref={pistonRefs[1]} position={[0.32, 0, 0]}>
              <mesh material={internalPistonMat}>
                <cylinderGeometry args={[0.11, 0.11, 0.12, 18]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} material={goldAccentMat}>
                <torusGeometry args={[0.112, 0.005, 8, 20]} />
              </mesh>
            </group>

            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.08, 16, 12]} />
              <meshBasicMaterial 
                color={activeFault === 'BLOW_BY' ? '#EF4444' : '#F59E0B'} 
                transparent 
                opacity={0.35} 
              />
            </mesh>
          </group>

          {/* ----------------- CYLINDER 3 (Left Aft - Active Diagnostic Focus) ----------------- */}
          <group 
            position={[-0.38 - exp * 0.55, 0.22, 0.06]} 
            rotation={[0, 0, 0.38]}
            onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_3'); }}
          >
            <mesh material={cyl3Mat}>
              <cylinderGeometry args={[0.125, 0.125, 0.34, 24]} />
            </mesh>
            {[-0.1, -0.04, 0.02, 0.08, 0.14].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} material={darkAlloyMat}>
                <cylinderGeometry args={[0.152, 0.152, 0.016, 24]} />
              </mesh>
            ))}
            <mesh position={[0, 0.22, 0]} material={cyl3Mat}>
              <boxGeometry args={[0.24, 0.14, 0.24]} />
            </mesh>
            <mesh position={[-0.09, 0.29, 0.04]} rotation={[0, 0, -0.35]} material={darkAlloyMat}>
              <cylinderGeometry args={[0.024, 0.024, 0.09, 10]} />
            </mesh>

            {/* Reciprocating Piston 3 */}
            <group ref={pistonRefs[2]} position={[-0.32, 0, 0]}>
              <mesh material={internalPistonMat}>
                <cylinderGeometry args={[0.11, 0.11, 0.12, 18]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} material={goldAccentMat}>
                <torusGeometry args={[0.112, 0.005, 8, 20]} />
              </mesh>
            </group>

            {/* Overheat Plasma Glow for Cylinder 3 if Fault Injected */}
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.09, 16, 12]} />
              <meshBasicMaterial 
                color={activeFault === 'CYL3_INJECTOR' ? '#EF4444' : '#F59E0B'} 
                transparent 
                opacity={activeFault === 'CYL3_INJECTOR' ? 0.75 : 0.35} 
              />
            </mesh>
          </group>

          {/* ----------------- CYLINDER 4 (Right Aft) ----------------- */}
          <group 
            position={[0.38 + exp * 0.55, 0.22, 0.06]} 
            rotation={[0, 0, -0.38]}
            onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_4'); }}
          >
            <mesh material={cyl4Mat}>
              <cylinderGeometry args={[0.125, 0.125, 0.34, 24]} />
            </mesh>
            {[-0.1, -0.04, 0.02, 0.08, 0.14].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} material={darkAlloyMat}>
                <cylinderGeometry args={[0.152, 0.152, 0.016, 24]} />
              </mesh>
            ))}
            <mesh position={[0, 0.22, 0]} material={cyl4Mat}>
              <boxGeometry args={[0.24, 0.14, 0.24]} />
            </mesh>
            <mesh position={[0.09, 0.29, 0.04]} rotation={[0, 0, 0.35]} material={darkAlloyMat}>
              <cylinderGeometry args={[0.024, 0.024, 0.09, 10]} />
            </mesh>

            {/* Reciprocating Piston 4 */}
            <group ref={pistonRefs[3]} position={[0.32, 0, 0]}>
              <mesh material={internalPistonMat}>
                <cylinderGeometry args={[0.11, 0.11, 0.12, 18]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} material={goldAccentMat}>
                <torusGeometry args={[0.112, 0.005, 8, 20]} />
              </mesh>
            </group>

            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.08, 16, 12]} />
              <meshBasicMaterial color="#F59E0B" transparent opacity={0.35} />
            </mesh>
          </group>
        </>
      )}

      {/* =========================================================================
          3. TURBOCHARGER & ELECTRONIC WASTEGATE ASSEMBLY
         ========================================================================= */}
      {showTurbo && (
        <group 
          position={[0, 0.52 + exp * 0.6, -0.1]}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot('TURBOCHARGER'); }}
        >
          {/* Turbo Inconel Turbine Scroll Volute */}
          <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={turboMat}>
            <torusGeometry args={[0.14, 0.07, 20, 32]} />
          </mesh>

          {/* Aluminum Compressor Wheel Housing */}
          <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI / 2, 0]} material={darkAlloyMat}>
            <torusGeometry args={[0.12, 0.055, 18, 28]} />
          </mesh>

          {/* Center Bearing Cartridge CHRA */}
          <mesh position={[0, 0.06, 0]} material={crankMat}>
            <cylinderGeometry args={[0.07, 0.07, 0.14, 16]} />
          </mesh>

          {/* High-Speed Rotating Inconel Turbine Wheel Blades */}
          <group ref={turboRotorRef} position={[0, 0, 0]}>
            {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle, idx) => (
              <mesh key={idx} rotation={[0, 0, angle]} material={goldAccentMat}>
                <boxGeometry args={[0.015, 0.22, 0.04]} />
              </mesh>
            ))}
          </group>

          {/* Electronic Wastegate Actuator Servo & Linkage */}
          <mesh position={[0.18, -0.06, 0.09]} rotation={[0, 0, 0.35]} material={darkAlloyMat}>
            <cylinderGeometry args={[0.04, 0.04, 0.14, 14]} />
          </mesh>
          <mesh position={[0.12, 0.04, 0.08]} rotation={[0, 0, -0.2]} material={goldAccentMat}>
            <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
          </mesh>

          {/* Stainless Exhaust Collector Manifold Tubes */}
          <mesh geometry={createTubeGeometry([
            [-0.26, -0.24, 0],
            [-0.14, -0.1, 0],
            [0, 0, 0],
            [0.14, -0.1, 0],
            [0.26, -0.24, 0],
          ], 0.038)} material={darkAlloyMat} />
        </group>
      )}

      {/* =========================================================================
          4. HIGH-PRESSURE FUEL DELIVERY RAILS & INJECTOR SOLENOIDS
         ========================================================================= */}
      {showFuel && (
        <group position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onSelectHotspot('FUEL_SYSTEM'); }}>
          {/* Left Fuel Rail */}
          <mesh position={[-0.34, 0.02, 0.22 + exp * 0.3]} rotation={[Math.PI / 2, 0, 0]} material={fuelMat}>
            <cylinderGeometry args={[0.022, 0.022, 0.52, 16]} />
          </mesh>
          {/* Right Fuel Rail */}
          <mesh position={[0.34, 0.02, 0.22 + exp * 0.3]} rotation={[Math.PI / 2, 0, 0]} material={fuelMat}>
            <cylinderGeometry args={[0.022, 0.022, 0.52, 16]} />
          </mesh>

          {/* Piezo Injectors (4 Cylinders) */}
          {[
            [-0.34, -0.14, 0.14 + exp * 0.3],
            [0.34, -0.14, 0.14 + exp * 0.3],
            [-0.34, 0.2, 0.14 + exp * 0.3],
            [0.34, 0.2, 0.14 + exp * 0.3],
          ].map((pos, idx) => (
            <mesh key={idx} position={pos} rotation={[0.4, 0, 0]} material={goldAccentMat}>
              <cylinderGeometry args={[0.018, 0.012, 0.12, 12]} />
            </mesh>
          ))}

          {/* Central Fuel Pressure Regulator Valve */}
          <mesh position={[0, -0.22, 0.22 + exp * 0.3]} material={darkAlloyMat}>
            <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          5. DRY SUMP LUBRICATION RESERVOIR & OIL PUMP CASING
         ========================================================================= */}
      {showOil && (
        <group 
          position={[0, -0.06, -0.28 - exp * 0.45]}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot('OIL_SYSTEM'); }}
        >
          {/* Lower Aluminum Oil Pan Reservoir */}
          <mesh material={oilMat}>
            <boxGeometry args={[0.44, 0.56, 0.14]} />
          </mesh>

          {/* Bottom Oil Drain Plug */}
          <mesh position={[0, 0.2, -0.08]} material={goldAccentMat}>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
          </mesh>

          {/* Spin-On Cylindrical Oil Filter Canister */}
          <mesh position={[0.16, 0.2, -0.1]} rotation={[0, 0, 0]} material={darkAlloyMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.18, 20]} />
          </mesh>

          {/* Oil Cooler Radiator Matrix */}
          <mesh position={[-0.14, 0.2, -0.1]} material={darkAlloyMat}>
            <boxGeometry args={[0.16, 0.16, 0.08]} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          6. TOP-MOUNTED DUAL FADEC ECU & MIL-SPEC AVIONICS HARNESS
         ========================================================================= */}
      {showAvionics && (
        <group 
          position={[0, 0.06, 0.36 + exp * 0.5]}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot('AVIONICS_ECU'); }}
        >
          {/* Main ECU Enclosure Box */}
          <mesh material={ecuMat}>
            <boxGeometry args={[0.38, 0.46, 0.16]} />
          </mesh>

          {/* Anodized Aluminum Heatsink Cooling Fins */}
          {[-0.14, -0.07, 0, 0.07, 0.14].map((x, idx) => (
            <mesh key={idx} position={[x, 0, 0.09]} material={darkAlloyMat}>
              <boxGeometry args={[0.02, 0.42, 0.03]} />
            </mesh>
          ))}

          {/* MIL-DTL-38999 Circular Avionics Connectors */}
          {[-0.12, 0, 0.12].map((x, idx) => (
            <mesh key={idx} position={[x, 0.24, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={goldAccentMat}>
              <cylinderGeometry args={[0.032, 0.032, 0.05, 16]} />
            </mesh>
          ))}

          {/* Status Diagnostic Beacons (Active Nominal Emerald / Fault Crimson) */}
          <mesh position={[0.12, -0.16, 0.09]}>
            <boxGeometry args={[0.06, 0.025, 0.015]} />
            <meshBasicMaterial color={activeFault !== 'NONE' ? '#EF4444' : '#10B981'} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          7. INTRICATE BRAIDED SENSOR & ACTUATOR HARNESS LOOM
         ========================================================================= */}
      {showAvionics && (
        <group position={[0, 0, 0]}>
          {/* ECU to Cyl 1 & 3 Harness */}
          <mesh geometry={createTubeGeometry([
            [0, 0.2, 0.38 + exp * 0.3],
            [-0.2, 0.12, 0.32 + exp * 0.2],
            [-0.36, -0.06, 0.26 + exp * 0.1],
            [-0.42, -0.16, 0.18],
          ])} material={wiringMat} />

          {/* ECU to Cyl 2 & 4 Harness */}
          <mesh geometry={createTubeGeometry([
            [0, 0.2, 0.38 + exp * 0.3],
            [0.2, 0.12, 0.32 + exp * 0.2],
            [0.36, -0.06, 0.26 + exp * 0.1],
            [0.42, -0.16, 0.18],
          ])} material={wiringMat} />

          {/* ECU to Turbo Wastegate Sensor */}
          <mesh geometry={createTubeGeometry([
            [0, 0.26, 0.38 + exp * 0.3],
            [0.08, 0.38, 0.25 + exp * 0.2],
            [0.16, 0.46, 0.06],
          ])} material={wiringMat} />
        </group>
      )}
    </group>
  );
};
