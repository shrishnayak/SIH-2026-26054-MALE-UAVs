import React, { useState, useEffect } from 'react';
import { useTelemetry } from './context/TelemetryContext';
import { tacticalAudio } from './utils/tacticalAudio';
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
  Sparkles,
  Menu,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';

// Tab Components
import { LandingScrollytelling } from './components/landing/LandingScrollytelling';
import { UavBlueprintTab } from './components/UavBlueprintTab';
import { TelemetryTab } from './components/TelemetryTab';
import { PrognosticsTab } from './components/PrognosticsTab';
import { MissionMapTab } from './components/MissionMapTab';
import { FleetTab } from './components/FleetTab';
import { JudgesSandboxTab } from './components/JudgesSandboxTab';
import { CopilotTab } from './components/CopilotTab';

export default function App() {
  const { telemetry, isConnected, audioEnabled, setAudioEnabled, injectFault, clearFault } = useTelemetry();
  const [appMode, setAppMode] = useState('SHOWCASE'); // 'SHOWCASE' (Apple-style 3D Scrollytelling) | 'DASHBOARD' (Operations Flight Deck)
  const [activeTab, setActiveTab] = useState('BLUEPRINT');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [missionClock, setMissionClock] = useState(new Date().toLocaleTimeString());

  // Sync audio mute state with tacticalAudio engine
  useEffect(() => {
    tacticalAudio.setMuted(!audioEnabled);
  }, [audioEnabled]);

  // Update Zulu clock every second
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
    { id: 'BLUEPRINT', label: '3D CAD STUDIO', icon: Box, component: UavBlueprintTab },
    { id: 'TELEMETRY', label: 'LIVE TELEMETRY', icon: Activity, component: TelemetryTab },
    { id: 'PROGNOSTICS', label: 'AI PROGNOSTICS & XAI', icon: Brain, component: PrognosticsTab },
    { id: 'MISSION_MAP', label: 'RL REPLANNER', icon: Map, component: MissionMapTab },
    { id: 'FLEET', label: 'SWARM FLEET', icon: Users, component: FleetTab },
    { id: 'SANDBOX', label: "JUDGE'S SANDBOX", icon: Sliders, component: JudgesSandboxTab },
    { id: 'COPILOT', label: 'COPILOT & REPORT', icon: FileText, component: CopilotTab },
  ];

  const handleNavigateFromLanding = (tabId) => {
    tacticalAudio.playChirp();
    setActiveTab(tabId);
    setAppMode('DASHBOARD');
  };

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || UavBlueprintTab;

  return (
    <div className={`min-h-screen bg-carbon-950 text-slate-100 flex flex-col font-sans relative selection:bg-tactical-amber selection:text-black ${appMode === 'DASHBOARD' ? (isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed') : ''}`}>
      {/* =========================================================================
          1. MILITARY TACTICAL HEADER & TOP MODE SWITCHER
         ========================================================================= */}
      <header className="hud-glass border-b border-tactical-amber/25 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 bg-carbon-900/95 backdrop-blur-xl">
        {/* Left: Branding & UAV Metadata */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              tacticalAudio.playClick();
              setAppMode('SHOWCASE');
            }}
            className="w-10 h-10 rounded-xl bg-carbon-800 border border-tactical-amber/40 hover:border-tactical-amber flex items-center justify-center transition-all hover:scale-105 shadow-tactical-amber"
            title="Return to 3D Cinematic Showcase"
          >
            <Plane className="w-5 h-5 text-tactical-amber" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-sm tracking-wider text-white">
                AEROTWIN // MALE UAV DIGITAL TWIN
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-tactical-amber/15 border border-tactical-amber/40 rounded-full text-tactical-amber font-bold">
                MIL-STD-178C
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              ROTAX 915/916 iS PROGNOSTICS & MISSION RELIABILITY ({telemetry.mission.uavId})
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher Toggle & Mission Clock */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-carbon-950 p-1 rounded-xl border border-carbon-750 shadow-inner">
            <button
              onClick={() => {
                tacticalAudio.playChirp();
                setAppMode('SHOWCASE');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                appMode === 'SHOWCASE'
                  ? 'bg-tactical-amber text-black shadow-tactical-amber'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D SHOWCASE</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playChirp();
                setAppMode('DASHBOARD');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                appMode === 'DASHBOARD'
                  ? 'bg-tactical-amber text-black shadow-tactical-amber'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>FLIGHT DECK</span>
            </button>
          </div>

          {/* Live Zulu Clock & Telemetry Ticker (Visible on wide screens) */}
          <div className="hidden xl:flex items-center gap-3 bg-carbon-950/90 border border-carbon-750 px-3 py-1.5 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-tactical-amber" />
              <span>ZULU: {missionClock}</span>
            </div>
            <div className="h-3 w-[1px] bg-carbon-700"></div>
            <div className="text-slate-300">
              ALT: <span className="text-white font-bold">{telemetry.mission.altitudeFt.toLocaleString()} FT</span>
            </div>
            <div className="h-3 w-[1px] bg-carbon-700"></div>
            <div className="text-slate-300">
              SPD: <span className="text-white font-bold">{telemetry.mission.airspeedKts} KTS</span>
            </div>
            <div className="h-3 w-[1px] bg-carbon-700"></div>
            <div className="text-slate-300">
              HEALTH: <span className={`font-bold ${isCritical ? 'text-red-400' : isDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>
                {health.index.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Audio Alarm Toggle & Connection Health Badge */}
        <div className="flex items-center gap-2.5">
          {/* Procedural Audio Alarm Toggle */}
          <button
            onClick={() => {
              const newState = !audioEnabled;
              setAudioEnabled(newState);
              if (newState) tacticalAudio.playChirp();
            }}
            title={audioEnabled ? 'Tactical Audio: Active' : 'Tactical Audio: Muted'}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 ${
              audioEnabled
                ? 'bg-tactical-amber/20 text-tactical-amber border-tactical-amber/60 shadow-tactical-amber'
                : 'bg-carbon-950 text-slate-400 border-carbon-750 hover:text-slate-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-carbon-950 border border-carbon-750 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-tactical-amber animate-pulse'}`} />
            <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-tactical-amber font-bold'}>
              {isConnected ? 'CAN 100 HZ LIVE' : 'INTERNAL BRIDGE'}
            </span>
          </div>

          {/* Overall Health Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border shadow-md ${
            isCritical
              ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse shadow-alert-red'
              : isDegraded
              ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-tactical-amber'
              : 'bg-emerald-950/90 border-emerald-500/70 text-emerald-400'
          }`}>
            {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{health.status}</span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. GLOBAL FAULT INJECTION QUICK ACTION HUD BAR
         ========================================================================= */}
      <div className="bg-carbon-900 border-b border-carbon-800 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-tactical-amber flex items-center gap-1 font-bold">
            <Flame className="w-3.5 h-3.5" /> QUICK FAULT INJECTION (DEMO / JUDGES):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              tacticalAudio.playAlarm();
              injectFault('CYL3_INJECTOR', 0.9);
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              health.activeFault === 'CYL3_INJECTOR'
                ? 'bg-red-500 text-black font-bold border-red-500 shadow-alert-red'
                : 'bg-carbon-950 text-red-400 border-red-500/30 hover:bg-red-950/50'
            }`}
          >
            Cyl 3 Clog
          </button>

          <button
            onClick={() => {
              tacticalAudio.playAlarm();
              injectFault('BLOW_BY', 0.85);
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              health.activeFault === 'BLOW_BY'
                ? 'bg-amber-500 text-black font-bold border-amber-500 shadow-tactical-amber'
                : 'bg-carbon-950 text-amber-400 border-amber-500/30 hover:bg-amber-950/50'
            }`}
          >
            Piston Blow-By
          </button>

          <button
            onClick={() => {
              tacticalAudio.playAlarm();
              injectFault('OIL_PUMP_CAVITATION', 0.95);
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              health.activeFault === 'OIL_PUMP_CAVITATION'
                ? 'bg-red-500 text-black font-bold border-red-500 shadow-alert-red'
                : 'bg-carbon-950 text-red-300 border-red-500/30 hover:bg-red-950/50'
            }`}
          >
            Oil Cavitation
          </button>

          <button
            onClick={() => {
              tacticalAudio.playAlarm();
              injectFault('TURBO_WASTEGATE_STUCK', 0.8);
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              health.activeFault === 'TURBO_WASTEGATE_STUCK'
                ? 'bg-tactical-amber text-black font-bold border-tactical-amber shadow-tactical-amber'
                : 'bg-carbon-950 text-tactical-amber border-tactical-amber/30 hover:bg-amber-950/50'
            }`}
          >
            Turbo Surge
          </button>

          <button
            onClick={() => {
              tacticalAudio.playAlarm();
              injectFault('COOLING_DEGRADATION', 0.85);
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              health.activeFault === 'COOLING_DEGRADATION'
                ? 'bg-cryo-teal text-black font-bold border-cryo-teal shadow-cryo-teal'
                : 'bg-carbon-950 text-cryo-teal border-cryo-teal/30 hover:bg-teal-950/50'
            }`}
          >
            Cooling Decay
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              clearFault();
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              health.activeFault === 'NONE'
                ? 'bg-emerald-500 text-black font-bold border-emerald-500'
                : 'bg-carbon-950 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/50'
            }`}
          >
            Clear All (Nominal)
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. ACTIVE FAULT ALERT NOTIFICATION BANNER
         ========================================================================= */}
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
          <button 
            onClick={() => {
              tacticalAudio.playChirp();
              setActiveTab('MISSION_MAP');
              setAppMode('DASHBOARD');
            }}
            className="font-bold underline cursor-pointer hover:text-white flex items-center gap-1"
          >
            <span>VIEW AUTONOMOUS RL REPLAN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          4. MAIN VIEWPORT (SHOWCASE SCROLLYTELLING VS FLIGHT DECK TABS)
         ========================================================================= */}
      {appMode === 'SHOWCASE' ? (
        <LandingScrollytelling 
          onNavigateTab={handleNavigateFromLanding}
          onLaunchDashboard={() => {
            tacticalAudio.playChirp();
            setAppMode('DASHBOARD');
          }}
        />
      ) : (
        <>
          {/* Operations Navigation Sidebar */}
          <nav className="app-sidebar bg-carbon-900/95 border-r border-carbon-800 px-3 flex flex-col gap-1.5 z-40">
            <button
              type="button"
              className="sidebar-toggle rounded-xl"
              onClick={() => {
                tacticalAudio.playClick();
                setIsSidebarOpen(!isSidebarOpen);
              }}
              aria-label={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
              title={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
            >
              <Menu className="w-5 h-5 text-tactical-amber" />
              <span>NAVIGATION MENU</span>
            </button>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    tacticalAudio.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`py-2.5 px-3 text-xs font-mono whitespace-nowrap transition-all rounded-xl flex items-center gap-2 ${
                    isActive
                      ? 'bg-tactical-amber text-black font-bold shadow-tactical-amber'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-carbon-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="sidebar-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Flight Deck Tab Content */}
          <main className="flex-1 p-4 overflow-hidden relative">
            <ActiveComponent />
          </main>
        </>
      )}
    </div>
  );
}
