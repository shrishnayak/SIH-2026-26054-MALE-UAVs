import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { 
  Activity, 
  Gauge, 
  Thermometer, 
  Flame, 
  Radio, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Maximize2 
} from 'lucide-react';

// Reusable SVG Radial Gauge Component
const RadialGauge = ({ value, min, max, label, unit, criticalLow, warningLow, warningHigh, criticalHigh, precision = 1 }) => {
  const clampedVal = Math.max(min, Math.min(max, value));
  const pct = (clampedVal - min) / (max - min);
  const angle = pct * 180 - 90; // -90 to +90 deg

  let color = '#10B981'; // Green
  if ((criticalHigh && value >= criticalHigh) || (criticalLow && value <= criticalLow)) {
    color = '#EF4444'; // Red
  } else if ((warningHigh && value >= warningHigh) || (warningLow && value <= warningLow)) {
    color = '#F59E0B'; // Amber
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-900/80 border border-slate-800 rounded-lg relative overflow-hidden">
      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="relative w-28 h-16 flex items-end justify-center">
        {/* Gauge Background Arc */}
        <svg viewBox="0 0 100 55" className="w-full h-full">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active Colored Value Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="126"
            strokeDashoffset={126 - (pct * 126)}
            className="transition-all duration-150"
          />
        </svg>
        {/* Value Text */}
        <div className="absolute bottom-0 text-center">
          <span className="font-mono text-lg font-bold text-white tracking-tight">
            {typeof value === 'number' ? value.toFixed(precision) : value}
          </span>
          <span className="text-[10px] font-mono text-slate-400 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );
};

// Reusable SVG Dynamic Line Chart for Telemetry Streams
const DynamicSparkline = ({ data, color = '#19C7A5', min, max, label, currentVal, unit }) => {
  const points = data && data.length > 0 ? data : Array(40).fill(min);
  const dataMin = min !== undefined ? min : Math.min(...points) * 0.95;
  const dataMax = max !== undefined ? max : Math.max(...points) * 1.05;
  const range = dataMax - dataMin || 1;

  const width = 300;
  const height = 70;

  const svgPoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - dataMin) / range) * (height - 12) - 6;
      return `${x},${Math.max(4, Math.min(height - 4, y))}`;
    })
    .join(' ');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-slate-300 font-medium">{label}</span>
        <span className="font-mono text-sm font-bold" style={{ color }}>
          {currentVal} <span className="text-[10px] text-slate-400">{unit}</span>
        </span>
      </div>
      <div className="w-full h-16 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Subtle Grid Lines */}
          <line x1="0" y1="10" x2={width} y2="10" stroke="#1e293b" strokeDasharray="3,3" />
          <line x1="0" y1="35" x2={width} y2="35" stroke="#1e293b" strokeDasharray="3,3" />
          <line x1="0" y1="60" x2={width} y2="60" stroke="#1e293b" strokeDasharray="3,3" />

          {/* Sparkline Gradient Fill */}
          <defs>
            <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Polyline Path */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={svgPoints}
          />
        </svg>
      </div>
    </div>
  );
};

