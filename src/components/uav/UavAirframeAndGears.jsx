import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const UavAirframeAndGears = ({
  isExploded = false,
  explosionFactor = 0,
  selectedHotspot,
  onSelectHotspot,
  telemetry,
  propRef,
  xrayMode = 'STEALTH_CARBON',
  isolatedPart = 'ALL'
}) => {
  const frontPropRef = useRef();
  const gimbalRef = useRef();
  const satcomRef = useRef();

  // Rotate Propeller & Gimbal Optics based on telemetry
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const rpm = telemetry?.engine?.rpm || 4800;
    const rotSpeed = (rpm / 60) * delta * 2.8;

    if (frontPropRef.current) {
      frontPropRef.current.rotation.z += rotSpeed;
    }
    if (propRef && propRef.current) {
      propRef.current.rotation.z += rotSpeed;
    }

    // Gentle realistic EO/IR gimbal tracking sweep
    if (gimbalRef.current) {
      gimbalRef.current.rotation.z = Math.sin(time * 0.4) * 0.45;
      gimbalRef.current.rotation.x = Math.sin(time * 0.3) * 0.2 + 0.3;
    }

    // SATCOM satellite tracking motion
    if (satcomRef.current) {
      satcomRef.current.rotation.y = Math.sin(time * 0.2) * 0.35;
    }
  });

  const exp = typeof explosionFactor === 'number' && explosionFactor > 0 
    ? explosionFactor 
    : (isExploded ? 0.9 : 0.0);

  // Dynamic Airframe Material Generator
  const getAirframeSkinMat = () => {
    if (xrayMode === 'WIREFRAME_XRAY') {
      return new THREE.MeshBasicMaterial({
        color: '#C59B27',
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
    }
    if (xrayMode === 'CAD_BLUEPRINT') {
      return new THREE.MeshPhysicalMaterial({
        color: '#161D2A',
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
      });
    }
    if (xrayMode === 'FLIR_THERMAL') {
      return new THREE.MeshPhysicalMaterial({
        color: '#1A212D',
        roughness: 0.4,
        metalness: 0.3,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
      });
    }
    if (xrayMode === 'METALLIC_ALLOY') {
      return new THREE.MeshStandardMaterial({
        color: '#CBD5E1',
        metalness: 0.95,
        roughness: 0.2,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
    }
    // Default: Stealth Matte Carbon & Frosted Titanium
    return new THREE.MeshPhysicalMaterial({
      color: '#161D2A',
      roughness: 0.6,
      metalness: 0.75,
      transparent: true,
      opacity: 0.7,
      transmission: 0.1,
      ior: 1.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  };

  const ghostSkinMat = getAirframeSkinMat();

  const wireMat = new THREE.MeshBasicMaterial({
    color: '#C59B27',
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });

  const glowingAmberWireMat = new THREE.MeshBasicMaterial({
    color: '#C59B27',
    wireframe: true,
    transparent: true,
    opacity: 0.28,
  });

  const structuralSparMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.9,
    roughness: 0.3,
  });

  const landingGearMat = new THREE.MeshStandardMaterial({
    color: '#64748B',
    metalness: 0.92,
    roughness: 0.2,
  });

  const landingGearDarkMat = new THREE.MeshStandardMaterial({
    color: '#161D2A',
    metalness: 0.95,
    roughness: 0.25,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: '#C59B27',
    metalness: 0.9,
    roughness: 0.25,
  });

  const flirLensMat = new THREE.MeshPhysicalMaterial({
    color: '#475569',
    emissive: '#1E293B',
    emissiveIntensity: 0.3,
    metalness: 0.95,
    roughness: 0.15,
  });

  const showAirframe = isolatedPart === 'ALL' || isolatedPart === 'AIRFRAME';

  if (!showAirframe && isolatedPart !== 'ALL') {
    return null;
  }

  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. TRANSLUCENT STEALTH CARBON FUSELAGE & INTERNAL STRUCTURE
         ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main Aerodynamic Composite Fuselage Shell */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.54, 0.28, 6.0, 32, 16]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.542, 0.282, 6.02, 20, 14]} />
          <primitive object={wireMat} attach="material" />
        </mesh>

        {/* Nose Radome Fairing (SATCOM Enclosure) - Explodes forward */}
        <group position={[0, -2.6 - exp * 0.7, -0.02]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[0.5, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={ghostSkinMat} attach="material" />
          </mesh>
          <mesh rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[0.502, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={glowingAmberWireMat} attach="material" />
          </mesh>

          {/* Internal SATCOM Ku-Band Dish Antenna */}
          <group ref={satcomRef} position={[0, 0.15, 0.1]}>
            <mesh rotation={[0.4, 0, 0]} material={goldAccentMat}>
              <cylinderGeometry args={[0.22, 0.04, 0.08, 24]} />
            </mesh>
            {/* Feedhorn LNB */}
            <mesh position={[0, 0.12, 0.12]} rotation={[0.4, 0, 0]} material={structuralSparMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
            </mesh>
          </group>
        </group>

        {/* Ventral Chin EO/IR FLIR Sensor Gimbal Turret (360° Tracking) */}
        <group position={[0, -1.8, -0.42]} ref={gimbalRef}>
          {/* Gimbal Base Swivel Mount */}
          <mesh material={landingGearDarkMat}>
            <cylinderGeometry args={[0.18, 0.18, 0.1, 20]} />
          </mesh>
          {/* Gimbal Rotating Sphere Ball */}
          <mesh position={[0, 0, -0.12]} material={landingGearDarkMat}>
            <sphereGeometry args={[0.16, 24, 20]} />
          </mesh>
          {/* Thermal LWIR Optical Aperture Lens (Glowing Cyan) */}
          <mesh position={[0.06, -0.12, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
            <primitive object={flirLensMat} attach="material" />
          </mesh>
          {/* High-Definition Day Optical Zoom Lens */}
          <mesh position={[-0.06, -0.12, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
            <primitive object={flirLensMat} attach="material" />
          </mesh>
          {/* Laser Rangefinder / Target Illuminator Emitter */}
          <mesh position={[0, -0.14, -0.06]} rotation={[Math.PI / 2, 0, 0]} material={goldAccentMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.02, 10]} />
          </mesh>
        </group>

        {/* Internal Titanium Bulkheads / Structural Frames */}
        {[-2.0, -1.2, -0.4, 0.4, 1.2, 2.0, 2.8].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.44 - (y * 0.04), 0.014, 8, 28]} />
            <meshBasicMaterial color="#E5A93C" opacity={0.25} transparent />
          </mesh>
        ))}

        {/* Longitudinal Internal Carbon Stringers */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh 
            key={idx} 
            position={[Math.cos(angle) * 0.4, 0.4, Math.sin(angle) * 0.4]}
          >
            <cylinderGeometry args={[0.012, 0.012, 5.8, 6]} />
            <meshBasicMaterial color="#475569" opacity={0.22} transparent />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          2. HIGH-ASPECT-RATIO CARBON COMPOSITE WINGS WITH INTERNAL SPARS
         ========================================================================= */}
      <group position={[0, 0.6, 0.1]}>
        {/* Left Wing Assembly (Explodes laterally to the left) */}
        <group position={[-exp * 0.8, 0, 0]}>
          {/* Outer Translucent Aerodynamic Wing Skin */}
          <mesh position={[-4.6, 0, 0]} rotation={[0, 0, 0.02]}>
            <boxGeometry args={[8.6, 0.1, 0.98]} />
            <primitive object={ghostSkinMat} attach="material" />
          </mesh>
          <mesh position={[-4.6, 0, 0]} rotation={[0, 0, 0.02]}>
            <boxGeometry args={[8.62, 0.102, 0.982]} />
            <primitive object={wireMat} attach="material" />
          </mesh>

          {/* Spanwise Main Tubular Spar (Carbon-Titanium Hybrid) */}
          <mesh position={[-4.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.022, 8.4, 16]} />
            <primitive object={structuralSparMat} attach="material" />
          </mesh>

          {/* Wing Internal Rib Cross-Sections */}
          {[-1.2, -2.4, -3.6, -4.8, -6.0, -7.2, -8.4].map((x, idx) => (
            <mesh key={idx} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.9, 0.08, 0.018]} />
              <primitive object={structuralSparMat} attach="material" />
            </mesh>
          ))}

          {/* Canted Winglet Tip */}
          <mesh position={[-8.9, 0, 0.2]} rotation={[0, 0, 0.45]}>
            <boxGeometry args={[0.06, 0.45, 0.85]} />
            <primitive object={ghostSkinMat} attach="material" />
          </mesh>
        </group>

        {/* Right Wing Assembly (Explodes laterally to the right) */}
        <group position={[exp * 0.8, 0, 0]}>
          <mesh position={[4.6, 0, 0]} rotation={[0, 0, -0.02]}>
            <boxGeometry args={[8.6, 0.1, 0.98]} />
            <primitive object={ghostSkinMat} attach="material" />
          </mesh>
          <mesh position={[4.6, 0, 0]} rotation={[0, 0, -0.02]}>
            <boxGeometry args={[8.62, 0.102, 0.982]} />
            <primitive object={wireMat} attach="material" />
          </mesh>

          <mesh position={[4.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.022, 8.4, 16]} />
            <primitive object={structuralSparMat} attach="material" />
          </mesh>

          {[1.2, 2.4, 3.6, 4.8, 6.0, 7.2, 8.4].map((x, idx) => (
            <mesh key={idx} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.9, 0.08, 0.018]} />
              <primitive object={structuralSparMat} attach="material" />
            </mesh>
          ))}

          <mesh position={[8.9, 0, 0.2]} rotation={[0, 0, -0.45]}>
            <boxGeometry args={[0.06, 0.45, 0.85]} />
            <primitive object={ghostSkinMat} attach="material" />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
          3. UNDERWING DUAL PODS (Synthetic Aperture Radar & SIGINT)
         ========================================================================= */}
      <group position={[-1.8, 0.4, -0.45]}>
        <mesh position={[0, 0, 0.22]} material={landingGearDarkMat}>
          <boxGeometry args={[0.22, 0.38, 0.14]} />
        </mesh>
        <mesh position={[-0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.68, 20]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[-0.14, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.04, 20]} />
          <primitive object={flirLensMat} attach="material" />
        </mesh>

        <mesh position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.68, 20]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[0.14, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.04, 20]} />
          <primitive object={flirLensMat} attach="material" />
        </mesh>
      </group>

      {/* =========================================================================
          4. OVERSIZED FORWARD PROPELLER & VARIABLE-PITCH SPINNER
         ========================================================================= */}
      <group 
        position={[0, -2.9 - exp * 0.6, -0.05]} 
        ref={frontPropRef}
        onClick={(e) => { e.stopPropagation(); onSelectHotspot('ENGINE_BLOCK'); }}
      >
        {/* Central Aerodynamic Nose Spinner Cone */}
        <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.27, 0.6, 28]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.272, 0.602, 18]} />
          <primitive object={glowingAmberWireMat} attach="material" />
        </mesh>

        {/* Spinner Base Mounting Flange */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={landingGearDarkMat}>
          <cylinderGeometry args={[0.27, 0.29, 0.14, 28]} />
        </mesh>

        {/* 3 High-Aspect Aerodynamic Propeller Blades */}
        {[0, (2 * Math.PI) / 3, -(2 * Math.PI) / 3].map((angle, idx) => (
          <group key={idx} rotation={[0, 0, angle]}>
            {/* Blade Root Pivot Shank */}
            <mesh position={[0, 0.38, 0]} material={landingGearMat}>
              <cylinderGeometry args={[0.042, 0.052, 0.24, 14]} />
            </mesh>
            {/* Aerodynamic Carbon Composite Foil */}
            <mesh position={[0, 1.35, 0]} rotation={[0, 0.16, 0]}>
              <boxGeometry args={[0.15, 1.9, 0.026]} />
              <primitive object={ghostSkinMat} attach="material" />
            </mesh>
            <mesh position={[0, 1.35, 0]} rotation={[0, 0.16, 0]}>
              <boxGeometry args={[0.152, 1.902, 0.028]} />
              <primitive object={wireMat} attach="material" />
            </mesh>
            {/* High-Visibility Blade Tip Safety Markings (Tactical Amber) */}
            <mesh position={[0, 2.22, 0]} material={goldAccentMat}>
              <boxGeometry args={[0.152, 0.12, 0.03]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================================
          5. COMPLETE RETRACTABLE TRICYCLE LANDING GEAR SYSTEM
         ========================================================================= */}
      {/* Front Nose Gear Assembly */}
      <group position={[0, -2.1, -0.3 - exp * 0.4]}>
        <mesh position={[0, 0, 0]} material={landingGearDarkMat}>
          <boxGeometry args={[0.18, 0.22, 0.2]} />
        </mesh>
        {/* Telescopic Oleo Strut Outer Cylinder */}
        <mesh position={[0, 0, -0.48]} material={landingGearDarkMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.72, 18]} />
        </mesh>
        {/* Chrome Hydraulic Piston Rod */}
        <mesh position={[0, 0, -0.88]} material={landingGearMat}>
          <cylinderGeometry args={[0.048, 0.048, 0.48, 18]} />
        </mesh>
        {/* Scissor Torque Linkages */}
        <mesh position={[0, 0.07, -0.58]} rotation={[0.42, 0, 0]} material={landingGearMat}>
          <boxGeometry args={[0.032, 0.24, 0.022]} />
        </mesh>
        <mesh position={[0, 0.07, -0.75]} rotation={[-0.42, 0, 0]} material={landingGearMat}>
          <boxGeometry args={[0.032, 0.24, 0.022]} />
        </mesh>
        {/* Wheel Fork Axle & Nose Wheel */}
        <mesh position={[0, 0, -1.08]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.23, 0.23, 0.12, 28]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[0, 0, -1.08]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.232, 0.232, 0.122, 18]} />
          <primitive object={glowingAmberWireMat} attach="material" />
        </mesh>
        <mesh position={[0, 0, -1.08]} rotation={[0, 0, Math.PI / 2]} material={landingGearMat}>
          <cylinderGeometry args={[0.095, 0.095, 0.13, 18]} />
        </mesh>
      </group>

      {/* Left Main Gear */}
      <group position={[-0.4, 0.1, -0.3 - exp * 0.4]}>
        <mesh position={[-0.9, 0, -0.44]} rotation={[0, 0.65, 0]} material={landingGearMat}>
          <cylinderGeometry args={[0.055, 0.045, 1.85, 18]} />
        </mesh>
        <mesh position={[-1.65, 0, -0.88]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.29, 0.29, 0.15, 28]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[-1.65, 0, -0.88]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.292, 0.292, 0.152, 18]} />
          <primitive object={glowingAmberWireMat} attach="material" />
        </mesh>
        <mesh position={[-1.65, 0, -0.88]} rotation={[0, 0, Math.PI / 2]} material={landingGearMat}>
          <cylinderGeometry args={[0.115, 0.115, 0.16, 18]} />
        </mesh>
      </group>

      {/* Right Main Gear */}
      <group position={[0.4, 0.1, -0.3 - exp * 0.4]}>
        <mesh position={[0.9, 0, -0.44]} rotation={[0, -0.65, 0]} material={landingGearMat}>
          <cylinderGeometry args={[0.055, 0.045, 1.85, 18]} />
        </mesh>
        <mesh position={[1.65, 0, -0.88]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.29, 0.29, 0.15, 28]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[1.65, 0, -0.88]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.292, 0.292, 0.152, 18]} />
          <primitive object={glowingAmberWireMat} attach="material" />
        </mesh>
        <mesh position={[1.65, 0, -0.88]} rotation={[0, 0, Math.PI / 2]} material={landingGearMat}>
          <cylinderGeometry args={[0.115, 0.115, 0.16, 18]} />
        </mesh>
      </group>

      {/* =========================================================================
          6. EMPENNAGE & CANTED V-TAIL STABILIZERS (Aft)
         ========================================================================= */}
      <group position={[0, 3.2 + exp * 0.7, 0.38]}>
        {/* Left V-Tail Fin */}
        <mesh position={[-0.8, 0, 0.42]} rotation={[0.45, 0, -0.54]}>
          <boxGeometry args={[0.065, 0.75, 1.55]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[-0.8, 0, 0.42]} rotation={[0.45, 0, -0.54]}>
          <boxGeometry args={[0.067, 0.752, 1.552]} />
          <primitive object={wireMat} attach="material" />
        </mesh>

        {/* Right V-Tail Fin */}
        <mesh position={[0.8, 0, 0.42]} rotation={[0.45, 0, 0.54]}>
          <boxGeometry args={[0.065, 0.75, 1.55]} />
          <primitive object={ghostSkinMat} attach="material" />
        </mesh>
        <mesh position={[0.8, 0, 0.42]} rotation={[0.45, 0, 0.54]}>
          <boxGeometry args={[0.067, 0.752, 1.552]} />
          <primitive object={wireMat} attach="material" />
        </mesh>
      </group>
    </group>
  );
};
