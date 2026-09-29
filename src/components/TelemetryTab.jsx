import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Droplets,
  Flame,
  Gauge,
  Radio,
  Sigma,
  Thermometer,
  TrendingUp,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { ArcGauge, Heatmap, LineChart, Sparkline } from './charts/Charts';
import {
  Badge,
  Callout,
  KeyValue,
  Panel,
  PanelBody,
  PanelHeader,
  SectionHeading,
  Segmented,
  StatTile,
  Table,
} from './ui/primitives';
import { correlationMatrix, describe, fmt, mean, spectrum, zScores } from '../utils/analytics';

/* =========================================================================
   Live telemetry — 100 Hz CAN stream rendered as real engineering charts
   ========================================================================= */

const GROUPS = {
  THERMAL: {
    label: 'Thermal',
    unit: '°C',
    series: [
      { id: 'egt1', label: 'EGT 1', color: '#FF9F0A' },
      { id: 'egt2', label: 'EGT 2', color: '#FFB84D' },
      { id: 'egt3', label: 'EGT 3', color: '#FF453A' },
      { id: 'egt4', label: 'EGT 4', color: '#E06C5C' },
    ],
    bounds: [780, 1020],
    thresholds: [
      { y: 950, color: '#FF453A', label: 'EGT limit 950 °C' },
      { y: 880, color: '#FF9F0A', label: 'continuous max 880 °C' },
    ],
  },
  LUBRICATION: {
    label: 'Lubrication',
    unit: 'bar',
    series: [
      { id: 'oilPress', label: 'Oil pressure', color: '#0A84FF' },
      { id: 'map', label: 'Manifold pressure', color: '#30D158' },
    ],
    bounds: [0.8, 5.6],
    thresholds: [
      { y: 2.5, color: '#FF453A', label: 'oil pressure low 2.5 bar' },
      { y: 3.1, color: '#FF9F0A', label: 'caution 3.1 bar' },
    ],
  },
  STRUCTURAL: {
    label: 'Structural',
    unit: 'gRMS',
    series: [{ id: 'vibration', label: 'Crankcase vibration', color: '#BF5AF2' }],
    bounds: [0, 2.4],
    thresholds: [{ y: 0.8, color: '#FF453A', label: 'airworthiness limit 0.8 gRMS' }],
  },
  FLUID: {
    label: 'Fluid',
    unit: '°C',
    series: [{ id: 'oilTemp', label: 'Oil temperature', color: '#64D2FF' }],
    bounds: [40, 150],
    thresholds: [
      { y: 115, color: '#FF9F0A', label: 'oil temp caution 115 °C' },
      { y: 130, color: '#FF453A', label: 'oil temp limit 130 °C' },
    ],
  },
};

const STAT_COLUMNS = [
  { key: 'label', label: 'Channel', render: (r) => <span className="text-ink">{r.label}</span> },
  { key: 'mean', label: 'Mean', align: 'right', render: (r) => <span className="font-mono">{fmt(r.mean, 2)}</span> },
  { key: 'std', label: 'σ', align: 'right', render: (r) => <span className="font-mono">{fmt(r.std, 3)}</span> },
  { key: 'min', label: 'Min', align: 'right', render: (r) => <span className="font-mono">{fmt(r.min, 1)}</span> },
  { key: 'max', label: 'Max', align: 'right', render: (r) => <span className="font-mono">{fmt(r.max, 1)}</span> },
  { key: 'p95', label: 'p95', align: 'right', render: (r) => <span className="font-mono">{fmt(r.p95, 1)}</span> },
  {
    key: 'slope',
    label: 'Trend / sample',
    align: 'right',
    render: (r) => (
      <span className="font-mono" style={{ color: r.slope > 0 ? '#FF9F0A' : '#0A84FF' }}>
        {r.slope > 0 ? '+' : ''}
        {fmt(r.slope, 4)}
      </span>
    ),
  },
  { key: 'r2', label: 'R²', align: 'right', render: (r) => <span className="font-mono text-ink-muted">{fmt(r.r2, 2)}</span> },
];