export const TelemetryTab = () => {
  const { telemetry, historyBuffer } = useTelemetry();
  const { engine, residuals, canBusFrames } = telemetry;

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-140px)] overflow-y-auto pr-1">
      {/* 1. Primary Engine Gauge Cluster */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <RadialGauge
          label="ENGINE RPM"
          value={engine.rpm}
          min={2000}
          max={6000}
          unit="RPM"
          warningHigh={5500}
          criticalHigh={5800}
          precision={0}
        />
        <RadialGauge
          label="THROTTLE"
          value={engine.throttlePct}
          min={0}
          max={100}
          unit="%"
          warningHigh={95}
          precision={1}
        />
        <RadialGauge
          label="MANIFOLD PRESS (MAP)"
          value={engine.mapBar}
          min={0.6}
          max={2.2}
          unit="bar"
          warningHigh={1.75}
          criticalHigh={1.9}
          precision={2}
        />
        <RadialGauge
          label="OIL PRESSURE"
          value={engine.oilPressBar}
          min={0.5}
          max={6.0}
          unit="bar"
          criticalLow={1.8}
          warningLow={2.5}
          precision={2}
        />
        <RadialGauge
          label="OIL TEMP"
          value={engine.oilTempC}
          min={50}
          max={150}
          unit="°C"
          warningHigh={115}
          criticalHigh={130}
          precision={1}
        />
        <RadialGauge
          label="VIBRATION (g-RMS)"
          value={engine.vibrationGrms}
          min={0.0}
          max={3.0}
          unit="g"
          warningHigh={0.8}
          criticalHigh={1.4}
          precision={3}
        />
      </div>

      {/* 2. Thermodynamic Channel Bars: EGT 1-4 & CHT 1-4 vs Physics Residuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exhaust Gas Temperature (EGT) Channel Cluster */}
        <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
                EXHAUST GAS TEMPERATURE (EGT 1–4) & RESIDUALS
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">REDLINE: 950°C</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {engine.egt.map((val, idx) => {
              const res = residuals.egtResiduals[idx];
              const isCrit = val > 920;
              const isWarn = val > 880;
              const barColor = isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-col items-center">
                  <div className="text-[11px] font-mono text-slate-400">CYL {idx + 1}</div>
                  <div className={`font-mono text-base font-bold my-1 ${isCrit ? 'text-red-400 animate-pulse' : isWarn ? 'text-amber-400' : 'text-slate-200'}`}>
                    {val.toFixed(1)}°C
                  </div>
                  {/* Vertical Progress Bar */}
                  <div className="w-full bg-slate-900 h-20 rounded-sm overflow-hidden flex items-end p-0.5">
                    <div
                      className={`w-full ${barColor} transition-all duration-200 rounded-sm`}
                      style={{ height: `${Math.min(100, Math.max(10, ((val - 700) / 300) * 100))}%` }}
                    ></div>
                  </div>
                  {/* Delta Residual */}
                  <div className={`text-[10px] font-mono mt-2 px-1 rounded ${res > 30 ? 'bg-red-950 text-red-300 font-bold' : 'text-slate-400'}`}>
                    Δ {res > 0 ? `+${res.toFixed(1)}` : res.toFixed(1)}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cylinder Head Temperature (CHT) Channel Cluster */}
        <div className="hud-glass rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-xs tracking-wider text-slate-200">
                CYLINDER HEAD TEMPERATURE (CHT 1–4) & RESIDUALS
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">REDLINE: 135°C</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {engine.cht.map((val, idx) => {
              const res = residuals.chtResiduals[idx];
              const isCrit = val > 130;
              const isWarn = val > 120;
              const barColor = isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-cyan-500';

              return (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-col items-center">
                  <div className="text-[11px] font-mono text-slate-400">CYL {idx + 1}</div>
                  <div className={`font-mono text-base font-bold my-1 ${isCrit ? 'text-red-400 animate-pulse' : isWarn ? 'text-amber-400' : 'text-slate-200'}`}>
                    {val.toFixed(1)}°C
                  </div>
                  {/* Vertical Progress Bar */}
                  <div className="w-full bg-slate-900 h-20 rounded-sm overflow-hidden flex items-end p-0.5">
                    <div
                      className={`w-full ${barColor} transition-all duration-200 rounded-sm`}
                      style={{ height: `${Math.min(100, Math.max(10, ((val - 80) / 70) * 100))}%` }}
                    ></div>
                  </div>
                  {/* Delta Residual */}
                  <div className={`text-[10px] font-mono mt-2 px-1 rounded ${res > 15 ? 'bg-red-950 text-red-300 font-bold' : 'text-slate-400'}`}>
                    Δ {res > 0 ? `+${res.toFixed(1)}` : res.toFixed(1)}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Live 100 Hz Streaming Time-Series Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <DynamicSparkline
          label="CYL 3 EGT (°C)"
          data={historyBuffer.egt3}
          currentVal={engine.egt[2]}
          color="#EF4444"
          min={800}
          max={1000}
          unit="°C"
        />
        <DynamicSparkline
          label="VIBRATION (g-RMS)"
          data={historyBuffer.vibration}
          currentVal={engine.vibrationGrms}
          color="#F59E0B"
          min={0.1}
          max={2.5}
          unit="g"
        />
        <DynamicSparkline
          label="OIL PRESSURE (bar)"
          data={historyBuffer.oilPress}
          currentVal={engine.oilPressBar}
          color="#19C7A5"
          min={1.0}
          max={5.5}
          unit="bar"
        />
        <DynamicSparkline
          label="MANIFOLD PRESSURE (bar)"
          data={historyBuffer.map}
          currentVal={engine.mapBar}
          color="#10B981"
          min={0.8}
          max={2.2}
          unit="bar"
        />
      </div>

      {/* 4. CAN Bus Raw Packet Hex Sniffer */}
      <div className="hud-glass rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-hud-cyan animate-pulse" />
            <span className="font-mono text-xs font-bold text-hud-cyan">
              100 HZ CAN 2.0B TELEMETRY STREAM (BINARY FRAME PARSER)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">BAUDRATE: 500 KBPS | BUS LOAD: 42%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {canBusFrames.map((frame, idx) => (
            <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-hud-cyan font-bold">ID: {frame.canId}</span>
                <span className="text-[10px]">DLC: {frame.dlc} BYTES</span>
              </div>
              <div className="text-slate-200 tracking-widest bg-slate-900 px-1.5 py-0.5 rounded text-center border border-slate-800/80">
                {frame.rawHex}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
