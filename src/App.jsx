import React, { useState, useEffect } from 'react';
import { useTelemetry } from './context/TelemetryContext';
import { 
  Box, 
  Activity, 
  Brain, 
  Map, 
  Users, 
  Sliders, 
  FileText, 
  Volume2, 
  VolumeX, 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Wrench, 
  Plane,
  Clock,
  Sparkles
} from 'lucide-react';

// Tab Components
import { UavBlueprintTab } from './components/UavBlueprintTab';
import { TelemetryTab } from './components/TelemetryTab';
import { PrognosticsTab } from './components/PrognosticsTab';
import { MissionMapTab } from './components/MissionMapTab';
import { FleetTab } from './components/FleetTab';
import { JudgesSandboxTab } from './components/JudgesSandboxTab';
import { CopilotTab } from './components/CopilotTab';

export default function App() {
  const { telemetry, isConnected, audioEnabled, setAudioEnabled, injectFault, clearFault } = useTelemetry();
  const [activeTab, setActiveTab] = useState('BLUEPRINT');
  const [missionClock, setMissionClock] = useState(new Date().toLocaleTimeString());

  // Update Clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setMissionClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const health = telemetry.health;
  const isCritical = health.status === 'CRITICAL';
  const isDegraded = health.status === 'DEGRADED';

  // Tabs Configuration
  const tabs = [
    { id: 'BLUEPRINT', label: '📐 3D CAD BLUEPRINT', icon: Box, component: UavBlueprintTab },
    { id: 'TELEMETRY', label: '📊 LIVE TELEMETRY', icon: Activity, component: TelemetryTab },
    { id: 'PROGNOSTICS', label: '🧠 AI PROGNOSTICS & XAI', icon: Brain, component: PrognosticsTab },
    { id: 'MISSION_MAP', label: '🗺️ RL REPLANNER', icon: Map, component: MissionMapTab },
    { id: 'FLEET', label: '🛸 SWARM FLEET', icon: Users, component: FleetTab },
    { id: 'SANDBOX', label: "⚖️ JUDGE'S SANDBOX", icon: Sliders, component: JudgesSandboxTab },
    { id: 'COPILOT', label: '📄 COPILOT & REPORT', icon: FileText, component: CopilotTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || UavBlueprintTab;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-hud relative selection:bg-hud-cyan selection:text-black">
      {/* 1. Military Tactical Header */}
      <header className="hud-glass border-b border-hud-cyan/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        {/* Left: Branding & UAV Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-hud-cyan/10 border border-hud-cyan flex items-center justify-center shadow-hud-cyan">
            <Plane className="w-5 h-5 text-hud-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-sm tracking-wider text-hud-cyan glow-cyan">
                AEROTWIN // MALE UAV DIGITAL TWIN
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">
                MIL-STD-178C
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              ROTAX 915/916 iS PROGNOSTICS & MISSION RELIABILITY SYSTEM (UAV-01)
            </div>
          </div>
        </div>

        {/* Center: Live Mission Clock & Telemetry Ticker */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-md text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-hud-cyan" />
            <span>ZULU: {missionClock}</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800"></div>
          <div className="text-slate-300">
            ALT: <span className="text-white font-bold">{telemetry.mission.altitudeFt.toLocaleString()} FT</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800"></div>
          <div className="text-slate-300">
            SPD: <span className="text-white font-bold">{telemetry.mission.airspeedKts} KTS</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800"></div>
          <div className="text-slate-300">
            HEALTH: <span className={`font-bold ${isCritical ? 'text-red-400' : isDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>
              {health.index.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Right: Socket Status, Audio Alarm Toggle & Health Badge */}
        <div className="flex items-center gap-2.5">
          {/* Audio Alarm Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Audio Alarms: Active' : 'Audio Alarms: Muted'}
            className={`p-1.5 rounded border text-xs font-mono transition-colors flex items-center gap-1 ${
              audioEnabled
                ? 'bg-hud-cyan/20 text-hud-cyan border-hud-cyan/60'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400 animate-pulse'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isConnected ? 'CAN 100 HZ LIVE' : 'INTERNAL BRIDGE'}
            </span>
          </div>

          {/* Overall Health Status Badge */}
          <div className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border ${
            isCritical
              ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-hud-red'
              : isDegraded
              ? 'bg-amber-950/80 border-amber-500 text-amber-400 shadow-hud-amber'
              : 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
          }`}>
            {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{health.status}</span>
          </div>
        </div>
      </header>

      {/* 2. Global Fault Injection Quick Action HUD Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-hud-cyan flex items-center gap-1 font-bold">
            <Flame className="w-3.5 h-3.5" /> QUICK FAULT INJECTION (JUDGE / DEMO):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => injectFault('CYL3_INJECTOR', 0.9)}
            className={`px-2 py-1 rounded border transition-all ${
              health.activeFault === 'CYL3_INJECTOR'
                ? 'bg-red-500 text-black font-bold border-red-500 shadow-hud-red'
                : 'bg-slate-900/90 text-red-400 border-red-500/40 hover:bg-red-950'
            }`}
          >
            Cyl 3 Clog
          </button>

          <button
            onClick={() => injectFault('BLOW_BY', 0.85)}
            className={`px-2 py-1 rounded border transition-all ${
              health.activeFault === 'BLOW_BY'
                ? 'bg-amber-500 text-black font-bold border-amber-500 shadow-hud-amber'
                : 'bg-slate-900/90 text-amber-400 border-amber-500/40 hover:bg-amber-950'
            }`}
          >
            Piston Blow-By
          </button>

          <button
            onClick={() => injectFault('OIL_PUMP_CAVITATION', 0.95)}
            className={`px-2 py-1 rounded border transition-all ${
              health.activeFault === 'OIL_PUMP_CAVITATION'
                ? 'bg-red-500 text-black font-bold border-red-500 shadow-hud-red'
                : 'bg-slate-900/90 text-red-300 border-red-500/40 hover:bg-red-950'
            }`}
          >
            Oil Cavitation
          </button>

          <button
            onClick={() => injectFault('TURBO_WASTEGATE_STUCK', 0.8)}
            className={`px-2 py-1 rounded border transition-all ${
              health.activeFault === 'TURBO_WASTEGATE_STUCK'
                ? 'bg-purple-500 text-black font-bold border-purple-500'
                : 'bg-slate-900/90 text-purple-300 border-purple-500/40 hover:bg-purple-950'
            }`}
          >
            Turbo Surge
          </button>

          <button
            onClick={() => injectFault('COOLING_DEGRADATION', 0.85)}
            className={`px-2 py-1 rounded border transition-all ${
              health.activeFault === 'COOLING_DEGRADATION'
                ? 'bg-cyan-500 text-black font-bold border-cyan-500'
                : 'bg-slate-900/90 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950'
            }`}
          >
            Cooling Decay
          </button>

          <button
            onClick={() => clearFault()}
            className={`px-2 py-1 rounded border transition-all ${
              health.activeFault === 'NONE'
                ? 'bg-emerald-500 text-black font-bold border-emerald-500'
                : 'bg-slate-900/90 text-emerald-400 border-emerald-500/40 hover:bg-emerald-950'
            }`}
          >
            Clear All (Nominal)
          </button>
        </div>
      </div>

      {/* 3. Active Alert Banner if Degraded or Critical */}
      {(isCritical || isDegraded) && (
        <div className={`px-4 py-2 flex items-center justify-between text-xs font-mono border-b ${
          isCritical
            ? 'bg-red-950/90 text-red-200 border-red-500/60 animate-pulse'
            : 'bg-amber-950/90 text-amber-200 border-amber-500/60'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span className="font-bold">{health.alertMessage}</span>
          </div>
          <span className="font-bold underline cursor-pointer" onClick={() => setActiveTab('MISSION_MAP')}>
            VIEW AUTONOMOUS RL REPLAN →
          </span>
        </div>
      )}

      {/* 4. Tab Switcher Navigation */}
      <nav className="bg-slate-950/90 border-b border-slate-800 px-4 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3 text-xs font-mono whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                isActive
                  ? 'border-hud-cyan text-hud-cyan font-bold bg-hud-cyan/10 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 5. Main Active Content View Container */}
      <main className="flex-1 p-4 overflow-hidden relative">
        <ActiveComponent />
      </main>
    </div>
  );
}
