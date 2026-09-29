import React, { useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, GizmoHelper, GizmoViewport, Grid, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   Studio stage: procedural HDR-ish environment (no network fetch), infinite
   CAD ground grid, contact shadows, real axis gizmo and a damped camera rig.
   ========================================================================= */

export const MODEL_FRAMES = {
  POWERTRAIN: {
    HERO: { position: [1.85, 1.15, 2.35], target: [-0.08, 0.05, 0] },
    ISO: { position: [2.6, 1.9, 2.6], target: [0, 0.05, 0] },
    FRONT: { position: [-3.4, 0.55, 0.02], target: [-0.3, 0.05, 0] },
    SIDE: { position: [0.05, 0.75, 3.5], target: [0, 0.05, 0] },
    TOP: { position: [0, 3.9, 0.02], target: [0, 0, 0] },
    DETAIL: { position: [-0.3, 0.72, 1.05], target: [0, 0.34, -0.05] },
  },
  AIRFRAME: {
    HERO: { position: [-3.6, 1.7, 7.0], target: [0.1, 0.45, 0] },
    ISO: { position: [6.4, 4.4, 6.6], target: [0.1, 0.45, 0] },
    FRONT: { position: [-11.8, 1.4, 0.05], target: [-0.2, 0.45, 0] },
    SIDE: { position: [0.05, 1.4, 9.8], target: [0.1, 0.45, 0] },
    TOP: { position: [0.1, 13.2, 0.05], target: [0.1, 0.45, 0] },
    DETAIL: { position: [-3.4, 0.5, 2.2], target: [-1.3, 0.1, 0] },
  },
  ASSEMBLY: {
    HERO: { position: [-6.4, 2.8, 6.8], target: [-0.2, 0.4, 0] },
    ISO: { position: [8.2, 5.4, 7.6], target: [0, 0.4, 0] },
    FRONT: { position: [-12.6, 1.6, 0.05], target: [-0.4, 0.4, 0] },
    SIDE: { position: [0.05, 1.6, 12.2], target: [0, 0.4, 0] },
    TOP: { position: [0, 13.8, 0.05], target: [0, 0.4, 0] },
    DETAIL: { position: [-3.4, 1.0, 2.6], target: [-1.2, 0.2, 0] },
  },
};

/* ------------ procedural studio environment (no external HDRI fetch) ---- */
const StudioEnvironment = ({ intensity = 1 }) => (
  <Environment resolution={256} frames={1} background={false}>
    <Lightformer form="rect" intensity={2.1 * intensity} color="#ffffff" scale={[12, 12, 1]} position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} />
    <Lightformer form="rect" intensity={2.6 * intensity} color="#f6f8fb" scale={[6, 6, 1]} position={[-6, 4.5, 5]} rotation={[0, -Math.PI / 4, 0]} />
    <Lightformer form="rect" intensity={1.15 * intensity} color="#cfd6e0" scale={[6, 6, 1]} position={[6, 2.5, 4]} rotation={[0, Math.PI / 4, 0]} />
    <Lightformer form="rect" intensity={1.9 * intensity} color="#ffffff" scale={[10, 2.4, 1]} position={[0, 3.2, -8]} />
    <Lightformer form="rect" intensity={0.5 * intensity} color="#9aa3ad" scale={[14, 14, 1]} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} />
  </Environment>
);

