import React, { useRef } from 'react';
import * as THREE from 'three';

// Solid matte technical CAD materials for internal mechanical parts.
const mechMaterial = new THREE.MeshStandardMaterial({
  color: '#64748b',
  metalness: 0.85,
  roughness: 0.35,
});

const darkMechMaterial = new THREE.MeshStandardMaterial({
  color: '#475569',
  metalness: 0.9,
  roughness: 0.25,
});

const wiringMaterial = new THREE.MeshStandardMaterial({
  color: '#64748b',
  roughness: 0.5,
  metalness: 0.3,
});

// Helper for curved tube wiring harness paths
function createTubeGeometry(points, radius = 0.022, tubularSegments = 32) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
}

export const UavEngineInternals = ({ 
  isExploded = false, 
  selectedHotspot, 
  onSelectHotspot, 
  telemetry, 
  xrayMode = 'GHOST' 
}) => {
  const groupRef = useRef();
  const egtRes = telemetry?.residuals?.egtResiduals || [0, 0, 0, 0];
  const activeFault = telemetry?.health?.activeFault || 'NONE';

  const exp = isExploded ? 0.85 : 0.0;

  // Emissive color helper for active component inspection
  const getComponentColor = (id, baseMat = mechMaterial, faultCondition = false, residualVal = 0) => {
    const isSelected = selectedHotspot === id;
    if (faultCondition || Math.abs(residualVal) > 40) {
      return new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#ef4444',
        emissiveIntensity: 0.7,
        metalness: 0.7,
        roughness: 0.3
      });
    }
    if (isSelected) {
      return new THREE.MeshStandardMaterial({
        color: '#f97316',
        emissive: '#7c2d12',
        emissiveIntensity: 0.15,
        metalness: 0.8,
        roughness: 0.25
      });
    }
    return baseMat;
  };

  const cyl1Mat = getComponentColor('CYLINDER_1', mechMaterial, activeFault === 'COOLING_DEGRADATION', egtRes[0]);
  const cyl2Mat = getComponentColor('CYLINDER_2', mechMaterial, activeFault === 'COOLING_DEGRADATION' || activeFault === 'BLOW_BY', egtRes[1]);
  const cyl3Mat = getComponentColor('CYLINDER_3', mechMaterial, activeFault === 'CYL3_INJECTOR', egtRes[2]);
  const cyl4Mat = getComponentColor('CYLINDER_4', mechMaterial, activeFault === 'COOLING_DEGRADATION', egtRes[3]);
  const turboMat = getComponentColor('TURBOCHARGER', darkMechMaterial, activeFault === 'TURBO_WASTEGATE_STUCK', telemetry?.residuals?.mapResidual || 0);
  const oilMat = getComponentColor('OIL_SYSTEM', darkMechMaterial, activeFault === 'OIL_PUMP_CAVITATION' || activeFault === 'BLOW_BY', telemetry?.residuals?.oilPressResidual || 0);
  const ecuMat = getComponentColor('AVIONICS_ECU', darkMechMaterial, false);
  const crankMat = getComponentColor('ENGINE_BLOCK', mechMaterial, false);

  return (
    <group ref={groupRef} position={[0, 0.4, 0]}>
      {/* 1. Central Crankcase & Transmission Gearcase */}
      <group 
        position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('ENGINE_BLOCK'); }}
      >
        {/* Main Crankcase Housing */}
        <mesh position={[0, 0, 0]} material={crankMat} castShadow receiveShadow>
          <boxGeometry args={[0.54, 0.65, 0.44]} />
        </mesh>
        {/* Upper Sump Ribs */}
        <mesh position={[0, 0.28, 0]} material={darkMechMaterial}>
          <boxGeometry args={[0.48, 0.12, 0.38]} />
        </mesh>
        {/* Front Driveshaft Output Flange / Gear Housing */}
        <mesh position={[0, -0.38, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.18, 0.22, 0.24, 24]} />
        </mesh>
        {/* Driveshaft Spindle */}
        <mesh position={[0, -0.52, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={mechMaterial}>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 16]} />
        </mesh>
      </group>

      {/* 2. Four Boxer Cylinders (Angled Opposed Configuration) */}
      {/* Cylinder 1 (Left Forward) */}
      <group 
        position={[-0.38 - exp * 0.4, -0.15, 0.06]} 
        rotation={[0, 0, 0.38]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_1'); }}
      >
        {/* Cylinder Barrel */}
        <mesh material={cyl1Mat}>
          <cylinderGeometry args={[0.12, 0.12, 0.32, 18]} />
        </mesh>
        {/* Cooling Fins */}
        {[-0.08, -0.02, 0.04, 0.1].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} material={darkMechMaterial}>
            <cylinderGeometry args={[0.145, 0.145, 0.018, 18]} />
          </mesh>
        ))}
        {/* Cylinder Head / Valve Cover */}
        <mesh position={[0, 0.2, 0]} material={cyl1Mat}>
          <boxGeometry args={[0.22, 0.12, 0.22]} />
        </mesh>
        {/* Spark Plug Boot */}
        <mesh position={[-0.08, 0.26, 0]} rotation={[0, 0, -0.3]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.025, 0.025, 0.09, 8]} />
        </mesh>
      </group>

      {/* Cylinder 2 (Right Forward) */}
      <group 
        position={[0.38 + exp * 0.4, -0.15, 0.06]} 
        rotation={[0, 0, -0.38]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_2'); }}
      >
        <mesh material={cyl2Mat}>
          <cylinderGeometry args={[0.12, 0.12, 0.32, 18]} />
        </mesh>
        {[-0.08, -0.02, 0.04, 0.1].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} material={darkMechMaterial}>
            <cylinderGeometry args={[0.145, 0.145, 0.018, 18]} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]} material={cyl2Mat}>
          <boxGeometry args={[0.22, 0.12, 0.22]} />
        </mesh>
        <mesh position={[0.08, 0.26, 0]} rotation={[0, 0, 0.3]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.025, 0.025, 0.09, 8]} />
        </mesh>
      </group>

      {/* Cylinder 3 (Left Aft - Active Monitoring & Primary Focus) */}
      <group 
        position={[-0.38 - exp * 0.4, 0.2, 0.06]} 
        rotation={[0, 0, 0.38]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_3'); }}
      >
        <mesh material={cyl3Mat}>
          <cylinderGeometry args={[0.12, 0.12, 0.32, 18]} />
        </mesh>
        {[-0.08, -0.02, 0.04, 0.1].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} material={darkMechMaterial}>
            <cylinderGeometry args={[0.145, 0.145, 0.018, 18]} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]} material={cyl3Mat}>
          <boxGeometry args={[0.22, 0.12, 0.22]} />
        </mesh>
        <mesh position={[-0.08, 0.26, 0]} rotation={[0, 0, -0.3]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.025, 0.025, 0.09, 8]} />
        </mesh>
      </group>

      {/* Cylinder 4 (Right Aft) */}
      <group 
        position={[0.38 + exp * 0.4, 0.2, 0.06]} 
        rotation={[0, 0, -0.38]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_4'); }}
      >
        <mesh material={cyl4Mat}>
          <cylinderGeometry args={[0.12, 0.12, 0.32, 18]} />
        </mesh>
        {[-0.08, -0.02, 0.04, 0.1].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} material={darkMechMaterial}>
            <cylinderGeometry args={[0.145, 0.145, 0.018, 18]} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]} material={cyl4Mat}>
          <boxGeometry args={[0.22, 0.12, 0.22]} />
        </mesh>
        <mesh position={[0.08, 0.26, 0]} rotation={[0, 0, 0.3]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.025, 0.025, 0.09, 8]} />
        </mesh>
      </group>

      {/* 3. Top-Mounted Avionics Flight Controller & ECU Enclosure */}
      <group 
        position={[0, 0.05, 0.32 + exp * 0.35]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('AVIONICS_ECU'); }}
      >
        {/* Main ECU Unit Box */}
        <mesh material={ecuMat}>
          <boxGeometry args={[0.36, 0.42, 0.16]} />
        </mesh>
        {/* Avionics Connectors & Terminal Blocks */}
        {[-0.12, 0, 0.12].map((x, idx) => (
          <mesh key={idx} position={[x, 0.22, 0.02]} material={darkMechMaterial}>
            <boxGeometry args={[0.07, 0.06, 0.08]} />
          </mesh>
        ))}
        {/* Status Optical Beacons / LED array */}
        <mesh position={[0.1, 0.12, 0.09]}>
          <boxGeometry args={[0.08, 0.03, 0.02]} />
          <meshBasicMaterial color={activeFault !== 'NONE' ? '#ef4444' : '#10b981'} />
        </mesh>
      </group>

      {/* 4. Complex Intricate Wiring Harnesses & Loom Bundles */}
      <group position={[0, 0, 0]}>
        {/* Harness Loop 1: ECU to Cyl 1 */}
        <mesh geometry={createTubeGeometry([
          [0, 0.2, 0.35],
          [-0.18, 0.1, 0.32],
          [-0.32, -0.05, 0.28],
          [-0.42, -0.12, 0.2],
        ])} material={wiringMaterial} />

        {/* Harness Loop 2: ECU to Cyl 2 */}
        <mesh geometry={createTubeGeometry([
          [0, 0.2, 0.35],
          [0.18, 0.1, 0.32],
          [0.32, -0.05, 0.28],
          [0.42, -0.12, 0.2],
        ])} material={wiringMaterial} />

        {/* Harness Loop 3: ECU to Cyl 3 & Aft Sensors */}
        <mesh geometry={createTubeGeometry([
          [-0.08, 0.22, 0.35],
          [-0.24, 0.28, 0.32],
          [-0.38, 0.25, 0.22],
        ])} material={wiringMaterial} />

        {/* Harness Loop 4: ECU to Cyl 4 */}
        <mesh geometry={createTubeGeometry([
          [0.08, 0.22, 0.35],
          [0.24, 0.28, 0.32],
          [0.38, 0.25, 0.22],
        ])} material={wiringMaterial} />

        {/* Harness Loop 5: Central Braided Cable Bridge across Cylinders */}
        <mesh geometry={createTubeGeometry([
          [-0.4, 0.05, 0.18],
          [-0.25, -0.18, 0.25],
          [0, -0.22, 0.28],
          [0.25, -0.18, 0.25],
          [0.4, 0.05, 0.18],
        ], 0.024)} material={wiringMaterial} />
      </group>

      {/* 5. Fuel Delivery Rails & High-Pressure Injection Lines */}
      <group position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onSelectHotspot('FUEL_SYSTEM'); }}>
        {/* Left Fuel Rail */}
        <mesh position={[-0.32, 0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.48, 12]} />
        </mesh>
        {/* Right Fuel Rail */}
        <mesh position={[0.32, 0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.48, 12]} />
        </mesh>
      </group>

      {/* 6. Turbocharger & Exhaust Manifold Unit */}
      <group 
        position={[0, 0.48 + exp * 0.4, -0.1]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('TURBOCHARGER'); }}
      >
        {/* Turbo Turbine Volute Housing */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={turboMat}>
          <torusGeometry args={[0.13, 0.065, 16, 24]} />
        </mesh>
        {/* Center Compressor Core */}
        <mesh position={[0, 0, 0]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
        </mesh>
        {/* Wastegate Actuator Canister & Linkage Rod */}
        <mesh position={[0.16, -0.06, 0.08]} rotation={[0, 0, 0.4]} material={mechMaterial}>
          <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
        </mesh>
        {/* Exhaust Collector Tube */}
        <mesh geometry={createTubeGeometry([
          [-0.22, -0.2, 0],
          [-0.12, -0.08, 0],
          [0, 0, 0],
          [0.12, -0.08, 0],
          [0.22, -0.2, 0],
        ], 0.035)} material={darkMechMaterial} />
      </group>

      {/* 7. Oil Sump, Pump & Filter Housing */}
      <group 
        position={[0, -0.05, -0.26 - exp * 0.3]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('OIL_SYSTEM'); }}>
        {/* Oil Pan Lower Reservoir */}
        <mesh material={oilMat}>
          <boxGeometry args={[0.42, 0.52, 0.12]} />
        </mesh>
        {/* Cylindrical Oil Filter Canister */}
        <mesh position={[0.15, 0.18, -0.08]} rotation={[0, 0, 0]} material={darkMechMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 16]} />
        </mesh>
      </group>
    </group>
  );
};
