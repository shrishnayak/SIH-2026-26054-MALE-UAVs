import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetry } from '../../context/TelemetryContext';
import { UavAirframeAndGears } from '../uav/UavAirframeAndGears';
import { UavEngineInternals } from '../uav/UavEngineInternals';
import { HudHologramScene } from '../uav/HudHologramScene';
import { tacticalAudio } from '../../utils/tacticalAudio';
import { 
  Box, 
  Activity, 
  Brain, 
  Map, 
  Users, 
  Sliders, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Flame, 
  Zap, 
  ArrowRight, 
  Gauge, 
  Crosshair, 
  Layers, 
  Sparkles, 
  ChevronDown,
  Terminal,
  Radio,
  Cpu,
  Plane,
  Clock,
  Compass,
  Eye,
  RotateCw,
  X,
  Ruler,
  Wind
} from 'lucide-react';

// Aerodynamic Flow Streamlines Particle System (Fluid wind tunnel effect)
const AeroStreamlines = () => {
  const count = 36;
  const particlesRef = useRef();
  
  const lines = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const xSpan = (Math.random() - 0.5) * 8.5;
      const yStart = -4.5 + Math.random() * 2;
      const zHeight = (Math.random() - 0.5) * 0.8 + 0.1;
      const speed = 0.04 + Math.random() * 0.03;
      return { xSpan, yStart, zHeight, speed, y: yStart };
    });
  }, []);

  useFrame((state, delta) => {
    lines.forEach((line) => {
      line.y += line.speed * (delta * 60);
      if (line.y > 4.5) {
        line.y = -4.5 - Math.random() * 2;
      }
    });
  });

  return (
    <group ref={particlesRef}>
      {lines.map((line, idx) => (
        <mesh key={idx} position={[line.xSpan, line.y, line.zHeight]}>
          <boxGeometry args={[0.015, 0.45, 0.008]} />
          <meshBasicMaterial 
            color="#C59B27" 
            transparent 
            opacity={0.18} 
          />
        </mesh>
      ))}
    </group>
  );
};

