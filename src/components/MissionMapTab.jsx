import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useTelemetry } from '../context/TelemetryContext';
import { 
  Navigation, 
  MapPin, 
  Wind, 
  ShieldAlert, 
  CheckCircle2, 
  Compass, 
  ArrowRight, 
  Plane,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

// Custom Tactical UAV SVG Marker
const uavIcon = new L.DivIcon({
  className: 'custom-uav-icon',
  html: `
    <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(25, 199, 165, 0.2); border: 2px solid #19C7A5; border-radius: 50%; box-shadow: 0 0 15px #19C7A5;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#19C7A5" stroke="#050908" stroke-width="1.5">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Base Airfield Marker
const baseIcon = new L.DivIcon({
  className: 'custom-base-icon',
  html: `
    <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(16, 185, 129, 0.25); border: 2px solid #10B981; border-radius: 4px; box-shadow: 0 0 10px #10B981;">
      <div style="width: 8px; height: 8px; background: #10B981; border-radius: 2px;"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// Emergency Strip Marker
const emergencyIcon = new L.DivIcon({
  className: 'custom-emergency-icon',
  html: `
    <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(245, 158, 11, 0.25); border: 2px solid #F59E0B; border-radius: 4px; box-shadow: 0 0 10px #F59E0B;">
      <div style="width: 8px; height: 8px; background: #F59E0B; border-radius: 2px;"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

export const MissionMapTab = () => {
  const { telemetry, aiPrognostics } = useTelemetry();
  const isCritical = telemetry.health.status === 'CRITICAL';
  const isDegraded = telemetry.health.status === 'DEGRADED';
  const braveMapsUrl = 'https://search.brave.com/maps?source=web&bbox=73.352%2C18.345%2C74.392%2C18.774';

  // Mission coordinates are kept inside the Pune bounding box supplied for this planner.
  const homeBase = [18.5204, 73.8567]; // FOB Bravo, Pune
  const emergencyBase = [18.6690, 73.8950]; // Aux Recovery Strip 04, east divert
  const uavCurrentPos = [18.5850, 73.9500]; // Live UAV position

  // Nominal Mission Waypoints (Cyan Trajectory)
  const nominalFlightPlan = [
    homeBase,
    [18.5480, 73.7900],
    [18.6000, 73.8350],
    uavCurrentPos,
    [18.6500, 74.0200],
    [18.7200, 74.1200],
    [18.7000, 74.3000]
  ];

  // Each fault gets a distinct RL corridor so the replanner visibly changes its route.
  const faultRoutePlans = {
    CYL3_INJECTOR: [uavCurrentPos, [18.5700, 73.9100], [18.5550, 73.8750], emergencyBase],
    BLOW_BY: [uavCurrentPos, [18.6250, 73.9200], [18.6450, 73.8800], emergencyBase],
    OIL_PUMP_CAVITATION: [uavCurrentPos, [18.5600, 73.9700], [18.6000, 74.0050], emergencyBase],
    TURBO_WASTEGATE_STUCK: [uavCurrentPos, [18.6150, 73.9800], [18.6800, 73.9600], emergencyBase],
    COOLING_DEGRADATION: [uavCurrentPos, [18.5450, 73.9350], [18.5850, 73.8750], emergencyBase]
  };

  const activeFault = telemetry.health.activeFault;
  const rlEmergencyRtbPath = faultRoutePlans[activeFault] || [
    uavCurrentPos,
    [18.6100, 73.9250],
    [18.6400, 73.9000],
    emergencyBase
  ];

  // Geofence Patrol Zone Coordinates
  const geofencePolygon = [
    [18.3450, 73.3520],
    [18.7740, 73.3520],
    [18.7740, 74.3920],
    [18.3450, 74.3920]
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] w-full">
      {/* 1. Tactical Leaflet Map Canvas */}
      <div className="flex-1 relative hud-glass rounded-lg overflow-hidden flex flex-col">
        {/* Map Header Status Banner */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 bg-black/85 border border-hud-cyan/40 rounded text-xs font-mono text-hud-cyan flex items-center gap-2 backdrop-blur-md">
            <Navigation className="w-3.5 h-3.5 text-hud-cyan animate-pulse" />
            <span>TACTICAL AUTONOMOUS MISSION REPLANNER</span>
          </div>

          <div className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md ${
            isCritical
              ? 'bg-red-950/80 border border-red-500 text-red-300 animate-pulse'
              : isDegraded
              ? 'bg-amber-950/80 border border-amber-500 text-amber-300'
              : 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
          }`}>
            {isCritical
              ? 'RL DECISION: AUTONOMOUS EMERGENCY RTB ENGAGED'
              : isDegraded
              ? 'RL DECISION: ADAPTIVE POWER DERATE COMMANDED'
              : 'RL DECISION: NOMINAL MISSION PATH CLEARED'}
          </div>
        </div>

        {/* Native map view centered on the bounding box from the supplied Brave Maps URL. */}
        <div className="w-full h-full relative bg-slate-950">
          <MapContainer
            center={[18.5595, 73.872]}
            zoom={10}
            style={{ height: '100%', width: '100%', background: '#050908' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polygon
              positions={geofencePolygon}
              pathOptions={{ color: '#19C7A5', weight: 1, dashArray: '5, 5', fillOpacity: 0.03 }}
            />

            {/* Nominal mission corridor remains visible as a reference route. */}
            <Polyline
              positions={nominalFlightPlan}
              pathOptions={{ color: '#19C7A5', weight: 3, opacity: 0.72 }}
            />

            {/* Fault-specific RL route is rendered only when a degraded/critical state is active. */}
            {(isCritical || isDegraded || activeFault !== 'NONE') && (
              <Polyline
                positions={rlEmergencyRtbPath}
                pathOptions={{
                  color: isCritical ? '#EF4444' : '#F59E0B',
                  weight: 5,
                  dashArray: '10, 8',
                  opacity: 0.98
                }}
              />
            )}

            <Circle
              center={uavCurrentPos}
              radius={isCritical ? 18000 : 32000}
              pathOptions={{
                color: isCritical ? '#EF4444' : '#10B981',
                fillColor: isCritical ? '#EF4444' : '#10B981',
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: '4, 4'
              }}
            />

            <Marker position={homeBase} icon={baseIcon}>
              <Popup>
                <div className="text-xs font-mono">
                  <div className="font-bold text-emerald-400">FORWARD OPERATING BASE BRAVO</div>
                  <div>Primary home recovery field | Pune sector</div>
                </div>
              </Popup>
            </Marker>

            <Marker position={emergencyBase} icon={emergencyIcon}>
              <Popup>
                <div className="text-xs font-mono">
                  <div className="font-bold text-amber-400">AUX RECOVERY STRIP 04</div>
                  <div>RL emergency divert destination</div>
                </div>
              </Popup>
            </Marker>

            <Marker position={uavCurrentPos} icon={uavIcon}>
              <Popup>
                <div className="text-xs font-mono">
                  <div className="font-bold text-hud-cyan">RL REPLANNER OPERATING AREA</div>
                  <div>UAV-01 live position | Pune sector</div>
                  <div>RUL: {aiPrognostics.rul_hours_mean.toFixed(1)} hrs</div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
          <a
            href={braveMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded border border-hud-cyan/60 bg-slate-950/90 text-xs font-mono font-bold text-hud-cyan backdrop-blur-md hover:bg-hud-cyan/20"
          >
            OPEN IN BRAVE MAPS
          </a>
        </div>

        {/* Tactical Legend at Bottom of Map */}
        <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-4 bg-black/85 border border-slate-700/80 px-3 py-1.5 rounded-lg text-[11px] font-mono backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-1 bg-hud-cyan inline-block"></span> Nominal Flight Path
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-1 bg-amber-400 inline-block border-t border-dashed"></span> RL Emergency Divert RTB
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 inline-block"></span> Safe Glide Footprint
          </div>
        </div>
      </div>

      {/* 2. Right Panel: RL Decision Engine & Trajectory Flight Envelope */}
      <div className="w-full lg:w-96 hud-glass rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-hud-cyan" />
            <h3 className="font-display font-bold text-sm tracking-wider text-hud-cyan">
              RL POLICY CONTROLLER
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">POLICY: PPO-REPLAN-v2</span>
        </div>

        {/* Current State Snapshot */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col gap-2">
          <div className="text-xs font-mono text-slate-400">FLIGHT STATE VECTORS</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-900 p-1.5 rounded">
              <span className="text-slate-400">ALTITUDE:</span> <span className="text-white font-bold">{telemetry.mission.altitudeFt.toLocaleString()} ft</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded">
              <span className="text-slate-400">AIRSPEED:</span> <span className="text-white font-bold">{telemetry.mission.airspeedKts} kts</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded">
              <span className="text-slate-400">WIND:</span> <span className="text-hud-cyan font-bold">240° @ 18 kts</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded">
              <span className="text-slate-400">FUEL:</span> <span className="text-emerald-400 font-bold">84.2 L (3.2h)</span>
            </div>
          </div>
        </div>

        {/* RL Autonomous Action Recommendations */}
        <div className={`p-3 rounded border flex flex-col gap-2 ${
          isCritical
            ? 'bg-red-950/30 border-red-500/50'
            : isDegraded
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          <div className="text-xs font-mono font-bold flex items-center justify-between">
            <span className={isCritical ? 'text-red-400' : isDegraded ? 'text-amber-400' : 'text-emerald-400'}>
              CLOSED-LOOP CONTROL COMMANDS
            </span>
            <span className="text-[10px] font-mono text-slate-400">AUTONOMOUS</span>
          </div>

          <div className="flex flex-col gap-1.5 text-xs font-mono">
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded">
              <span className="text-slate-400">COMMANDED THROTTLE:</span>
              <span className="font-bold text-white">
                {isCritical ? '58.0% (DERATED CRUISE)' : isDegraded ? '68.0%' : '78.5% (COMMANDED)'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded">
              <span className="text-slate-400">TARGET RECOVERY STRIP:</span>
              <span className="font-bold text-hud-cyan">
                {isCritical ? 'Aux Recovery Strip 04 (22.4 NM)' : 'FOB Bravo (41.2 NM)'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded">
              <span className="text-slate-400">DESCENT RATE PROFILE:</span>
              <span className="font-bold text-white">
                {isCritical ? '-350 FPM (GLIDE DESCENT)' : '0 FPM (LEVEL FLIGHT)'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded">
              <span className="text-slate-400">EST. TIME TO TOUCHDOWN:</span>
              <span className="font-bold text-emerald-400">
                {isCritical ? '14.2 MINUTES' : 'N/A (ON STATION)'}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Margin Indicator */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">RUL / FLIGHT TIME MARGIN:</span>
            <span className={`font-bold ${isCritical ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isCritical ? '2.4x (SAFE MARGIN)' : '58.0x (NOMINAL)'}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isCritical ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, isCritical ? 45 : 100)}%` }}
            ></div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 leading-tight">
            Reinforcement Learning policy guarantees 99.4% probability of safe recovery prior to mechanical fatigue redline.
          </div>
        </div>
      </div>
    </div>
  );
};