export const TelemetryTab = () => {
  const { telemetry, historyBuffer, isConnected } = useTelemetry();
  const [group, setGroup] = useState('THERMAL');
  const [showSparklines, setShowSparklines] = useState(true);

  const engine = telemetry.engine || {};
  const residuals = telemetry.residuals || {};
  const mission = telemetry.mission || {};
  const health = telemetry.health || {};

  const active = GROUPS[group];

  const chartSeries = useMemo(
    () =>
      active.series.map((s) => ({
        ...s,
        data: (historyBuffer?.[s.id] || []).map((v) => (Number.isFinite(v) ? v : null)),
      })),
    [active, historyBuffer],
  );

  const statsRows = useMemo(
    () =>
      [
        { key: 'egt3', label: 'EGT 3 (hottest)' },
        { key: 'cht3', label: 'CHT 3' },
        { key: 'oilPress', label: 'Oil pressure' },
        { key: 'oilTemp', label: 'Oil temperature' },
        { key: 'vibration', label: 'Vibration' },
        { key: 'map', label: 'Manifold pressure' },
      ].map((c) => ({ key: c.key, label: c.label, ...describe(historyBuffer?.[c.key] || [0]) })),
    [historyBuffer],
  );

  const corr = useMemo(
    () =>
      correlationMatrix({
        EGT3: historyBuffer?.egt3 || [],
        CHT3: historyBuffer?.cht3 || [],
        OIL_P: historyBuffer?.oilPress || [],
        OIL_T: historyBuffer?.oilTemp || [],
        VIB: historyBuffer?.vibration || [],
        MAP: historyBuffer?.map || [],
      }),
    [historyBuffer],
  );

  const vibeSpectrum = useMemo(() => spectrum(historyBuffer?.vibration || [], 18), [historyBuffer?.vibration]);
  const egtZ = useMemo(() => zScores(historyBuffer?.egt3 || []), [historyBuffer?.egt3]);
  const anomalyCount = egtZ.filter((z) => Math.abs(z) >= 2.5).length;

  const healthTone = health.status === 'CRITICAL' ? '#FF453A' : health.status === 'DEGRADED' ? '#FF9F0A' : '#30D158';

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title="Live telemetry"
        subtitle="Structured CAN 2.0B frames decoded at 100 Hz, downsampled to a 1 Hz analysis window. Charts carry real axes, threshold lines and crosshair readouts, with per-channel statistics and correlation analysis computed from the retained buffer."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={isConnected ? 'success' : 'warning'}>
              <Radio className="h-3 w-3" />
              {isConnected ? 'CAN link live' : 'Internal simulation bridge'}
            </Badge>
            <Badge tone="neutral">500 kbps · load 42%</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-5">
        <StatsGauge label="Crank speed" value={engine.rpm} unit="rpm" min={0} max={6000} tone="#0A84FF" sublabel={`Throttle ${fmt(engine.throttlePct, 0)}%`} />
        <StatsGauge label="Manifold pressure" value={engine.mapBar} unit="bar" min={0.4} max={2.4} tone="#30D158" sublabel={`λ ${fmt(engine.lambda, 2)}`} />
        <StatsGauge label="Oil pressure" value={engine.oilPressBar} unit="bar" min={0} max={5.5} tone="#64D2FF" sublabel={`Oil temp ${fmt(engine.oilTempC, 1)} °C`} />
        <StatsGauge label="Hottest EGT" value={Math.max(...(engine.egt || [0]))} unit="°C" min={600} max={1050} tone="#FF9F0A" sublabel={`CHT max ${fmt(Math.max(...(engine.cht || [0])), 1)} °C`} />
        <StatsGauge label="Vibration" value={engine.vibrationGrms} unit="gRMS" min={0} max={2.4} tone="#BF5AF2" sublabel={`Health ${fmt(health.index, 1)}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="Frequency-domain channel trace"
            subtitle={`${active.label} group · ${active.series.length} channel${active.series.length > 1 ? 's' : ''} · unit ${active.unit}`}
            icon={Activity}
            actions={
              <Segmented
                options={[
                  { value: 'THERMAL', label: 'Thermal' },
                  { value: 'LUBRICATION', label: 'Lubrication' },
                  { value: 'STRUCTURAL', label: 'Structural' },
                  { value: 'FLUID', label: 'Fluid' },
                ]}
                value={group}
                onChange={setGroup}
              />
            }
          />
          <PanelBody>
            <LineChart
              height={288}
              series={chartSeries}
              xLabels={historyBuffer?.timestamps || []}
              thresholds={active.thresholds}
              yMin={active.bounds[0]}
              yMax={active.bounds[1]}
              unit={active.unit}
              digits={active.unit === 'gRMS' ? 3 : 1}
              areaFill={chartSeries.length === 1}
            />
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              <KeyValue
                items={[
                  { label: 'Mission phase', value: mission.missionPhase || '—' },
                  { label: 'Altitude', value: `${mission.altitudeFt?.toLocaleString?.() ?? '—'} ft` },
                ]}
              />
              <KeyValue
                items={[
                  { label: 'Airspeed', value: `${fmt(mission.airspeedKts, 0)} kts` },
                  { label: 'Ambient', value: `${fmt(mission.ambientTempC, 1)} °C` },
                ]}
              />
              <KeyValue
                items={[
                  { label: 'Fuel flow', value: `${fmt(engine.fuelFlowLph, 1)} L/h` },
                  { label: 'Rail pressure', value: `${fmt(engine.fuelPressureBar, 2)} bar` },
                ]}
              />
              <KeyValue
                items={[
                  { label: 'Wastegate duty', value: `${fmt(engine.wastegateDutyPct, 0)}%` },
                  { label: 'Buffer depth', value: `${historyBuffer?.timestamps?.length ?? 0} samples` },
                ]}
              />
            </div>
          </PanelBody>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Channel statistics" subtitle="Retained 1 Hz window · least-squares trend" icon={Sigma} />
            <PanelBody className="p-0">
              <Table columns={STAT_COLUMNS} rows={statsRows} dense />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Outlier screen"
              subtitle={`EGT 3 · ${anomalyCount} sample${anomalyCount === 1 ? '' : 's'} beyond ±2.5σ`}
              icon={AlertTriangle}
              actions={<Badge tone={anomalyCount ? 'warning' : 'success'}>{anomalyCount ? 'attention' : 'clean'}</Badge>}
            />
            <PanelBody>
              <LineChart
                height={132}
                series={[{ id: 'z', label: 'z-score', color: '#FF9F0A', data: egtZ }]}
                thresholds={[
                  { y: 2.5, color: '#FF453A', label: '+2.5σ' },
                  { y: -2.5, color: '#FF453A', label: '−2.5σ' },
                ]}
                yMin={-4}
                yMax={4}
                unit="σ"
                legend={false}
                digits={2}
              />
              <div className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                Standardised residuals against the 40-sample rolling baseline; sustained excursions seed the anomaly channel used by the
                prognostics stack.
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel>
          <PanelHeader title="Cylinder residual balance" subtitle="Measured minus physics-model baseline" icon={Flame} />
          <PanelBody className="flex flex-col gap-3">
            <ResidualRow label="EGT residual" values={residuals.egtResiduals || [0, 0, 0, 0]} unit="°C" threshold={20} />
            <ResidualRow label="CHT residual" values={residuals.chtResiduals || [0, 0, 0, 0]} unit="°C" threshold={8} />
            <KeyValue
              columns={2}
              items={[
                { label: 'Max |residual|', value: `${fmt(residuals.maxResidualAbs, 2)} °C` },
                { label: 'Vibration Δ', value: `${fmt(residuals.vibrationResidual, 3)} gRMS` },
                { label: 'Oil pressure Δ', value: `${fmt(residuals.oilPressResidual, 2)} bar` },
                { label: 'MAP Δ', value: `${fmt(residuals.mapResidual, 3)} bar` },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Channel correlation" subtitle="Pearson r · 1 Hz window" icon={TrendingUp} />
          <PanelBody className="overflow-x-auto">
            <Heatmap keys={corr.keys} values={corr.values} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Vibration spectrum" subtitle="Order analysis, normalised" icon={Waves} />
          <PanelBody>
            <div className="flex h-[168px] items-end gap-1.5">
              {vibeSpectrum.map((v, i) => (
                <div key={`sp-${i}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(2, v)}%`,
                      background: v > 65 ? '#FF453A' : v > 35 ? '#FF9F0A' : '#64D2FF',
                      opacity: 0.85,
                    }}
                    title={`Order ${i + 1}: ${v.toFixed(1)}%`}
                  />
                  <span className="font-mono text-2xs text-ink-dim">{i + 1}x</span>
                </div>
              ))}
            </div>
            <KeyValue
              columns={2}
              className="mt-3"
              items={[
                { label: 'Fundamental', value: `${fmt((engine.rpm || 0) / 60, 1)} Hz (1x)` },
                { label: '2x order', value: `${fmt((engine.rpm || 0) / 30, 1)} Hz` },
                { label: 'Window', value: 'Hann, N=128' },
                { label: 'Sample rate', value: '1 Hz' },
              ]}
            />
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="CAN 2.0B frame decoder"
          subtitle="Raw binary frames as transmitted on the airframe bus"
          icon={Cpu}
          actions={<Badge tone="neutral">ID filter: 0x100 · 0x200 · 0x210 · 0x300</Badge>}
        />
        <PanelBody className="p-0">
          <Table
            columns={[
              { key: 'canId', label: 'CAN ID', render: (r) => <span className="font-mono text-ink">{r.canId}</span> },
              { key: 'dlc', label: 'DLC', align: 'right', render: (r) => <span className="font-mono">{r.dlc} B</span> },
              { key: 'rawHex', label: 'Payload (hex)', render: (r) => <span className="font-mono tracking-widest text-ink-muted">{r.rawHex}</span> },
              { key: 'decoded', label: 'Decoded signal', render: (r) => <span className="text-ink-faint">{r.decoded}</span> },
            ]}
            rows={(telemetry.canBusFrames || []).map((f, i) => ({ id: i, ...f, decoded: FRAME_DECODE[i] || '—' }))}
          />
        </PanelBody>
      </Panel>

      <Callout tone={health.status === 'NOMINAL' ? 'success' : 'warning'} icon={Droplets} title="Interpretation">
        {health.status === 'NOMINAL'
          ? 'All six monitored channels sit inside their airworthiness envelopes, and the residual balance across the four cylinders stays within the ±20 °C attribution band.'
          : `Detected deviation: ${health.alertMessage || 'channel excursion'} — link the residual attribution in the prognostics view to the specific cylinder and subsystem.`}
      </Callout>
    </div>
  );
};

const FRAME_DECODE = ['RPM / throttle / fuel flow / λ', 'EGT bank 1–4', 'CHT bank 1–4', 'MAP / oil pressure / vibration'];

const StatsGauge = ({ label, value, unit, min, max, tone, sublabel }) => (
  <div className="panel flex flex-col items-center px-3 py-3">
    <ArcGauge value={Number.isFinite(value) ? value : 0} min={min} max={max} unit={unit} tone={tone} size={124} />
    <div className="mt-1 text-[12px] font-medium text-ink">{label}</div>
    <div className="text-2xs text-ink-faint">{sublabel}</div>
  </div>
);

const ResidualRow = ({ label, values, unit, threshold }) => {
  const scale = Math.max(threshold * 1.8, ...values.map((v) => Math.abs(v))) || 1;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11.5px]">
        <span className="text-ink-faint">{label}</span>
        <span className="font-mono text-ink-dim">{`band ±${threshold}${unit}`}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {values.map((v, i) => {
          const pct = Math.min(100, (Math.abs(v) / scale) * 100);
          const breaching = Math.abs(v) > threshold;
          return (
            <div key={`${label}-${i}`} className="flex flex-col items-center gap-1">
              <div className="relative h-16 w-full overflow-hidden rounded bg-white/[0.04]">
                <div
                  className="absolute bottom-0 w-full rounded-t"
                  style={{ height: `${Math.max(4, pct)}%`, background: breaching ? '#FF453A' : '#0A84FF', opacity: 0.8 }}
                />
              </div>
              <span className="font-mono text-2xs" style={{ color: breaching ? '#FF918B' : '#7c7c82' }}>
                {v > 0 ? '+' : ''}
                {v.toFixed(1)}
              </span>
              <span className="text-2xs text-ink-dim">C{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
