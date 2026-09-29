import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Boxes,
  Brain,
  ChevronRight,
  FileText as FileTextIcon,
  Gauge,
  Layers,
  LineChart as LineChartIcon,
  Map as MapIcon,
  Plane,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { RotaxEngine } from '../uav/RotaxEngine';
import { UavAirframe } from '../uav/UavAirframe';
import { MODEL_FRAMES, ModelStage } from '../uav/ModelStage';
import { LineChart, RadarChart, Sparkline } from '../charts/Charts';
import { Badge, Callout, KeyValue, Panel, PanelBody, PanelHeader, SectionHeading } from '../ui/primitives';
import { describe, fmt } from '../../utils/analytics';
import { tacticalAudio } from '../../utils/tacticalAudio';

/* =========================================================================
   Product landing page — macOS chrome, engineering-first storytelling,
   scroll-driven motion: reveals, scroll-spy nav, rolling stats, marquee.
   ========================================================================= */

const NAV_LINKS = [
  { id: 'overview', label: 'Overview' },
  { id: 'powertrain', label: 'Powertrain' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'specs', label: 'Specifications' },
];

const FEATURES = [
  {
    icon: Boxes,
    title: 'Studio-grade CAD workbench',
    body: 'A 1,352 cc opposed-four assembled from machined geometry — finned barrels, chrome intake runners, brass fuel rails, turbocharger, PSRU and spinner — rendered with physically based metal and shadow occlusion.',
    tag: 'CAD Studio',
  },
  {
    icon: Brain,
    title: 'Physics-informed prognostics',
    body: 'A PINN residual channel, sequence autoencoder and gradient-boosted classifier run side by side, producing calibrated remaining-useful-life intervals instead of single-point guesses.',
    tag: 'AI Prognostics',
  },
  {
    icon: Sparkles,
    title: 'Explainability by default',
    body: 'Every inference ships with integrated-gradient attributions, counterfactual sensitivity and a model registry entry, so maintainers can audit the reason before acting on it.',
    tag: 'XAI',
  },
  {
    icon: MapIcon,
    title: 'Autonomous mission replanning',
    body: 'When a channel leaves its envelope, the reinforcement-learning agent regenerates the route to the nearest recovery airfield while preserving the mission objective.',
    tag: 'RL Replanner',
  },
  {
    icon: Users,
    title: 'Swarm fleet supervision',
    body: 'Five airframes stream through the same digital twin, ranked by health index, RUL and open maintenance actions with per-airframe degradation histories.',
    tag: 'Fleet',
  },
  {
    icon: Wrench,
    title: 'Condition-based maintenance',
    body: 'RUL intervals convert directly into inspection windows, consumable demand and a MIL-STD-178C Level A evidence trail exported from the reporting console.',
    tag: 'Logistics',
  },
];

const PIPELINE = [
  { step: 'Sensors', detail: 'CAN 2.0B · 100 Hz' },
  { step: 'Decode', detail: 'Signal conditioning' },
  { step: 'Residual', detail: 'Physics baseline' },
  { step: 'Inference', detail: 'PINN · AE · GBM' },
  { step: 'Explain', detail: 'Attribution · CFX' },
  { step: 'Act', detail: 'RUL · replan · log' },
];

const SPEC_ROWS = [
  { label: 'Powerplant', value: 'VRDE 180 HP · Rotax 915 iS class' },
  { label: 'Configuration', value: 'Turbocharged opposed-4, dual FADEC' },
  { label: 'Displacement', value: '1,352 cc · 84 × 61 mm' },
  { label: 'Max continuous', value: '141 hp @ 5,800 rpm' },
  { label: 'Take-off rating', value: '180 hp @ 5,800 rpm' },
  { label: 'Ceiling (MALE envelope)', value: '26,000 ft' },
  { label: 'Max endurance', value: '24 h class' },
  { label: 'Telemetry bus', value: 'Dual redundant CAN A/B' },
];

/* =========================================================================
   Motion primitives
   ========================================================================= */

/* Scroll reveal — works for both window and nested scroll-container pages */
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, visible];
};

