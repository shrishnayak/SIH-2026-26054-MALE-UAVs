import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { 
  Users, 
  Plane, 
  Activity, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const FleetTab = () => {
  const { telemetry, aiPrognostics } = useTelemetry();
  const [selectedUav, setSelectedUav] = useState('UAV-01');

  // Swarm Fleet Data Matrix (UAV-01 to UAV-05)
  const fleetData = [
    {
      id: 'UAV-01',
      callsign: 'VIPER-01 (ACTIVE TESTBED)',
      engine: 'Rotax 915 iS (S/N: RTX-0842)',
      status: telemetry.health.status === 'CRITICAL' ? 'EMERGENCY RTB' : telemetry.health.status === 'DEGRADED' ? 'DERATED LOITER' : 'ON STATION',
      health: aiPrognostics.engine_health_index,
      rulHours: aiPrognostics.rul_hours_mean,
      flightHours: 342.5,
      tboDueHours: 857.5,
      nextMaintenanceDays: aiPrognostics.engine_health_index < 40 ? 0 : 28,
      subsystems: {
        combustion: aiPrognostics.dominant_root_cause_feature.includes('EGT') ? 35 : 99,
        lubrication: aiPrognostics.dominant_root_cause_feature.includes('Oil') ? 28 : 98,
        induction: aiPrognostics.dominant_root_cause_feature.includes('MAP') ? 52 : 99,
        cooling: aiPrognostics.dominant_root_cause_feature.includes('CHT') ? 42 : 98,
        vibration: aiPrognostics.dominant_root_cause_feature.includes('Vibration') ? 30 : 97
      }
    },
    {
      id: 'UAV-02',
      callsign: 'VIPER-02 (ESCORT LEAD)',
      engine: 'Rotax 915 iS (S/N: RTX-0819)',
      status: 'ON STATION',
      health: 96.2,
      rulHours: 785.0,
      flightHours: 415.0,
      tboDueHours: 785.0,
      nextMaintenanceDays: 45,
      subsystems: { combustion: 98, lubrication: 95, induction: 97, cooling: 96, vibration: 95 }
    },
    {
      id: 'UAV-03',
      callsign: 'VIPER-03 (RELAY ORBIT)',
      engine: 'Rotax 916 iS (S/N: RTX-0902)',
      status: 'CLIMB TO CRUISE',
      health: 99.1,
      rulHours: 1120.0,
      flightHours: 80.0,
      tboDueHours: 1120.0,
      nextMaintenanceDays: 90,
      subsystems: { combustion: 100, lubrication: 99, induction: 98, cooling: 99, vibration: 100 }
    },
    {
      id: 'UAV-04',
      callsign: 'VIPER-04 (PERIMETER PATROL)',
      engine: 'Rotax 915 iS (S/N: RTX-0754)',
      status: 'DERATED CRUISE',
      health: 84.5,
      rulHours: 420.0,
      flightHours: 780.0,
      tboDueHours: 420.0,
      nextMaintenanceDays: 14,
      subsystems: { combustion: 88, lubrication: 82, induction: 85, cooling: 86, vibration: 80 }
    },
    {
      id: 'UAV-05',
      callsign: 'VIPER-05 (HANGAR RESERVE)',
      engine: 'Rotax 915 iS (S/N: RTX-0699)',
      status: 'GROUND MAINTENANCE',
      health: 72.0,
      rulHours: 140.0,
      flightHours: 1060.0,
      tboDueHours: 140.0,
      nextMaintenanceDays: 2,
      subsystems: { combustion: 74, lubrication: 70, induction: 78, cooling: 75, vibration: 65 }
    }
  ];

  const currentUav = fleetData.find(u => u.id === selectedUav) || fleetData[0];

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-140px)] overflow-y-auto pr-1">
      {/* 1. Fleet Overview Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="hud-glass p-3 rounded-lg flex items-center gap-3">
          <div className="p-2.5 bg-hud-cyan/10 rounded border border-hud-cyan/30 text-hud-cyan">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">TOTAL SWARM ASSETS</div>
            <div className="font-mono text-2xl font-bold text-white">5 MALE UAVs</div>
          </div>
        </div>

        <div className="hud-glass p-3 rounded-lg flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">AIRBORNE / MISSION READY</div>
            <div className="font-mono text-2xl font-bold text-emerald-400">4 / 5 OPERATIONAL</div>
          </div>
        </div>

        <div className="hud-glass p-3 rounded-lg flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded border border-purple-500/30 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">FLEET MEAN HEALTH INDEX</div>
            <div className="font-mono text-2xl font-bold text-white">
              {(fleetData.reduce((acc, curr) => acc + curr.health, 0) / 5).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="hud-glass p-3 rounded-lg flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded border border-amber-500/30 text-amber-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">PENDING WORK ORDERS</div>
            <div className="font-mono text-2xl font-bold text-amber-400">2 SCHEDULED</div>
          </div>
        </div>
      </div>

      {/* 2. Swarm UAV Matrix Table */}
      <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-hud-cyan" />
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
              SWARM FLEET OPERATIONAL READINESS MATRIX
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">AUTO-SYNCHRONIZED (CAN & SATCOM)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">UAV ID / Callsign</th>
                <th className="py-2.5 px-3">Engine S/N</th>
                <th className="py-2.5 px-3">Mission Status</th>
                <th className="py-2.5 px-3">Health Index</th>
                <th className="py-2.5 px-3">Predicted RUL</th>
                <th className="py-2.5 px-3">Flight Hours</th>
                <th className="py-2.5 px-3">Next Maint.</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fleetData.map((uav) => {
                const isSelected = selectedUav === uav.id;
                const isCrit = uav.health < 50;
                const isDeg = uav.health >= 50 && uav.health < 80;

                return (
                  <tr
                    key={uav.id}
                    onClick={() => setSelectedUav(uav.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-hud-cyan/15 border-l-4 border-hud-cyan'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                      <Plane className="w-3.5 h-3.5 text-hud-cyan" />
                      {uav.callsign}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{uav.engine}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        uav.status.includes('EMERGENCY') || uav.status.includes('GROUND')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : uav.status.includes('DERATED')
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {uav.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${isCrit ? 'text-red-400' : isDeg ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {uav.health.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-hud-cyan font-bold">{uav.rulHours.toFixed(1)} hrs</td>
                    <td className="py-3 px-3 text-slate-300">{uav.flightHours} hrs</td>
                    <td className="py-3 px-3 text-slate-300">
                      {uav.nextMaintenanceDays === 0 ? (
                        <span className="text-red-400 font-bold animate-pulse">IMMEDIATE</span>
                      ) : (
                        `In ${uav.nextMaintenanceDays} days`
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="px-2 py-1 bg-slate-800 hover:bg-hud-cyan hover:text-black rounded text-[11px] transition-colors">
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Bottom Subsystem Heatmap for Selected Asset */}
      <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-hud-cyan" />
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
              DETAILED SUBSYSTEM HEATMAP FOR {currentUav.callsign}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">ENGINE TBO REMAINING: {currentUav.tboDueHours} HRS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(currentUav.subsystems).map(([subsystem, score]) => (
            <div key={subsystem} className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col gap-2">
              <div className="text-xs font-mono text-slate-400 uppercase">{subsystem}</div>
              <div className={`font-mono text-2xl font-bold ${
                score < 50 ? 'text-red-400' : score < 80 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {score}%
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    score < 50 ? 'bg-red-500' : score < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
