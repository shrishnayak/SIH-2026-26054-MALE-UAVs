import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetry } from '../context/TelemetryContext';
import { UavEngineInternals } from './uav/UavEngineInternals';
import { UavAirframeAndGears } from './uav/UavAirframeAndGears';
import { HudHologramScene } from './uav/HudHologramScene';
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
  Gauge,
  Camera,
  Eye,
  Crosshair,
  Sliders,
  Radio,
  Sparkles,
  Plane
} from 'lucide-react';

// Combined Master 3D UAV Airframe + Mechanical Engine Cutaway
const MasterUav3DModel = ({ 
  isExploded, 
  selectedHotspot, 
  onSelectHotspot, 
  telemetry, 
  showHudRings,
  xrayMode 
}) => {
  const masterGroupRef = useRef();
  const propRef = useRef();

  return (
    <group ref={masterGroupRef} position={[0, 0, 0]}>
      {/* 1. Translucent Cyan Ghosted Airframe, Wings, Gears & Propeller */}
      <UavAirframeAndGears
        isExploded={isExploded}
        selectedHotspot={selectedHotspot}
        onSelectHotspot={onSelectHotspot}
        telemetry={telemetry}
        propRef={propRef}
      />

      {/* 2. Solid Gray Precision Internal Engine & Mechanical Assembly */}
      <UavEngineInternals
        isExploded={isExploded}
        selectedHotspot={selectedHotspot}
        onSelectHotspot={onSelectHotspot}
        telemetry={telemetry}
        xrayMode={xrayMode}
      />

      {/* 3. 3D Concentric Holographic Calibration Rings & Reticles */}
      <HudHologramScene
        showHudRings={showHudRings}
        activeFault={telemetry?.health?.activeFault || 'NONE'}
      />
    </group>
  );
};

