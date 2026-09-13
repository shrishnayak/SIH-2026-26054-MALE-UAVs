import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { 
  Brain, 
  Cpu, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  Activity, 
  BarChart3, 
  HelpCircle,
  Clock,
  Gauge
} from 'lucide-react';

export const PrognosticsTab = () => {
  const { telemetry, aiPrognostics, historyBuffer } = useTelemetry();

  // SHAP Feature Attribution items
  const attributions = aiPrognostics.feature_attributions || {};
  const sortedAttrs = Object.entries(attributions)
    .map(([feature, importance]) => ({ feature, importance }))
    .sort((a, b) => b.importance - a.importance);

  const isAnomaly = aiPrognostics.is_anomaly;

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-140px)] overflow-y-auto pr-1">
      {/* 1. AI Health Status & RUL Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Engine Health Index */}
        <div className={`p-4 rounded-lg border transition-all ${
          aiPrognostics.engine_health_index < 40
            ? 'bg-red-950/40 border-red-500/60 shadow-hud-red'
            : aiPrognostics.engine_health_index < 75
            ? 'bg-amber-950/40 border-amber-500/60 shadow-hud-amber'
            : 'hud-glass'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>ENGINE HEALTH INDEX</span>
            <Activity className="w-4 h-4 text-hud-cyan" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-white tracking-tight">
              {aiPrognostics.engine_health_index.toFixed(1)}%
            </span>
            <span className={`text-xs font-mono font-bold ${
              aiPrognostics.engine_health_index < 40 ? 'text-red-400' : aiPrognostics.engine_health_index < 75 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {aiPrognostics.severity_level}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                aiPrognostics.engine_health_index < 40 ? 'bg-red-500' : aiPrognostics.engine_health_index < 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${aiPrognostics.engine_health_index}%` }}
            ></div>
          </div>
        </div>

        {/* PyTorch LSTM Predicted RUL */}
        <div className="hud-glass p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>PREDICTED RUL (LSTM)</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-emerald-400 tracking-tight">
              {aiPrognostics.rul_hours_mean.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">FLIGHT HOURS</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
            <span>95% CONFIDENCE INTERVAL:</span>
            <span className="text-hud-cyan font-bold">
              [{aiPrognostics.rul_hours_lower_95.toFixed(1)} - {aiPrognostics.rul_hours_upper_95.toFixed(1)}] hrs
            </span>
          </div>
        </div>

        {/* Autoencoder Micro-Anomaly Score */}
        <div className="hud-glass p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>AUTOENCODER RECON MSE</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-black tracking-tight ${isAnomaly ? 'text-red-400' : 'text-purple-300'}`}>
              {aiPrognostics.reconstruction_mse.toFixed(5)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
            <span>ANOMALY THRESHOLD:</span>
            <span className="text-slate-300 font-bold">0.08500</span>
          </div>
        </div>

        {/* Diagnosed Subsystem Fault Mode */}
        <div className="hud-glass p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>DIAGNOSED ROOT CAUSE</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-sm font-bold text-slate-200 uppercase line-clamp-1">
            {aiPrognostics.diagnosed_fault.replace(/_/g, ' ')}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
            <span>LEAD ATTRIBUTION:</span>
            <span className="text-amber-400 font-bold">{aiPrognostics.dominant_root_cause_feature}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Middle Row: LSTM Degradation Decay Forecast & Autoencoder Anomaly Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LSTM Degradation Decay Curve Chart */}
        <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
                LSTM REMAINING USEFUL LIFE (RUL) DECAY TRAJECTORY & 95% CI
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">TBO HORIZON: 1,200 HRS</span>
          </div>

          <div className="h-56 w-full relative bg-slate-950/80 rounded border border-slate-800 p-2 flex flex-col justify-between">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              {/* Horizontal Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#1e293b" strokeDasharray="3,3" />

              {/* Y Axis Labels */}
              <text x="5" y="24" fill="#64748b" fontSize="10" fontFamily="Amazon Ember, Segoe UI, sans-serif">800h</text>
              <text x="5" y="64" fill="#64748b" fontSize="10" fontFamily="Amazon Ember, Segoe UI, sans-serif">400h</text>
              <text x="5" y="104" fill="#64748b" fontSize="10" fontFamily="Amazon Ember, Segoe UI, sans-serif">100h</text>
              <text x="15" y="144" fill="#ef4444" fontSize="10" fontFamily="Amazon Ember, Segoe UI, sans-serif">0h (EOL)</text>

              {/* Shaded 95% Confidence Interval polygon */}
              {isAnomaly ? (
                <polygon
                  points="40,30 180,60 300,120 420,150 420,165 300,145 180,95 40,45"
                  fill="rgba(239, 68, 68, 0.18)"
                />
              ) : (
                <polygon
                  points="40,25 150,28 300,35 480,45 480,65 300,50 150,40 40,35"
                  fill="rgba(16, 185, 129, 0.15)"
                />
              )}

              {/* Mean RUL Trajectory Path */}
              {isAnomaly ? (
                <path
                  d="M 40 38 Q 180 75 300 135 T 420 158"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M 40 30 Q 200 36 340 44 T 480 55"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Critical Intercept Point marker */}
              {isAnomaly && (
                <g transform="translate(420, 158)">
                  <circle r="5" fill="#EF4444" className="animate-ping" />
                  <circle r="4" fill="#EF4444" />
                    <text x="-45" y="-12" fill="#EF4444" fontSize="11" fontFamily="Amazon Ember, Segoe UI, sans-serif" fontWeight="bold">
                    CRITICAL LIMIT
                  </text>
                </g>
              )}
            </svg>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
              <span>CURRENT TIME (T=0)</span>
              <span>MISSION FORECAST HORIZON (+20 HRS)</span>
            </div>
          </div>
        </div>

        {/* Explainable AI (XAI) SHAP Feature Attribution Bars */}
        <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
                XAI SHAP FEATURE ATTRIBUTION BREAKDOWN
              </h3>
            </div>
            <span className="text-xs font-mono text-purple-400">LOCAL EXPLANATION</span>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {sortedAttrs.slice(0, 7).map(({ feature, importance }, idx) => {
              const isLead = idx === 0 && importance > 25;
              return (
                <div key={feature} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={isLead ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {feature.replace(/_/g, ' ')}
                    </span>
                    <span className={isLead ? 'text-red-400 font-bold' : 'text-hud-cyan'}>
                      {importance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLead ? 'bg-red-500' : 'bg-hud-cyan'
                      }`}
                      style={{ width: `${Math.min(100, importance)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Subsystem Degradation Matrix */}
      <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-hud-cyan" />
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
              ROTAX 915 iS ENGINE HEALTH STATUS MATRIX
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">5 MULTI-DISCIPLINARY PHYSICAL DOMAINS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              domain: 'COMBUSTION',
              health: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('EGT') ? 35 : 99,
              status: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('EGT') ? 'FAILING' : 'HEALTHY',
              metric: 'EGT Balance Δ < 15°C'
            },
            {
              domain: 'LUBRICATION',
              health: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('Oil') ? 28 : 98,
              status: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('Oil') ? 'CRITICAL' : 'HEALTHY',
              metric: 'Hydrodynamic Film > 2.5 bar'
            },
            {
              domain: 'TURBOCHARGING',
              health: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('MAP') ? 52 : 99,
              status: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('MAP') ? 'DEGRADED' : 'HEALTHY',
              metric: 'Wastegate Servo Duty 62%'
            },
            {
              domain: 'COOLING / RADIATOR',
              health: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('CHT') ? 42 : 98,
              status: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('CHT') ? 'ELEVATED' : 'HEALTHY',
              metric: 'Coolant Delta 12.5°C'
            },
            {
              domain: 'STRUCTURAL DYNAMICS',
              health: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('Vibration') ? 30 : 97,
              status: isAnomaly && aiPrognostics.dominant_root_cause_feature.includes('Vibration') ? 'CRITICAL' : 'HEALTHY',
              metric: 'Broadband Energy < 0.45g'
            }
          ].map((sub, idx) => (
            <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{sub.domain}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  sub.status === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {sub.status}
                </span>
              </div>
              <div className="font-mono text-2xl font-bold text-white">
                {sub.health}%
              </div>
              <div className="text-[10px] font-mono text-slate-400">{sub.metric}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
