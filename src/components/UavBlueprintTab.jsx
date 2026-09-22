import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetry } from '../context/TelemetryContext';
import { UavEngineInternals } from './uav/UavEngineInternals';
import { UavAirframeAndGears } from './uav/UavAirframeAndGears';
import { HudHologramScene } from './uav/HudHologramScene';
import { CadViewportGizmo } from './uav/CadViewportGizmo';
import { tacticalAudio } from '../utils/tacticalAudio';
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
  Plane,
  Ruler,
  Compass,
  Palette,
  Volume2
} from 'lucide-react';

// Master 3D UAV Airframe + Mechanical Engine Cutaway
const MasterUav3DModel = ({ 
  isExploded, 
  explosionFactor,
  selectedHotspot, 
  onSelectHotspot, 
  telemetry, 
  showHudRings,
  xrayMode,
  isolatedPart
}) => {
  const masterGroupRef = useRef();
  const propRef = useRef();

  return (
    <group ref={masterGroupRef} position={[0, 0, 0]}>
      {/* 1. Translucent Stealth Carbon Airframe, Wings, Gears & Propeller */}
      <UavAirframeAndGears
        isExploded={isExploded}
        explosionFactor={explosionFactor}
        selectedHotspot={selectedHotspot}
        onSelectHotspot={onSelectHotspot}
        telemetry={telemetry}
        propRef={propRef}
        xrayMode={xrayMode}
        isolatedPart={isolatedPart}
      />

      {/* 2. Solid High-Precision Internal Engine & Mechanical Assembly */}
      <UavEngineInternals
        isExploded={isExploded}
        explosionFactor={explosionFactor}
        selectedHotspot={selectedHotspot}
        onSelectHotspot={onSelectHotspot}
        telemetry={telemetry}
        xrayMode={xrayMode}
        isolatedPart={isolatedPart}
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
  const [explosionFactor, setExplosionFactor] = useState(0.0);
  const [showHudRings, setShowHudRings] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [xrayMode, setXrayMode] = useState('STEALTH_CARBON'); // 'STEALTH_CARBON' | 'CAD_BLUEPRINT' | 'FLIR_THERMAL' | 'METALLIC_ALLOY' | 'WIREFRAME_XRAY'
  const [isolatedPart, setIsolatedPart] = useState('ALL'); // 'ALL' | 'ENGINE_BLOCK' | 'CYLINDERS' | 'TURBOCHARGER' | 'FUEL_SYSTEM' | 'OIL_SYSTEM' | 'AVIONICS_ECU' | 'AIRFRAME'
  const [cameraView, setCameraView] = useState('HERO_HEADON');
  const [selectedHotspot, setSelectedHotspot] = useState('CYLINDER_3');
  const [fftData, setFftData] = useState(Array.from({ length: 24 }, () => Math.random() * 40 + 10));
  const controlsRef = useRef();

  // Dynamic live FFT vibration spectrum ticker
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

  // Camera Presets handler
  const handleResetCamera = (viewType) => {
    tacticalAudio.playChirp();
    setCameraView(viewType);
    if (!controlsRef.current) return;

    if (viewType === 'HERO_HEADON') {
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
      tolerances: 'Bore: 84.00mm ±0.01 | Stroke: 61.00mm | Compression: 10.4:1',
      telemetryKey: `RPM: ${telemetry.engine.rpm} | Throttle: ${telemetry.engine.throttlePct}% | MAP: ${telemetry.engine.mapBar} bar`,
      residual: `Vibration: ${telemetry.engine.vibrationGrms} g-RMS (Δ ${telemetry.residuals.vibrationResidual > 0 ? '+' : ''}${telemetry.residuals.vibrationResidual})`,
      status: telemetry.health.status,
      desc: 'Central boxer crankcase. Senses structural torsional vibrations and load factors. Dual spark ignition and redundant CAN A/B bus channels.'
    },
    CYLINDER_1: {
      name: 'Cylinder 1 Combustion Chamber (Left Forward)',
      subsystem: 'Combustion Chamber & Piston',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder Sleeve',
      tolerances: 'Piston-to-Wall Clearance: 0.038mm | Ring Gap: 0.25mm',
      telemetryKey: `EGT: ${telemetry.engine.egt[0]}°C | CHT: ${telemetry.engine.cht[0]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[0] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[0]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[0] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[0]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[0]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Left-forward combustion chamber. Monitored for stoichiometric combustion balance and cylinder head heat transfer.'
    },
    CYLINDER_2: {
      name: 'Cylinder 2 Combustion Chamber (Right Forward)',
      subsystem: 'Combustion Chamber & Piston',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder Sleeve',
      tolerances: 'Piston-to-Wall Clearance: 0.038mm | Ring Gap: 0.25mm',
      telemetryKey: `EGT: ${telemetry.engine.egt[1]}°C | CHT: ${telemetry.engine.cht[1]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[1] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[1]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[1] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[1]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[1]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Right-forward cylinder chamber. High correlation with oil heat load in blow-by failure scenarios.'
    },
    CYLINDER_3: {
      name: 'Cylinder 3 Combustion Chamber (Left Aft - Active Diagnostic Focus)',
      subsystem: 'Combustion & Injection Port',
      spec: 'High-pressure Port Fuel Injector 3 (PFI-3), Dual Spark Plugs',
      tolerances: 'Injector Nozzle Orifice: 0.18mm | Spray Angle: 22° Cone',
      telemetryKey: `EGT: ${telemetry.engine.egt[2]}°C | CHT: ${telemetry.engine.cht[2]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[2] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[2]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[2] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[2]}°C`,
      status: telemetry.health.activeFault === 'CYL3_INJECTOR' || telemetry.engine.egt[2] > 920 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Left-rear cylinder port. Shows severe lean-burn thermal excursions (>960°C) when injector orifice is restricted or fuel vaporization is uneven.'
    },
    CYLINDER_4: {
      name: 'Cylinder 4 Combustion Chamber (Right Aft)',
      subsystem: 'Combustion Chamber & Piston',
      spec: 'Bore 84mm, Stroke 61mm, NiCaSil Plated Cylinder Sleeve',
      tolerances: 'Piston-to-Wall Clearance: 0.038mm | Ring Gap: 0.25mm',
      telemetryKey: `EGT: ${telemetry.engine.egt[3]}°C | CHT: ${telemetry.engine.cht[3]}°C`,
      residual: `EGT Residual: ${telemetry.residuals.egtResiduals[3] > 0 ? '+' : ''}${telemetry.residuals.egtResiduals[3]}°C | CHT Residual: ${telemetry.residuals.chtResiduals[3] > 0 ? '+' : ''}${telemetry.residuals.chtResiduals[3]}°C`,
      status: Math.abs(telemetry.residuals.egtResiduals[3]) > 40 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Right-aft cylinder chamber. Monitored for balanced thermal symmetry and exhaust manifold backpressure.'
    },
    TURBOCHARGER: {
      name: 'Turbocharger & Electronic Wastegate Actuator',
      subsystem: 'Induction & Boost Turbine',
      spec: 'Variable boost ratio up to 1.85 bar absolute at 15,000 ft, Inconel turbine',
      tolerances: 'Turbine Rotor Radial Play: 0.042mm | Wastegate Stroke: 12.0mm',
      telemetryKey: `MAP: ${telemetry.engine.mapBar} bar | Wastegate Duty: ${telemetry.engine.wastegateDutyPct}%`,
      residual: `MAP Residual: ${telemetry.residuals.mapResidual > 0 ? '+' : ''}${telemetry.residuals.mapResidual} bar`,
      status: telemetry.health.activeFault === 'TURBO_WASTEGATE_STUCK' ? 'CRITICAL' : 'NOMINAL',
      desc: 'Exhaust-driven turbocharger maintains sea-level manifold pressure up to critical flight ceiling. Regulated by digital wastegate servo.'
    },
    OIL_SYSTEM: {
      name: 'Lubrication System, Oil Sump & Radiator',
      subsystem: 'Lubrication & Thermal Management',
      spec: 'Dry sump lubrication, integrated mechanical oil pump, thermostatically controlled cooler',
      tolerances: 'Pump Rotor Clearance: 0.05mm | Pressure Relief: 5.0 bar',
      telemetryKey: `Oil Press: ${telemetry.engine.oilPressBar} bar | Oil Temp: ${telemetry.engine.oilTempC}°C`,
      residual: `Press Residual: ${telemetry.residuals.oilPressResidual} bar | Temp Residual: ${telemetry.residuals.oilTempResidual > 0 ? '+' : ''}${telemetry.residuals.oilTempResidual}°C`,
      status: telemetry.health.activeFault === 'OIL_PUMP_CAVITATION' || telemetry.engine.oilPressBar < 2.0 ? 'CRITICAL' : 'NOMINAL',
      desc: 'Maintains hydrodynamic fluid wedge across connecting rod journals. Pressure collapse triggers bearing friction and catastrophic seizure.'
    },
    FUEL_SYSTEM: {
      name: 'Dual High-Pressure Fuel Rail & Injector Loom',
      subsystem: 'Fuel Injection Delivery',
      spec: 'Main & Aux High-Pressure Pumps, 3.0 bar regulated rail pressure, dual return lines',
      tolerances: 'Regulator Setpoint: 3.00 bar ±0.05 | Filter: 10 Micron Micro-glass',
      telemetryKey: `Fuel Flow: ${telemetry.engine.fuelFlowLph} L/h | Rail Pressure: ${telemetry.engine.fuelPressureBar} bar | Lambda: ${telemetry.engine.lambda}`,
      residual: 'Flow Residual: ±0.4 L/h (Nominal)',
      status: 'NOMINAL',
      desc: 'Dual electric fuel delivery system supplying filtered fuel to multi-point electronic fuel injection rails.'
    },
    AVIONICS_ECU: {
      name: 'Redundant Dual FADEC ECU & Flight Avionics Unit',
      subsystem: 'Command & Control Electronics',
      spec: 'Lane A/B Dual Redundant Microcontrollers, MIL-STD-178C Level A, Optocoupled CAN 2.0B',
      tolerances: 'Clock Drift: < 0.05 ppm | Sensor Sampling: 1000 Hz Internal',
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
          LEFT HUD INTERFACE PANEL (Data Readouts, Gauges, FFT, Deep-Dive Inspector)
         ========================================================================= */}
      <div className="w-full xl:w-96 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Panel Header */}
        <div className="hud-glass p-3 rounded-xl border border-tactical-amber/30 bg-carbon-900/90 shadow-hud-glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-tactical-amber animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-tactical-amber">
                BLENDER CAD STUDIO // X-RAY
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tactical-amber/10 border border-tactical-amber/30 text-tactical-amber font-bold">
              MIL-SPEC 3D
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            UAV-01 DIGITAL TWIN CAD POWERTRAIN ASSEMBLY
          </div>
        </div>

        {/* Live Gauges & Subsystem Telemetry Card */}
        <div className="hud-glass p-3.5 rounded-xl border border-carbon-700 bg-carbon-900/80 flex flex-col gap-3 shadow-hud-glass">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Gauge className="w-3.5 h-3.5 text-tactical-amber" />
              POWERTRAIN DYNAMICS
            </span>
            <span className="text-emerald-400 font-bold font-mono">{telemetry.engine.rpm} RPM</span>
          </div>

          {/* 4-Cylinder EGT Heat Balance Matrix */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>CYLINDER EGT MATRIX (°C)</span>
              <span className="text-tactical-amber text-[10px] font-bold">Δ SPREAD: {(Math.max(...telemetry.engine.egt) - Math.min(...telemetry.engine.egt)).toFixed(1)}°C</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {telemetry.engine.egt.map((temp, idx) => {
                const isOverheat = temp > 900;
                const isSelected = selectedHotspot === `CYLINDER_${idx + 1}`;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      tacticalAudio.playClick();
                      setSelectedHotspot(`CYLINDER_${idx + 1}`);
                    }}
                    className={`p-1.5 rounded-lg flex flex-col items-center border transition-all ${
                      isSelected 
                        ? 'border-tactical-amber bg-tactical-amber/20 shadow-tactical-amber' 
                        : isOverheat 
                          ? 'border-red-500/60 bg-red-950/40 text-red-300' 
                          : 'border-carbon-700 bg-carbon-800/80 hover:border-carbon-600'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-400">CYL {idx + 1}</span>
                    <span className={`w-full text-center text-xs font-mono font-bold ${isOverheat ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
                      {temp.toFixed(0)}°
                    </span>
                    <div className="w-full bg-carbon-950 h-1 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${isOverheat ? 'bg-red-500' : 'bg-tactical-amber'}`} 
                        style={{ width: `${Math.min(100, (temp / 1000) * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FFT Vibration Harmonics Spectrogram */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-cryo-teal" />
                VIBRATION FFT SPECTRUM
              </span>
              <span className="text-cryo-teal text-[10px] font-bold">{telemetry.engine.vibrationGrms} g-RMS</span>
            </div>
            <div className="h-14 bg-carbon-950 border border-carbon-750 rounded-lg p-1.5 flex items-end justify-between gap-0.5">
              {fftData.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-full rounded-t transition-all duration-100 ${
                    val > 70 ? 'bg-red-500 shadow-alert-red' : 'bg-tactical-amber'
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
        <div className="hud-glass p-3.5 rounded-xl border border-carbon-700 bg-carbon-900/80 flex flex-col gap-2.5 flex-1 shadow-hud-glass">
          <div className="flex items-center justify-between border-b border-carbon-750 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-tactical-amber font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>INSPECTOR: {selectedHotspot}</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeHotspot.status === 'CRITICAL' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {activeHotspot.status}
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-100">
            {activeHotspot.name}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            <span className="text-tactical-amber">SUBSYSTEM:</span> {activeHotspot.subsystem}
          </div>
          <div className="text-[10px] font-mono text-slate-300 bg-carbon-950 p-2 rounded-lg border border-carbon-800">
            {activeHotspot.spec}
          </div>
          {activeHotspot.tolerances && (
            <div className="text-[10px] font-mono text-cryo-teal bg-carbon-950/80 p-2 rounded-lg border border-cryo-teal/20 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{activeHotspot.tolerances}</span>
            </div>
          )}

          {/* Real-time Telemetry & Residual Delta */}
          <div className="bg-carbon-950 p-2.5 rounded-lg border border-tactical-amber/20 flex flex-col gap-1 text-[11px] font-mono">
            <div className="text-slate-300">
              <span className="text-tactical-amber font-bold">METRICS:</span> {activeHotspot.telemetryKey}
            </div>
            <div className="text-tactical-amber">
              <span className="text-slate-400">RESIDUAL:</span> {activeHotspot.residual}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-300 leading-relaxed bg-carbon-950/60 p-2 rounded-lg border border-carbon-800">
            {activeHotspot.desc}
          </div>

          {/* Subsystem Direct Select Buttons */}
          <div className="mt-auto pt-2 border-t border-carbon-750">
            <div className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase font-medium">Select Subsystem To Inspect:</div>
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
                  onClick={() => {
                    tacticalAudio.playClick();
                    setSelectedHotspot(item.id);
                  }}
                  className={`px-1.5 py-1.5 rounded-lg text-center truncate transition-colors ${
                    selectedHotspot === item.id 
                      ? 'bg-tactical-amber text-black font-bold shadow-tactical-amber' 
                      : 'bg-carbon-800 border border-carbon-700 text-slate-300 hover:border-tactical-amber/40'
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
          RIGHT: BLENDER-TYPE 3D CAD ENGINE & AIRFRAME STUDIO
         ========================================================================= */}
      <div className="flex-1 relative hud-glass rounded-xl overflow-hidden flex flex-col border border-tactical-amber/30 shadow-2xl bg-carbon-950">
        {/* Top Control HUD Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Left: Exploded Slider, MatCaps, HUD Rings */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Title Badge */}
            <div className="px-3 py-1.5 bg-carbon-900/90 border border-tactical-amber/50 rounded-lg text-xs font-mono text-tactical-amber flex items-center gap-2 shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-tactical-amber animate-pulse"></span>
              <span className="font-bold">CAD 3D DIGITAL TWIN STUDIO</span>
            </div>

            {/* Stepless Exploded Slider Control */}
            <div className="flex items-center gap-2 px-3 py-1 bg-carbon-900/90 border border-carbon-700 rounded-lg backdrop-blur-md">
              <Layers className="w-3.5 h-3.5 text-tactical-amber" />
              <span className="text-xs font-mono text-slate-300">EXPLODE:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(explosionFactor * 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) / 100;
                  setExplosionFactor(val);
                  setIsExploded(val > 0.05);
                  tacticalAudio.playRatchet(400 + val * 400);
                }}
                className="w-24 h-1.5 bg-carbon-750 rounded-lg appearance-none cursor-pointer accent-tactical-amber"
              />
              <span className="text-xs font-mono font-bold text-tactical-amber min-w-[36px]">
                {Math.round(explosionFactor * 100)}%
              </span>
            </div>

            {/* MatCap / Shader Mode Switcher */}
            <div className="flex items-center gap-1 bg-carbon-900/90 border border-carbon-700 p-1 rounded-lg backdrop-blur-md">
              <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {[
                { id: 'STEALTH_CARBON', label: 'CARBON' },
                { id: 'CAD_BLUEPRINT', label: 'BLUEPRINT' },
                { id: 'FLIR_THERMAL', label: 'FLIR HEAT' },
                { id: 'METALLIC_ALLOY', label: 'CHROME' },
                { id: 'WIREFRAME_XRAY', label: 'WIRE' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => {
                    tacticalAudio.playClick();
                    setXrayMode(mode.id);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                    xrayMode === mode.id
                      ? 'bg-tactical-amber text-black font-bold shadow-tactical-amber'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Part Isolation Solo Filter */}
            <div className="flex items-center gap-1 bg-carbon-900/90 border border-carbon-700 p-1 rounded-lg backdrop-blur-md">
              <Eye className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                value={isolatedPart}
                onChange={(e) => {
                  tacticalAudio.playClick();
                  setIsolatedPart(e.target.value);
                }}
                className="bg-transparent text-[10px] font-mono text-tactical-amber focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-carbon-900 text-slate-200">FOCUS: ALL SUB-ASSEMBLIES</option>
                <option value="ENGINE_BLOCK" className="bg-carbon-900 text-slate-200">SOLO: CRANKCASE BLOCK</option>
                <option value="CYLINDERS" className="bg-carbon-900 text-slate-200">SOLO: 4 BOXER CYLINDERS</option>
                <option value="TURBOCHARGER" className="bg-carbon-900 text-slate-200">SOLO: TURBOCHARGER</option>
                <option value="FUEL_SYSTEM" className="bg-carbon-900 text-slate-200">SOLO: FUEL RAILS</option>
                <option value="OIL_SYSTEM" className="bg-carbon-900 text-slate-200">SOLO: OIL SUMP & PUMP</option>
                <option value="AVIONICS_ECU" className="bg-carbon-900 text-slate-200">SOLO: FADEC ECU</option>
                <option value="AIRFRAME" className="bg-carbon-900 text-slate-200">SOLO: AIRFRAME & WINGS</option>
              </select>
            </div>
          </div>

          {/* Right: Camera Presets */}
          <div className="flex items-center gap-1 bg-carbon-900/90 border border-carbon-700 p-1 rounded-lg pointer-events-auto backdrop-blur-md flex-wrap justify-end">
            <button
              onClick={() => handleResetCamera('HERO_HEADON')}
              title="Low-Angle Head-On Perspective (Hero Drone Image)"
              className={`px-2.5 py-1 text-xs font-mono rounded-md flex items-center gap-1 transition-all ${
                cameraView === 'HERO_HEADON'
                  ? 'bg-tactical-amber text-black font-bold shadow-tactical-amber'
                  : 'text-slate-300 hover:text-white hover:bg-carbon-800'
              }`}
            >
              <Camera className="w-3 h-3" />
              HERO (LOW-ANGLE)
            </button>
            <button
              onClick={() => handleResetCamera('XRAY_CUTAWAY')}
              className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
                cameraView === 'XRAY_CUTAWAY' ? 'bg-tactical-amber/30 text-tactical-amber border border-tactical-amber/50 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ISO CUTAWAY
            </button>
            <button
              onClick={() => handleResetCamera('ENGINE_MACRO')}
              className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
                cameraView === 'ENGINE_MACRO' ? 'bg-tactical-amber/30 text-tactical-amber border border-tactical-amber/50 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ENGINE BAY
            </button>
            <button
              onClick={() => handleResetCamera('TOP_CAD')}
              className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
                cameraView === 'TOP_CAD' ? 'bg-tactical-amber/30 text-tactical-amber border border-tactical-amber/50 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TOP CAD
            </button>
            <button
              onClick={() => handleResetCamera('SIDE_ELEV')}
              className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
                cameraView === 'SIDE_ELEV' ? 'bg-tactical-amber/30 text-tactical-amber border border-tactical-amber/50 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SIDE ELEV
            </button>
          </div>
        </div>

        {/* Blender CAD Orientation Gizmo Overlay */}
        <CadViewportGizmo onSnapView={handleResetCamera} cameraView={cameraView} />

        {/* 3D WebGL Canvas */}
        <div className="w-full h-full cursor-grab active:cursor-grabbing bg-[#080A0F] relative">
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
            {/* Holographic Obsidian Scene Background */}
            <color attach="background" args={['#080A0F']} />
            <fog attach="fog" args={['#080A0F', 14, 38]} />

            {/* Studio Technical Lighting Setup */}
            <ambientLight intensity={0.9} />
            <directionalLight position={[-8, -8, 8]} intensity={1.4} color="#E2E8F0" />
            <directionalLight position={[6, -6, 10]} intensity={1.8} color="#FFFBEB" />
            <directionalLight position={[0, 8, 4]} intensity={0.6} color="#94A3B8" />
            
            {/* Dynamic Engine Core PointLight */}
            <pointLight 
              position={[0, 0.4, 0.5]} 
              intensity={2.5} 
              color={telemetry.health.status === 'CRITICAL' ? '#EF4444' : '#E5A93C'}
              distance={6}
            />

            {/* Propeller Hub PointLight */}
            <pointLight 
              position={[0, -2.8, -0.8]} 
              intensity={2.0} 
              color="#2DD4BF" 
              distance={4}
            />

            {/* Subtle Float Motion */}
            <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.06}>
              <MasterUav3DModel
                isExploded={isExploded}
                explosionFactor={explosionFactor}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={setSelectedHotspot}
                telemetry={telemetry}
                showHudRings={showHudRings}
                xrayMode={xrayMode}
                isolatedPart={isolatedPart}
              />
            </Float>

            {/* Orbit Controls */}
            <OrbitControls
              ref={controlsRef}
              target={[0, -0.6, -0.1]}
              enableDamping={true}
              dampingFactor={0.05}
              maxDistance={25}
              minDistance={1.2}
              maxPolarAngle={Math.PI / 2 + 0.15}
            />
          </Canvas>

          {/* Bottom Left Tip Overlay */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none text-[11px] font-mono text-slate-300 bg-carbon-900/80 px-3.5 py-2 rounded-lg border border-carbon-700 backdrop-blur-md flex items-center gap-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-tactical-amber animate-spin" />
            <span>Click any 3D cylinder chamber, piston, or turbo to inspect real-time CAD telemetry & tolerances</span>
          </div>

          {/* Bottom Right Coordinate Readout */}
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-[10px] font-mono text-tactical-amber bg-carbon-900/80 px-3 py-1.5 rounded-lg border border-tactical-amber/30 backdrop-blur-md shadow-lg">
            FOV: 42° // ROTAX 915 iS // BLENDER CAD 3D EXPANDABLE
          </div>
        </div>
      </div>
    </div>
  );
};
