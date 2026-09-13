import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Dashed / Tick Circle Geometry
function createTickRingPoints(radius, count = 36, length = 0.08) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x1 = Math.cos(angle) * (radius - length / 2);
    const y1 = Math.sin(angle) * (radius - length / 2);
    const x2 = Math.cos(angle) * (radius + length / 2);
    const y2 = Math.sin(angle) * (radius + length / 2);
    points.push(new THREE.Vector3(x1, y1, 0));
    points.push(new THREE.Vector3(x2, y2, 0));
  }
  return points;
}

export const HudHologramScene = ({ showHudRings = true, activeFault = 'NONE' }) => {
  const propRingRef = useRef();
  const engineReticleRef = useRef();
  const noseRingRef = useRef();
  const leftWheelRingRef = useRef();
  const rightWheelRingRef = useRef();
  const podRingRef = useRef();
  const scanSweepRef = useRef();

  // Animate HUD Reticles & Scanning waves
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (propRingRef.current) {
      propRingRef.current.rotation.z += delta * 0.4;
    }
    if (engineReticleRef.current) {
      engineReticleRef.current.rotation.z -= delta * 0.25;
    }
    if (noseRingRef.current) {
      noseRingRef.current.rotation.z += delta * 0.3;
    }
    if (leftWheelRingRef.current) {
      leftWheelRingRef.current.rotation.z -= delta * 0.25;
    }
    if (rightWheelRingRef.current) {
      rightWheelRingRef.current.rotation.z += delta * 0.25;
    }
    if (podRingRef.current) {
      podRingRef.current.rotation.z += delta * 0.35;
    }
    if (scanSweepRef.current) {
      // Periodic sweep along the fuselage Y-axis
      scanSweepRef.current.position.y = -2.5 + ((Math.sin(time * 1.5) + 1) / 2) * 5.0;
    }
  });

  const hudCyan = '#19C7A5';
  const hudGlow = '#1D3B2E';
  const faultColor = '#FF4D4D';
  const mainHudColor = activeFault !== 'NONE' ? faultColor : hudCyan;

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. DARK BLUE CAD GRID FLOOR
         ======================================================== */}
      <group position={[0, 0, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Deep Navy/Cyan Coordinate Grid */}
          <gridHelper args={[24, 48, '#2B4A3B', '#10231B']} rotation={[Math.PI / 2, 0, 0]} />
        
        {/* Fine Sub-grid Accent */}
        <gridHelper args={[12, 48, '#334155', '#111827']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} />

        {/* Central Primary Concentric Calibration Rings */}
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[3.2, 3.23, 80]} />
          <meshBasicMaterial color={mainHudColor} opacity={0.35} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[4.8, 4.82, 80]} />
          <meshBasicMaterial color={hudGlow} opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[7.2, 7.23, 96]} />
          <meshBasicMaterial color={mainHudColor} opacity={0.25} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* Tactical Diamond Orientation Markers (❖) on Grid */}
        {[
          [3.5, 3.5], [-3.5, 3.5], [3.5, -3.5], [-3.5, -3.5],
          [5.5, 0], [-5.5, 0], [0, 5.5], [0, -5.5]
        ].map(([x, y], idx) => (
          <mesh key={idx} position={[x, y, 0.01]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.22, 0.22]} />
            <meshBasicMaterial color={hudCyan} opacity={0.4} transparent side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Floor HUD Diagnostics Text */}
        <Text
          position={[0, -3.5, 0.01]}
          fontSize={0.24}
          color={mainHudColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          DIAGNOSTIC 10 // DIGITAL TWIN CALIBRATION
        </Text>

        <Text
          position={[2.6, -2.8, 0.01]}
          fontSize={0.14}
          color="#0284c7"
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.08}
        >
          SYS_VOL_ID 09/394015 // ISO CAD GRID
        </Text>
      </group>

      {/* ========================================================
          2. CONCENTRIC DIAGNOSTIC RINGS UNDER WHEELS (Matching image_1.png)
         ======================================================== */}
      {/* Front Nose Wheel Contact Rings */}
      <group position={[0, -2.1, -1.18]} ref={noseRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.44, 48]} />
          <meshBasicMaterial color={mainHudColor} opacity={0.8} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.56, 0.58, 48, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color={hudGlow} opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.73, 48, 1, Math.PI / 4, Math.PI]} />
          <meshBasicMaterial color={mainHudColor} opacity={0.4} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Left Main Wheel Contact Rings */}
      <group position={[-2.0, 0.1, -1.18]} ref={leftWheelRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.51, 48]} />
          <meshBasicMaterial color={mainHudColor} opacity={0.75} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.66, 0.68, 48, 1, 0, Math.PI * 1.4]} />
          <meshBasicMaterial color={hudGlow} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right Main Wheel Contact Rings */}
      <group position={[2.0, 0.1, -1.18]} ref={rightWheelRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.51, 48]} />
          <meshBasicMaterial color={mainHudColor} opacity={0.75} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.66, 0.68, 48, 1, Math.PI * 0.3, Math.PI * 1.4]} />
          <meshBasicMaterial color={hudGlow} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ========================================================
          3. FLOATING 3D HUD RETICLES & CALLOUT RINGS
         ======================================================== */}
      {showHudRings && (
        <>
          {/* Propeller Trajectory HUD Ring (Hero Framing Arc) */}
          <group position={[0, -2.8, -0.05]} ref={propRingRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.9, 1.93, 64, 1, 0, Math.PI * 1.6]} />
              <meshBasicMaterial color={hudCyan} opacity={0.75} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.05, 2.07, 64, 1, Math.PI * 0.5, Math.PI * 0.8]} />
              <meshBasicMaterial color={hudGlow} opacity={0.55} transparent side={THREE.DoubleSide} />
            </mesh>
            {/* Compass / Angle Tick Arcs */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.75, 1.76, 48, 1, Math.PI * 1.1, Math.PI * 0.4]} />
              <meshBasicMaterial color={hudCyan} opacity={0.6} transparent side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Engine Bay Circular Targeting Reticle (Mid-Fuselage Cutaway) */}
          <group position={[0, 0.4, 0.15]} ref={engineReticleRef}>
            <mesh rotation={[0, 0, 0]}>
              <ringGeometry args={[0.92, 0.95, 48, 1, 0, Math.PI * 1.3]} />
              <meshBasicMaterial color={mainHudColor} opacity={0.8} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[0, 0, 0]}>
              <ringGeometry args={[1.08, 1.1, 48, 1, Math.PI * 0.8, Math.PI * 0.7]} />
              <meshBasicMaterial color={hudGlow} opacity={0.5} transparent side={THREE.DoubleSide} />
            </mesh>
            {/* Diagnostic Bracket Crosshairs */}
            {[-0.8, 0.8].map((x, idx) => (
              <mesh key={idx} position={[x, 0, 0]}>
                <boxGeometry args={[0.15, 0.015, 0.015]} />
                <meshBasicMaterial color={mainHudColor} />
              </mesh>
            ))}
          </group>

          {/* Underwing Sensor Pod Diagnostic HUD Ring */}
          <group position={[-1.8, 0.4, -0.45]} ref={podRingRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.38, 0.41, 32, 1, 0, Math.PI * 1.7]} />
              <meshBasicMaterial color={hudCyan} opacity={0.85} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.48, 0.5, 32, 1, Math.PI * 0.3, Math.PI * 0.9]} />
              <meshBasicMaterial color={hudGlow} opacity={0.6} transparent side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Animated Holographic Scan Wave Sweep (Traveling along UAV) */}
          <mesh position={[0, 0, 0]} ref={scanSweepRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 1.2, 32]} />
            <meshBasicMaterial color="#64748b" opacity={0.12} transparent side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
};
