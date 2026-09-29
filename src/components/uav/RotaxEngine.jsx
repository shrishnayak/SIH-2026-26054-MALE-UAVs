import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================================
   Rotax 915 iS / VRDE 180 HP class turbocharged boxer engine
   Fully procedural CAD-grade geometry: crankcase, finned barrels, cam cover
   with data plate, chrome intake runners, brass fuel rails, turbocharger,
   exhaust muffler, PSRU housing and propeller shaft.
   ========================================================================= */

/* ---------------- shared material factory (PBR, no emissive glow) -------- */
const useEngineMaterials = (xrayMode) => useMemo(() => {
  const wire = xrayMode === 'WIREFRAME';
  const factory = (opts) => (wire
    ? new THREE.MeshBasicMaterial({ color: '#8C9199', wireframe: true, transparent: true, opacity: 0.28 })
    : new THREE.MeshStandardMaterial({ envMapIntensity: 1.05, ...opts }));

  return {
    anodised: factory({ color: '#1C1F23', metalness: 0.72, roughness: 0.42 }),
    castAl: factory({ color: '#8E939A', metalness: 0.92, roughness: 0.42 }),
    machined: factory({ color: '#C3C7CC', metalness: 0.96, roughness: 0.24 }),
    chrome: factory({ color: '#DCE0E5', metalness: 1.0, roughness: 0.12 }),
    brass: factory({ color: '#B98A3F', metalness: 1.0, roughness: 0.3 }),
    iron: factory({ color: '#3A3B3D', metalness: 0.72, roughness: 0.68 }),
    wrap: factory({ color: '#5B5D60', metalness: 0.55, roughness: 0.78 }),
    red: factory({ color: '#B02B23', metalness: 0.35, roughness: 0.45 }),
    blue: factory({ color: '#1F4E8C', metalness: 0.4, roughness: 0.42 }),
    rubber: factory({ color: '#141517', metalness: 0.06, roughness: 0.92 }),
    composite: factory({ color: '#101114', metalness: 0.25, roughness: 0.42 }),
    radiator: factory({ color: '#6E7378', metalness: 0.72, roughness: 0.55 }),
    steel: factory({ color: '#9BA0A8', metalness: 1.0, roughness: 0.34 }),
    sensor: factory({ color: '#2A2D31', metalness: 0.5, roughness: 0.5 }),
  };
}, [xrayMode]);

/* ---------------- canvas data plate ("VRDE 180 HP") -------------------- */
const useDataPlateTexture = () => useMemo(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 300;
  const g = canvas.getContext('2d');
  if (!g) return null;

  g.fillStyle = '#191C20';
  g.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 700; i += 1) {
    g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    g.beginPath();
    const y = Math.random() * canvas.height;
    g.moveTo(0, y);
    g.lineTo(canvas.width, y);
    g.stroke();
  }

  g.strokeStyle = 'rgba(226,232,238,0.42)';
  g.lineWidth = 3;
  g.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  g.textBaseline = 'middle';
  g.font = '600 96px Inter, Arial, sans-serif';
  g.fillStyle = '#E8ECF1';
  g.fillText('VRDE', 250, 130);
  g.font = '700 104px Inter, Arial, sans-serif';
  g.fillText('180', 560, 130);
  g.font = '600 58px Inter, Arial, sans-serif';
  g.fillText('HP', 812, 132);

  g.font = '400 30px Inter, Arial, sans-serif';
  g.fillStyle = 'rgba(226,232,238,0.62)';
  g.fillText('TURBOCHARGED OPPOSED-4  ·  DUAL FADEC  ·  141 hp CONT.', 252, 206);
  g.fillText('SIH-2026-26054  ·  MALE UAV DIGITAL TWIN', 252, 246);

  g.strokeStyle = 'rgba(232,236,241,0.75)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(128, 150, 66, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(128, 150, 48, 0, Math.PI * 2);
  g.stroke();
  g.font = '700 34px Inter, Arial, sans-serif';
  g.fillStyle = 'rgba(232,236,241,0.9)';
  g.textAlign = 'center';
  g.fillText('VT', 128, 152);
  g.textAlign = 'left';

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}, []);