/* ------------------------------- camera rig ----------------------------- */
const CameraRig = ({ view, frames, controlsRef, autoRotate, damping = 0.075 }) => {
  const { camera } = useThree();
  const goalPos = useRef(new THREE.Vector3(...(frames[view] || frames.HERO).position));
  const goalTarget = useRef(new THREE.Vector3(...(frames[view] || frames.HERO).target));
  const lastView = useRef(view);
  const lastFrames = useRef(frames);

  const settled = useRef(false);

  useFrame(() => {
    if (lastView.current !== view || lastFrames.current !== frames) {
      lastView.current = view;
      lastFrames.current = frames;
      const f = frames[view] || frames.HERO;
      goalPos.current.set(...f.position);
      goalTarget.current.set(...f.target);
      settled.current = false;
    }

    const controls = controlsRef.current;
    if (!controls) return;

    if (!settled.current) {
      /* fly to the preset, then hand the camera back to OrbitControls so it
         never fights user orbiting or the auto-rotate turntable */
      camera.position.lerp(goalPos.current, damping + 0.02);
      controls.target.lerp(goalTarget.current, damping + 0.02);
      controls.autoRotate = false;
      controls.update();
      if (
        camera.position.distanceTo(goalPos.current) < 0.02 &&
        controls.target.distanceTo(goalTarget.current) < 0.02
      ) {
        settled.current = true;
      }
    } else {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.55;
      controls.update();
    }
  });

  return null;
};

/* ----------------------------- main stage ------------------------------- */
export const ModelStage = ({
  children,
  frames = MODEL_FRAMES.POWERTRAIN,
  view = 'HERO',
  grid = true,
  shadows = true,
  framing = 9,
  minDistance = 1.2,
  maxDistance = 30,
  fov = 38,
  background = '#101114',
  autoRotate = false,
}) => {
  const controlsRef = useRef(null);

  const gridArgs = useMemo(
    () => ({
      args: [40, 40],
      cellSize: 0.25,
      cellThickness: 0.6,
      cellColor: '#2A2D33',
      sectionSize: 1,
      sectionThickness: 1.1,
      sectionColor: '#3E434B',
      fadeDistance: 26,
      fadeStrength: 1.6,
      infiniteGrid: true,
    }),
    [],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: (frames[view] || frames.HERO).position, fov, near: 0.05, far: 200 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color(background);
        scene.fog = new THREE.Fog(background, framing * 2.4, framing * 4.6);
      }}
    >
      <StudioEnvironment intensity={1} />

      <directionalLight position={[-6, 7, 5]} intensity={2.2} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006}>
        <orthographicCamera attach="shadow-camera" args={[-3.4, 3.4, 3.4, -3.4, 0.5, 30]} />
      </directionalLight>
      <directionalLight position={[7, 3, 4]} intensity={0.7} color="#cdd6e2" />
      <directionalLight position={[0, 4, -8]} intensity={0.55} color="#e8eef7" />
      <ambientLight intensity={0.18} />

      {grid ? <Grid position={[0, -0.002, 0]} {...gridArgs} /> : null}

      {shadows ? (
        <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={framing} blur={2.4} far={4.2} resolution={1024} color="#000000" />
      ) : null}

      <CameraRig view={view} frames={frames} controlsRef={controlsRef} autoRotate={autoRotate} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.75}
        zoomSpeed={0.8}
        panSpeed={0.7}
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={Math.PI / 2 + 0.22}
      />

      {children}

      <GizmoHelper alignment="top-right" margin={[68, 68]}>
        <GizmoViewport axisColors={['#FF453A', '#30D158', '#0A84FF']} labelColor="#F2F2F7" hideNegativeAxes />
      </GizmoHelper>
    </Canvas>
  );
};

/* ------------------------- clickable hotspot marker --------------------- */
export const HotspotMarker = ({ position, active, tone = '#0A84FF', onClick, label }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(active ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08 : 1);
  });

  const handle = useCallback(
    (e) => {
      e.stopPropagation();
      if (onClick) onClick();
    },
    [onClick],
  );

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={handle}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshStandardMaterial color={active ? '#FFFFFF' : tone} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.048, 28]} />
        <meshBasicMaterial color={tone} transparent opacity={active ? 0.95 : 0.5} side={THREE.DoubleSide} />
      </mesh>
      {active && label ? (
        <mesh position={[0.17, 0.02, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.01]} />
          <meshBasicMaterial color={tone} transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
};

