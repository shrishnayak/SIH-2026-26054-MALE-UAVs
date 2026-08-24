import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetry } from '../context/TelemetryContext';
import { 
  Layers, 
  Maximize2, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  Thermometer, 
  Zap, 
  Info, 
  Cpu, 
  ShieldAlert,
  ChevronRight,
  Gauge
} from 'lucide-react';

// Color Helper based on Sensor Residual Temperature / Stress
function getHotspotColor(residual, isFault, baseColor = '#00F0FF') {
  if (isFault) return '#EF4444'; // Red
  if (residual > 40) return '#EF4444'; // Critical Red
  if (residual > 15) return '#F59E0B'; // Amber Warning
  if (residual < -15) return '#0284C7'; // Blue Cold
  return baseColor; // Nominal Cyan/Green
}

// 3D Procedural MALE UAV Airframe Model (Predator / Reaper class layout)
const UavModel = ({ isExploded, selectedHotspot, onSelectHotspot, telemetry }) => {
  const groupRef = useRef();
  const propRef = useRef();

  const egtRes = telemetry.residuals.egtResiduals;
  const activeFault = telemetry.health.activeFault;

  // Animate pusher propeller
  useFrame((state, delta) => {
    if (propRef.current) {
      propRef.current.rotation.z += (telemetry.engine.rpm / 60) * delta * 2.0;
    }
  });

  const explodedOffset = isExploded ? 1.4 : 0.0;

  // Colors for Engine Hotspots
  const cyl1Color = getHotspotColor(egtRes[0], activeFault === 'COOLING_DEGRADATION', '#10B981');
  const cyl2Color = getHotspotColor(egtRes[1], activeFault === 'COOLING_DEGRADATION' || activeFault === 'BLOW_BY', '#10B981');
  const cyl3Color = getHotspotColor(egtRes[2], activeFault === 'CYL3_INJECTOR', '#10B981');
  const cyl4Color = getHotspotColor(egtRes[3], activeFault === 'COOLING_DEGRADATION', '#10B981');
  const turboColor = getHotspotColor(0, activeFault === 'TURBO_WASTEGATE_STUCK', '#00F0FF');
  const oilColor = getHotspotColor(telemetry.residuals.oilTempResidual, activeFault === 'OIL_PUMP_CAVITATION' || activeFault === 'BLOW_BY', '#00F0FF');

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. Slender Fuselage Mesh */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.28, 6.2, 24]} />
        <meshStandardMaterial
          color="#0d1f38"
          roughness={0.4}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe Outline Overlay for Fuselage */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.505, 0.285, 6.22, 16]} />
        <meshBasicMaterial color="#00F0FF" wireframe opacity={0.18} transparent />
      </mesh>

      {/* Nose Radome */}
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.49, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#081426" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* 2. High Aspect Ratio Wings (Left & Right) */}
      <group position={[0, 0.6, 0]}>
        {/* Left Main Wing */}
        <mesh position={[-4.2 - explodedOffset * 0.8, 0, 0]} rotation={[0, 0, 0.03]}>
          <boxGeometry args={[7.8, 0.08, 0.95]} />
          <meshStandardMaterial color="#0b1d36" metalness={0.85} roughness={0.35} />
        </mesh>
        <mesh position={[-4.2 - explodedOffset * 0.8, 0, 0]} rotation={[0, 0, 0.03]}>
          <boxGeometry args={[7.82, 0.082, 0.96]} />
          <meshBasicMaterial color="#00F0FF" wireframe opacity={0.15} transparent />
        </mesh>

        {/* Right Main Wing */}
        <mesh position={[4.2 + explodedOffset * 0.8, 0, 0]} rotation={[0, 0, -0.03]}>
          <boxGeometry args={[7.8, 0.08, 0.95]} />
          <meshStandardMaterial color="#0b1d36" metalness={0.85} roughness={0.35} />
        </mesh>
        <mesh position={[4.2 + explodedOffset * 0.8, 0, 0]} rotation={[0, 0, -0.03]}>
          <boxGeometry args={[7.82, 0.082, 0.96]} />
          <meshBasicMaterial color="#00F0FF" wireframe opacity={0.15} transparent />
        </mesh>
      </group>

      {/* 3. Inverted V-Tail Empennage */}
      <group position={[0, -2.9, 0]}>
        {/* Left V-Stab */}
        <mesh position={[-0.85 - explodedOffset * 0.4, -0.2, 0.5]} rotation={[0.45, 0, -0.55]}>
          <boxGeometry args={[0.06, 1.8, 0.65]} />
          <meshStandardMaterial color="#0a1a30" metalness={0.8} />
        </mesh>
        {/* Right V-Stab */}
        <mesh position={[0.85 + explodedOffset * 0.4, -0.2, 0.5]} rotation={[0.45, 0, 0.55]}>
          <boxGeometry args={[0.06, 1.8, 0.65]} />
          <meshStandardMaterial color="#0a1a30" metalness={0.8} />
        </mesh>
      </group>

      {/* 4. Rear Engine Bay Cowling & Rotax 915 iS Engine Core */}
      <group position={[0, -1.8 - explodedOffset * 0.6, 0.15 + explodedOffset * 0.5]}>
        {/* Engine Bay Outer Casing (Semi-Transparent in Exploded View) */}
        <mesh
          position={[0, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot('ENGINE_BLOCK'); }}
        >
          <boxGeometry args={[0.9, 1.4, 0.8]} />
          <meshStandardMaterial
            color={selectedHotspot === 'ENGINE_BLOCK' ? '#00F0FF' : '#1e3a5f'}
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={isExploded ? 0.35 : 0.9}
            wireframe={isExploded}
          />
        </mesh>

        {/* Rotax 915 Boxer Crankcase Block */}
        <mesh
          position={[0, -0.1, 0]}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot('ENGINE_BLOCK'); }}
        >
          <boxGeometry args={[0.65, 0.85, 0.55]} />
          <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.2} />
        </mesh>

        {/* Cylinder 1 (Left Forward) */}
        <group position={[-0.45 - explodedOffset * 0.4, 0.18, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_1'); }}>
            <cylinderGeometry args={[0.14, 0.14, 0.38, 16]} />
            <meshStandardMaterial color={cyl1Color} emissive={cyl1Color} emissiveIntensity={0.35} />
          </mesh>
        </group>

        {/* Cylinder 2 (Right Forward) */}
        <group position={[0.45 + explodedOffset * 0.4, 0.18, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_2'); }}>
            <cylinderGeometry args={[0.14, 0.14, 0.38, 16]} />
            <meshStandardMaterial color={cyl2Color} emissive={cyl2Color} emissiveIntensity={0.35} />
          </mesh>
        </group>

        {/* Cylinder 3 (Left Aft) - Highlights with RED if Fault Active */}
        <group position={[-0.45 - explodedOffset * 0.4, -0.22, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_3'); }}>
            <cylinderGeometry args={[0.14, 0.14, 0.38, 16]} />
            <meshStandardMaterial
              color={cyl3Color}
              emissive={cyl3Color}
              emissiveIntensity={activeFault === 'CYL3_INJECTOR' ? 0.8 : 0.35}
            />
          </mesh>
        </group>

        {/* Cylinder 4 (Right Aft) */}
        <group position={[0.45 + explodedOffset * 0.4, -0.22, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('CYLINDER_4'); }}>
            <cylinderGeometry args={[0.14, 0.14, 0.38, 16]} />
            <meshStandardMaterial color={cyl4Color} emissive={cyl4Color} emissiveIntensity={0.35} />
          </mesh>
        </group>

        {/* Turbocharger & Wastegate Unit */}
        <group position={[0, -0.6 - explodedOffset * 0.5, 0.3 + explodedOffset * 0.4]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('TURBOCHARGER'); }}>
            <torusGeometry args={[0.16, 0.07, 16, 24]} />
            <meshStandardMaterial
              color={turboColor}
              emissive={turboColor}
              emissiveIntensity={activeFault === 'TURBO_WASTEGATE_STUCK' ? 0.8 : 0.3}
            />
          </mesh>
        </group>

        {/* Oil Radiator & Filter Housing */}
        <group position={[0, 0.5 + explodedOffset * 0.4, -0.3 - explodedOffset * 0.3]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('OIL_SYSTEM'); }}>
            <boxGeometry args={[0.42, 0.22, 0.16]} />
            <meshStandardMaterial
              color={oilColor}
              emissive={oilColor}
              emissiveIntensity={activeFault === 'OIL_PUMP_CAVITATION' ? 0.8 : 0.3}
            />
          </mesh>
        </group>

        {/* Dual Fuel Pumps Unit */}
        <group position={[0.25 + explodedOffset * 0.3, 0.4, 0.25]}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectHotspot('FUEL_SYSTEM'); }}>
            <cylinderGeometry args={[0.06, 0.06, 0.25, 12]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </group>

      {/* 5. Rear Pusher 3-Blade Propeller */}
      <group position={[0, -3.2, 0]} ref={propRef}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.2, 16]} />
          <meshStandardMaterial color="#111827" metalness={0.9} />
        </mesh>
        {/* Prop Blade 1 */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.07, 1.4, 0.02]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Prop Blade 2 */}
        <mesh position={[-0.65, -0.38, 0]} rotation={[0, 0, (2 * Math.PI) / 3]}>
          <boxGeometry args={[0.07, 1.4, 0.02]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Prop Blade 3 */}
        <mesh position={[0.65, -0.38, 0]} rotation={[0, 0, -(2 * Math.PI) / 3]}>
          <boxGeometry args={[0.07, 1.4, 0.02]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// Tactical CAD Grid Floor & Axis Lines
const CadGrid = () => {
  return (
    <group position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[24, 48, '#00F0FF', '#0F2744']} rotation={[Math.PI / 2, 0, 0]} />
      {/* Concentric Calibration Rings */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[3.8, 3.84, 64]} />
        <meshBasicMaterial color="#00F0FF" opacity={0.2} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[7.8, 7.84, 64]} />
        <meshBasicMaterial color="#00F0FF" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const UavBlueprintTab = () => {
  const { telemetry, injectFault, clearFault } = useTelemetry();
  const [isExploded, setIsExploded] = useState(false);
  const [cameraView, setCameraView] = useState('ISOMETRIC'); // 'ISOMETRIC' | 'TOP_DOWN' | 'ELEVATION' | 'ENGINE_ZOOM'
  const [selectedHotspot, setSelectedHotspot] = useState('CYLINDER_3');
  const controlsRef = useRef();

  const handleResetCamera = (viewType) => {
    setCameraView(viewType);
    if (!controlsRef.current) return;

    if (viewType === 'ISOMETRIC') {
      controlsRef.current.object.position.set(0, -6, 7);
      controlsRef.current.target.set(0, 0, 0);
    } else if (viewType === 'TOP_DOWN') {
      controlsRef.current.object.position.set(0, 0.1, 10);
      controlsRef.current.target.set(0, 0, 0);
    } else if (viewType === 'ELEVATION') {
      controlsRef.current.object.position.set(10, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
    } else if (viewType === 'ENGINE_ZOOM') {
      controlsRef.current.object.position.set(0, -3.5, 2.5);
      controlsRef.current.target.set(0, -1.8, 0);
    }
    controlsRef.current.update();
  };

  // Hotspot Knowledge Base & Live Metrics
  const hotspotData = {
    ENGINE_BLOCK: {
      name: 'Rotax 915 iS Engine Block (4-Cylinder Boxer)',
      subsystem: 'Powertrain Core',
      spec: '1,414 cc, 4-stroke turbocharged, liquid/air cooled, dual FADEC ECU',
      telemetryKey: `RPM: ${telemetry.engine.rpm} | Throttle: ${telemetry.engine.throttlePct}% | MAP: ${telemetry.engine.mapBar} bar`,
      residual: `Vibration: ${telemetry.engine.vibrationGrms} g-RMS (Δ ${telemetry.residuals.vibrationResidual > 0 ? '+' : ''}${telemetry.residuals.vibrationResidual})`,
      status: telemetry.health.status,
      desc: 'Central boxer crankcase. Senses structural torsional vibrations and load factors. Dual spark ignition and redundant CAN A/B bus channels.'
    },
    CYLINDER_1: {
      name: 'Cylinder 1 Combustion Chamber (Left Forward)',
      subsystem: 'Combustion Chamber',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder',
      telemetryKey: `EGT: ${telemetry.engine.egt[0]}°C | CHT: ${telemetry.engine.cht[0]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[0] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[0]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[0] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[0]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[0]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Left-forward combustion chamber. Monitored for stoichiometric combustion balance and cylinder head heat transfer.'
    },
    CYLINDER_2: {
      name: 'Cylinder 2 Combustion Chamber (Right Forward)',
      subsystem: 'Combustion Chamber',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder',
      telemetryKey: `EGT: ${telemetry.engine.egt[1]}°C | CHT: ${telemetry.engine.cht[1]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[1] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[1]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[1] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[1]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[1]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Right-forward cylinder chamber. High correlation with oil heat load in blow-by failure scenarios.'
    },
    CYLINDER_3: {
      name: 'Cylinder 3 Combustion Chamber (Left Aft - Active Monitoring)',
      subsystem: 'Combustion & Injection Port',
      spec: 'High-pressure Port Fuel Injector 3 (PFI-3), Dual Spark Plugs',
      telemetryKey: `EGT: ${telemetry.engine.egt[2]}°C | CHT: ${telemetry.engine.cht[2]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[2] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[2]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[2] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[2]}°C`,
      status: telemetry.health.activeFault === 'CYL3_INJECTOR' || telemetry.engine.egt[2] > 920 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Left-rear cylinder port. Shows severe lean-burn thermal excursions (>960°C) when injector orifice is restricted or fuel vaporization is uneven.'
    },
    CYLINDER_4: {
      name: 'Cylinder 4 Combustion Chamber (Right Aft)',
      subsystem: 'Combustion Chamber',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder',
      telemetryKey: `EGT: ${telemetry.engine.egt[3]}°C | CHT: ${telemetry.engine.cht[3]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[3] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[3]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[3] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[3]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[3]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Right-aft cylinder chamber. Monitored for balanced thermal symmetry and exhaust manifold backpressure.'
    },
    TURBOCHARGER: {
      name: 'Turbocharger & Electronic Wastegate Actuator',
      subsystem: 'Induction & Boost',
      spec: 'Variable boost ratio up to 1.85 bar absolute at 15,000 ft',
      telemetryKey: `MAP: ${telemetry.engine.mapBar} bar | Wastegate Duty: ${telemetry.engine.wastegateDutyPct}%`,
      residual: `MAP Residual: ${telemetry.residuals.mapResidual > 0 ? '+' : ''}${telemetry.residuals.mapResidual} bar`,
      status: telemetry.health.activeFault === 'TURBO_WASTEGATE_STUCK' ? 'CRITICAL' : 'NOMINAL',
      desc: 'Exhaust-driven turbocharger maintains sea-level manifold pressure up to critical flight ceiling. Regulated by digital wastegate servo.'
    },
    OIL_SYSTEM: {
      name: 'Lubrication System & Oil Cooler',
      subsystem: 'Lubrication & Radiator',
      spec: 'Dry sump lubrication, integrated mechanical oil pump, thermostatically controlled cooler',
      telemetryKey: `Oil Press: ${telemetry.engine.oilPressBar} bar | Oil Temp: ${telemetry.engine.oilTempC}°C`,
      residual: `Press Residual: ${telemetry.residuals.oilPressResidual} bar | Temp Residual: ${telemetry.residuals.oilTempResidual > 0 ? '+' : ''}${telemetry.residuals.oilTempResidual}°C`,
      status: telemetry.health.activeFault === 'OIL_PUMP_CAVITATION' || telemetry.engine.oilPressBar < 2.0 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Maintains hydrodynamic fluid wedge across connecting rod journals. Pressure collapse triggers bearing friction and catastrophic seizure.'
    },
    FUEL_SYSTEM: {
      name: 'Redundant Dual Electric Fuel Pumps',
      subsystem: 'Fuel Delivery',
      spec: 'Main & Aux High-Pressure Pumps, 3.0 bar regulated rail pressure',
      telemetryKey: `Fuel Flow: ${telemetry.engine.fuelFlowLph} L/h | Rail Pressure: ${telemetry.engine.fuelPressureBar} bar | Lambda: ${telemetry.engine.lambda}`,
      residual: 'Flow Residual: ±0.4 L/h (Nominal)',
      status: 'NOMINAL',
      desc: 'Dual electric fuel delivery system supplying filtered Avgas 100LL / Mogas 95 to multi-point electronic fuel injection rails.'
    }
  };

  const activeHotspot = hotspotData[selectedHotspot] || hotspotData.CYLINDER_3;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] w-full">
      {/* Left / Main: 3D CAD Blueprint Canvas */}
      <div className="flex-1 relative hud-glass rounded-lg overflow-hidden flex flex-col">
        {/* HUD Overlay Bar atop 3D Canvas */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 bg-black/70 border border-hud-cyan/40 rounded text-xs font-mono text-hud-cyan flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse"></span>
            <span>UAV-01 3D DIGITAL TWIN CAD WORKSPACE</span>
          </div>

          <div className="px-3 py-1 bg-black/70 border border-slate-700 rounded text-xs font-mono text-slate-300">
            ENGINE: ROTAX 915 iS (S/N: RTX-915-0842)
          </div>

          <button
            onClick={() => setIsExploded(!isExploded)}
            className={`px-3 py-1 rounded text-xs font-mono border transition-all flex items-center gap-1.5 ${
              isExploded
                ? 'bg-hud-cyan text-black font-bold border-hud-cyan shadow-hud-cyan'
                : 'bg-black/70 text-hud-cyan border-hud-cyan/40 hover:bg-hud-cyan/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {isExploded ? 'EXPLODED VIEW: ON' : 'EXPLODED VIEW: OFF'}
          </button>
        </div>

        {/* Camera Preset Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/80 border border-slate-700/80 p-1 rounded-md">
          <button
            onClick={() => handleResetCamera('ISOMETRIC')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              cameraView === 'ISOMETRIC' ? 'bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ISO 3D
          </button>
          <button
            onClick={() => handleResetCamera('TOP_DOWN')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              cameraView === 'TOP_DOWN' ? 'bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            TOP CAD
          </button>
          <button
            onClick={() => handleResetCamera('ELEVATION')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              cameraView === 'ELEVATION' ? 'bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SIDE ELEV
          </button>
          <button
            onClick={() => handleResetCamera('ENGINE_ZOOM')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              cameraView === 'ENGINE_ZOOM' ? 'bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ENGINE BAY
          </button>
        </div>

        {/* 3D R3F Canvas */}
        <div className="w-full h-full cursor-grab active:cursor-grabbing">
          <Canvas
            camera={{ position: [0, -6, 7], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <color attach="background" args={['#030712']} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 10, 10]} intensity={1.2} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00F0FF" />
            <pointLight position={[0, -2, 2]} intensity={1.5} color={telemetry.health.status === 'CRITICAL' ? '#EF4444' : '#00F0FF'} />

            <CadGrid />

            <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
              <UavModel
                isExploded={isExploded}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={setSelectedHotspot}
                telemetry={telemetry}
              />
            </Float>

            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.08}
              minDistance={2}
              maxDistance={22}
            />
          </Canvas>
        </div>

        {/* Hotspot Quick Click Bar at Bottom of 3D Canvas */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-center gap-2 bg-black/85 border border-hud-cyan/30 p-2 rounded-lg backdrop-blur-md">
          <span className="text-xs font-mono text-hud-cyan flex items-center gap-1 mr-2">
            <Zap className="w-3.5 h-3.5" /> SELECT SUBSYSTEM:
          </span>
          {[
            { id: 'CYLINDER_1', label: 'CYL 1' },
            { id: 'CYLINDER_2', label: 'CYL 2' },
            { id: 'CYLINDER_3', label: 'CYL 3 (FAULT SENSOR)' },
            { id: 'CYLINDER_4', label: 'CYL 4' },
            { id: 'TURBOCHARGER', label: 'TURBO/WASTEGATE' },
            { id: 'OIL_SYSTEM', label: 'OIL RADIATOR/PUMP' },
            { id: 'FUEL_SYSTEM', label: 'FUEL PUMPS' },
            { id: 'ENGINE_BLOCK', label: 'CRANKCASE BLOCK' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedHotspot(item.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                selectedHotspot === item.id
                  ? 'bg-hud-cyan text-black font-bold border-hud-cyan shadow-hud-cyan'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-hud-cyan/60 hover:text-hud-cyan'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Drawer: Component Hotspot Telemetry & Thermal Diagnostics */}
      <div className="w-full lg:w-96 hud-glass rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-hud-cyan" />
            <h3 className="font-display font-bold text-sm tracking-wider text-hud-cyan">
              HOTSPOT INSPECTOR
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
            activeHotspot.status === 'CRITICAL'
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
          }`}>
            {activeHotspot.status}
          </span>
        </div>

        {/* Selected Component Header */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded p-3">
          <div className="text-xs font-mono text-slate-400">{activeHotspot.subsystem}</div>
          <div className="text-base font-bold text-white mt-0.5">{activeHotspot.name}</div>
          <div className="text-xs font-mono text-hud-cyan mt-1">{activeHotspot.spec}</div>
        </div>

        {/* Live Sensor Metrics Box */}
        <div className="bg-black/60 border border-hud-cyan/30 rounded p-3 flex flex-col gap-2">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-hud-cyan" /> REAL-TIME SENSOR TELEMETRY
          </div>
          <div className="font-mono text-sm text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
            {activeHotspot.telemetryKey}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-hud-amber" /> FIRST-PRINCIPLES PHYSICS RESIDUAL
          </div>
          <div className="font-mono text-xs text-hud-amber bg-slate-950 p-2 rounded border border-slate-800">
            {activeHotspot.residual}
          </div>
        </div>

        {/* Component Physics & Description */}
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 text-xs leading-relaxed text-slate-300">
          <div className="font-bold text-hud-cyan mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> SUBSYSTEM DIAGNOSTICS & FAILURE MODES
          </div>
          {activeHotspot.desc}
        </div>

        {/* Quick Fault Injection Test for this Component */}
        <div className="mt-auto pt-3 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-2">QUICK TEST INJECTION:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => injectFault('CYL3_INJECTOR', 0.85)}
              className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 rounded text-xs font-mono text-red-300 transition-colors"
            >
              Inject Cyl 3 Clog
            </button>
            <button
              onClick={() => injectFault('OIL_PUMP_CAVITATION', 0.85)}
              className="px-2 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded text-xs font-mono text-amber-300 transition-colors"
            >
              Inject Oil Cavitation
            </button>
            <button
              onClick={() => injectFault('BLOW_BY', 0.85)}
              className="px-2 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded text-xs font-mono text-purple-300 transition-colors"
            >
              Inject Blow-By
            </button>
            <button
              onClick={() => clearFault()}
              className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded text-xs font-mono text-emerald-300 transition-colors"
            >
              Clear Faults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
