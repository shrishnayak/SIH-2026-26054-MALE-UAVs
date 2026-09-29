import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BoltCircle, Tube } from './RotaxEngine';

/* =========================================================================
   MALE UAV airframe — lofted composite fuselage with ogive radome, swept
   tapered wings with dihedral + canted winglets, blended V-tail, pusher
   prop, retractable tricycle gear, EO/IR gimbal turret and SATCOM dome.
   Forward axis is -X; the model is authored about its visual centroid so
   the CAD stage frames it centred, like the powertrain model.
   ========================================================================= */

/* Planform section tables (span fraction → chord scale + aft sweep offset) */
const WING_SECTIONS = [
  { at: 0, chord: 1, sweep: 0 },
  { at: 0.34, chord: 0.93, sweep: 0.11 },
  { at: 1, chord: 0.44, sweep: 0.55 },
];
const FIN_SECTIONS = [
  { at: 0, chord: 1, sweep: 0 },
  { at: 1, chord: 0.52, sweep: 0.34 },
];
const WINGLET_SECTIONS = [
  { at: 0, chord: 1, sweep: 0 },
  { at: 1, chord: 0.45, sweep: 0.12 },
];

/*
 * Lofted lifting surface: cosine-spaced NACA 4-digit symmetric sections
 * swept along the span with per-station chord/sweep/twist, capped at root
 * and tip. Spans +Z (root at z=0); `mirror` spans -Z with flipped winding.
 */