export const UavBlueprintTab = () => {
  const { telemetry, injectFault, clearFault } = useTelemetry();
  const [isExploded, setIsExploded] = useState(false);
  const [showHudRings, setShowHudRings] = useState(true);
  const [xrayMode, setXrayMode] = useState('GHOST'); // 'GHOST' | 'WIREFRAME' | 'SOLID'
  const [cameraView, setCameraView] = useState('HERO_HEADON'); // 'HERO_HEADON' | 'FRONT_VIEW' | 'BACK_VIEW' | 'XRAY_CUTAWAY' | 'ENGINE_MACRO' | 'LANDING_GEAR' | 'TOP_CAD' | 'SIDE_ELEV'
  const [selectedHotspot, setSelectedHotspot] = useState('CYLINDER_3');
  const [fftData, setFftData] = useState(Array.from({ length: 24 }, () => Math.random() * 40 + 10));
  const controlsRef = useRef();

  // Dynamic live FFT vibration spectrum ticker for left HUD panel
  useEffect(() => {
    const interval = setInterval(() => {
      setFftData(prev => prev.map((val, i) => {
        const base = (telemetry.engine.rpm / 5000) * 35;
        const noise = (Math.sin(Date.now() * 0.005 + i) + 1) * 15;
        const faultSpike = (telemetry.health.status === 'CRITICAL' && (i === 7 || i === 14)) ? 45 : 0;
        return Math.min(95, Math.max(8, base + noise + faultSpike));
      }));
    }, 120);
    return () => clearInterval(interval);
  }, [telemetry.engine.rpm, telemetry.health.status]);

  // Camera Presets handler (Default matches image_1.png dynamic low-angle head-on perspective)
  const handleResetCamera = (viewType) => {
    setCameraView(viewType);
    if (!controlsRef.current) return;

    if (viewType === 'HERO_HEADON') {
      // Direct match to image_1.png: low-angle head-on looking up at the front propeller & engine bay
      controlsRef.current.object.position.set(0.15, -4.6, 0.45);
      controlsRef.current.target.set(0, -0.6, -0.1);
    } else if (viewType === 'FRONT_VIEW') {
      controlsRef.current.object.position.set(0, -9, 0.15);
      controlsRef.current.target.set(0, 0, 0);
    } else if (viewType === 'BACK_VIEW') {
      controlsRef.current.object.position.set(0, 9, 0.15);
      controlsRef.current.target.set(0, 0, 0);
    } else if (viewType === 'XRAY_CUTAWAY') {
      controlsRef.current.object.position.set(1.4, -3.2, 1.6);
      controlsRef.current.target.set(0, 0.2, 0.1);
    } else if (viewType === 'ENGINE_MACRO') {
      controlsRef.current.object.position.set(0.1, -1.8, 1.3);
      controlsRef.current.target.set(0, 0.4, 0.1);
    } else if (viewType === 'LANDING_GEAR') {
      controlsRef.current.object.position.set(0.1, -3.8, -0.7);
      controlsRef.current.target.set(0, -2.1, -0.6);
    } else if (viewType === 'TOP_CAD') {
      controlsRef.current.object.position.set(0, 0.1, 9.2);
      controlsRef.current.target.set(0, 0, 0);
    } else if (viewType === 'SIDE_ELEV') {
      controlsRef.current.object.position.set(9.0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  };

  // Hotspot Knowledge Base & Live Metrics
  const hotspotData = {
    ENGINE_BLOCK: {
      name: 'Rotax 915 iS Engine Block (4-Cylinder Boxer)',
      subsystem: 'Powertrain Core & Crankcase',
      spec: '1,414 cc, 4-stroke boxer, liquid/air cooled, dual FADEC ECU, 141 HP Max Continuous',
      telemetryKey: `RPM: ${telemetry.engine.rpm} | Throttle: ${telemetry.engine.throttlePct}% | MAP: ${telemetry.engine.mapBar} bar`,
      residual: `Vibration: ${telemetry.engine.vibrationGrms} g-RMS (Δ ${telemetry.residuals.vibrationResidual > 0 ? '+' : ''}${telemetry.residuals.vibrationResidual})`,
      status: telemetry.health.status,
      desc: 'Central boxer crankcase. Senses structural torsional vibrations and load factors. Dual spark ignition and redundant CAN A/B bus channels.'
    },
    CYLINDER_1: {
      name: 'Cylinder 1 Combustion Chamber (Left Forward)',
      subsystem: 'Combustion Chamber & Piston',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder Sleeve',
      telemetryKey: `EGT: ${telemetry.engine.egt[0]}°C | CHT: ${telemetry.engine.cht[0]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[0] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[0]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[0] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[0]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[0]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Left-forward combustion chamber. Monitored for stoichiometric combustion balance and cylinder head heat transfer.'
    },
    CYLINDER_2: {
      name: 'Cylinder 2 Combustion Chamber (Right Forward)',
      subsystem: 'Combustion Chamber & Piston',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder Sleeve',
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
      subsystem: 'Combustion Chamber & Piston',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder Sleeve',
      telemetryKey: `EGT: ${telemetry.engine.egt[3]}°C | CHT: ${telemetry.engine.cht[3]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[3] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[3]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[3] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[3]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[3]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Right-aft cylinder chamber. Monitored for balanced thermal symmetry and exhaust manifold backpressure.'
    },
    TURBOCHARGER: {
      name: 'Turbocharger & Electronic Wastegate Actuator',
      subsystem: 'Induction & Boost Turbine',
      spec: 'Variable boost ratio up to 1.85 bar absolute at 15,000 ft, Inconel turbine',
      telemetryKey: `MAP: ${telemetry.engine.mapBar} bar | Wastegate Duty: ${telemetry.engine.wastegateDutyPct}%`,
      residual: `MAP Residual: ${telemetry.residuals.mapResidual > 0 ? '+' : ''}${telemetry.residuals.mapResidual} bar`,
      status: telemetry.health.activeFault === 'TURBO_WASTEGATE_STUCK' ? 'CRITICAL' : 'NOMINAL',
      desc: 'Exhaust-driven turbocharger maintains sea-level manifold pressure up to critical flight ceiling. Regulated by digital wastegate servo.'
    },
    OIL_SYSTEM: {
      name: 'Lubrication System, Oil Sump & Radiator',
      subsystem: 'Lubrication & Thermal Management',
      spec: 'Dry sump lubrication, integrated mechanical oil pump, thermostatically controlled cooler',
      telemetryKey: `Oil Press: ${telemetry.engine.oilPressBar} bar | Oil Temp: ${telemetry.engine.oilTempC}°C`,
      residual: `Press Residual: ${telemetry.residuals.oilPressResidual} bar | Temp Residual: ${telemetry.residuals.oilTempResidual > 0 ? '+' : ''}${telemetry.residuals.oilTempResidual}°C`,
      status: telemetry.health.activeFault === 'OIL_PUMP_CAVITATION' || telemetry.engine.oilPressBar < 2.0 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Maintains hydrodynamic fluid wedge across connecting rod journals. Pressure collapse triggers bearing friction and catastrophic seizure.'
    },
    FUEL_SYSTEM: {
      name: 'Dual High-Pressure Fuel Rail & Injector Loom',
      subsystem: 'Fuel Injection Delivery',
      spec: 'Main & Aux High-Pressure Pumps, 3.0 bar regulated rail pressure, dual return lines',
      telemetryKey: `Fuel Flow: ${telemetry.engine.fuelFlowLph} L/h | Rail Pressure: ${telemetry.engine.fuelPressureBar} bar | Lambda: ${telemetry.engine.lambda}`,
      residual: 'Flow Residual: ±0.4 L/h (Nominal)',
      status: 'NOMINAL',
      desc: 'Dual electric fuel delivery system supplying filtered fuel to multi-point electronic fuel injection rails.'
    },
    AVIONICS_ECU: {
      name: 'Redundant Dual FADEC ECU & Flight Avionics Unit',
      subsystem: 'Command & Control Electronics',
      spec: 'Lane A/B Dual Redundant Microcontrollers, MIL-STD-178C Level A, Optocoupled CAN 2.0B',
      telemetryKey: `Lane A: ACTIVE | Lane B: STANDBY SYNC | CPU Load: 24% | Bus Errors: 0`,
      residual: 'Latency: 1.2 ms | Sync Drift: 0.00 μs',
      status: 'NOMINAL',
      desc: 'Fully autonomous dual-channel FADEC engine management unit. Executes ignition timing, closed-loop lambda control, and prognostics diagnostics.'
    }
  };

  const activeHotspot = hotspotData[selectedHotspot] || hotspotData.CYLINDER_3;

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-130px)] w-full">
      {/* =========================================================================
          LEFT HUD INTERFACE PANEL (Stylized Data Readouts & Graphs matching image_1.png)
         ========================================================================= */}
      <div className="w-full xl:w-96 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Panel Header */}
        <div className="hud-glass p-3 rounded-lg border border-hud-cyan/40 bg-slate-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-hud-cyan animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-hud-cyan glow-cyan">
                HUD DIAGNOSTICS // CAD X-RAY
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-hud-cyan/10 border border-hud-cyan/30 text-hud-cyan">
              MIL-SPEC 3D
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            UAV-01 DIGITAL TWIN STRUCTURAL & MECHANICAL TELEMETRY
          </div>
        </div>

        {/* Live Gauges & Subsystem Telemetry Card */}
        <div className="hud-glass p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-hud-cyan" />
              POWERTRAIN DYNAMICS
            </span>
            <span className="text-emerald-400 font-bold">{telemetry.engine.rpm} RPM</span>
          </div>

          {/* 4-Cylinder EGT Heat Balance Gradient Bars */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>CYLINDER EGT MATRIX (°C)</span>
              <span className="text-hud-cyan text-[10px]">Δ SPREAD: {(Math.max(...telemetry.engine.egt) - Math.min(...telemetry.engine.egt)).toFixed(2)}°C</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {telemetry.engine.egt.map((temp, idx) => {
                const isOverheat = temp > 900;
                const isSelected = selectedHotspot === `CYLINDER_${idx + 1}`;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedHotspot(`CYLINDER_${idx + 1}`)}
                    className={`p-1.5 rounded flex flex-col items-center border transition-all ${
                      isSelected 
                        ? 'border-hud-cyan bg-hud-cyan/20 shadow-hud-cyan' 
                        : isOverheat 
                          ? 'border-red-500/50 bg-red-950/30' 
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-400">CYL {idx + 1}</span>
                    <span className={`w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs font-mono font-bold ${isOverheat ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                      {temp.toFixed(1)}°
                    </span>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${isOverheat ? 'bg-red-500' : 'bg-hud-cyan'}`} 
                        style={{ width: `${Math.min(100, (temp / 1000) * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FFT Vibration Frequency Waveform (Stylized small graph from image_1.png) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-hud-cyan" />
                VIBRATION FFT HARMONICS
              </span>
              <span className="text-hud-cyan text-[10px]">{telemetry.engine.vibrationGrms} g-RMS</span>
            </div>
            <div className="h-14 bg-slate-950 border border-slate-800/80 rounded p-1.5 flex items-end justify-between gap-0.5">
              {fftData.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-full rounded-t transition-all duration-100 ${
                    val > 70 ? 'bg-red-600' : 'bg-sky-400'
                  }`}
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0 Hz</span>
              <span>1X (80Hz)</span>
              <span>2X (160Hz)</span>
              <span>HIGH (1kHz)</span>
            </div>
          </div>
        </div>

        {/* Selected Component Deep Dive Inspector */}
        <div className="hud-glass p-3 rounded-lg border border-hud-cyan/30 bg-slate-950/70 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-hud-cyan font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>INSPECTOR: {selectedHotspot}</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              activeHotspot.status === 'CRITICAL' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {activeHotspot.status}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-200">
            {activeHotspot.name}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            <span className="text-hud-cyan">SUBSYSTEM:</span> {activeHotspot.subsystem}
          </div>
          <div className="text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
            {activeHotspot.spec}
          </div>

          {/* Real-time Telemetry & Residual Delta */}
          <div className="bg-black/50 p-2 rounded border border-hud-cyan/20 flex flex-col gap-1 text-[11px] font-mono">
            <div className="text-slate-300">
              <span className="text-hud-cyan">METRICS:</span> {activeHotspot.telemetryKey}
            </div>
            <div className="text-amber-400">
              <span className="text-slate-400">RESIDUAL:</span> {activeHotspot.residual}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/80">
            {activeHotspot.desc}
          </div>

          {/* Quick Subsystem Selector Buttons */}
          <div className="mt-auto pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-500 mb-1.5 uppercase">Select Subsystem To Inspect:</div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              {[
                { id: 'CYLINDER_3', label: 'Cyl 3 Port' },
                { id: 'TURBOCHARGER', label: 'Turbo Unit' },
                { id: 'ENGINE_BLOCK', label: 'Crankcase' },
                { id: 'OIL_SYSTEM', label: 'Oil Sump' },
                { id: 'FUEL_SYSTEM', label: 'Fuel Rails' },
                { id: 'AVIONICS_ECU', label: 'ECU Avionics' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedHotspot(item.id)}
                  className={`px-1.5 py-1 rounded text-center truncate transition-colors ${
                    selectedHotspot === item.id 
                      ? 'bg-hud-cyan text-black font-bold shadow-hud-cyan' 
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-hud-cyan/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT / MAIN: MASTER 3D TECHNICAL BLUEPRINT CANVAS (Matching image_1.png)
         ========================================================================= */}
      <div className="flex-1 relative hud-glass rounded-lg overflow-hidden flex flex-col border border-hud-cyan/40 shadow-2xl">
        {/* Top Control HUD Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Left Title & Status */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <div className="px-3 py-1 bg-black/80 border border-hud-cyan/50 rounded-md text-xs font-mono text-hud-cyan flex items-center gap-2 shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse"></span>
              <span className="font-bold">MALE UAV 3D DIGITAL TWIN CAD X-RAY</span>
            </div>

            <button
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3 py-1 rounded-md text-xs font-mono border transition-all flex items-center gap-1.5 backdrop-blur-md ${
                isExploded
                  ? 'bg-hud-cyan text-black font-bold border-hud-cyan shadow-hud-cyan'
                  : 'bg-black/80 text-hud-cyan border-hud-cyan/40 hover:bg-hud-cyan/20'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {isExploded ? 'EXPLODED VIEW: ON' : 'EXPLODED VIEW: OFF'}
            </button>

            <button
              onClick={() => setShowHudRings(!showHudRings)}
              className={`px-3 py-1 rounded-md text-xs font-mono border transition-all flex items-center gap-1.5 backdrop-blur-md ${
                showHudRings
                  ? 'bg-hud-cyan/20 text-hud-cyan border-hud-cyan/60'
                  : 'bg-black/80 text-slate-400 border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              HUD RINGS: {showHudRings ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Camera Preset Toolbar (Defaulting to Hero Head-On matching image_1.png) */}
          <div className="flex items-center gap-1 bg-black/85 border border-slate-700/80 p-1 rounded-md pointer-events-auto backdrop-blur-md flex-wrap justify-end">
            <button
              onClick={() => handleResetCamera('HERO_HEADON')}
              title="Low-Angle Head-On Perspective (image_1.png)"
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1 transition-all ${
                cameraView === 'HERO_HEADON'
                  ? 'bg-hud-cyan text-black font-bold shadow-hud-cyan'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3 h-3" />
              HERO 3D (IMAGE_1)
            </button>
            <button
              onClick={() => handleResetCamera('FRONT_VIEW')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'FRONT_VIEW' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FRONT VIEW
            </button>
            <button
              onClick={() => handleResetCamera('BACK_VIEW')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'BACK_VIEW' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BACK VIEW
            </button>
            <button
              onClick={() => handleResetCamera('XRAY_CUTAWAY')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'XRAY_CUTAWAY' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              X-RAY ISO
            </button>
            <button
              onClick={() => handleResetCamera('ENGINE_MACRO')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'ENGINE_MACRO' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ENGINE BAY
            </button>
            <button
              onClick={() => handleResetCamera('LANDING_GEAR')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'LANDING_GEAR' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NOSE GEAR
            </button>
            <button
              onClick={() => handleResetCamera('TOP_CAD')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'TOP_CAD' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TOP CAD
            </button>
            <button
              onClick={() => handleResetCamera('SIDE_ELEV')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                cameraView === 'SIDE_ELEV' ? 'bg-hud-cyan/30 text-hud-cyan border border-hud-cyan/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SIDE ELEV
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas */}
        <div className="w-full h-full cursor-grab active:cursor-grabbing bg-[#020617] relative">
          <Canvas
            camera={{ 
              position: [0.15, -4.6, 0.45], 
              fov: 42,
              near: 0.1,
              far: 100
            }}
            gl={{ 
              antialias: true, 
              alpha: true,
              powerPreference: 'high-performance'
            }}
          >
            {/* Holographic Dark Navy Scene Background */}
            <color attach="background" args={['#020617']} />
            <fog attach="fog" args={['#020617', 12, 35]} />

            {/* Studio Technical Lighting Setup */}
            <ambientLight intensity={0.8} />
            {/* Cool Cyan Rim Light */}
            <directionalLight position={[-8, -8, 8]} intensity={1.2} color="#cbd5e1" />
            {/* Key Neutral White Light for Metallic Engine Parts */}
            <directionalLight position={[6, -6, 10]} intensity={1.5} color="#f8fafc" />
            {/* Soft Fill Light from Below/Aft */}
            <directionalLight position={[0, 8, 4]} intensity={0.45} color="#94a3b8" />
            
            {/* Localized Component Glow PointLight */}
            <pointLight 
              position={[0, 0.4, 0.5]} 
              intensity={2.2} 
              color={telemetry.health.status === 'CRITICAL' ? '#dc2626' : '#64748b'}
              distance={6}
            />

            {/* Front Propeller Ground Target PointLight */}
            <pointLight 
              position={[0, -2.8, -0.8]} 
              intensity={1.8} 
              color="#64748b" 
              distance={4}
            />

            {/* Float wrapper for subtle alive breathing motion */}
            <Float speed={1.0} rotationIntensity={0.06} floatIntensity={0.08}>
              <MasterUav3DModel
                isExploded={isExploded}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={setSelectedHotspot}
                telemetry={telemetry}
                showHudRings={showHudRings}
                xrayMode={xrayMode}
              />
            </Float>

            {/* Orbit Controls with Damping */}
            <OrbitControls
              ref={controlsRef}
              target={[0, -0.6, -0.1]}
              enableDamping={true}
              dampingFactor={0.05}
              maxDistance={25}
              minDistance={1.2}
              maxPolarAngle={Math.PI / 2 + 0.15} // Prevent going below floor grid
            />
          </Canvas>

          {/* Interactive Click Tip Overlay */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none text-[11px] font-mono text-slate-400 bg-black/70 px-3 py-1.5 rounded border border-slate-800 backdrop-blur-md flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-hud-cyan animate-spin" />
            <span>Click any 3D engine cylinder, turbo, or gear component to inspect telemetry in real-time</span>
          </div>

          {/* Bottom Right Coordinate Readout */}
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-[10px] font-mono text-hud-cyan bg-black/70 px-2.5 py-1 rounded border border-hud-cyan/30 backdrop-blur-md">
            FOV: 42° // PITCH: -14.2° // YAW: +0.4° // SCALE: 1:1 ISO
          </div>
        </div>
      </div>
    </div>
  );
};
