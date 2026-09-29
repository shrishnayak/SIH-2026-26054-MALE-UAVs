import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Box,
  Brain,
  ChevronRight,
  FileText,
  Map,
  Menu,
  Plane,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Users,
} from 'lucide-react';

import { useTelemetry } from './context/TelemetryContext';
import { tacticalAudio } from './utils/tacticalAudio';
import { StatusDot } from './components/ui/primitives';
import { LandingPage } from './components/landing/LandingPage';
import { CadStudioTab } from './components/CadStudioTab';
import { TelemetryTab } from './components/TelemetryTab';
import { PrognosticsTab } from './components/PrognosticsTab';
import { MissionMapTab } from './components/MissionMapTab';
import { FleetTab } from './components/FleetTab';
import { JudgesSandboxTab } from './components/JudgesSandboxTab';
import { CopilotTab } from './components/CopilotTab';

const TABS = [
  { id: 'STUDIO', label: 'CAD Studio', icon: Box, component: CadStudioTab },
  { id: 'TELEMETRY', label: 'Live Telemetry', icon: Activity, component: TelemetryTab },
  { id: 'PROGNOSTICS', label: 'Prognostics & XAI', icon: Brain, component: PrognosticsTab },
  { id: 'MISSION_MAP', label: 'Mission Replanner', icon: Map, component: MissionMapTab },
  { id: 'FLEET', label: 'Swarm Fleet', icon: Users, component: FleetTab },
  { id: 'SANDBOX', label: "Judge's Sandbox", icon: Sliders, component: JudgesSandboxTab },
  { id: 'COPILOT', label: 'Copilot & Reports', icon: FileText, component: CopilotTab },
];

const FAULTS = [
  { id: 'CYL3_INJECTOR', label: 'Cyl 3 clog' },
  { id: 'BLOW_BY', label: 'Piston blow-by' },
  { id: 'OIL_PUMP_CAVITATION', label: 'Oil cavitation' },
  { id: 'TURBO_WASTEGATE_STUCK', label: 'Turbo surge' },
  { id: 'COOLING_DEGRADATION', label: 'Cooling decay' },
];