const useLiftSurface = ({ chord = 1, span = 1, thickness = 0.12, sections = WING_SECTIONS, twist = 0, mirror = false }) =>
  useMemo(() => {
    const N = 14;
    const yt = (x) =>
      5 * thickness * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    const xc = (i) => (1 - Math.cos((Math.PI * i) / N)) / 2;

    /* closed airfoil circuit: upper LE→TE, then lower TE→LE (2N points) */
    const ring = [];
    for (let i = 0; i <= N; i += 1) ring.push([xc(i), yt(xc(i))]);
    for (let i = N - 1; i >= 1; i -= 1) ring.push([xc(i), -yt(xc(i))]);
    const P = ring.length;

    const sample = (t) => {
      for (let i = 0; i < sections.length - 1; i += 1) {
        const a = sections[i];
        const b = sections[i + 1];
        if (t >= a.at && t <= b.at) {
          const f = (t - a.at) / (b.at - a.at || 1);
          return { c: a.chord + (b.chord - a.chord) * f, s: a.sweep + (b.sweep - a.sweep) * f };
        }
      }
      const last = sections[sections.length - 1];
      return { c: last.chord, s: last.sweep };
    };

    const K = 18;
    const pos = [];
    for (let k = 0; k <= K; k += 1) {
      const t = k / K;
      const { c, s } = sample(t);
      const z = mirror ? -(t * span) : t * span;
      for (let i = 0; i < P; i += 1) {
        const [cx, cy] = ring[i];
        const shear = Math.tan(twist * t) * cy * c;
        pos.push(cx * c + s + shear, cy * c, z);
      }
    }

    const idx = [];
    for (let k = 0; k < K; k += 1) {
      for (let i = 0; i < P; i += 1) {
        const i2 = (i + 1) % P;
        const a = k * P + i;
        const b = k * P + i2;
        const c0 = (k + 1) * P + i;
        const d = (k + 1) * P + i2;
        idx.push(a, c0, b, b, c0, d);
      }
    }

    /* root + tip caps via centroid fans */
    const centroid = (rowBase) => {
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (let i = 0; i < P; i += 1) {
        sx += pos[(rowBase + i) * 3];
        sy += pos[(rowBase + i) * 3 + 1];
        sz += pos[(rowBase + i) * 3 + 2];
      }
      pos.push(sx / P, sy / P, sz / P);
      return pos.length / 3 - 1;
    };
    const rootC = centroid(0);
    const tipC = centroid(K * P);
    for (let i = 0; i < P; i += 1) {
      const i2 = (i + 1) % P;
      idx.push(i, i2, rootC);
      idx.push(K * P + i2, K * P + i, tipC);
    }

    if (mirror) {
      for (let i = 0; i < idx.length; i += 3) {
        const tmp = idx[i + 1];
        idx[i + 1] = idx[i + 2];
        idx[i + 2] = tmp;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.scale(chord, chord, 1);
    geo.computeVertexNormals();
    return geo;
  }, [chord, span, thickness, sections, twist, mirror]);

/* Lathe helper — rotates an (axial, radius) table about the +X axis */
const latheFromProfile = (profile, segments = 36) => {
  const pts = profile.map(([ax, r]) => new THREE.Vector2(Math.max(r, 0.001), ax));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.rotateZ(-Math.PI / 2); /* lathe +Y axis → +X (nose at x=0, aft +X) */
  return geo;
};

const useFuselageGeo = () =>
  useMemo(() => {
    /* ogive nose → cylindrical mid-body → tapered tail boom (length 4.10) */
    const geo = latheFromProfile([
      [0.0, 0.001],
      [0.1, 0.082],
      [0.22, 0.142],
      [0.38, 0.192],
      [0.56, 0.23],
      [0.78, 0.258],
      [1.02, 0.273],
      [1.28, 0.282],
      [1.56, 0.282],
      [1.84, 0.276],
      [2.1, 0.266],
      [2.38, 0.25],
      [2.66, 0.231],
      [2.94, 0.206],
      [3.22, 0.178],
      [3.5, 0.153],
      [3.78, 0.133],
      [4.02, 0.121],
      [4.1, 0.118],
    ]);
    geo.translate(-2.0, 0, 0);
    return geo;
  }, []);

const useRadomeGeo = () =>
  useMemo(() => {
    /* dielectric nose shell, slightly proud of the hull */
    const geo = latheFromProfile(
      [
        [0.0, 0.005],
        [0.1, 0.086],
        [0.22, 0.146],
        [0.38, 0.196],
        [0.56, 0.234],
        [0.74, 0.255],
      ],
      36,
    );
    geo.translate(-2.0, 0, 0);
    return geo;
  }, []);

/* ----------------------------- materials -------------------------------- */
const useUavMaterials = (xrayMode) => useMemo(() => {
  const wire = xrayMode === 'WIREFRAME';
  const factory = (opts) => (wire
    ? new THREE.MeshBasicMaterial({ color: '#8C9199', wireframe: true, transparent: true, opacity: 0.3 })
    : new THREE.MeshStandardMaterial({ envMapIntensity: 1.0, ...opts }));

  return {
    skin: factory({ color: '#3A3E44', metalness: 0.38, roughness: 0.54 }),
    skinLight: factory({ color: '#9AA0A7', metalness: 0.42, roughness: 0.48 }),
    metal: factory({ color: '#B9BEC5', metalness: 0.95, roughness: 0.3 }),
    dark: factory({ color: '#1B1D21', metalness: 0.3, roughness: 0.62 }),
    radome: factory({ color: '#5A5F66', metalness: 0.12, roughness: 0.72 }),
    rubber: factory({ color: '#131416', metalness: 0.04, roughness: 0.95 }),
    glass: factory({ color: '#0E1418', metalness: 0.5, roughness: 0.08 }),
    brass: factory({ color: '#B98A3F', metalness: 1.0, roughness: 0.34 }),
    redLight: factory({ color: '#D33B31', metalness: 0.2, roughness: 0.4 }),
    greenLight: factory({ color: '#2FA85A', metalness: 0.2, roughness: 0.4 }),
  };
}, [xrayMode]);

export const UavAirframe = ({
  rpm = 4800,
  explode = 0,
  xrayMode = 'PBR',
  selected = null,
  onSelect,
  spin = true,
}) => {
  const mats = useUavMaterials(xrayMode);
  const propRef = useRef();
  const gimbalRef = useRef();
  const satcomRef = useRef();

  /* ---------------- procedural geometries ---------------- */
  const fuselageGeo = useFuselageGeo();
  const radomeGeo = useRadomeGeo();

  const wingRightGeo = useLiftSurface({ chord: 1.02, span: 2.95, thickness: 0.125, sections: WING_SECTIONS, twist: 0.035 });
  const wingLeftGeo = useLiftSurface({ chord: 1.02, span: 2.95, thickness: 0.125, sections: WING_SECTIONS, twist: 0.035, mirror: true });
  const finRightGeo = useLiftSurface({ chord: 0.66, span: 1.3, thickness: 0.1, sections: FIN_SECTIONS });
  const finLeftGeo = useLiftSurface({ chord: 0.66, span: 1.3, thickness: 0.1, sections: FIN_SECTIONS, mirror: true });
  const wingletRightGeo = useLiftSurface({ chord: 0.34, span: 0.42, thickness: 0.09, sections: WINGLET_SECTIONS });
  const wingletLeftGeo = useLiftSurface({ chord: 0.34, span: 0.42, thickness: 0.09, sections: WINGLET_SECTIONS, mirror: true });

  const exp = Math.max(0, Math.min(1.2, explode));
  const finSplay = 0.62 + exp * 0.18;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (spin && propRef.current) propRef.current.rotation.x += (rpm / 60) * delta * 2.4;
    if (gimbalRef.current) {
      gimbalRef.current.rotation.z = Math.sin(t * 0.35) * 0.42;
      gimbalRef.current.rotation.x = 0.22 + Math.sin(t * 0.27) * 0.16;
    }
    if (satcomRef.current) satcomRef.current.rotation.y = Math.sin(t * 0.18) * 0.3;
  });

  const pick = (id) => (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(id);
  };

  const matFor = (id, base) => (selected === id ? mats.metal : base);

  return (
    <group>
      {/* ================= FUSELAGE, NOSE RADOME & PANEL LINES ============== */}
      <group onClick={pick('FUSELAGE')}>
        {/* lofted hull: ogive nose → mid-body → tail boom */}
        <mesh geometry={fuselageGeo} material={matFor('FUSELAGE', mats.skin)} castShadow receiveShadow />
        <mesh geometry={radomeGeo} material={mats.radome} castShadow />
        {/* radome dielectric joint + fastener rings */}
        <mesh position={[-1.26, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.radome}>
          <torusGeometry args={[0.252, 0.012, 8, 36]} />
        </mesh>
        <BoltCircle count={16} radius={0.266} axis="x" position={[-1.2, 0, 0]} material={mats.metal} boltRadius={0.005} boltLength={0.014} />
        <BoltCircle count={16} radius={0.178} axis="x" position={[1.28, 0, 0]} material={mats.metal} boltRadius={0.005} boltLength={0.014} />

        {/* avionics spine deck, two segments following the hull taper */}
        <mesh position={[-0.25, 0.245, 0]} material={mats.skinLight} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.08, 0.38]} />
        </mesh>
        <mesh position={[0.62, 0.225, 0]} material={mats.skinLight} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.07, 0.28]} />
        </mesh>

        {/* aft bulkhead / prop carrier */}
        <mesh position={[2.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.dark} castShadow>
          <cylinderGeometry args={[0.118, 0.118, 0.06, 28]} />
        </mesh>

        {/* panel seam rings following the hull radius */}
        {[
          [-1.15, 0.262],
          [-0.62, 0.284],
          [-0.12, 0.279],
          [0.42, 0.251],
          [0.95, 0.198],
          [1.45, 0.161],
        ].map(([x, r]) => (
          <mesh key={`panel-${x}`} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.dark}>
            <torusGeometry args={[r + 0.002, 0.005, 6, 36]} />
          </mesh>
        ))}

        {/* belly avionics bay hatches */}
        {[
          [-0.5, -0.245],
          [0.35, -0.262],
        ].map(([x, y]) => (
          <mesh key={`hatch-${x}`} position={[x, y, 0]} material={mats.metal} castShadow>
            <boxGeometry args={[0.42, 0.02, 0.34]} />
          </mesh>
        ))}

        {/* SATCOM radome on the spine */}
        <group ref={satcomRef} position={[0.05, 0.262 + exp * 0.25, 0]}>
          <mesh material={mats.skinLight} castShadow>
            <sphereGeometry args={[0.23, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <torusGeometry args={[0.228, 0.008, 6, 30]} />
          </mesh>
        </group>

        {/* belly comm antennas + tail blade antenna */}
        {[
          [-0.9, -0.24],
          [0.6, -0.26],
          [1.35, -0.2],
        ].map(([x, y]) => (
          <mesh key={`ant-${x}`} position={[x, y - 0.02, 0]} material={mats.dark} castShadow>
            <boxGeometry args={[0.16, 0.11, 0.02]} />
          </mesh>
        ))}
        <mesh position={[1.62, -0.17, 0]} material={mats.dark} castShadow>
          <boxGeometry args={[0.02, 0.12, 0.14]} />
        </mesh>

        {/* GPS pucks on the spine */}
        {[
          [-0.1, 0.285],
          [0.9, 0.22],
        ].map(([x, y]) => (
          <mesh key={`gps-${x}`} position={[x, y, 0]} material={mats.dark} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.022, 20]} />
          </mesh>
        ))}

        {/* nose booms: pitot-static probes + AOA vanes */}
        {[-1, 1].map((s) => (
          <mesh key={`pitot-${s}`} position={[-1.85, 0, s * 0.1]} rotation={[0, 0, Math.PI / 2]} material={mats.metal} castShadow>
            <cylinderGeometry args={[0.011, 0.011, 0.3, 10]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <group key={`vane-${s}`}>
            <mesh position={[-1.86, 0.05, s * 0.145]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal} castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.07, 8]} />
            </mesh>
            <mesh position={[-1.86, 0.05, s * 0.185]} rotation={[0, 0, s * 0.7]} material={mats.dark} castShadow>
              <boxGeometry args={[0.04, 0.012, 0.12]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================= WINGS, WINGLETS, CONTROL SURFACES ================ */}
      <group position={[0, 0.02 + exp * 0.42, 0]} onClick={pick('WING')}>
        {/* swept tapered panels with dihedral, root buried in the hull */}
        <mesh
          geometry={wingRightGeo}
          position={[-0.85, 0, 0.24]}
          rotation={[-0.055, 0, 0]}
          material={matFor('WING', mats.skinLight)}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={wingLeftGeo}
          position={[-0.85, 0, -0.24]}
          rotation={[0.055, 0, 0]}
          material={matFor('WING', mats.skinLight)}
          castShadow
          receiveShadow
        />

        {/* wing-body fairings */}
        {[-1, 1].map((s) => (
          <mesh key={`fairing-${s}`} position={[-0.5, 0.04, s * 0.28]} material={mats.skin} castShadow>
            <boxGeometry args={[0.72, 0.16, 0.3]} />
          </mesh>
        ))}

        {/* canted winglets at the tips (mirrored cant) */}
        <mesh
          geometry={wingletRightGeo}
          position={[-0.32, 0.18, 3.18]}
          rotation={[-1.19, 0, 0]}
          material={matFor('WING', mats.skinLight)}
          castShadow
        />
        <mesh
          geometry={wingletLeftGeo}
          position={[-0.32, 0.18, -3.18]}
          rotation={[1.19, 0, 0]}
          material={matFor('WING', mats.skinLight)}
          castShadow
        />

        {/* landing lights in the root leading edge */}
        {[-1, 1].map((s) => (
          <group key={`ldglt-${s}`} position={[-0.86, 0, s * 0.3]}>
            <mesh material={mats.dark} castShadow>
              <boxGeometry args={[0.09, 0.09, 0.11]} />
            </mesh>
            <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.glass}>
              <cylinderGeometry args={[0.032, 0.032, 0.012, 14]} />
            </mesh>
          </group>
        ))}

        {/* inboard flaps + outboard ailerons hugging the swept TE */}
        {[-1, 1].map((s) => (
          <mesh key={`flap-${s}`} position={[0.22, 0.005, s * 0.95]} material={mats.metal} castShadow>
            <boxGeometry args={[0.15, 0.024, 0.85]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`aileron-${s}`} position={[0.21, 0, s * 2.1]} material={mats.metal} castShadow>
            <boxGeometry args={[0.13, 0.02, 0.7]} />
          </mesh>
        ))}
        {/* flap track fairings under the trailing edge */}
        {[-1, 1].map((s) =>
          [
            [0.28, 0.95],
            [0.3, 2.1],
          ].map(([x, z]) => (
            <mesh key={`track-${s}-${z}`} position={[x, -0.06, s * z]} material={mats.dark} castShadow>
              <boxGeometry args={[0.18, 0.05, 0.24]} />
            </mesh>
          )),
        )}

        {/* navigation lights on the winglet tips — red port, green starboard */}
        <mesh position={[-0.3, 0.56, 3.32]} material={mats.redLight}>
          <sphereGeometry args={[0.035, 12, 10]} />
        </mesh>
        <mesh position={[-0.3, 0.56, -3.32]} material={mats.greenLight}>
          <sphereGeometry args={[0.035, 12, 10]} />
        </mesh>
      </group>

      {/* ================= V-TAIL EMPENNAGE ================================= */}
      <group position={[1.45, 0.13, 0]} onClick={pick('V_TAIL')}>
        {/* canted fins sharing one splay angle, mirrored planforms */}
        <mesh
          geometry={finRightGeo}
          rotation={[-(Math.PI / 2 - finSplay), 0, 0]}
          material={matFor('V_TAIL', mats.skinLight)}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={finLeftGeo}
          rotation={[Math.PI / 2 - finSplay, 0, 0]}
          material={matFor('V_TAIL', mats.skinLight)}
          castShadow
          receiveShadow
        />
        {/* dorsal keel fairing hugging the boom crown */}
        <mesh position={[0.25, 0.03, 0]} material={mats.skin} castShadow>
          <boxGeometry args={[0.6, 0.14, 0.06]} />
        </mesh>
        {/* rudder hinge lines lying in each fin plane */}
        {[-1, 1].map((s) => (
          <mesh
            key={`rudder-${s}`}
            position={[0.42, 0.53, s * 0.38]}
            rotation={[s * (finSplay - Math.PI / 2), 0, 0]}
            material={mats.metal}
            castShadow
          >
            <boxGeometry args={[0.03, 0.014, 0.9]} />
          </mesh>
        ))}
        {/* fin-tip nav lights + aft beacon */}
        <mesh position={[0.28, 1.06, 0.755]} material={mats.redLight}>
          <sphereGeometry args={[0.03, 12, 10]} />
        </mesh>
        <mesh position={[0.28, 1.06, -0.755]} material={mats.redLight}>
          <sphereGeometry args={[0.03, 12, 10]} />
        </mesh>
        <mesh position={[0.5, 0.02, 0]} material={mats.redLight}>
          <sphereGeometry args={[0.028, 12, 10]} />
        </mesh>
      </group>

      {/* ================= PUSHER PROPELLER ================================= */}
      <group position={[2.44 + exp * 0.4, 0, 0]} onClick={pick('PROPELLER')}>
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={mats.metal} castShadow>
          <coneGeometry args={[0.088, 0.24, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={mats.dark} castShadow>
          <cylinderGeometry args={[0.062, 0.062, 0.1, 20]} />
        </mesh>
        <group ref={propRef}>
          {[0, 1, 2].map((i) => (
            <group key={`blade-${i}`} rotation={[(i * Math.PI * 2) / 3, 0, 0]}>
              {/* root cuff */}
              <mesh position={[0, 0.1, 0]} material={mats.metal} castShadow>
                <cylinderGeometry args={[0.028, 0.038, 0.09, 12]} />
              </mesh>
              {/* tapered aerofoil blade: chord broadens mid-span, capsule tips it */}
              <mesh position={[0, 0.4, 0]} rotation={[0, 0.42, 0]} scale={[1, 1, 2.6]} material={mats.dark} castShadow>
                <capsuleGeometry args={[0.032, 0.5, 6, 14]} />
              </mesh>
              <mesh position={[0, 0.68, 0]} rotation={[0, 0.42, 0]} scale={[1, 1, 2.0]} material={mats.dark} castShadow>
                <capsuleGeometry args={[0.022, 0.14, 6, 12]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ================= EO/IR GIMBAL TURRET ============================== */}
      <group position={[-1.3, -0.42 - exp * 0.3, 0]} onClick={pick('EO_IR_TURRET')}>
        {/* belly mount fairing into the yoke */}
        <mesh position={[0, 0.12, 0]} material={mats.skin} castShadow>
          <boxGeometry args={[0.18, 0.14, 0.18]} />
        </mesh>
        {/* yoke / azimuth ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.metal} castShadow>
          <torusGeometry args={[0.135, 0.018, 8, 30]} />
        </mesh>
        <mesh position={[0, 0.09, 0]} material={mats.dark} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.09, 22]} />
        </mesh>
        <group ref={gimbalRef} position={[0, -0.06, 0]}>
          {/* gyro-stabilised ball */}
          <mesh material={matFor('EO_IR_TURRET', mats.dark)} castShadow receiveShadow>
            <sphereGeometry args={[0.115, 26, 20]} />
          </mesh>
          {/* MWIR lens */}
          <mesh position={[0, 0.01, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={mats.glass}>
            <cylinderGeometry args={[0.055, 0.055, 0.05, 24]} />
          </mesh>
          <mesh position={[0, 0.01, 0.115]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <torusGeometry args={[0.058, 0.008, 8, 26]} />
          </mesh>
          {/* daylight / laser designator aperture */}
          <mesh position={[-0.07, 0.03, 0.085]} rotation={[Math.PI / 2, 0, 0]} material={mats.glass}>
            <cylinderGeometry args={[0.028, 0.028, 0.045, 18]} />
          </mesh>
          <mesh position={[0, -0.07, 0.02]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 14]} />
          </mesh>
        </group>
      </group>

      {/* ================= RETRACTABLE TRICYCLE LANDING GEAR ================ */}
      <group position={[0, -exp * 0.34, 0]} onClick={pick('LANDING_GEAR')}>
        {/* nose gear: oleo strut, scissor link, twin wheels, bay doors */}
        <group position={[-1.28, 0, 0]}>
          <mesh position={[0, -0.5, 0]} material={mats.metal} castShadow>
            <cylinderGeometry args={[0.034, 0.03, 0.56, 16]} />
          </mesh>
          <mesh position={[0, -0.85, 0]} material={mats.metal} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
          </mesh>
          {/* scissor link */}
          {[-1, 1].map((s) => (
            <mesh key={`nlink-${s}`} position={[0, -0.62, s * 0.018]} rotation={[s * 0.5, 0, 0]} material={mats.dark} castShadow>
              <boxGeometry args={[0.03, 0.16, 0.014]} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`nw-${s}`} position={[0, -0.95, s * 0.085]} rotation={[Math.PI / 2, 0, 0]} material={mats.rubber} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 22]} />
            </mesh>
          ))}
          <mesh position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <cylinderGeometry args={[0.022, 0.022, 0.24, 10]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`ndoor-${s}`} position={[0, -0.3, s * 0.16]} material={mats.skin} castShadow>
              <boxGeometry args={[0.4, 0.016, 0.26]} />
            </mesh>
          ))}
        </group>

        {/* main gear: cantilever struts, trailing links, brakes, doors */}
        {[-1, 1].map((s) => (
          <group key={`main-${s}`} position={[0.05, 0, s * 0.3]}>
            {/* cantilever strut: top under the wing root, bottom out at the axle */}
            <mesh position={[0, -0.475, s * 0.12]} rotation={[-s * 0.276, 0, 0]} material={mats.metal} castShadow>
              <cylinderGeometry args={[0.04, 0.034, 0.88, 16]} />
            </mesh>
            {/* drag brace to the axle */}
            <mesh position={[0, -0.8, s * 0.22]} rotation={[s * 0.6, 0, 0]} material={mats.metal} castShadow>
              <boxGeometry args={[0.045, 0.2, 0.016]} />
            </mesh>
            <mesh position={[0, -0.9, s * 0.24]} rotation={[Math.PI / 2, 0, 0]} material={mats.rubber} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.1, 24]} />
            </mesh>
            {/* brake caliper disc */}
            <mesh position={[0, -0.9, s * 0.18]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
              <cylinderGeometry args={[0.075, 0.075, 0.02, 20]} />
            </mesh>
            {/* gear door */}
            <mesh position={[-0.12, -0.3, s * 0.06]} rotation={[0, 0, s * 0.08]} material={mats.skin} castShadow>
              <boxGeometry args={[0.46, 0.016, 0.3]} />
            </mesh>
            {/* brake line */}
            <Tube
              points={[
                [0.0, -0.25, s * 0.12],
                [0.04, -0.55, s * 0.16],
                [0.02, -0.82, s * 0.19],
              ]}
              radius={0.008}
              material={mats.brass}
              segments={16}
              radial={8}
            />
          </group>
        ))}
      </group>

      {/* ================= EFFECTORS / PAYLOAD PYLONS ====================== */}
      <group onClick={pick('PAYLOAD')}>
        {[-1, 1].map((s) => (
          <group key={`pylon-${s}`} position={[-0.45, 0.02 + exp * 0.42, s * 1.15]}>
            {/* hardpoint shoe against the wing lower surface */}
            <mesh position={[0, -0.05, 0]} material={mats.dark} castShadow>
              <boxGeometry args={[0.34, 0.14, 0.05]} />
            </mesh>
            {/* stores pod / munition body */}
            <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.skinLight} castShadow>
              <cylinderGeometry args={[0.055, 0.055, 0.92, 20]} />
            </mesh>
            <mesh position={[-0.46, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.metal} castShadow>
              <coneGeometry args={[0.055, 0.14, 20]} />
            </mesh>
            {/* seeker window */}
            <mesh position={[-0.52, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.glass}>
              <cylinderGeometry args={[0.028, 0.028, 0.012, 14]} />
            </mesh>
            {/* cruciform tail fins */}
            {[
              [0.38, 0],
              [0.38, Math.PI / 2],
            ].map(([x, ry]) => (
              <mesh key={`fin-${x}-${ry}`} position={[x, -0.3, 0]} rotation={[0, ry, 0]} material={mats.dark} castShadow>
                <boxGeometry args={[0.14, 0.008, 0.2]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ================= BELLY ANTENNA FARM / DAS ======================== */}
      <group onClick={pick('DAS')}>
        <mesh position={[0.55, -0.28, 0]} material={mats.dark} castShadow>
          <boxGeometry args={[0.34, 0.09, 0.24]} />
        </mesh>
        <mesh position={[0.55, -0.335, 0]} material={mats.glass}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        </mesh>
        <mesh position={[-0.15, -0.26, 0.12]} material={mats.glass}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        </mesh>
      </group>
    </group>
  );
};
