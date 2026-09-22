import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const HudHologramScene = ({ showHudRings = true, activeFault = 'NONE' }) => {
  const propRingRef = useRef();
  const engineReticleRef = useRef();
  const noseRingRef = useRef();
  const leftWheelRingRef = useRef();
  const rightWheelRingRef = useRef();
  const scanSweepRef = useRef();
  const radarSweepRef = useRef();

  // Animate HUD Reticles & Scanning waves
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (propRingRef.current) {
      propRingRef.current.rotation.z += delta * 0.45;
    }
    if (engineReticleRef.current) {
      engineReticleRef.current.rotation.z -= delta * 0.3;
    }
    if (noseRingRef.current) {
      noseRingRef.current.rotation.z += delta * 0.35;
    }
    if (leftWheelRingRef.current) {
      leftWheelRingRef.current.rotation.z -= delta * 0.28;
    }
    if (rightWheelRingRef.current) {
      rightWheelRingRef.current.rotation.z += delta * 0.28;
    }
    if (radarSweepRef.current) {
      radarSweepRef.current.rotation.z -= delta * 0.7;
    }
    if (scanSweepRef.current) {
      scanSweepRef.current.position.y = -2.6 + ((Math.sin(time * 1.6) + 1) / 2) * 5.4;
    }
  });

  const tacticalAmber = '#C59B27';
  const cryoTeal = '#67E8F9';
  const defenseSage = '#2E7D5A';
  const alertRed = '#9E2A2B';
  const activeColor = activeFault !== 'NONE' ? alertRed : tacticalAmber;

  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. MILITARY CAD COORDINATE GRID & CONCENTRIC RADAR RINGS
         ========================================================================= */}
      <group position={[0, 0, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Stealth Carbon Coordinate Grid */}
        <gridHelper args={[26, 52, '#C59B27', '#161D2A']} rotation={[Math.PI / 2, 0, 0]} />
        <gridHelper args={[14, 56, '#2A3344', '#090C12']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} />

        {/* Primary Concentric Radar Range Calibration Rings */}
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[3.2, 3.23, 80]} />
          <meshBasicMaterial color={activeColor} opacity={0.3} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[5.2, 5.22, 80]} />
          <meshBasicMaterial color={defenseSage} opacity={0.18} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[7.8, 7.83, 96]} />
          <meshBasicMaterial color={activeColor} opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* Rotating Radar Range Sweep Beam */}
        <group ref={radarSweepRef} position={[0, 0, 0.006]}>
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.2, 7.8, 32, 1, 0, Math.PI * 0.35]} />
            <meshBasicMaterial color={defenseSage} opacity={0.08} transparent side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Tactical Diamond Orientation Markers on Grid */}
        {[
          [3.8, 3.8], [-3.8, 3.8], [3.8, -3.8], [-3.8, -3.8],
          [6.0, 0], [-6.0, 0], [0, 6.0], [0, -6.0]
        ].map(([x, y], idx) => (
          <mesh key={idx} position={[x, y, 0.01]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshBasicMaterial color={tacticalAmber} opacity={0.45} transparent side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Floor HUD Diagnostics Text */}
        <Text
          position={[0, -3.8, 0.01]}
          fontSize={0.26}
          color={activeColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          CAD 3D TWIN // MIL-STD-178C DIGITAL TWIN CALIBRATION
        </Text>

        <Text
          position={[3.0, -3.0, 0.01]}
          fontSize={0.15}
          color={cryoTeal}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.1}
        >
          ROTAX 915/916 iS POWERTRAIN MATRIX
        </Text>
      </group>

      {/* =========================================================================
          2. CONCENTRIC WHEEL CONTACT RINGS
         ========================================================================= */}
      {/* Front Nose Wheel Contact Rings */}
      <group position={[0, -2.1, -1.18]} ref={noseRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.44, 0.46, 48]} />
          <meshBasicMaterial color={activeColor} opacity={0.8} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.62, 48, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color={cryoTeal} opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Left Main Wheel Contact Rings */}
      <group position={[-2.05, 0.1, -1.18]} ref={leftWheelRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.53, 48]} />
          <meshBasicMaterial color={activeColor} opacity={0.75} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.72, 48, 1, 0, Math.PI * 1.4]} />
          <meshBasicMaterial color={cryoTeal} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right Main Wheel Contact Rings */}
      <group position={[2.05, 0.1, -1.18]} ref={rightWheelRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.53, 48]} />
          <meshBasicMaterial color={activeColor} opacity={0.75} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.72, 48, 1, Math.PI * 0.3, Math.PI * 1.4]} />
          <meshBasicMaterial color={cryoTeal} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* =========================================================================
          3. FLOATING 3D HUD RETICLES & TRAJECTORY RINGS
         ========================================================================= */}
      {showHudRings && (
        <>
          {/* Propeller Trajectory Arc */}
          <group position={[0, -2.9, -0.05]} ref={propRingRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.0, 2.03, 64, 1, 0, Math.PI * 1.6]} />
              <meshBasicMaterial color={tacticalAmber} opacity={0.8} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.18, 2.2, 64, 1, Math.PI * 0.5, Math.PI * 0.8]} />
              <meshBasicMaterial color={cryoTeal} opacity={0.6} transparent side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Engine Bay Circular Targeting Reticle */}
          <group position={[0, 0.4, 0.15]} ref={engineReticleRef}>
            <mesh rotation={[0, 0, 0]}>
              <ringGeometry args={[0.96, 0.99, 48, 1, 0, Math.PI * 1.3]} />
              <meshBasicMaterial color={activeColor} opacity={0.85} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[0, 0, 0]}>
              <ringGeometry args={[1.14, 1.16, 48, 1, Math.PI * 0.8, Math.PI * 0.7]} />
              <meshBasicMaterial color={cryoTeal} opacity={0.5} transparent side={THREE.DoubleSide} />
            </mesh>
            {/* Crosshair target calipers */}
            {[-0.85, 0.85].map((x, idx) => (
              <mesh key={idx} position={[x, 0, 0]}>
                <boxGeometry args={[0.16, 0.016, 0.016]} />
                <meshBasicMaterial color={activeColor} />
              </mesh>
            ))}
          </group>

          {/* Holographic Longitudinal Scan Wave */}
          <mesh position={[0, 0, 0]} ref={scanSweepRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 1.3, 32]} />
            <meshBasicMaterial color={cryoTeal} opacity={0.16} transparent side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
};