/* ---------------- instanced helpers ------------------------------------ */
const InstancedFins = ({ count, radius, thickness, spacing, y0, material }) => {
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      dummy.position.set(0, y0 + i * spacing, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, y0, spacing]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, thickness, 22]} />
    </instancedMesh>
  );
};

const BoltCircle = ({
  count = 8,
  radius = 0.07,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  boltRadius = 0.0085,
  boltLength = 0.022,
  material,
  axis = 'z',
}) => {
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count;
      if (axis === 'z') {
        dummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
        dummy.rotation.set(Math.PI / 2, 0, 0);
      } else if (axis === 'y') {
        dummy.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
        dummy.rotation.set(0, 0, 0);
      } else {
        dummy.position.set(0, Math.sin(a) * radius, Math.cos(a) * radius);
        dummy.rotation.set(0, 0, Math.PI / 2);
      }
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, radius, axis]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} position={position} rotation={rotation} material={material} castShadow>
      <cylinderGeometry args={[boltRadius, boltRadius, boltLength, 8]} />
    </instancedMesh>
  );
};

/* ---------------- tube helper (intake runners / hoses) ----------------- */
const Tube = ({ points, radius = 0.02, material, segments = 40, radial = 12 }) => {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, segments, radius, radial, false);
  }, [points, radius, segments, radial]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
};

export { Tube, BoltCircle, InstancedFins };

/* =========================================================================
   Main assembly
   ========================================================================= */