export default function App() {
  const { telemetry, isConnected, audioEnabled, setAudioEnabled, injectFault, clearFault } = useTelemetry();

  // SHOWCASE = landing page, DASHBOARD = flight deck. Single owner of navigation state.
  const [appMode, setAppMode] = useState('SHOWCASE');
  const [activeTab, setActiveTab] = useState('STUDIO');
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [zuluClock, setZuluClock] = useState('');

  useEffect(() => {
    tacticalAudio.setMuted(!audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    const tick = () => setZuluClock(new Date().toLocaleTimeString([], { hour12: false }));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const health = telemetry.health || {};
  const ActiveTab = (TABS.find((t) => t.id === activeTab) || TABS[0]).component;

  const openDashboard = (tabId) => {
    tacticalAudio.playChirp();
    setActiveTab(tabId);
    setAppMode('DASHBOARD');
  };

  const statusTone =
    health.status === 'CRITICAL' ? 'danger' : health.status === 'DEGRADED' ? 'warning' : 'success';

  return (
    <div className="app-shell">
      {/* ============================ Title bar ============================ */}
      <header className="titlebar">
        <div className="flex min-w-0 items-center gap-3">
          <div className="traffic-lights">
            <span className="tl-close" />
            <span className="tl-min" />
            <span className="tl-max" />
          </div>
          {appMode === 'SHOWCASE' ? (
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                tacticalAudio.playClick();
                setAppMode('DASHBOARD');
              }}
              title="Open flight deck"
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsNavOpen((v) => !v)}
              title={isNavOpen ? 'Hide navigation' : 'Show navigation'}
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-white/[0.06]"
            onClick={() => {
              tacticalAudio.playClick();
              setAppMode('SHOWCASE');
            }}
            title="Back to overview"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
              <Plane className="h-3.5 w-3.5 text-ink" />
            </span>
            <span className="text-[13px] font-semibold text-ink">AeroTwin</span>
            <span className="hidden text-[11.5px] text-ink-dim sm:inline">
              {appMode === 'SHOWCASE' ? 'Overview' : 'Flight Deck'}
            </span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="viewport-overlay hidden items-center gap-2 px-2.5 py-1.5 md:flex">
            <Radio className={`h-3.5 w-3.5 ${isConnected ? 'text-success' : 'text-ink-faint'}`} />
            <span className="font-mono text-[10.5px] text-ink-muted">
              {isConnected ? 'CAN LINK' : 'SIMULATION'}
            </span>
          </div>
          <div className="viewport-overlay hidden items-center gap-2 px-2.5 py-1.5 sm:flex">
            <span className="badge badge-neutral">{health.status || '—'}</span>
            <span className="font-mono text-[10.5px] text-ink-muted">
              {health.index?.toFixed?.(1) ?? '—'}%
            </span>
          </div>
          <div className="viewport-overlay hidden items-center px-2.5 py-1.5 lg:flex">
            <span className="font-mono text-[10.5px] text-ink-muted">{zuluClock}Z</span>
          </div>
          <div className="viewport-overlay flex items-center gap-2 px-2.5 py-1.5">
            <StatusDot tone={audioEnabled ? '#30D158' : '#7C7C82'} pulse={audioEnabled} />
            <button
              type="button"
              className="font-mono text-[10.5px] text-ink-muted transition hover:text-ink"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              AUDIO
            </button>
          </div>
        </div>
      </header>

      {/* ===================== Health status strip ========================= */}
      {appMode === 'DASHBOARD' ? (
        health.status === 'CRITICAL' ? (
          <div className="flex items-center justify-between gap-3 border-b border-danger/30 bg-danger/10 px-5 py-2">
            <div className="flex items-center gap-2 text-[12.5px] text-ink">
              <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
              <span className="font-medium">{health.alertMessage}</span>
            </div>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => openDashboard('MISSION_MAP')}>
              Open replanner
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : health.status === 'DEGRADED' ? (
          <div className="flex items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-5 py-2">
            <div className="flex items-center gap-2 text-[12.5px] text-ink">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
              <span className="font-medium">{health.alertMessage}</span>
            </div>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => openDashboard('PROGNOSTICS')}>
              Open prognostics
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-line bg-surface/40 px-5 py-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-[12.5px] text-ink-muted">All channels inside the learned flight envelope.</span>
          </div>
        )
      ) : null}

      {/* ===================== Fault injection console ===================== */}
      {appMode === 'DASHBOARD' ? (
        <div className="border-b border-line bg-surface/60 px-5 py-2.5">
          <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Fault injection
            </span>
            {FAULTS.map((f) => {
              const isActive = health.activeFault === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => {
                    tacticalAudio.playAlarm();
                    injectFault(f.id, 0.9);
                  }}
                >
                  {f.label}
                </button>
              );
            })}
            <button
              type="button"
              className={`btn btn-sm ${health.activeFault === 'NONE' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                tacticalAudio.playClick();
                clearFault();
              }}
            >
              Nominal
            </button>
            <span className="ml-auto hidden font-mono text-2xs text-ink-dim md:inline">
              UAV-01 · dual FADEC · CAN 2.0B @ 100 Hz
            </span>
          </div>
        </div>
      ) : null}

      {/* ============================ Main body ============================ */}
      <div className="app-body">
        {appMode === 'SHOWCASE' ? (
          <div className="flex-1 overflow-y-auto">
            <LandingPage onLaunchStudio={() => openDashboard('STUDIO')} onOpenTab={openDashboard} />
          </div>
        ) : (
          <>
            <nav className={`sidebar ${isNavOpen ? 'is-open' : 'is-hidden'}`}>
              <div className="sidebar-section">Flight deck</div>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`sidebar-item ${activeTab === tab.id ? 'is-active' : ''}`}
                    onClick={() => {
                      tacticalAudio.playClick();
                      setActiveTab(tab.id);
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}

              <div className="mt-auto flex flex-col gap-2 px-1 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm w-full"
                  onClick={() => {
                    tacticalAudio.playClick();
                    setIsNavOpen(false);
                  }}
                >
                  Collapse
                </button>
                <button
                  type="button"
                  className={`btn btn-sm w-full ${statusTone === 'danger' ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={() => openDashboard('SANDBOX')}
                >
                  Diagnostics sandbox
                </button>
              </div>
            </nav>

            <main className="app-main">
              <div className="content-scroll">
                <ActiveTab />
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