const Reveal = ({ children, delay = 0, className = '', as: Tag = 'div' }) => {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

/* Rolling number — eases toward the live target every frame */
const CountUp = ({ value, decimals = 0, className = '' }) => {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  const raf = useRef(0);

  useEffect(() => {
    const tick = () => {
      const diff = target - current.current;
      if (Math.abs(diff) < Math.max(0.001, Math.abs(target) * 0.0004)) {
        current.current = target;
        setShown(target);
        raf.current = 0;
        return;
      }
      current.current += diff * 0.14;
      setShown(current.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return <span className={className}>{fmt(shown, decimals)}</span>;
};

/* The landing page may scroll on the window or inside a nested container —
   find the element whose scrollHeight actually exceeds its clientHeight. */
const getScrollRoot = () => {
  let node = document.querySelector('.landing-page');
  while (node && node !== document.body) {
    const st = getComputedStyle(node);
    if (/(auto|scroll)/.test(st.overflowY) && node.scrollHeight > node.clientHeight + 4) return node;
    node = node.parentElement;
  }
  return window;
};

const getScrollY = () => {
  const root = getScrollRoot();
  return root === window ? window.scrollY : root.scrollTop;
};

const scrollToTop = () => {
  const root = getScrollRoot();
  if (root === window) window.scrollTo({ top: 0, behavior: 'smooth' });
  else root.scrollTo({ top: 0, behavior: 'smooth' });
};

/* Scroll events from whichever container actually scrolls the landing page */
const useScrollContainer = (onScroll) => {
  const handler = useRef(onScroll);
  handler.current = onScroll;

  useEffect(() => {
    const listener = () => handler.current();
    let target = getScrollRoot();
    target.addEventListener('scroll', listener, { passive: true });
    handler.current();

    /* the scroll root can change as layouts settle — re-resolve briefly */
    const interval = setInterval(() => {
      const next = getScrollRoot();
      if (next !== target) {
        target.removeEventListener('scroll', listener);
        target = next;
        target.addEventListener('scroll', listener, { passive: true });
        handler.current();
      }
    }, 1200);

    return () => {
      clearInterval(interval);
      target.removeEventListener('scroll', listener);
    };
  }, []);
};

/* =========================================================================
   Sections
   ========================================================================= */

const LandingNav = ({ onLaunchStudio, onOpenTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('overview');

  const onScroll = useCallback(() => {
    setScrolled(getScrollY() > 12);

    /* scroll-spy: section whose top is nearest above the mid-viewport line */
    let current = NAV_LINKS[0].id;
    for (const l of NAV_LINKS) {
      const el = document.getElementById(l.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.38) current = l.id;
    }
    setActive(current);
  }, []);

  useScrollContainer(onScroll);

  const jump = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className="sticky top-[52px] z-40 border-b transition-colors"
      style={{
        background: scrolled ? 'rgba(10,10,12,0.82)' : 'rgba(10,10,12,0.5)',
        borderColor: scrolled ? 'rgba(255,255,255,0.10)' : 'transparent',
        backdropFilter: 'saturate(180%) blur(22px)',
        WebkitBackdropFilter: 'saturate(180%) blur(22px)',
      }}
    >
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-2 text-[11.5px] text-ink-dim">MALE UAV digital twin</div>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => jump(e, l.id)}
              className={`nav-link ${active === l.id ? 'is-active' : ''}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm hidden sm:inline-flex" onClick={() => onOpenTab('TELEMETRY')}>
            <Radio className="h-3.5 w-3.5" />
            Live stream
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              tacticalAudio.playChirp();
              onLaunchStudio();
            }}
          >
            Open studio
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

/* ---------------------------------- hero -------------------------------- */
const Hero = ({ telemetry, onLaunchStudio, onOpenTab }) => {
  const engine = telemetry.engine || {};
  const health = telemetry.health || {};

  const stats = [
    { k: 'Engine health', v: health.index, d: 1, suffix: '%', s: health.status || '—' },
    { k: 'Crank speed', v: engine.rpm, d: 0, suffix: '', s: 'live rpm' },
    { k: 'Hottest EGT', v: Math.max(...(engine.egt || [0])), d: 0, suffix: '°', s: `CHT ${fmt(Math.max(...(engine.cht || [0])), 0)} °C` },
    { k: 'Vibration', v: engine.vibrationGrms, d: 3, suffix: '', s: 'gRMS' },
  ];

  return (
    <section id="overview" className="relative scroll-mt-28 border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-20">
        <div className="hero-in">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3 py-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11.5px] text-ink-muted">SIH 2026 · Problem 26054 · MALE UAV propulsion</span>
          </div>

          <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[44px]">
            The digital twin that knows
            <br />
            what its engine is doing.
          </h1>

          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ink-muted">
            AeroTwin fuses CAD-accurate geometry, a 100 Hz CAN acquisition chain and a physics-informed prognostic stack so a MALE UAV
            powertrain can be inspected, diagnosed and scheduled before it fails. Orbit the assembly, drag the explode slider and watch
            the inference that follows every channel.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => { tacticalAudio.playChirp(); onLaunchStudio(); }}>
              <Boxes className="h-4 w-4" />
              Enter the CAD studio
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => onOpenTab('PROGNOSTICS')}>
              <Brain className="h-4 w-4" />
              Prognostics &amp; XAI
            </button>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.k}>
                <dt className="text-[11px] text-ink-faint">{s.k}</dt>
                <dd className="mt-1 font-mono text-[19px] font-semibold leading-none text-ink">
                  <CountUp value={s.v} decimals={s.d} />
                  {s.suffix}
                </dd>
                <dd className="mt-1 text-2xs text-ink-dim">{s.s}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="viewport-frame" style={{ height: 'min(58vh, 470px)' }}>
          <ModelStage frames={MODEL_FRAMES.POWERTRAIN} view="HERO" framing={6} minDistance={1.2} maxDistance={12} fov={36} autoRotate>
            <group position={[0, -0.18, 0]} rotation={[0, -0.35, 0]}>
              <RotaxEngine rpm={engine.rpm || 4800} explode={0} selected={null} spin />
            </group>
          </ModelStage>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between">
            <div className="viewport-overlay px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted">VRDE 180 HP · interactive assembly</div>
            <div className="viewport-overlay px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted">drag to orbit · wheel to zoom</div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ live ticker ------------------------------ */
const LiveTicker = ({ telemetry, aiPrognostics }) => {
  const e = telemetry.engine || {};
  const items = useMemo(() => {
    const egt = e.egt || [0, 0, 0, 0];
    const spread = Math.max(...egt) - Math.min(...egt);
    return [
      { k: 'EGT SPREAD', v: `${fmt(spread, 1)} °C` },
      { k: 'HEALTH INDEX', v: `${fmt(telemetry.health?.index, 1)}%` },
      { k: 'CRANK', v: `${e.rpm ?? '—'} rpm` },
      { k: 'MAP', v: `${fmt(e.mapBar, 2)} bar` },
      { k: 'OIL PRESSURE', v: `${fmt(e.oilPressBar, 2)} bar` },
      { k: 'VIBRATION', v: `${fmt(e.vibrationGrms, 3)} gRMS` },
      { k: 'RUL', v: `${fmt(aiPrognostics.rul_hours_mean, 0)} h` },
      { k: 'CAN BUS', v: '2.0B @ 100 Hz' },
      { k: 'INFERENCE', v: 'PINN · AE · GBM · 12 ms' },
      { k: 'FLEET', v: '5 AIRFRAMES STREAMING' },
    ];
  }, [e.rpm, e.mapBar, e.oilPressBar, e.vibrationGrms, e.egt, telemetry.health?.index, aiPrognostics.rul_hours_mean]);

  const row = (dup) => (
    <div className="flex shrink-0" aria-hidden={dup || undefined}>
      {items.map((it) => (
        <span key={`${dup}-${it.k}`} className="land-marquee-item">
          <span className="status-dot pulse" style={{ background: 'var(--app-success)' }} />
          {it.k}
          <strong>{it.v}</strong>
        </span>
      ))}
    </div>
  );

  return (
    <div className="land-ticker marquee-mask">
      <div className="land-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
};

/* ------------------------------ pipeline strip --------------------------- */
const PipelineStrip = () => (
  <section className="border-b border-line bg-surface/40">
    <Reveal className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
      {PIPELINE.map((p, i) => (
        <React.Fragment key={p.step}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line font-mono text-[10.5px] text-ink-muted">
              {i + 1}
            </span>
            <div>
              <div className="text-[12.5px] font-medium text-ink">{p.step}</div>
              <div className="text-2xs text-ink-dim">{p.detail}</div>
            </div>
          </div>
          {i < PIPELINE.length - 1 ? <ChevronRight className="hidden h-4 w-4 text-ink-dim lg:block" /> : null}
        </React.Fragment>
      ))}
    </Reveal>
  </section>
);

/* ------------------------------ features grid --------------------------- */
const Features = () => (
  <section id="intelligence" className="scroll-mt-28 border-b border-line">
    <div className="mx-auto max-w-6xl px-5 py-14">
      <Reveal>
        <SectionHeading
          title="One workbench, whole propulsion chain"
          subtitle="Six capabilities that share a single twin, from geometry to maintenance decision."
        />
      </Reveal>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal key={f.title} delay={(i % 3) * 90} className="h-full">
              <article className="panel h-full p-4 transition hover:border-line-strong">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-ink-muted" />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{f.body}</p>
                <div className="mt-3">
                  <Badge tone="neutral">{f.tag}</Badge>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* ------------------- scroll-driven powertrain explorer ------------------ */
const PowertrainExplorer = ({ telemetry, onOpenTab }) => {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setProgress(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const explode = Math.min(1, Math.max(0, (progress - 0.15) / 0.6));

  return (
    <section id="powertrain" ref={sectionRef} className="scroll-mt-28 border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <SectionHeading
            title="Take the assembly apart"
            subtitle="Scroll to separate the powerplant stack — cam cover, barrel group, intake plenum, exhaust and accessories — then open the studio for full control."
            actions={
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenTab('STUDIO')}>
                <Boxes className="h-3.5 w-3.5" />
                Open CAD workbench
              </button>
            }
          />
        </Reveal>

        <div className="viewport-frame" style={{ height: 'min(70vh, 560px)' }}>
          <ModelStage frames={MODEL_FRAMES.POWERTRAIN} view={progress > 0.4 ? 'ISO' : 'HERO'} framing={6} minDistance={1} maxDistance={13}>
            <group position={[0, -0.18, 0]}>
              <RotaxEngine
                rpm={telemetry.engine?.rpm || 4800}
                explode={explode}
                selected={null}
                faultCylinders={(telemetry.residuals?.egtResiduals || [])
                  .map((v, i) => (Math.abs(v) > 35 ? `CYLINDER_${i + 1}` : null))
                  .filter(Boolean)}
                cutaway={progress > 0.75}
                spin
              />
            </group>
          </ModelStage>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
            <div className="viewport-overlay px-3 py-2">
              <div className="mb-1 text-2xs text-ink-dim">Exploded separation</div>
              <div className="meter-track w-40">
                <div className="meter-fill" style={{ width: `${explode * 100}%`, background: '#0A84FF' }} />
              </div>
            </div>
            <div className="viewport-overlay px-3 py-2 font-mono text-[10.5px] text-ink-muted">
              {explode < 0.05 ? 'assembled' : progress > 0.75 ? 'section cut · bores & pistons exposed' : 'exploded assembly'}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: 'Bore × stroke', v: '84 × 61', s: 'mm' },
            { k: 'Cylinders', v: '4', s: 'opposed, liquid cooled' },
            { k: 'Boost', v: fmt(telemetry.engine?.mapBar, 2), s: 'bar manifold' },
            { k: 'Crank speed', v: `${telemetry.engine?.rpm ?? '—'}`, s: 'rpm' },
          ].map((s, i) => (
            <Reveal key={s.k} delay={i * 70}>
              <div className="panel px-3.5 py-3">
                <div className="text-[11px] text-ink-faint">{s.k}</div>
                <div className="mt-1 font-mono text-[18px] font-semibold text-ink">{s.v}</div>
                <div className="text-2xs text-ink-dim">{s.s}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------ airframe twin spotlight ------------------------ */
const AirframeSpotlight = ({ telemetry, onOpenTab }) => (
  <section className="border-b border-line">
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Reveal className="order-2 lg:order-1">
        <div className="viewport-frame" style={{ height: 'min(58vh, 460px)' }}>
          <ModelStage frames={MODEL_FRAMES.AIRFRAME} view="HERO" framing={12} minDistance={2.4} maxDistance={26} fov={36} autoRotate>
            <group position={[0, 0.35, 0]}>
              <UavAirframe rpm={telemetry.engine?.rpm || 4800} explode={0} selected={null} />
            </group>
          </ModelStage>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between">
            <div className="viewport-overlay px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted">MALE airframe · 18 m span class</div>
            <div className="viewport-overlay px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted">
              {(telemetry.mission?.missionPhase || 'LOITER').toLowerCase()}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="order-1 lg:order-2" delay={120}>
        <h2 className="text-[26px] font-semibold tracking-tight text-ink">The whole airframe, not just the graph.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
          Carbon-composite fuselage, high-aspect wing with winglets, V-tail empennage, pusher propeller, retractable gear and a
          gyro-stabilised EO/IR turret — every bolted assembly is selectable, and each selection maps back to the instrumented channels that
          monitor it.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
          <KeyValue
            items={[
              { label: 'Mission phase', value: telemetry.mission?.missionPhase || 'LOITER' },
              { label: 'Altitude', value: `${fmt(telemetry.mission?.altitudeFt, 0)} ft` },
            ]}
          />
          <KeyValue
            items={[
              { label: 'Airspeed', value: `${fmt(telemetry.mission?.airspeedKts, 0)} kts` },
              { label: 'Ambient', value: `${fmt(telemetry.mission?.ambientTempC, 1)} °C` },
            ]}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenTab('STUDIO')}>
            <Layers className="h-3.5 w-3.5" />
            Inspect airframe
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenTab('MISSION_MAP')}>
            <MapIcon className="h-3.5 w-3.5" />
            Mission replanner
          </button>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ----------------------------- live analytics --------------------------- */
const LiveAnalytics = ({ telemetry, aiPrognostics, historyBuffer, onOpenTab }) => {
  const health = telemetry.health || {};

  const series = useMemo(
    () => [
      { id: 'egt3', label: 'EGT 3 (°C)', color: '#FF9F0A', data: historyBuffer?.egt3 || [], width: 1.9 },
      { id: 'cht3', label: 'CHT 3 (×10 °C)', color: '#64D2FF', data: (historyBuffer?.cht3 || []).map((c) => c * 10), dashed: true, width: 1.5 },
    ],
    [historyBuffer],
  );

  const vibe = historyBuffer?.vibration || [];
  const vibeStats = useMemo(() => describe(vibe), [vibe]);

  return (
    <section id="analytics" className="scroll-mt-28 border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Reveal>
          <SectionHeading
            title="Live analysis, not decoration"
            subtitle="Charts are computed from the live CAN stream — multi-axis traces with threshold bands, per-channel statistics, harmonic order analysis and correlation matrices."
            actions={
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenTab('TELEMETRY')}>
                <LineChartIcon className="h-3.5 w-3.5" />
                Full telemetry view
              </button>
            }
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Reveal>
            <Panel>
              <PanelHeader
                title="Thermal trace"
                subtitle="EGT 3 measured against CHT 3 with airworthiness thresholds"
                icon={Activity}
                actions={<Badge tone={health.status === 'NOMINAL' ? 'success' : 'warning'}>{health.status || '—'}</Badge>}
              />
              <PanelBody>
                <LineChart
                  height={252}
                  series={series}
                  xLabels={historyBuffer?.timestamps || []}
                  thresholds={[
                    { y: 950, color: '#FF453A', label: 'EGT limit' },
                    { y: 1150, color: '#64D2FF', label: 'CHT caution' },
                  ]}
                  yMin={500}
                  yMax={1200}
                  unit="°C"
                  digits={0}
                />
              </PanelBody>
            </Panel>
          </Reveal>

          <div className="flex flex-col gap-4">
            <Reveal delay={90}>
              <Panel>
                <PanelHeader title="Health trajectory" subtitle="Engine health index, 40-sample window" icon={Gauge} />
                <PanelBody>
                  <div className="font-mono text-[26px] font-semibold leading-none text-ink">
                    <CountUp value={health.index} decimals={1} />%
                  </div>
                  <div className="mt-1 text-2xs text-ink-dim">
                    RUL {fmt(aiPrognostics.rul_hours_mean, 1)} h · anomaly {fmt(aiPrognostics.anomaly_score, 3)}σ
                  </div>
                  <div className="mt-3">
                    <Sparkline
                      data={historyBuffer?.healthIndex || []}
                      color={health.status === 'NOMINAL' ? '#30D158' : '#FF453A'}
                      height={54}
                    />
                  </div>
                  <div className="mt-3">
                    <KeyValue
                      columns={2}
                      items={[
                        { label: 'Vib. mean', value: `${fmt(vibeStats.mean, 3)} g` },
                        { label: 'Vib. σ', value: fmt(vibeStats.std, 4) },
                        { label: 'Trend', value: `${fmt(vibeStats.trend.slope, 5)}/smp` },
                        { label: 'R²', value: fmt(vibeStats.trend.r2, 2) },
                      ]}
                    />
                  </div>
                </PanelBody>
              </Panel>
            </Reveal>

            <Reveal delay={160}>
              <Panel>
                <PanelHeader title="Prognostic summary" subtitle="PINN + autoencoder verdict" icon={Brain} />
                <PanelBody className="flex flex-col gap-2">
                  {[
                    { k: 'Diagnosis', v: (aiPrognostics.diagnosed_fault || 'NOMINAL_OPERATION').replace(/_/g, ' ') },
                    { k: 'Dominant driver', v: aiPrognostics.dominant_root_cause_feature || 'None' },
                    { k: 'Reconstruction MSE', v: fmt(aiPrognostics.reconstruction_mse, 5) },
                    { k: 'Degradation rate', v: `${fmt(aiPrognostics.degradation_rate_pct_per_hour, 2)} %/h` },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="text-ink-faint">{row.k}</span>
                      <span className="truncate font-mono text-ink">{row.v}</span>
                    </div>
                  ))}
                </PanelBody>
              </Panel>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ specifications -------------------------- */
const SpecsSection = ({ telemetry, aiPrognostics }) => {
  const engine = telemetry.engine || {};
  const norm = (v, lo, hi) => Math.min(1, Math.max(0, ((v ?? lo) - lo) / (hi - lo)));
  const maxEgt = Math.max(...(engine.egt || [0]));

  const radarAxes = [
    { label: 'Thermal', value: 1 - norm(maxEgt, 760, 950) },
    { label: 'Lubrication', value: norm(engine.oilPressBar, 2.0, 4.4) },
    { label: 'Vibration', value: 1 - norm(engine.vibrationGrms, 0.1, 0.9) },
    { label: 'Boost', value: 1 - Math.abs(norm(engine.mapBar, 0.7, 1.7) - 0.72) },
    { label: 'Fuel', value: norm(engine.fuelFlowLph, 4, 32) },
    { label: 'Health', value: norm(telemetry.health?.index, 40, 100) },
  ];

  return (
    <section id="specs" className="scroll-mt-28 border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Reveal>
          <SectionHeading
            title="Specifications"
            subtitle="The numbers behind the twin — powerplant, airframe and the live margin each subsystem is holding right now."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal>
            <Panel className="h-full">
              <PanelHeader title="Powertrain & airframe" subtitle="Certification-basis configuration" icon={Wrench} />
              <PanelBody>
                <KeyValue columns={2} items={SPEC_ROWS} />
              </PanelBody>
            </Panel>
          </Reveal>

          <Reveal delay={110}>
            <Panel className="h-full">
              <PanelHeader
                title="Subsystem margin radar"
                subtitle="Normalised headroom against failure thresholds"
                icon={ShieldCheck}
                actions={<Badge tone={telemetry.health?.status === 'NOMINAL' ? 'success' : 'warning'}>{telemetry.health?.status || '—'}</Badge>}
              />
              <PanelBody className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                <RadarChart axes={radarAxes} size={224} tone="#0A84FF" />
                <div className="w-full max-w-[240px]">
                  <KeyValue
                    items={[
                      {
                        label: 'Model confidence',
                        value: `${fmt(Number.isFinite(aiPrognostics.confidence_pct) ? aiPrognostics.confidence_pct : 92, 0)}%`,
                      },
                      { label: 'Open findings', value: (aiPrognostics.diagnosed_fault || 'NOMINAL_OPERATION').replace(/_/g, ' ') },
                      { label: 'Worst EGT margin', value: `${fmt(950 - maxEgt, 0)} °C` },
                      { label: 'Health index', value: `${fmt(telemetry.health?.index, 1)}%` },
                    ]}
                  />
                </div>
              </PanelBody>
            </Panel>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <Callout tone="accent" icon={Sparkles} title="Every number is live">
            Static rows describe the certified configuration; the radar, thresholds and traces are recomputed each second from the 100 Hz CAN
            stream — so the moment a channel starts walking toward its limit, the margin you are reading shrinks with it.
          </Callout>
        </Reveal>
      </div>
    </section>
  );
};

/* --------------------------------- CTA band ------------------------------ */
const CtaBand = ({ onLaunchStudio, onOpenTab }) => (
  <section className="cta-band">
    <Reveal className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h2 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
        See it run before you commit hardware.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted">
        The full flight deck is live — inject a fault, watch the prognostic stack attribute it in real time, and read the maintenance
        action it schedules. No sign-up, no backend, everything computed in the browser.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => { tacticalAudio.playChirp(); onLaunchStudio(); }}>
          Launch the flight deck
          <ArrowRight className="h-4 w-4" />
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => onOpenTab('SANDBOX')}>
          Judge&apos;s sandbox
        </button>
      </div>
      <div className="mt-5 font-mono text-2xs text-ink-dim">
        100 Hz CAN · 263 CAD primitives · 5 models · MIL-STD-178C Level A reporting
      </div>
    </Reveal>
  </section>
);

/* --------------------------------- footer -------------------------------- */
const Footer = ({ onLaunchStudio, onOpenTab }) => (
  <footer className="mx-auto max-w-6xl px-5 py-10">
    <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-md">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
            <Plane className="h-3.5 w-3.5 text-ink" />
          </span>
          <span className="text-[13.5px] font-semibold text-ink">AeroTwin</span>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-muted">
          Digital twin, prognostics and explainability workbench for MALE UAV propulsion — built for the SIH 2026 problem statement 26054.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { tacticalAudio.playChirp(); onLaunchStudio(); }}>
            Launch studio
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenTab('COPILOT')}>
            <FileTextIcon className="h-3.5 w-3.5" />
            Reports
          </button>
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-[12.5px] sm:grid-cols-2">
        {NAV_LINKS.map((l) => (
          <a key={l.id} href={`#${l.id}`} className="text-ink-muted transition hover:text-ink">
            {l.label}
          </a>
        ))}
        <button type="button" className="text-left text-ink-muted transition hover:text-ink" onClick={() => onOpenTab('SANDBOX')}>
          Judge&apos;s sandbox
        </button>
        <button type="button" className="text-left text-ink-muted transition hover:text-ink" onClick={() => onOpenTab('FLEET')}>
          Swarm fleet
        </button>
      </nav>
    </div>

    <div className="flex flex-col gap-2 pt-5 text-2xs text-ink-dim sm:flex-row sm:items-center sm:justify-between">
      <span>© 2026 AeroTwin — VRDE 180 HP digital twin. Concept prototype, not for flight.</span>
      <span className="font-mono">CAN 2.0B · 100 Hz · PINN + AE + GBM · MIL-STD-178C Level A</span>
    </div>
  </footer>
);

/* ------------------------------- back to top ----------------------------- */
const BackToTop = () => {
  const [shown, setShown] = useState(false);

  const onScroll = useCallback(() => {
    setShown(getScrollY() > 640);
  }, []);

  useScrollContainer(onScroll);

  const toTop = () => scrollToTop();

  return (
    <button type="button" aria-label="Back to top" className={`to-top ${shown ? 'is-shown' : ''}`} onClick={toTop}>
      <ArrowUp className="h-4 w-4" />
    </button>
  );
};

/* ================================ landing page =========================== */
export const LandingPage = ({ onLaunchStudio = () => {}, onOpenTab = () => {} }) => {
  const { telemetry, aiPrognostics, historyBuffer } = useTelemetry();

  return (
    <div className="landing-page min-h-screen bg-canvas text-ink">
      <LandingNav onLaunchStudio={onLaunchStudio} onOpenTab={onOpenTab} />
      <Hero telemetry={telemetry} onLaunchStudio={onLaunchStudio} onOpenTab={onOpenTab} />
      <LiveTicker telemetry={telemetry} aiPrognostics={aiPrognostics} />
      <PipelineStrip />
      <Features />
      <PowertrainExplorer telemetry={telemetry} onOpenTab={onOpenTab} />
      <AirframeSpotlight telemetry={telemetry} onOpenTab={onOpenTab} />
      <LiveAnalytics
        telemetry={telemetry}
        aiPrognostics={aiPrognostics}
        historyBuffer={historyBuffer}
        onOpenTab={onOpenTab}
      />
      <SpecsSection telemetry={telemetry} aiPrognostics={aiPrognostics} />
      <CtaBand onLaunchStudio={onLaunchStudio} onOpenTab={onOpenTab} />
      <Footer onLaunchStudio={onLaunchStudio} onOpenTab={onOpenTab} />
      <BackToTop />
    </div>
  );
};

export default LandingPage;
