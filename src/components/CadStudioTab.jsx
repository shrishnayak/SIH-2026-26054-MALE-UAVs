import React, { useMemo, useState } from 'react';
import {
  Activity,
  Boxes,
  Camera,
  Crosshair,
  Eye,
  Flame,
  Gauge,
  Layers,
  Move3d,
  Orbit,
  Plane,
  Ruler,
  Scan,
  Sparkles,
  ThermometerSnowflake,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { RotaxEngine } from './uav/RotaxEngine';
import { UavAirframe } from './uav/UavAirframe';
import { MODEL_FRAMES, ModelStage } from './uav/ModelStage';
import { AttributionBars, LineChart } from './charts/Charts';
import {
  Badge,
  Callout,
  KeyValue,
  Panel,
  PanelBody,
  PanelHeader,
  SectionHeading,
  Segmented,
  Slider,
  StatTile,
  Toggle,
  ToolButton,
} from './ui/primitives';
import { mean, spectrum } from '../utils/analytics';
import { tacticalAudio } from '../utils/tacticalAudio';

/* =========================================================================
   CAD Studio — macOS-style inspector + studio-lit 3D workbench
   ========================================================================= */

const PART_LIBRARY = {
  POWERTRAIN: [
    { id: 'ENGINE_BLOCK', label: 'Crankcase', icon: Boxes },
    { id: 'CYLINDER_1', label: 'Cylinder 1', icon: Flame },
    { id: 'CYLINDER_2', label: 'Cylinder 2', icon: Flame },
    { id: 'CYLINDER_3', label: 'Cylinder 3', icon: Flame },
    { id: 'CYLINDER_4', label: 'Cylinder 4', icon: Flame },
    { id: 'CAM_COVER', label: 'Cam cover', icon: Layers },
    { id: 'INTAKE_SYSTEM', label: 'Intake system', icon: Wind },
    { id: 'EXHAUST_SYSTEM', label: 'Exhaust', icon: Waves },
    { id: 'TURBOCHARGER', label: 'Turbocharger', icon: Zap },
    { id: 'PSRU', label: 'PSRU + spinner', icon: Orbit },
    { id: 'ACCESSORY_SYSTEM', label: 'Cooling & oil', icon: ThermometerSnowflake },
    { id: 'IGNITION_SYSTEM', label: 'Ignition rail', icon: Zap },
  ],
  AIRFRAME: [
    { id: 'FUSELAGE', label: 'Fuselage shell', icon: Plane },
    { id: 'WING', label: 'Wing assembly', icon: Move3d },
    { id: 'V_TAIL', label: 'V-tail', icon: Move3d },
    { id: 'PROPELLER', label: 'Pusher propeller', icon: Orbit },
    { id: 'EO_IR_TURRET', label: 'EO/IR turret', icon: Eye },
    { id: 'LANDING_GEAR', label: 'Landing gear', icon: Wrench },
    { id: 'PAYLOAD', label: 'Effector pylons', icon: Crosshair },
    { id: 'DAS', label: 'Belly sensor farm', icon: Scan },
  ],
};

const VIEW_OPTIONS = [
  { value: 'HERO', label: 'Hero' },
  { value: 'ISO', label: 'ISO' },
  { value: 'FRONT', label: 'Front' },
  { value: 'SIDE', label: 'Side' },
  { value: 'TOP', label: 'Top' },
  { value: 'DETAIL', label: 'Detail' },
];

const MODEL_OPTIONS = [
  { value: 'POWERTRAIN', label: 'Powertrain', icon: Gauge },
  { value: 'AIRFRAME', label: 'Airframe', icon: Plane },
  { value: 'ASSEMBLY', label: 'Assembly', icon: Boxes },
];

const SPEC_SHEET = [
  { label: 'Type', value: 'Turbocharged opposed-4' },
  { label: 'Displacement', value: '1,352 cc' },
  { label: 'Max continuous', value: '141 hp @ 5,800 rpm' },
  { label: 'Take-off power', value: '180 hp @ 5,800 rpm' },
  { label: 'Bore × stroke', value: '84.0 × 61.0 mm' },
  { label: 'Compression ratio', value: '10.4 : 1' },
  { label: 'Fuel system', value: 'Dual FADEC, port injection' },
  { label: 'Cooling', value: 'Liquid / ram-air hybrid' },
  { label: 'Propeller drive', value: 'PSRU 2.43 : 1' },
  { label: 'Dry mass (installed)', value: '86.4 kg' },
];

const PRIMITIVE_COUNT = { POWERTRAIN: '263', AIRFRAME: '118', ASSEMBLY: '381' };

export const CadStudioTab = () => {
  const { telemetry, historyBuffer } = useTelemetry();
  const [model, setModel] = useState('POWERTRAIN');
  const [cameraView, setCameraView] = useState('HERO');
  const [explode, setExplode] = useState(0);
  const [grid, setGrid] = useState(true);
  const [shadows, setShadows] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [cutaway, setCutaway] = useState(false);
  const [spin, setSpin] = useState(true);
  const [selected, setSelected] = useState('CYLINDER_3');

  const engine = telemetry.engine;
  const health = telemetry.health;
  const residuals = telemetry.residuals;

  const egt = engine?.egt || [840, 840, 840, 840];
  const cht = engine?.cht || [106, 106, 106, 106];
  const egtMean = mean(egt);
  const egtDeviation = egt.map((v, i) => ({ label: `Cyl ${i + 1}`, value: v - egtMean }));

  const faultCylinders = useMemo(
    () =>
      (residuals?.egtResiduals || [0, 0, 0, 0])
        .map((v, i) => (Math.abs(v) > 35 ? `CYLINDER_${i + 1}` : null))
        .filter(Boolean),
    [residuals?.egtResiduals],
  );

  const fft = useMemo(() => spectrum(historyBuffer?.vibration || [], 24), [historyBuffer?.vibration]);
  const fftLabels = useMemo(() => fft.map((_, i) => `${i + 1}x`), [fft]);

  const xrayMode = wireframe ? 'WIREFRAME' : 'PBR';
  const frames = MODEL_FRAMES[model] || MODEL_FRAMES.POWERTRAIN;
  const parts = PART_LIBRARY[model] || PART_LIBRARY.POWERTRAIN;

  const onSelectPart = (id) => {
    tacticalAudio.playChirp();
    setSelected(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title="CAD Studio"
        subtitle="Parametric powertrain and airframe assemblies, studio-lit and fully explorable. Orbit to inspect any sub-assembly, drag the explode slider to separate the stack, and click any component for live telemetry, tolerances and part data."
        actions={
          <Segmented
            options={MODEL_OPTIONS}
            value={model}
            onChange={(v) => {
              tacticalAudio.playClick();
              setModel(v);
              setExplode(0);
              setCameraView('HERO');
            }}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[268px_minmax(0,1fr)_300px]">
        {/* ------------------------------- INSPECTOR ------------------------ */}
        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHeader title="Inspector" subtitle="Viewport & render state" icon={Layers} />
            <PanelBody className="flex flex-col gap-3">
              <div>
                <div className="mb-2 text-[11px] font-medium text-ink-faint">Camera preset</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {VIEW_OPTIONS.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => {
                        tacticalAudio.playClick();
                        setCameraView(v.value);
                      }}
                      className={`rounded-lg border px-2 py-1.5 text-[11.5px] transition ${
                        cameraView === v.value
                          ? 'border-accent/50 bg-accent/15 text-ink'
                          : 'border-line bg-white/[0.03] text-ink-muted hover:bg-white/[0.06]'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <Slider
                label="Exploded separation"
                value={Math.round(explode * 100)}
                min={0}
                max={120}
                onChange={(v) => setExplode(v / 100)}
                format={(v) => `${v}%`}
              />

              <div className="hairline" />

              <Toggle checked={wireframe} onChange={setWireframe} label="Wireframe mode" hint="Edge-only geometry" />
              <Toggle checked={cutaway} onChange={setCutaway} label="Section cutaway" hint="Reveal bores & pistons" />
              <Toggle checked={spin} onChange={setSpin} label="Live rotation" hint="Crank, prop & turbo" />
              <Toggle checked={grid} onChange={setGrid} label="Ground grid" hint="CAD reference plane" />
              <Toggle checked={shadows} onChange={setShadows} label="Contact shadows" hint="Floor occlusion" />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Assembly tree" subtitle={`${parts.length} components`} icon={Boxes} />
            <PanelBody className="max-h-[380px] overflow-y-auto p-2 scroll-thin">
              {parts.map((p) => {
                const Icon = p.icon;
                const isFault = p.id.startsWith('CYLINDER') && faultCylinders.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPart(p.id)}
                    className={`sidebar-item ${selected === p.id ? 'is-active' : ''}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{p.label}</span>
                    {isFault ? <span className="count" style={{ color: '#FF918B' }}>Δ</span> : null}
                  </button>
                );
              })}
            </PanelBody>
          </Panel>
        </div>

        {/* ------------------------------- VIEWPORT ------------------------- */}
        <div className="flex flex-col gap-3">
          <div className="viewport-frame" style={{ height: 'min(64vh, 620px)' }}>
            <ModelStage
              frames={frames}
              view={cameraView}
              grid={grid}
              shadows={shadows}
              framing={model === 'POWERTRAIN' ? 6 : 12}
              minDistance={0.8}
              maxDistance={model === 'POWERTRAIN' ? 14 : 26}
            >
              {model !== 'AIRFRAME' ? (
                <group
                  position={model === 'ASSEMBLY' ? [1.3, -0.55, 1.95] : [0, -0.18, 0]}
                  rotation={model === 'ASSEMBLY' ? [0, 0.5, 0] : [0, 0, 0]}
                  scale={model === 'ASSEMBLY' ? 1.15 : 1}
                >
                  <RotaxEngine
                    rpm={engine?.rpm || 4800}
                    explode={model === 'ASSEMBLY' ? 0.35 : explode}
                    xrayMode={xrayMode}
                    selected={selected}
                    onSelect={onSelectPart}
                    faultCylinders={faultCylinders}
                    cutaway={cutaway}
                    spin={spin}
                  />
                </group>
              ) : null}

              {model !== 'POWERTRAIN' ? (
                <group position={model === 'ASSEMBLY' ? [-1.5, 0.62, -0.15] : [0, 0.35, 0]}>
                  <UavAirframe
                    rpm={engine?.rpm || 4800}
                    explode={model === 'ASSEMBLY' ? 0 : explode}
                    xrayMode={xrayMode}
                    selected={selected}
                    onSelect={onSelectPart}
                  />
                </group>
              ) : null}
            </ModelStage>

            <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
              <div className="viewport-overlay pointer-events-auto flex items-center gap-2 px-2.5 py-1.5">
                <Crosshair className="h-3.5 w-3.5 text-ink-faint" />
                <span className="font-mono text-[11px] text-ink-muted">
                  {selected}
                  {faultCylinders.includes(selected) ? ' · deviation flagged' : ''}
                </span>
              </div>
              <div className="viewport-overlay pointer-events-auto flex items-center gap-1 p-1">
                <ToolButton title="Hero view" active={cameraView === 'HERO'} onClick={() => setCameraView('HERO')}>
                  <Camera className="h-4 w-4" />
                </ToolButton>
                <ToolButton title="Wireframe" active={wireframe} onClick={() => setWireframe(!wireframe)}>
                  <Scan className="h-4 w-4" />
                </ToolButton>
                <ToolButton title="Section cutaway" active={cutaway} onClick={() => setCutaway(!cutaway)}>
                  <Ruler className="h-4 w-4" />
                </ToolButton>
                <ToolButton title="Exploded view" active={explode > 0.02} onClick={() => setExplode(explode > 0.02 ? 0 : 0.75)}>
                  <Boxes className="h-4 w-4" />
                </ToolButton>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
              <div className="viewport-overlay px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted">
                {model} · {PRIMITIVE_COUNT[model]} primitives · ACES tone-mapped PBR · drag to orbit · wheel to zoom
              </div>
              <div className="viewport-overlay px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted">
                RPM {engine?.rpm} · MAP {engine?.mapBar?.toFixed?.(2)} bar · OIL {engine?.oilPressBar?.toFixed?.(2)} bar
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Health index" value={health?.index?.toFixed?.(1) ?? '—'} unit="%" icon={Gauge} hint={health?.status} />
            <StatTile
              label="Crank speed"
              value={engine?.rpm?.toLocaleString?.() ?? '—'}
              unit="rpm"
              icon={Activity}
              hint={`Throttle ${engine?.throttlePct?.toFixed?.(0) ?? '—'}%`}
            />
            <StatTile
              label="Vibration"
              value={engine?.vibrationGrms?.toFixed?.(3) ?? '—'}
              unit="gRMS"
              icon={Waves}
              hint={`Δ ${residuals?.vibrationResidual?.toFixed?.(3) ?? '—'}`}
            />
            <StatTile
              label="Manifold pressure"
              value={engine?.mapBar?.toFixed?.(2) ?? '—'}
              unit="bar"
              icon={Zap}
              hint={`Wastegate ${engine?.wastegateDutyPct?.toFixed?.(0) ?? '—'}%`}
            />
          </div>
        </div>

        {/* ------------------------------- SPEC PANEL ----------------------- */}
        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHeader title="VRDE 180 HP" subtitle="Type-certificate data sheet" icon={Ruler} />
            <PanelBody>
              <KeyValue items={SPEC_SHEET} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Cylinder thermal balance"
              subtitle={`Mean EGT ${egtMean.toFixed(1)} °C vs learned baseline`}
              icon={Flame}
              actions={
                <Badge tone={Math.max(...egt) - Math.min(...egt) > 18 ? 'warning' : 'success'}>
                  {`spread ${(Math.max(...egt) - Math.min(...egt)).toFixed(1)} °C`}
                </Badge>
              }
            />
            <PanelBody>
              <AttributionBars items={egtDeviation} unit="°C" digits={1} />
              <div className="mt-3">
                <KeyValue
                  items={[
                    { label: 'CHT 1 / 2', value: `${cht[0]?.toFixed?.(1) ?? '—'} / ${cht[1]?.toFixed?.(1) ?? '—'} °C` },
                    { label: 'CHT 3 / 4', value: `${cht[2]?.toFixed?.(1) ?? '—'} / ${cht[3]?.toFixed?.(1) ?? '—'} °C` },
                  ]}
                />
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Vibration signature" subtitle="Hann-windowed DFT · crankcase gRMS" icon={Waves} />
            <PanelBody>
              <LineChart
                height={130}
                series={[{ id: 'fft', label: 'Amplitude', color: '#64D2FF', data: fft, area: true }]}
                xLabels={fftLabels}
                yMin={0}
                yMax={100}
                unit="%"
                legend={false}
                digits={0}
                areaFill
              />
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                Order-1 and order-2 peaks follow crank rotational frequency. Rising 3x–4x energy combined with oil-pressure loss is the
                signature the physics-informed network uses for bearing-wear attribution.
              </p>
            </PanelBody>
          </Panel>

          <Callout
            tone={health?.status === 'NOMINAL' ? 'success' : health?.status === 'DEGRADED' ? 'warning' : 'danger'}
            icon={Sparkles}
            title="Model note"
          >
            {faultCylinders.length
              ? `Thermal gradient on ${faultCylinders.join(', ')} exceeds the 35 °C attribution band — switch to section cutaway to inspect bore condition.`
              : 'All instrumented channels sit inside the learned envelope. No structural deviation flagged for the current geometry.'}
          </Callout>
        </div>
      </div>
    </div>
  );
};