// Interactive 3D Hotspot Pin in Three.js Space
const Interactive3DHotspotPin = ({ position, label, sublabel, id, onSelect, isSelected }) => {
  const ringRef = useRef();

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {/* Outer Rotating Calibration Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.18, 0.22, 24]} />
        <meshBasicMaterial 
          color={isSelected ? '#C59B27' : '#D4A373'} 
          transparent 
          opacity={isSelected ? 0.9 : 0.45} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Central Interactive Click Node */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color={isSelected ? '#C59B27' : '#CBD5E1'} 
          emissive={isSelected ? '#967230' : '#475569'}
          emissiveIntensity={0.5}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};

// Smooth LERP Choreographed 3D Scene Actor with Mouse Parallax
const Scrollytelling3DScene = ({ 
  scrollProgress, 
  telemetry, 
  mousePos, 
  isFreeOrbit, 
  selectedHotspot, 
  onSelectHotspot 
}) => {
  const groupRef = useRef();
  const targetRot = useRef(new THREE.Euler(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!groupRef.current || isFreeOrbit) return;

    // 1. Calculate Target Choreography based on scroll progress (0.0 to 1.0)
    let p = 0;
    let tX = 0, tY = 0, tZ = 0;
    let rX = 0, rY = 0, rZ = 0;

    if (scrollProgress < 0.25) {
      // Section 1: Hero Low-Angle Head-On Perspective (Matching MALE UAV image)
      p = scrollProgress / 0.25;
      tX = 0;
      tY = -0.35 * p;
      tZ = 0;
      rX = 0.12 * (1 - p);
      rY = -0.28 * p;
      rZ = 0;
    } else if (scrollProgress < 0.5) {
      // Section 2: Close Macro Zoom into 4-Boxer Combustion Core
      p = (scrollProgress - 0.25) / 0.25;
      tX = 0.35 * p;
      tY = 0.55 * p;
      tZ = -0.15 * p;
      rX = 0.32 * p;
      rY = 0.42 * p;
      rZ = -0.12 * p;
    } else if (scrollProgress < 0.75) {
      // Section 3: Isometric X-Ray Cutaway & Prognostics Inspection
      p = (scrollProgress - 0.5) / 0.25;
      tX = 0.35 - 0.55 * p;
      tY = 0.55 - 0.25 * p;
      tZ = -0.15;
      rX = 0.32 + 0.18 * p;
      rY = 0.42 - 0.75 * p;
      rZ = 0;
    } else {
      // Section 4: High Altitude Loiter & Swarm Flight Cruise
      p = (scrollProgress - 0.75) / 0.25;
      tX = -0.2 + 0.2 * p;
      tY = 0.3 - 0.3 * p;
      tZ = 0;
      rX = 0.5 - 0.38 * p;
      rY = -0.33 + 0.33 * p;
      rZ = 0.08 * p;
    }

    // 2. Add Smooth Gyroscopic Mouse Parallax Sway
    const mouseSwayX = (mousePos.current.x || 0) * 0.18;
    const mouseSwayY = (mousePos.current.y || 0) * 0.14;

    targetPos.current.set(tX, tY, tZ);
    targetRot.current.set(rX + mouseSwayY, rY + mouseSwayX, rZ);

    // 3. Fluid Exponential LERP Smoothing (Damped transition)
    groupRef.current.position.lerp(targetPos.current, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRot.current.x, 0.08);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot.current.y, 0.08);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot.current.z, 0.08);
  });

  // Calculate dynamic explosion factor based on scroll
  let explosionFactor = 0;
  if (scrollProgress >= 0.22 && scrollProgress <= 0.58) {
    explosionFactor = Math.sin(((scrollProgress - 0.22) / 0.36) * Math.PI) * 0.85;
  }

  // Dynamic Shader mode based on scroll section
  let xrayMode = 'STEALTH_CARBON';
  if (scrollProgress > 0.5 && scrollProgress < 0.75) {
    xrayMode = 'METALLIC_ALLOY';
  } else if (scrollProgress >= 0.75) {
    xrayMode = 'CAD_BLUEPRINT';
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Float speed={1.1} rotationIntensity={0.03} floatIntensity={0.05}>
        <UavAirframeAndGears
          isExploded={explosionFactor > 0.08}
          explosionFactor={explosionFactor}
          telemetry={telemetry}
          xrayMode={xrayMode}
        />
        <UavEngineInternals
          isExploded={explosionFactor > 0.08}
          explosionFactor={explosionFactor}
          telemetry={telemetry}
          xrayMode={xrayMode}
        />
        <HudHologramScene
          showHudRings={true}
          activeFault={telemetry?.health?.activeFault || 'NONE'}
        />

        {/* Aerodynamic Wind Tunnel Streamlines */}
        <AeroStreamlines />

        {/* Interactive 3D Hotspot Pins */}
        <Interactive3DHotspotPin
          position={[0, -2.6, 0.1]}
          label="SATCOM RADOME"
          id="RADOME"
          isSelected={selectedHotspot === 'RADOME'}
          onSelect={onSelectHotspot}
        />
        <Interactive3DHotspotPin
          position={[0, -1.8, -0.45]}
          label="EO/IR FLIR GIMBAL"
          id="FLIR_TURRET"
          isSelected={selectedHotspot === 'FLIR_TURRET'}
          onSelect={onSelectHotspot}
        />
        <Interactive3DHotspotPin
          position={[0, 0.4, 0.35]}
          label="ROTAX 915 iS ENGINE"
          id="ENGINE"
          isSelected={selectedHotspot === 'ENGINE'}
          onSelect={onSelectHotspot}
        />
        <Interactive3DHotspotPin
          position={[-3.2, 0.6, 0.15]}
          label="COMPOSITE SPAR WINGS"
          id="WINGS"
          isSelected={selectedHotspot === 'WINGS'}
          onSelect={onSelectHotspot}
        />
        <Interactive3DHotspotPin
          position={[0, -2.1, -1.1]}
          label="OLEO NOSE GEAR"
          id="LANDING_GEAR"
          isSelected={selectedHotspot === 'LANDING_GEAR'}
          onSelect={onSelectHotspot}
        />
      </Float>
    </group>
  );
};