export const RotaxEngine = ({
  rpm = 4800,
  explode = 0,
  xrayMode = 'PBR',
  selected = null,
  onSelect,
  faultCylinders = [],
  cutaway = false,
  spin = true,
}) => {
  const mats = useEngineMaterials(xrayMode);
  const plateTex = useDataPlateTexture();
  const crankRef = useRef();
  const propRef = useRef();
  const turboRef = useRef();
  const pistonRefs = [useRef(), useRef(), useRef(), useRef()];
  const rodRefs = [useRef(), useRef(), useRef(), useRef()];
  const cylX = useMemo(() => [-0.33, -0.11, 0.11, 0.33], []);

  /* Boxer kinematics: cylinders 1 & 4 run in phase, 2 & 3 in opposition. */
  const CRANK_R = 0.075;
  const ROD_L = 0.24;
  const CRANK_Y = -0.02;
  const PHASE = useMemo(() => [0, Math.PI, Math.PI, 0], []);
  const exp = Math.max(0, Math.min(1.2, explode));
  const crankY = CRANK_Y - exp * 0.42;

  /* live telemetry-driven mechanical motion — true slider-crank linkage */
  useFrame((state, delta) => {
    if (!spin) return;
    const speed = (rpm / 60) * delta * Math.PI * 2;
    if (crankRef.current) crankRef.current.rotation.x += speed * 0.14;
    if (propRef.current) propRef.current.rotation.x += speed * 0.4;
    if (turboRef.current) turboRef.current.rotation.y += speed * 2.2;

    const theta = crankRef.current ? crankRef.current.rotation.x : state.clock.elapsedTime * 8;
    pistonRefs.forEach((pRef, i) => {
      const th = theta + PHASE[i];
      const s = CRANK_R * Math.sin(th);
      const c = CRANK_R * Math.cos(th);
      const rod = rodRefs[i].current;
      if (rod) {
        rod.position.set(cylX[i], c, s);
        rod.rotation.x = -Math.asin(s / ROD_L);
      }
      if (pRef.current) {
        const travel = crankY + c + Math.sqrt(ROD_L * ROD_L - s * s);
        pRef.current.position.y = Math.min(0.3, Math.max(0.145, travel));
      }
    });
  });

  /* highlight / fault material resolution */
  const faultMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#7A2019',
        metalness: 0.55,
        roughness: 0.5,
        emissive: '#33110D',
        emissiveIntensity: 0.34,
      }),
    [],
  );
  const highlightMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#C08A3E', metalness: 0.95, roughness: 0.3 }),
    [],
  );

  const matFor = (id, base) => {
    if (selected === id) return highlightMat;
    if (faultCylinders.includes(id)) return faultMat;
    return base;
  };

  const pick = (id) => (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(id);
  };

  return (
    <group>
      {/* ================= CRANKCASE & CRANKSHAFT ================= */}
      <group onClick={pick('ENGINE_BLOCK')}>
        <mesh material={mats.castAl} position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.94, 0.28, 0.42]} />
        </mesh>
        {/* cast ribs along the block */}
        {[-0.36, -0.18, 0, 0.18, 0.36].map((x) => (
          <mesh key={`rib-${x}`} material={mats.castAl} position={[x, 0.0, -0.225]} castShadow>
            <boxGeometry args={[0.03, 0.26, 0.02]} />
          </mesh>
        ))}
        {/* sump */}
        <mesh material={mats.anodised} position={[0, -0.19, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.1, 0.34]} />
        </mesh>
        <mesh material={mats.brass} position={[0, -0.245, 0.05]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
        </mesh>
        {/* block bolt rows */}
        <BoltCircle count={14} radius={0.155} axis="x" position={[0.485, 0, 0]} material={mats.machined} boltRadius={0.0075} boltLength={0.026} />
        <BoltCircle count={14} radius={0.155} axis="x" position={[-0.485, 0, 0]} material={mats.machined} boltRadius={0.0075} boltLength={0.026} />
      </group>

      {/* crankshaft, counterweight webs and connecting rods (rotating assembly) */}
      <group position={[0, crankY, 0]}>
        <group ref={crankRef}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
            <cylinderGeometry args={[0.042, 0.042, 0.98, 20]} />
          </mesh>
          {cylX.map((x, i) => {
            const dir = i === 0 || i === 3 ? 1 : -1;
            return (
              <group key={`web-${x}`} position={[x, 0, 0]}>
                <mesh position={[0, dir * 0.04, 0]} material={mats.machined} castShadow>
                  <boxGeometry args={[0.03, 0.16, 0.09]} />
                </mesh>
                <mesh position={[0, dir * CRANK_R, 0]} material={mats.steel} castShadow>
                  <cylinderGeometry args={[0.02, 0.02, 0.05, 12]} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* connecting rods: big end rides the crank pin, small end the piston pin */}
        {cylX.map((x, i) => (
          <group key={`rod-${x}`} ref={rodRefs[i]} position={[x, 0, 0]}>
            <mesh position={[0, ROD_L / 2, 0]} material={mats.steel} castShadow>
              <capsuleGeometry args={[0.016, ROD_L - 0.03, 6, 12]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
              <cylinderGeometry args={[0.027, 0.027, 0.05, 14]} />
            </mesh>
            <mesh position={[0, ROD_L, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
              <cylinderGeometry args={[0.021, 0.021, 0.04, 12]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================= FINNED BARRELS + HEADS + CAM COVER ================= */}
      <group>
        {cylX.map((x, i) => {
          const id = `CYLINDER_${i + 1}`;
          const faults = faultCylinders.includes(id);
          return (
            <group key={id} position={[x, 0, 0]} onClick={pick(id)}>
              {/* barrel */}
              <mesh material={matFor(id, mats.castAl)} position={[0, 0.27, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.098, 0.098, 0.26, 26]} />
              </mesh>
              {/* cooling fins */}
              <group position={[0, 0.16, 0]}>
                <InstancedFins count={13} radius={0.113} thickness={0.011} spacing={0.019} y0={0} material={matFor(id, mats.castAl)} />
              </group>
              {/* bore liner (revealed in cutaway) */}
              {cutaway ? (
                <mesh position={[0, 0.27, 0]} material={mats.machined} castShadow>
                  <cylinderGeometry args={[0.079, 0.079, 0.265, 26, 1, true]} />
                </mesh>
              ) : null}
              {/* piston with compression rings, driven by the crank linkage */}
              <mesh ref={pistonRefs[i]} position={[0, 0.22, 0]} material={matFor(id, mats.machined)} castShadow>
                <cylinderGeometry args={[0.077, 0.077, 0.05, 22]} />
                <mesh position={[0, 0.013, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.brass}>
                  <torusGeometry args={[0.0785, 0.0042, 8, 26]} />
                </mesh>
                <mesh position={[0, -0.013, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.brass}>
                  <torusGeometry args={[0.0785, 0.0042, 8, 26]} />
                </mesh>
              </mesh>
              {/* head + valve block */}
              <mesh material={matFor(id, mats.castAl)} position={[0, 0.435, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.185, 0.10, 0.235]} />
              </mesh>
              {/* head bolts */}
              <BoltCircle count={6} radius={0.082} axis="y" position={[0, 0.487, 0]} material={mats.machined} boltRadius={0.0065} boltLength={0.02} />
              {/* spark plug + HT boot */}
              <mesh material={mats.machined} position={[0, 0.44, 0.148]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.014, 0.014, 0.07, 12]} />
              </mesh>
              <mesh material={mats.rubber} position={[0, 0.44, 0.20]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.019, 0.019, 0.055, 12]} />
              </mesh>
              {faults ? (
                <mesh position={[0.10, 0.435, 0]} material={faultMat}>
                  <boxGeometry args={[0.012, 0.075, 0.19]} />
                </mesh>
              ) : null}
            </group>
          );
        })}

        {/* single anodised cam cover across all four heads */}
        <group position={[0, 0.52 + exp * 0.34, 0]} onClick={pick('CAM_COVER')}>
          <mesh material={mats.anodised} castShadow receiveShadow>
            <boxGeometry args={[0.88, 0.07, 0.27]} />
          </mesh>
          <mesh material={mats.anodised} position={[0, 0.045, 0]} castShadow>
            <boxGeometry args={[0.80, 0.022, 0.21]} />
          </mesh>
          <BoltCircle count={12} radius={0.128} axis="z" position={[0, 0.035, 0.138]} rotation={[0, 0, 0]} material={mats.machined} boltRadius={0.0065} boltLength={0.018} />
          <BoltCircle count={12} radius={0.128} axis="z" position={[0, 0.035, -0.138]} material={mats.machined} boltRadius={0.0065} boltLength={0.018} />

          {/* laser-etched data plate, both faces */}
          {plateTex ? (
            <>
              <mesh position={[0, 0.006, 0.137]}>
                <planeGeometry args={[0.62, 0.182]} />
                <meshStandardMaterial map={plateTex} metalness={0.6} roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.006, -0.137]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.62, 0.182]} />
                <meshStandardMaterial map={plateTex} metalness={0.6} roughness={0.45} />
              </mesh>
            </>
          ) : null}

          {/* oil filler neck */}
          <mesh material={mats.machined} position={[0.33, 0.06, -0.08]} castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.05, 16]} />
          </mesh>
          <mesh material={mats.brass} position={[0.33, 0.09, -0.08]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.02, 16]} />
          </mesh>
        </group>
      </group>

      {/* ================= INTAKE PLENUM, RUNNERS, THROTTLE BODIES ============ */}
      <group position={[0, 0.06 * exp, -0.14 - exp * 0.34]} onClick={pick('INTAKE_SYSTEM')}>
        {/* plenum */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow receiveShadow>
          <cylinderGeometry args={[0.062, 0.062, 0.86, 26]} />
        </mesh>
        <BoltCircle count={8} radius={0.05} axis="x" position={[0.435, 0, 0]} material={mats.machined} boltRadius={0.006} boltLength={0.016} />
        <BoltCircle count={8} radius={0.05} axis="x" position={[-0.435, 0, 0]} material={mats.machined} boltRadius={0.006} boltLength={0.016} />

        {/* four chrome intake runners curving down to each port */}
        {cylX.map((x, i) => (
          <group key={`runner-${x}`}>
            <Tube
              points={[
                [x, 0.02, 0.06],
                [x, 0.06, -0.04],
                [x, 0.14, -0.14],
                [x * 0.94, 0.30, -0.24],
                [x * 0.9, 0.44, -0.20],
              ]}
              radius={0.027}
              material={mats.chrome}
            />
            {/* runner flange */}
            <mesh position={[x, 0.025, 0.065]} material={mats.machined} castShadow>
              <cylinderGeometry args={[0.042, 0.042, 0.014, 18]} />
            </mesh>
            <BoltCircle count={4} radius={0.034} axis="y" position={[x, 0.02, 0.065]} material={mats.machined} boltRadius={0.005} boltLength={0.012} />

            {/* throttle body on the plenum */}
            <mesh position={[x, 0.085, 0]} material={mats.machined} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.085, 20]} />
            </mesh>
            <mesh position={[x, 0.135, 0]} material={mats.red} castShadow>
              <cylinderGeometry args={[0.03, 0.038, 0.028, 18]} />
            </mesh>
            <mesh position={[x + 0.052, 0.085, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.blue} castShadow>
              <cylinderGeometry args={[0.014, 0.014, 0.05, 12]} />
            </mesh>
            {/* injector + brass line to the fuel rail */}
            <mesh position={[x, 0.055, 0.045]} rotation={[0.5, 0, 0]} material={mats.sensor} castShadow>
              <cylinderGeometry args={[0.011, 0.011, 0.06, 10]} />
            </mesh>
            <Tube
              points={[
                [x, 0.10, 0.13],
                [x, 0.16, 0.10],
                [x, 0.22, 0.055],
              ]}
              radius={0.0068}
              material={mats.brass}
              segments={18}
              radial={8}
            />
          </group>
        ))}

        {/* brass fuel rail with red end caps */}
        <mesh position={[0, 0.245, 0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.brass} castShadow>
          <cylinderGeometry args={[0.017, 0.017, 0.80, 16]} />
        </mesh>
        {[-0.40, 0.40].map((x) => (
          <mesh key={`railcap-${x}`} position={[x, 0.245, 0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.red} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.03, 14]} />
          </mesh>
        ))}

        {/* manifold absolute pressure + air-temperature sensors */}
        <mesh position={[0.20, 0.20, 0.02]} material={mats.sensor} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.05, 12]} />
        </mesh>
        <mesh position={[-0.20, 0.20, 0.02]} rotation={[0, 0, Math.PI / 2]} material={mats.sensor} castShadow>
          <cylinderGeometry args={[0.013, 0.013, 0.045, 12]} />
        </mesh>
      </group>

      {/* ================= EXHAUST HEADERS + MUFFLER ========================== */}
      <group position={[0, 0, exp * 0.34]} onClick={pick('EXHAUST_SYSTEM')}>
        {cylX.map((x) => (
          <group key={`pipe-${x}`}>
            <Tube
              points={[
                [x, 0.42, 0.10],
                [x, 0.36, 0.16],
                [x * 0.92, 0.22, 0.24],
                [x * 0.8, 0.06, 0.30],
                [x * 0.7, -0.12, 0.33],
              ]}
              radius={0.031}
              material={mats.iron}
            />
            {/* port flange */}
            <mesh position={[x, 0.425, 0.115]} rotation={[Math.PI / 2, 0, 0]} material={mats.machined} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.012, 18]} />
            </mesh>
          </group>
        ))}

        {/* collector + heat-wrapped muffler with brass bands */}
        <mesh position={[0, -0.16, 0.30]} rotation={[0, 0, Math.PI / 2]} material={mats.iron} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.62, 20]} />
        </mesh>
        <mesh position={[0, -0.26, 0.32]} rotation={[0, 0, Math.PI / 2]} material={mats.wrap} castShadow receiveShadow>
          <cylinderGeometry args={[0.108, 0.108, 0.90, 28]} />
        </mesh>
        {[-0.32, -0.10, 0.10, 0.32].map((x) => (
          <mesh key={`band-${x}`} position={[x, -0.26, 0.32]} rotation={[0, 0, Math.PI / 2]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.113, 0.113, 0.016, 28]} />
          </mesh>
        ))}
        {/* tail pipe cone */}
        <mesh position={[0.49, -0.26, 0.32]} rotation={[0, 0, -Math.PI / 2]} material={mats.machined} castShadow>
          <cylinderGeometry args={[0.055, 0.108, 0.09, 24]} />
        </mesh>
        <mesh position={[0.60, -0.26, 0.32]} rotation={[0, 0, -Math.PI / 2]} material={mats.iron} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.16, 20]} />
        </mesh>
        {/* lambda / O2 boss */}
        <mesh position={[0.30, -0.17, 0.32]} material={mats.sensor} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.07, 12]} />
        </mesh>
      </group>

      {/* ================= TURBOCHARGER ====================================== */}
      <group position={[-0.66 - exp * 0.42, -0.10, 0.16 + exp * 0.2]} onClick={pick('TURBOCHARGER')}>
        {/* turbine volute */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.iron} castShadow receiveShadow>
          <torusGeometry args={[0.082, 0.046, 14, 26]} />
        </mesh>
        <mesh position={[0, -0.055, 0]} material={mats.iron} castShadow>
          <cylinderGeometry args={[0.07, 0.05, 0.05, 22]} />
        </mesh>
        {/* compressor housing (bright aluminium) */}
        <mesh position={[0, 0.10, 0]} rotation={[0, 0, 0]} material={mats.machined} castShadow>
          <cylinderGeometry args={[0.078, 0.05, 0.055, 24]} />
        </mesh>
        {/* centre housing + rotor */}
        <mesh position={[0, 0.025, 0]} material={mats.castAl} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.09, 16]} />
        </mesh>
        {/* bladed compressor + turbine wheels on the shared core shaft */}
        <group ref={turboRef} position={[0, 0.02, 0]}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <mesh
              key={`cw-${k}`}
              rotation={[0, (k * Math.PI) / 4, 0.55]}
              position={[Math.cos((k * Math.PI) / 4) * 0.032, 0.062, Math.sin((k * Math.PI) / 4) * 0.032]}
              material={mats.machined}
              castShadow
            >
              <boxGeometry args={[0.022, 0.01, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0, 0.062, 0]} material={mats.machined} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <mesh
              key={`tw-${k}`}
              rotation={[0, (k * Math.PI) / 4 + 0.4, -0.55]}
              position={[Math.cos((k * Math.PI) / 4) * 0.03, -0.03, Math.sin((k * Math.PI) / 4) * 0.03]}
              material={mats.iron}
              castShadow
            >
              <boxGeometry args={[0.02, 0.009, 0.026]} />
            </mesh>
          ))}
          <mesh position={[0, -0.03, 0]} material={mats.iron} castShadow>
            <cylinderGeometry args={[0.011, 0.011, 0.026, 10]} />
          </mesh>
        </group>
        {/* oil feed / drain lines */}
        <Tube points={[[-0.02, 0.10, 0.04], [-0.06, 0.16, 0.06], [-0.10, 0.22, 0.04]]} radius={0.0086} material={mats.brass} segments={16} radial={8} />
        <Tube points={[[0.0, -0.06, 0.03], [0.02, -0.14, 0.08], [0.04, -0.20, 0.14]]} radius={0.012} material={mats.rubber} segments={16} radial={8} />
        {/* wastegate actuator can + rod */}
        <mesh position={[0.10, 0.055, 0.02]} rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.07, 16]} />
        </mesh>
        <mesh position={[0.10, 0.055, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={mats.machined} castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.09, 8]} />
        </mesh>
        {/* charge pipe to intake plenum */}
        <Tube
          points={[
            [0.0, 0.16, 0.0],
            [0.06, 0.30, 0.04],
            [0.16, 0.42, -0.04],
            [0.20, 0.44, -0.18],
          ]}
          radius={0.03}
          material={mats.chrome}
        />
      </group>

      {/* ================= PSRU, PROPELLER SHAFT & SPINNER =================== */}
      <group position={[-exp * 0.46, 0, 0]} onClick={pick('PSRU')}>
        {/* reduction gearbox housing */}
        <mesh position={[-0.585, -0.02, 0]} material={mats.machined} castShadow receiveShadow>
          <boxGeometry args={[0.19, 0.32, 0.32]} />
        </mesh>
        {[-0.12, 0, 0.12].map((z) => (
          <mesh key={`psru-rib-${z}`} position={[-0.585, -0.02, z]} material={mats.machined} castShadow>
            <boxGeometry args={[0.20, 0.335, 0.014]} />
          </mesh>
        ))}
        {/* governor / oil pump pad */}
        <mesh position={[-0.56, 0.15, 0.06]} material={mats.castAl} castShadow>
          <boxGeometry args={[0.09, 0.05, 0.09]} />
        </mesh>
        <mesh position={[-0.56, 0.19, 0.06]} material={mats.brass} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 14]} />
        </mesh>

        {/* propeller flange + bolt circle */}
        <mesh position={[-0.705, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
          <cylinderGeometry args={[0.168, 0.168, 0.035, 34]} />
        </mesh>
        <BoltCircle count={12} radius={0.138} axis="x" position={[-0.735, -0.02, 0]} material={mats.machined} boltRadius={0.0085} boltLength={0.03} />

        {/* output shaft, spinner and three tapered composite propeller blades */}
        <group ref={propRef} position={[-0.9, -0.02, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
            <cylinderGeometry args={[0.033, 0.033, 0.28, 22]} />
          </mesh>
          <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.composite} castShadow>
            <coneGeometry args={[0.108, 0.26, 30]} />
          </mesh>
          <mesh position={[-0.125, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
            <cylinderGeometry args={[0.112, 0.112, 0.03, 30]} />
          </mesh>
          {[0, 1, 2].map((i) => {
            const a = (Math.PI * 2 * i) / 3;
            return (
              <group key={`blade-${i}`} rotation={[a, 0, 0]}>
                <mesh position={[0, 0.06, 0]} material={mats.machined} castShadow>
                  <cylinderGeometry args={[0.026, 0.034, 0.08, 12]} />
                </mesh>
                <mesh position={[0, 0.27, 0]} rotation={[0, 0.5, 0]} scale={[1, 1, 2.4]} material={mats.composite} castShadow>
                  <capsuleGeometry args={[0.03, 0.36, 6, 14]} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ================= COOLING, LUBRICATION & ACCESSORY DRIVE ============ */}
      <group position={[exp * 0.30, -exp * 0.16, -exp * 0.18]} onClick={pick('ACCESSORY_SYSTEM')}>
        {/* coolant radiator matrix */}
        <mesh position={[0.74, 0.10, 0.0]} material={mats.radiator} castShadow receiveShadow>
          <boxGeometry args={[0.10, 0.30, 0.30]} />
        </mesh>
        {[-0.12, -0.06, 0, 0.06, 0.12].map((z) => (
          <mesh key={`radfin-${z}`} position={[0.74, 0.10, z]} material={mats.castAl} castShadow>
            <boxGeometry args={[0.105, 0.315, 0.012]} />
          </mesh>
        ))}
        {/* thermostat housing + coolant hoses */}
        <mesh position={[0.60, 0.16, 0.0]} material={mats.castAl} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
        </mesh>
        <Tube
          points={[
            [0.62, 0.20, 0.0],
            [0.68, 0.26, -0.02],
            [0.74, 0.26, -0.02],
          ]}
          radius={0.022}
          material={mats.rubber}
        />
        <Tube
          points={[
            [0.14, -0.02, 0.16],
            [0.30, -0.06, 0.20],
            [0.46, -0.02, 0.12],
            [0.56, 0.06, 0.02],
          ]}
          radius={0.024}
          material={mats.rubber}
        />
        {/* water pump + drive pulley */}
        <mesh position={[0.52, -0.05, 0.0]} rotation={[0, 0, Math.PI / 2]} material={mats.castAl} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.09, 20]} />
        </mesh>
        <mesh position={[0.60, -0.05, 0.0]} rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow>
          <cylinderGeometry args={[0.062, 0.062, 0.02, 24]} />
        </mesh>

        {/* dry-sump oil tank with brass filler */}
        <mesh position={[0.62, -0.28, -0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.machined} castShadow receiveShadow>
          <cylinderGeometry args={[0.088, 0.088, 0.28, 24]} />
        </mesh>
        <mesh position={[0.78, -0.28, -0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.castAl} castShadow>
          <cylinderGeometry args={[0.092, 0.092, 0.03, 24]} />
        </mesh>
        <mesh position={[0.62, -0.20, -0.06]} material={mats.brass} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.05, 14]} />
        </mesh>
        {/* oil cooler + filter */}
        <mesh position={[0.40, -0.28, 0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.radiator} castShadow>
          <cylinderGeometry args={[0.048, 0.048, 0.16, 20]} />
        </mesh>
        <mesh position={[0.22, -0.26, -0.10]} material={mats.anodised} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.15, 20]} />
        </mesh>
        <Tube
          points={[
            [0.44, -0.30, -0.02],
            [0.50, -0.34, -0.04],
            [0.48, -0.36, -0.06],
          ]}
          radius={0.014}
          material={mats.rubber}
          segments={20}
          radial={8}
        />

        {/* starter motor */}
        <mesh position={[-0.24, -0.26, 0.14]} rotation={[0, 0, Math.PI / 2]} material={mats.castAl} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.17, 20]} />
        </mesh>
        <mesh position={[-0.10, -0.26, 0.14]} rotation={[0, 0, Math.PI / 2]} material={mats.blue} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.03, 20]} />
        </mesh>
        {/* alternator / permanent-magnet generator */}
        <mesh position={[-0.30, 0.16, -0.20]} rotation={[0, 0, Math.PI / 2]} material={mats.castAl} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.15, 20]} />
        </mesh>
      </group>

      {/* ================= IGNITION COIL RAIL & HT LEADS ===================== */}
      <group position={[0, 0, 0]} onClick={pick('IGNITION_SYSTEM')}>
        <mesh position={[0, 0.34, 0.235]} material={mats.anodised} castShadow>
          <boxGeometry args={[0.80, 0.045, 0.055]} />
        </mesh>
        {[-0.33, -0.11, 0.11, 0.33].map((x) => (
          <group key={`ht-${x}`}>
            <mesh position={[x, 0.34, 0.275]} material={mats.sensor} castShadow>
              <boxGeometry args={[0.05, 0.05, 0.035]} />
            </mesh>
            <Tube
              points={[
                [x, 0.33, 0.30],
                [x, 0.38, 0.28],
                [x, 0.42, 0.24],
                [x, 0.44, 0.21],
              ]}
              radius={0.0075}
              material={mats.rubber}
              segments={16}
              radial={8}
            />
          </group>
        ))}
      </group>
    </group>
  );
};







