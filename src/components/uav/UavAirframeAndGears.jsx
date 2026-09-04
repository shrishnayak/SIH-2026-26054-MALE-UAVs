import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Matte aerospace CAD materials with restrained structural contrast.
const ghostSkinMaterial = new THREE.MeshPhysicalMaterial({
  color: '#64748b',
  roughness: 0.62,
  metalness: 0.55,
  transparent: true,
  opacity: 0.72,
  transmission: 0.05,
  ior: 1.3,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: '#334155',
  wireframe: true,
  transparent: true,
  opacity: 0.18,
});

const glowingWireMaterial = new THREE.MeshBasicMaterial({
  color: '#475569',
  wireframe: true,
  transparent: true,
  opacity: 0.24,
});

const internalSparMaterial = new THREE.MeshStandardMaterial({
  color: '#475569',
  metalness: 0.9,
  roughness: 0.42,
});

const landingGearMetal = new THREE.MeshStandardMaterial({
  color: '#64748b',
  metalness: 0.9,
  roughness: 0.3,
});

const landingGearDark = new THREE.MeshStandardMaterial({
  color: '#334155',
  metalness: 0.95,
  roughness: 0.25,
});

const tireMaterial = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  metalness: 0.4,
  roughness: 0.7,
});

export const UavAirframeAndGears = ({
  isExploded = false,
  selectedHotspot,
  onSelectHotspot,
  telemetry,
  propRef,
}) => {
  const frontPropRef = useRef();

  // Rotate Propeller based on live engine RPM
  useFrame((state, delta) => {
    const rpm = telemetry?.engine?.rpm || 4800;
    const rotSpeed = (rpm / 60) * delta * 2.5;
    if (frontPropRef.current) {
      frontPropRef.current.rotation.z += rotSpeed;
    }
    if (propRef && propRef.current) {
      propRef.current.rotation.z += rotSpeed;
    }
  });

  const exp = isExploded ? 0.9 : 0.0;

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. TRANSLUCENT CYAN GHOSTED FUSELAGE
         ======================================================== */}
      <group position={[0, 0, 0]}>
        {/* Main Aerodynamic Fuselage Shell */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.52, 0.26, 5.8, 32, 16]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.522, 0.262, 5.82, 20, 14]} />
          <primitive object={wireframeMaterial} attach="material" />
        </mesh>

        {/* Nose Radome Fairing (Front) */}
        <mesh position={[0, -2.5, -0.02]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -2.5, -0.02]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.482, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={glowingWireMaterial} attach="material" />
        </mesh>

        {/* Internal Structural Bulkheads / Rings (X-Ray Framework) */}
        {[-2.0, -1.2, -0.4, 0.4, 1.2, 2.0, 2.8].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42 - (y * 0.04), 0.012, 8, 24]} />
            <meshBasicMaterial color="#64748b" opacity={0.2} transparent />
          </mesh>
        ))}

        {/* Longitudinal Internal Stringers */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh 
            key={idx} 
            position={[Math.cos(angle) * 0.38, 0.4, Math.sin(angle) * 0.38]}
          >
            <cylinderGeometry args={[0.01, 0.01, 5.6, 6]} />
            <meshBasicMaterial color="#475569" opacity={0.16} transparent />
          </mesh>
        ))}
      </group>

      {/* ========================================================
          2. HIGH-ASPECT-RATIO WINGS WITH INTERNAL SPARS & RIBS
         ======================================================== */}
      <group position={[0, 0.6, 0.1]}>
        {/* Left Wing Assembly */}
        <group position={[-exp * 0.6, 0, 0]}>
          {/* Outer Translucent Wing Skin */}
          <mesh position={[-4.5, 0, 0]} rotation={[0, 0, 0.02]}>
            <boxGeometry args={[8.4, 0.09, 0.96]} />
            <primitive object={ghostSkinMaterial} attach="material" />
          </mesh>
          <mesh position={[-4.5, 0, 0]} rotation={[0, 0, 0.02]}>
            <boxGeometry args={[8.42, 0.092, 0.962]} />
            <primitive object={wireframeMaterial} attach="material" />
          </mesh>

          {/* Spanwise Main Spar Tube */}
          <mesh position={[-4.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.02, 8.2, 12]} />
            <primitive object={internalSparMaterial} attach="material" />
          </mesh>

          {/* Wing Rib Cross-Sections */}
          {[-1.2, -2.4, -3.6, -4.8, -6.0, -7.2, -8.2].map((x, idx) => (
            <mesh key={idx} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.88, 0.075, 0.015]} />
              <primitive object={internalSparMaterial} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Right Wing Assembly */}
        <group position={[exp * 0.6, 0, 0]}>
          {/* Outer Translucent Wing Skin */}
          <mesh position={[4.5, 0, 0]} rotation={[0, 0, -0.02]}>
            <boxGeometry args={[8.4, 0.09, 0.96]} />
            <primitive object={ghostSkinMaterial} attach="material" />
          </mesh>
          <mesh position={[4.5, 0, 0]} rotation={[0, 0, -0.02]}>
            <boxGeometry args={[8.42, 0.092, 0.962]} />
            <primitive object={wireframeMaterial} attach="material" />
          </mesh>

          {/* Spanwise Main Spar Tube */}
          <mesh position={[4.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.02, 8.2, 12]} />
            <primitive object={internalSparMaterial} attach="material" />
          </mesh>

          {/* Wing Rib Cross-Sections */}
          {[1.2, 2.4, 3.6, 4.8, 6.0, 7.2, 8.2].map((x, idx) => (
            <mesh key={idx} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.88, 0.075, 0.015]} />
              <primitive object={internalSparMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================================================
          3. UNDERWING TWIN SENSOR / OPTICAL POD (Matching image_1.png)
         ======================================================== */}
      <group 
        position={[-1.8, 0.4, -0.45]}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('AVIONICS_ECU'); }}
      >
        {/* Pylon Mount Bracket */}
        <mesh position={[0, 0, 0.22]} material={landingGearDark}>
          <boxGeometry args={[0.22, 0.35, 0.12]} />
        </mesh>
        {/* Canister 1 (Left Optical/FLIR Sensor) */}
        <mesh position={[-0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.65, 20]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[-0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.132, 0.132, 0.652, 16]} />
          <primitive object={wireframeMaterial} attach="material" />
        </mesh>
        {/* Canister 1 Front Glowing Optical Aperture */}
        <mesh position={[-0.14, -0.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.04, 20]} />
          <meshStandardMaterial 
            color="#475569"
            emissive="#1e293b"
            emissiveIntensity={0.1}
            metalness={0.9} 
          />
        </mesh>

        {/* Canister 2 (Right Radar/Laser Sensor) */}
        <mesh position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.65, 20]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.132, 0.132, 0.652, 16]} />
          <primitive object={wireframeMaterial} attach="material" />
        </mesh>
        {/* Canister 2 Front Glowing Aperture */}
        <mesh position={[0.14, -0.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.04, 20]} />
          <meshStandardMaterial 
            color="#475569"
            emissive="#1e293b"
            emissiveIntensity={0.1}
            metalness={0.9} 
          />
        </mesh>
      </group>

      {/* ========================================================
          4. OVERSIZED FORWARD PROPELLER & SPINNER CONE (HERO FEATURE)
         ======================================================== */}
      <group 
        position={[0, -2.8, -0.05]} 
        ref={frontPropRef}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('ENGINE_BLOCK'); }}
      >
        {/* Central Aerodynamic Nose Spinner Cone */}
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.26, 0.58, 24]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.262, 0.582, 16]} />
          <primitive object={glowingWireMaterial} attach="material" />
        </mesh>
        {/* Spinner Base Ring */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={landingGearDark}>
          <cylinderGeometry args={[0.26, 0.28, 0.12, 24]} />
        </mesh>

        {/* Propeller Blade 1 (Dominant Vertical Hero Blade) */}
        <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
          {/* Blade Root Shank */}
          <mesh position={[0, 0.35, 0]} material={landingGearMetal}>
            <cylinderGeometry args={[0.04, 0.05, 0.22, 12]} />
          </mesh>
          {/* Aerodynamic Blade Foil (Slender Tapered Tip) */}
          <mesh position={[0, 1.3, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.14, 1.85, 0.024]} />
            <primitive object={ghostSkinMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.142, 1.852, 0.026]} />
            <primitive object={wireframeMaterial} attach="material" />
          </mesh>
        </group>

        {/* Propeller Blade 2 (Left Lower) */}
        <group position={[0, 0, 0]} rotation={[0, 0, (2 * Math.PI) / 3]}>
          <mesh position={[0, 0.35, 0]} material={landingGearMetal}>
            <cylinderGeometry args={[0.04, 0.05, 0.22, 12]} />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.14, 1.85, 0.024]} />
            <primitive object={ghostSkinMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.142, 1.852, 0.026]} />
            <primitive object={wireframeMaterial} attach="material" />
          </mesh>
        </group>

        {/* Propeller Blade 3 (Right Lower) */}
        <group position={[0, 0, 0]} rotation={[0, 0, -(2 * Math.PI) / 3]}>
          <mesh position={[0, 0.35, 0]} material={landingGearMetal}>
            <cylinderGeometry args={[0.04, 0.05, 0.22, 12]} />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.14, 1.85, 0.024]} />
            <primitive object={ghostSkinMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.142, 1.852, 0.026]} />
            <primitive object={wireframeMaterial} attach="material" />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          5. COMPLETE EXTENDED LANDING GEAR SYSTEM
         ======================================================== */}
      {/* A. Front Nose Gear Assembly */}
      <group position={[0, -2.1, -0.3]}>
        {/* Upper Mount Socket */}
        <mesh position={[0, 0, 0]} material={landingGearDark}>
          <boxGeometry args={[0.16, 0.2, 0.18]} />
        </mesh>
        {/* Telescopic Oleo Shock Absorber Outer Cylinder */}
        <mesh position={[0, 0, -0.45]} material={landingGearDark}>
          <cylinderGeometry args={[0.065, 0.065, 0.7, 16]} />
        </mesh>
        {/* Inner Shiny Chrome Piston Rod */}
        <mesh position={[0, 0, -0.85]} material={landingGearMetal}>
          <cylinderGeometry args={[0.045, 0.045, 0.45, 16]} />
        </mesh>
        {/* Scissor Torque Linkage Arms */}
        <mesh position={[0, 0.06, -0.55]} rotation={[0.4, 0, 0]} material={landingGearMetal}>
          <boxGeometry args={[0.03, 0.22, 0.02]} />
        </mesh>
        <mesh position={[0, 0.06, -0.72]} rotation={[-0.4, 0, 0]} material={landingGearMetal}>
          <boxGeometry args={[0.03, 0.22, 0.02]} />
        </mesh>
        {/* Wheel Fork Axle */}
        <mesh position={[0, 0, -1.05]} material={landingGearDark}>
          <cylinderGeometry args={[0.04, 0.04, 0.18, 12]} rotation={[0, 0, Math.PI / 2]} />
        </mesh>
        {/* Nose Wheel Tire (Translucent Wireframe + Hub) */}
        <mesh position={[0, 0, -1.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.11, 24]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0, -1.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.222, 0.222, 0.112, 16]} />
          <primitive object={glowingWireMaterial} attach="material" />
        </mesh>
        {/* Nose Wheel Center Hub */}
        <mesh position={[0, 0, -1.05]} rotation={[0, 0, Math.PI / 2]} material={landingGearMetal}>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 16]} />
        </mesh>
      </group>

      {/* B. Left Main Landing Gear */}
      <group position={[-0.4, 0.1, -0.3]}>
        {/* Heavy Diagonal Tubular Main Strut */}
        <mesh position={[-0.85, 0, -0.42]} rotation={[0, 0.65, 0]} material={landingGearMetal}>
          <cylinderGeometry args={[0.05, 0.04, 1.8, 16]} />
        </mesh>
        {/* Secondary Drag Brace */}
        <mesh position={[-0.7, 0.22, -0.38]} rotation={[0.25, 0.55, 0]} material={landingGearDark}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 12]} />
        </mesh>
        {/* Wheel Hub & Axle */}
        <mesh position={[-1.6, 0, -0.85]} material={landingGearDark}>
          <cylinderGeometry args={[0.045, 0.045, 0.2, 12]} rotation={[0, 0, Math.PI / 2]} />
        </mesh>
        {/* Left Main Wheel Tire */}
        <mesh position={[-1.6, 0, -0.85]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.14, 24]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[-1.6, 0, -0.85]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.282, 0.282, 0.142, 16]} />
          <primitive object={glowingWireMaterial} attach="material" />
        </mesh>
        <mesh position={[-1.6, 0, -0.85]} rotation={[0, 0, Math.PI / 2]} material={landingGearMetal}>
          <cylinderGeometry args={[0.11, 0.11, 0.15, 16]} />
        </mesh>
      </group>

      {/* C. Right Main Landing Gear */}
      <group position={[0.4, 0.1, -0.3]}>
        {/* Heavy Diagonal Tubular Main Strut */}
        <mesh position={[0.85, 0, -0.42]} rotation={[0, -0.65, 0]} material={landingGearMetal}>
          <cylinderGeometry args={[0.05, 0.04, 1.8, 16]} />
        </mesh>
        {/* Secondary Drag Brace */}
        <mesh position={[0.7, 0.22, -0.38]} rotation={[0.25, -0.55, 0]} material={landingGearDark}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 12]} />
        </mesh>
        {/* Wheel Hub & Axle */}
        <mesh position={[1.6, 0, -0.85]} material={landingGearDark}>
          <cylinderGeometry args={[0.045, 0.045, 0.2, 12]} rotation={[0, 0, Math.PI / 2]} />
        </mesh>
        {/* Right Main Wheel Tire */}
        <mesh position={[1.6, 0, -0.85]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.14, 24]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[1.6, 0, -0.85]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.282, 0.282, 0.142, 16]} />
          <primitive object={glowingWireMaterial} attach="material" />
        </mesh>
        <mesh position={[1.6, 0, -0.85]} rotation={[0, 0, Math.PI / 2]} material={landingGearMetal}>
          <cylinderGeometry args={[0.11, 0.11, 0.15, 16]} />
        </mesh>
      </group>

      {/* ========================================================
          6. EMPENNAGE / VERTICAL FIN & V-TAILS (AFT)
         ======================================================== */}
      <group position={[0, 3.1, 0.35]}>
        {/* Left V-Fin */}
        <mesh position={[-0.75 - exp * 0.4, 0, 0.4]} rotation={[0.45, 0, -0.52]}>
          <boxGeometry args={[0.06, 0.7, 1.5]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[-0.75 - exp * 0.4, 0, 0.4]} rotation={[0.45, 0, -0.52]}>
          <boxGeometry args={[0.062, 0.702, 1.502]} />
          <primitive object={wireframeMaterial} attach="material" />
        </mesh>

        {/* Right V-Fin */}
        <mesh position={[0.75 + exp * 0.4, 0, 0.4]} rotation={[0.45, 0, 0.52]}>
          <boxGeometry args={[0.06, 0.7, 1.5]} />
          <primitive object={ghostSkinMaterial} attach="material" />
        </mesh>
        <mesh position={[0.75 + exp * 0.4, 0, 0.4]} rotation={[0.45, 0, 0.52]}>
          <boxGeometry args={[0.062, 0.702, 1.502]} />
          <primitive object={wireframeMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
};