export const LandingScrollytelling = ({ onNavigateTab, onLaunchDashboard }) => {
  const { telemetry, injectFault, clearFault } = useTelemetry();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [isFreeOrbit, setIsFreeOrbit] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  
  const containerRef = useRef();
  const mousePos = useRef({ x: 0, y: 0 });

  // Mouse move parallax listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2
      };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollProgress(progress);

      const sectionIndex = Math.min(4, Math.floor(progress * 5));
      if (sectionIndex !== activeSection) {
        setActiveSection(sectionIndex);
        tacticalAudio.playClick();
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, [activeSection]);

  const scrollToSection = (index) => {
    tacticalAudio.playChirp();
    if (!containerRef.current) return;
    const { scrollHeight, clientHeight } = containerRef.current;
    const target = (scrollHeight - clientHeight) * (index / 4);
    containerRef.current.scrollTo({ top: target, behavior: 'smooth' });
  };

  const hotspotData = {
    RADOME: {
      name: 'Forward Bulbous Radome & SATCOM Link',
      type: 'Command & Telecommunications',
      spec: 'Ku/Ka-Band Gimballed Reflector Antenna, Dual-Channel Encrypted LOS Uplink',
      status: 'LINK LOCKED // 50 Mbps',
      desc: 'Aerodynamic composite radome with RF-transparent quartz matrix. Houses wideband beyond-line-of-sight satellite communications.'
    },
    FLIR_TURRET: {
      name: 'Ventral EO/IR Multi-Spectral Gimbal',
      type: 'Surveillance & Target Acquisition',
      spec: 'Continuous 360° Azimuth, HD MWIR Thermal Sensor, Laser Target Designator',
      status: 'TRACKING ACTIVE // 0.01° JITTER',
      desc: 'Precision gyro-stabilized gimbal payload providing high-resolution daylight electro-optical and long-wave infrared thermal imagery.'
    },
    ENGINE: {
      name: 'Rotax 915/916 iS Turbocharged Boxer Engine',
      type: 'Powertrain & Mechanical Core',
      spec: '1,414 cc 4-Stroke Boxer, Inconel Turbocharger (1.85 Bar), Dual FADEC ECU',
      status: `${telemetry.engine.rpm} RPM // EGT ${Math.max(...telemetry.engine.egt).toFixed(0)}°C`,
      desc: 'Core propulsion unit with nickel-silicon cylinder sleeves, forged pistons, and dual spark ignition. Optimized for high-altitude endurance.'
    },
    WINGS: {
      name: 'High-Aspect-Ratio Carbon Composite Wings',
      type: 'Aerodynamic Lift Surfaces',
      spec: '20.5m Wingspan, Multi-Rib Carbon Truss Spar, Cantilever Winglets',
      status: 'L/D RATIO: 18:1 // GLIDE READY',
      desc: 'Ultra-lightweight high-aspect carbon fiber wing assembly designed for minimum induced drag during extended high-altitude loiter missions.'
    },
    LANDING_GEAR: {
      name: 'Heavy-Duty Retractable Tricycle Landing Gear',
      type: 'Airframe Recovery System',
      spec: 'Oleo-Pneumatic Telescopic Strut, Chrome Piston, Disc Brake Calipers',
      status: 'STOWED // LOCKED EN ROUTE',
      desc: 'Shock-absorbing oleo struts engineered for rough-field tactical runway deployments with automated emergency gravity free-fall extension.'
    }
  };

  const activeHotspotInfo = selectedHotspot ? hotspotData[selectedHotspot] : null;

  return (
    <div className="relative w-full h-[calc(100vh-62px)] flex-1 overflow-hidden bg-carbon-950 font-sans text-slate-100 selection:bg-tactical-amber selection:text-black">
      {/* =========================================================================
          1. FIXED 3D CANVAS BACKGROUND (Fluid Apple-style 3D Scrollytelling)
         ========================================================================= */}
      <div className={`absolute inset-0 z-0 ${isFreeOrbit ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'}`}>
        <Canvas
          camera={{ position: [0.15, -4.8, 0.45], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#07090D']} />
          <fog attach="fog" args={['#07090D', 14, 38]} />

          {/* Warm Titanium & Champagne Studio Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[-6, -6, 8]} intensity={1.6} color="#CBD5E1" />
          <directionalLight position={[6, -4, 10]} intensity={2.0} color="#F1E5D1" />
          <directionalLight position={[0, 8, 4]} intensity={0.6} color="#64748B" />
          
          <pointLight position={[0, 0.4, 0.6]} intensity={2.2} color="#C59B27" distance={6} />
          <pointLight position={[0, -2.8, -0.6]} intensity={1.8} color="#D4A373" distance={4} />

          <Scrollytelling3DScene
            scrollProgress={scrollProgress}
            telemetry={telemetry}
            mousePos={mousePos}
            isFreeOrbit={isFreeOrbit}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={(id) => {
              tacticalAudio.playChirp();
              setSelectedHotspot(id);
            }}
          />

          {isFreeOrbit && (
            <OrbitControls
              enableDamping={true}
              dampingFactor={0.05}
              maxDistance={20}
              minDistance={1.5}
            />
          )}
        </Canvas>
      </div>

      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none scanline-layer opacity-30"></div>

      {/* Top Floating Controls Pill (Free 3D Orbit Toggle & Reset) */}
      <div className="fixed top-20 right-6 z-30 flex items-center gap-2">
        <button
          onClick={() => {
            tacticalAudio.playClick();
            setIsFreeOrbit(!isFreeOrbit);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 border transition-all shadow-lg backdrop-blur-md ${
            isFreeOrbit
              ? 'bg-tactical-amber text-black border-tactical-amber shadow-tactical-amber'
              : 'bg-carbon-900/90 text-slate-300 border-carbon-700 hover:border-tactical-amber'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFreeOrbit ? 'animate-spin' : ''}`} />
          <span>{isFreeOrbit ? 'FREE 3D ORBIT: ACTIVE' : '3D AUTO-CHOREOGRAPHY'}</span>
        </button>
      </div>

      {/* Floating Section Progress Indicator (Apple-style pill navigation) */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 flex flex-col items-center gap-3">
        {[
          { label: 'OVERVIEW', icon: Plane },
          { label: 'POWERTRAIN', icon: Gauge },
          { label: 'AI PROGNOSTICS', icon: Brain },
          { label: 'RL REPLANNER', icon: Map },
          { label: 'SWARM OPERATIONS', icon: Users },
        ].map((item, idx) => {
          const isActive = activeSection === idx;
          return (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              className="group flex items-center gap-2 relative focus:outline-none"
              title={item.label}
            >
              <span className={`text-[10px] font-mono font-bold transition-all ${
                isActive ? 'text-tactical-amber opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'
              }`}>
                {item.label}
              </span>
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-tactical-amber scale-125 shadow-tactical-amber' 
                  : 'bg-carbon-700 hover:bg-slate-400'
              }`} />
            </button>
          );
        })}
      </div>

      {/* Interactive 3D Hotspot Subsystem Drawer (Opens when user clicks any 3D node) */}
      {activeHotspotInfo && (
        <div className="fixed left-6 bottom-6 z-40 max-w-sm w-full bg-carbon-900/95 border border-tactical-amber/40 p-5 rounded-2xl backdrop-blur-2xl shadow-2xl animate-float-slow">
          <div className="flex items-center justify-between border-b border-carbon-750 pb-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-tactical-amber font-bold">
              <Crosshair className="w-4 h-4" />
              <span>3D SUBSYSTEM INSPECTOR</span>
            </div>
            <button 
              onClick={() => {
                tacticalAudio.playClick();
                setSelectedHotspot(null);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-carbon-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-bold text-base text-slate-100 font-display mb-0.5">
            {activeHotspotInfo.name}
          </h3>
          <div className="text-[11px] font-mono text-tactical-amber mb-2">
            {activeHotspotInfo.type}
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-carbon-950 p-2.5 rounded-xl border border-carbon-800 mb-2.5">
            {activeHotspotInfo.desc}
          </div>

          <div className="text-[10px] font-mono text-slate-400 bg-carbon-950/80 p-2 rounded-lg border border-carbon-800 mb-3">
            <span className="text-slate-300 font-bold">SPEC:</span> {activeHotspotInfo.spec}
          </div>

          <button
            onClick={() => onNavigateTab('BLUEPRINT')}
            className="w-full py-2 rounded-xl bg-tactical-amber text-black font-bold font-mono text-xs flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-tactical-amber"
          >
            <span>DEEP DIVE IN 3D CAD STUDIO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          2. SCROLLABLE NARRATIVE CONTENT CONTAINER
         ========================================================================= */}
      <div 
        ref={containerRef}
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
      >
        {/* -------------------------------------------------------------------
            SECTION 1: HERO CINEMATIC REVEAL
           ------------------------------------------------------------------- */}
        <section className="min-h-screen w-full flex flex-col justify-between p-8 md:p-16 snap-start relative">
          {/* Top Left Header Badge */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-carbon-900/90 border border-tactical-amber/30 rounded-full text-xs font-mono text-tactical-amber flex items-center gap-2 shadow-tactical-amber backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-tactical-amber animate-pulse"></span>
              <span className="font-bold">MIL-STD-178C LEVEL A AI DIGITAL TWIN</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-carbon-900/80 border border-carbon-700 rounded-full text-xs font-mono text-slate-300 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-tactical-gold" />
              <span>ZULU LIVE // CAN 100 HZ</span>
            </div>
          </div>

          {/* Center Left Hero Title & Value Proposition */}
          <div className="max-w-2xl flex flex-col gap-5 my-auto">
            <div className="text-xs font-mono text-tactical-amber tracking-widest uppercase flex items-center gap-2 font-bold">
              <Compass className="w-4 h-4 text-tactical-amber" />
              AEROTWIN // NEXT-GEN MALE UAV DIGITAL TWIN
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-display text-white leading-none">
              AEROTWIN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tactical-amber via-yellow-200 to-tactical-gold">
                DIGITAL TWIN
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
              Precision 3D CAD digital twin for high-altitude MALE UAV powertrains (Rotax 915/916 iS). 
              Physics-informed neural prognostics, real-time combustion chamber X-Ray, and autonomous RL mission replanning.
            </p>

            {/* Quick Action Portals */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  tacticalAudio.playChirp();
                  onNavigateTab('BLUEPRINT');
                }}
                className="px-6 py-3 rounded-xl bg-tactical-amber text-black font-bold font-mono text-sm flex items-center gap-2 shadow-tactical-amber hover:bg-yellow-400 transition-all hover:scale-105"
              >
                <Layers className="w-4 h-4" />
                <span>OPEN 3D CAD STUDIO</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  tacticalAudio.playClick();
                  onLaunchDashboard();
                }}
                className="px-6 py-3 rounded-xl bg-carbon-900/90 border border-carbon-700 hover:border-tactical-amber text-slate-200 font-mono text-sm flex items-center gap-2 backdrop-blur-md transition-all hover:bg-carbon-800"
              >
                <Activity className="w-4 h-4 text-tactical-gold" />
                <span>LIVE FLIGHT DECK</span>
              </button>
            </div>
          </div>

          {/* Bottom Telemetry HUD Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-carbon-900/85 border border-carbon-700 p-4 rounded-2xl backdrop-blur-md shadow-hud-glass">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">FLIGHT ALTITUDE</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                {telemetry.mission.altitudeFt.toLocaleString()} <span className="text-xs text-tactical-amber">FT</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">ENGINE POWER</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {telemetry.engine.rpm} <span className="text-xs text-slate-400">RPM</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">HEALTH INDEX</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-tactical-amber">
                {telemetry.health.index.toFixed(1)}% <span className="text-xs text-slate-400">{telemetry.health.status}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">MISSION RELIABILITY</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-200">
                99.8% <span className="text-xs text-slate-400">RUL: 842H</span>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 2: 3D CAD COMBUSTION CHAMBERS & POWERTRAIN ARCHITECTURE
           ------------------------------------------------------------------- */}
        <section className="min-h-screen w-full flex flex-col justify-center p-8 md:p-16 snap-start relative">
          <div className="max-w-xl flex flex-col gap-4 bg-carbon-900/90 border border-tactical-amber/30 p-8 rounded-3xl backdrop-blur-xl shadow-hud-glass-amber">
            <div className="text-xs font-mono text-tactical-amber tracking-widest uppercase flex items-center gap-2 font-bold">
              <Gauge className="w-4 h-4 text-tactical-amber" />
              POWERTRAIN DISASSEMBLY & CHAMBER PHYSICS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
              Rotax 915 iS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tactical-amber to-tactical-gold">
                4-Boxer Combustion Core
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              Reciprocating forged aluminum pistons, NiCaSil-plated cylinder sleeves, and Inconel turbocharger boost volute. 
              Real-time stoichiometric closed-loop lambda and dual FADEC ignition timing.
            </p>

            {/* Chamber Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-carbon-950 border border-carbon-800">
                <div className="text-[10px] font-mono text-slate-400">CYL 1-4 EGT SPREAD</div>
                <div className="text-lg font-bold font-mono text-tactical-amber">
                  {(Math.max(...telemetry.engine.egt) - Math.min(...telemetry.engine.egt)).toFixed(1)}°C
                </div>
                <div className="text-[9px] font-mono text-slate-500">Nominal Target: &lt; 35°C</div>
              </div>
              <div className="p-3 rounded-xl bg-carbon-950 border border-carbon-800">
                <div className="text-[10px] font-mono text-slate-400">MANIFOLD BOOST (MAP)</div>
                <div className="text-lg font-bold font-mono text-slate-200">
                  {telemetry.engine.mapBar} <span className="text-xs text-slate-400">BAR</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500">Wastegate Duty: {telemetry.engine.wastegateDutyPct}%</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('BLUEPRINT')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-tactical-amber text-black font-bold font-mono text-xs flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-tactical-amber"
            >
              <span>INSPECT EXPLODED 3D CAD MODEL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 3: PHYSICS-INFORMED AI PROGNOSTICS (PINN) & XAI
           ------------------------------------------------------------------- */}
        <section className="min-h-screen w-full flex flex-col justify-center items-end p-8 md:p-16 snap-start relative">
          <div className="max-w-xl flex flex-col gap-4 bg-carbon-900/90 border border-tactical-amber/30 p-8 rounded-3xl backdrop-blur-xl shadow-hud-glass">
            <div className="text-xs font-mono text-tactical-amber tracking-widest uppercase flex items-center gap-2 font-bold">
              <Brain className="w-4 h-4 text-tactical-amber" />
              PHYSICS-INFORMED NEURAL NETWORK (PINN)
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
              Remaining Useful Life <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tactical-amber to-tactical-gold">
                Prognostics & XAI
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              Autoencoders detect subtle micro-vibrations, piston blow-by, and fuel injector cavitation hundreds of hours before thermal failure. 
              SHAP feature attribution delivers explainable diagnostics for mission commanders.
            </p>

            {/* AI Prognostic KPIs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-carbon-950 border border-carbon-800">
                <div className="text-[10px] font-mono text-slate-400">PREDICTED RUL (MEAN)</div>
                <div className="text-lg font-bold font-mono text-slate-100">
                  842.0 <span className="text-xs text-slate-400">HOURS</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500">95% CI: [818.5 - 865.5h]</div>
              </div>
              <div className="p-3 rounded-xl bg-carbon-950 border border-carbon-800">
                <div className="text-[10px] font-mono text-slate-400">ANOMALY CONFIDENCE</div>
                <div className="text-lg font-bold font-mono text-tactical-amber">
                  99.4%
                </div>
                <div className="text-[9px] font-mono text-slate-500">Zero False Positives</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('PROGNOSTICS')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-tactical-amber text-black font-bold font-mono text-xs flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-tactical-amber"
            >
              <span>VIEW AI RESIDUALS & XAI SHAP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 4: AUTONOMOUS RL REPLANNER & TACTICAL RADAR
           ------------------------------------------------------------------- */}
        <section className="min-h-screen w-full flex flex-col justify-center p-8 md:p-16 snap-start relative">
          <div className="max-w-xl flex flex-col gap-4 bg-carbon-900/90 border border-tactical-amber/30 p-8 rounded-3xl backdrop-blur-xl shadow-hud-glass-amber">
            <div className="text-xs font-mono text-tactical-amber tracking-widest uppercase flex items-center gap-2 font-bold">
              <Map className="w-4 h-4 text-tactical-amber" />
              REINFORCEMENT LEARNING REPLANNER
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
              Autonomous Dynamic <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tactical-amber to-tactical-gold">
                Glide Cone & Rerouting
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              When cylinder or lubrication faults degrade engine power, the onboard RL agent recalculates optimal energy descent profiles, avoids SAM threat zones, and safely recovers to friendly airbases.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-carbon-950 border border-carbon-800 text-xs font-mono">
              <ShieldAlert className="w-5 h-5 text-tactical-amber flex-shrink-0" />
              <div>
                <span className="text-slate-200 font-bold">GLIDE RATIO:</span> 18:1 L/D Envelope | 
                <span className="text-tactical-amber ml-1">DIVERT AIRBASE: FOB DELTA (42 NM)</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('MISSION_MAP')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-tactical-amber text-black font-bold font-mono text-xs flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-tactical-amber"
            >
              <span>LAUNCH RL MISSION REPLANNER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 5: TACTICAL SWARM FLEET & MISSION OPERATIONS PORTAL
           ------------------------------------------------------------------- */}
        <section className="min-h-screen w-full flex flex-col justify-center items-center text-center p-8 md:p-16 snap-start relative">
          <div className="max-w-3xl flex flex-col items-center gap-6 bg-carbon-900/90 border border-tactical-amber/30 p-10 rounded-3xl backdrop-blur-2xl shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-carbon-800 border border-tactical-amber/50 flex items-center justify-center shadow-tactical-amber">
              <Plane className="w-7 h-7 text-tactical-amber" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
              Enter Military Operations <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tactical-amber via-yellow-200 to-tactical-gold">
                Tactical Flight Deck
              </span>
            </h2>

            <p className="text-base text-slate-300 font-sans max-w-xl">
              Access the complete suite of 7 interactive mission tabs: 3D CAD Blueprint, Live Telemetry, AI Prognostics, RL Replanner, Swarm Fleet, Judge's Sandbox, and AI Copilot.
            </p>

            {/* Tab Quick Gateways */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full pt-2">
              {[
                { id: 'BLUEPRINT', label: '3D CAD STUDIO', icon: Box },
                { id: 'TELEMETRY', label: 'LIVE TELEMETRY', icon: Activity },
                { id: 'PROGNOSTICS', label: 'AI PROGNOSTICS', icon: Brain },
                { id: 'MISSION_MAP', label: 'RL REPLANNER', icon: Map },
                { id: 'FLEET', label: 'SWARM FLEET', icon: Users },
                { id: 'SANDBOX', label: "JUDGE'S LAB", icon: Sliders },
                { id: 'COPILOT', label: 'AI COPILOT', icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      tacticalAudio.playClick();
                      onNavigateTab(tab.id);
                    }}
                    className="p-3 rounded-xl bg-carbon-950 border border-carbon-800 hover:border-tactical-amber/50 text-xs font-mono text-slate-200 flex flex-col items-center gap-2 hover:bg-carbon-800 transition-all hover:scale-105"
                  >
                    <Icon className="w-4 h-4 text-tactical-amber" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                tacticalAudio.playChirp();
                onLaunchDashboard();
              }}
              className="mt-4 px-8 py-3.5 rounded-xl bg-tactical-amber text-black font-bold font-mono text-sm flex items-center gap-3 shadow-tactical-amber hover:bg-yellow-400 transition-all hover:scale-105"
            >
              <span>ENTER OPERATIONS FLIGHT DECK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
