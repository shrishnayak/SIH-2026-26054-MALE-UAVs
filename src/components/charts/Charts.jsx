import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* =========================================================================
   Shared helpers
   ========================================================================= */

/** Tracks the rendered pixel width of a container so SVG text stays crisp. */
export const useElementWidth = (fallback = 760) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 40) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || fallback);
    return () => ro.disconnect();
  }, [fallback]);

  return [ref, width];
};

/** Human-friendly axis ticks (1 / 2 / 5 x 10^n steps). */
export const niceTicks = (min, max, count = 4) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return [min - 1, min, min + 1];
  }
  const span = max - min;
  const rawStep = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks.length >= 2 ? ticks : [min, max];
};

const buildPath = (data, xOf, yOf, closeAtBottom = false, baseY = 0) => {
  let d = '';
  let started = false;
  data.forEach((v, i) => {
    if (v === null || v === undefined || Number.isNaN(v)) {
      started = false;
      return;
    }
    d += `${started ? 'L' : 'M'}${xOf(i).toFixed(2)},${yOf(v).toFixed(2)} `;
    started = true;
  });
  if (closeAtBottom && d) {
    const idxs = data.map((v, i) => (Number.isFinite(v) ? i : -1)).filter((i) => i >= 0);
    d += `L${xOf(idxs[idxs.length - 1]).toFixed(2)},${baseY.toFixed(2)} L${xOf(idxs[0]).toFixed(2)},${baseY.toFixed(2)} Z`;
  }
  return d.trim();
};

const flatten = (series) =>
  series.flatMap((s) => (s.data || []).filter((v) => v !== null && v !== undefined && Number.isFinite(v)));

/* =========================================================================
   LineChart — multi-series time series with axes, crosshair, forecast cone
   ========================================================================= */
export const LineChart = ({
  series = [],
  height = 220,
  yMin,
  yMax,
  yTicks = 4,
  unit = '',
  digits = 1,
  bands = [],
  thresholds = [],
  markers = [],
  xLabels = [],
  forecastBand = null,
  legend = true,
  areaFill = false,
  onHoverIndex,
}) => {
  const [wrapRef, width] = useElementWidth(860);
  const [hover, setHover] = useState(null);

  const visible = series.filter((s) => !s.hidden);
  const allValues = flatten(visible);
  const bandValues = forecastBand
    ? [...(forecastBand.lower || []), ...(forecastBand.upper || [])].filter(Number.isFinite)
    : [];

  const lo = Number.isFinite(yMin) ? yMin : Math.min(...allValues, ...bandValues);
  const hi = Number.isFinite(yMax) ? yMax : Math.max(...allValues, ...bandValues);
  const padY = (hi - lo) * 0.08 || 1;
  const y0 = Number.isFinite(yMin) ? yMin : lo - padY;
  const y1 = Number.isFinite(yMax) ? yMax : hi + padY;

  const padL = 46;
  const padR = 14;
  const padT = 14;
  const padB = xLabels.length ? 26 : 12;

  const n = Math.max(...visible.map((s) => s.data?.length || 0), xLabels.length, 2);
  const plotW = Math.max(60, width - padL - padR);
  const plotH = Math.max(60, height - padT - padB);

  const xOf = useCallback((i) => padL + (i / Math.max(1, n - 1)) * plotW, [n, plotW]);
  const yOf = useCallback(
    (v) => padT + plotH - ((v - y0) / Math.max(1e-9, y1 - y0)) * plotH,
    [plotH, y0, y1],
  );

  const ticks = useMemo(() => niceTicks(y0, y1, yTicks), [y0, y1, yTicks]);

  const bandPath = useMemo(() => {
    if (!forecastBand || !forecastBand.lower?.length) return '';
    const { lower, upper } = forecastBand;
    const startIdx = forecastBand.from ?? n - lower.length;
    const up = upper.map((v, i) => `${xOf(startIdx + i).toFixed(2)},${yOf(v).toFixed(2)}`);
    const down = [...lower]
      .reverse()
      .map((v, i) => `${xOf(startIdx + lower.length - 1 - i).toFixed(2)},${yOf(v).toFixed(2)}`);
    return `M${up.join(' L')} L${down.join(' L')} Z`;
  }, [forecastBand, n, xOf, yOf]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left;
    const idx = Math.round(((rel - padL) / plotW) * (n - 1));
    const clamped = Math.max(0, Math.min(n - 1, idx));
    setHover(clamped);
    if (onHoverIndex) onHoverIndex(clamped);
  };

  const xTickIdx = useMemo(() => {
    if (!xLabels.length) return [];
    const count = Math.min(6, xLabels.length);
    const step = (xLabels.length - 1) / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, i) => Math.round(i * step));
  }, [xLabels]);

  return (
    <div className="w-full" ref={wrapRef}>
      <div className="relative" style={{ height }}>
        <svg
          width="100%"
          height={height}
          onMouseMove={handleMove}
          onMouseLeave={() => {
            setHover(null);
            if (onHoverIndex) onHoverIndex(null);
          }}
        >
          {bands.map((b, i) => {
            const top = yOf(Math.min(b.y1, y1));
            const bottom = yOf(Math.max(b.y0, y0));
            return (
              <rect
                key={`band-${i}`}
                x={padL}
                y={top}
                width={plotW}
                height={Math.max(0, bottom - top)}
                fill={b.color || 'rgba(255,159,10,0.10)'}
              />
            );
          })}

          {ticks.map((t) => (
            <g key={`t-${t}`}>
              <line x1={padL} x2={padL + plotW} y1={yOf(t)} y2={yOf(t)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <text
                x={padL - 8}
                y={yOf(t) + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#7c7c82"
                fontFamily="JetBrains Mono, monospace"
              >
                {Math.abs(t) >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(Math.abs(t) < 10 ? 1 : 0)}
              </text>
            </g>
          ))}
          {unit ? (
            <text x={padL - 8} y={padT - 4} textAnchor="end" fontSize="9.5" fill="#58585E" fontFamily="JetBrains Mono, monospace">
              {unit}
            </text>
          ) : null}

          {xTickIdx.map((i) => (
            <text
              key={`x-${i}`}
              x={xOf(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="9.5"
              fill="#7c7c82"
              fontFamily="JetBrains Mono, monospace"
            >
              {xLabels[i]}
            </text>
          ))}

          {bandPath ? <path d={bandPath} fill={forecastBand.color || 'rgba(10,132,255,0.16)'} stroke="none" /> : null}

          {thresholds.map((th, i) => (
            <g key={`th-${i}`}>
              <line
                x1={padL}
                x2={padL + plotW}
                y1={yOf(th.y)}
                y2={yOf(th.y)}
                stroke={th.color || '#FF9F0A'}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              {th.label ? (
                <text x={padL + 6} y={yOf(th.y) - 4} fontSize="9.5" fill={th.color || '#FF9F0A'} fontFamily="JetBrains Mono, monospace">
                  {th.label}
                </text>
              ) : null}
            </g>
          ))}

          {markers.map((m, i) => (
            <g key={`m-${i}`}>
              <line
                x1={xOf(m.index)}
                x2={xOf(m.index)}
                y1={padT}
                y2={padT + plotH}
                stroke={m.color || 'rgba(255,255,255,0.28)'}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {m.label ? (
                <text x={xOf(m.index) + 4} y={padT + 10} fontSize="9.5" fill="#a1a1a6" fontFamily="JetBrains Mono, monospace">
                  {m.label}
                </text>
              ) : null}
            </g>
          ))}

          {visible.map((s) => {
            const d = buildPath(s.data || [], xOf, yOf, areaFill && s.area, padT + plotH);
            return (
              <g key={s.id}>
                {areaFill && s.area && d ? <path d={d} fill={s.color} opacity="0.10" stroke="none" /> : null}
                <path
                  d={buildPath(s.data || [], xOf, yOf)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.width || 1.8}
                  strokeDasharray={s.dashed ? '5 4' : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {hover !== null ? (
            <g>
              <line x1={xOf(hover)} x2={xOf(hover)} y1={padT} y2={padT + plotH} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              {visible.map((s) => {
                const v = s.data?.[hover];
                if (!Number.isFinite(v)) return null;
                return (
                  <circle key={`h-${s.id}`} cx={xOf(hover)} cy={yOf(v)} r="3.2" fill={s.color} stroke="#0a0a0c" strokeWidth="1.4" />
                );
              })}
            </g>
          ) : null}
        </svg>

        {hover !== null ? (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line px-2.5 py-2 text-[11px] shadow-popover"
            style={{
              background: 'rgba(16,16,19,0.94)',
              left: Math.min(Math.max(xOf(hover) + 12, 8), Math.max(8, width - 168)),
              minWidth: 138,
            }}
          >
            {xLabels[hover] ? <div className="mb-1 font-mono text-2xs text-ink-faint">{xLabels[hover]}</div> : null}
            {visible.map((s) => {
              const v = s.data?.[hover];
              return (
                <div key={`tt-${s.id}`} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="status-dot" style={{ background: s.color, width: 6, height: 6 }} />
                    {s.label}
                  </span>
                  <span className="font-mono text-ink">{Number.isFinite(v) ? v.toFixed(digits) : '—'}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {legend && visible.length > 1 ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {visible.map((s) => (
            <span key={`lg-${s.id}`} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/* =========================================================================
   Sparkline — dense inline trend, no axes
   ========================================================================= */
export const Sparkline = ({ data = [], color = '#0A84FF', height = 34, fill = true }) => {
  const pts = data.filter((v) => Number.isFinite(v));
  if (pts.length < 2) return <div style={{ height }} />;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const W = 100;
  const H = 100;
  const x = (i) => (i / (pts.length - 1)) * W;
  const y = (v) => H - 6 - ((v - lo) / span) * (H - 12);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {fill ? <path d={area} fill={color} opacity="0.12" /> : null}
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
};

/* =========================================================================
   AttributionBars — SHAP-style signed feature contributions
   ========================================================================= */
export const AttributionBars = ({ items = [], unit = '%', digits = 1, maxRows = 12, positiveColor = '#FF453A', negativeColor = '#0A84FF' }) => {
  const rows = items.slice(0, maxRows);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => {
        const pct = (Math.abs(r.value) / maxAbs) * 50;
        const positive = r.value >= 0;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-[132px] shrink-0 truncate text-[11.5px] text-ink-muted" title={r.label}>
              {r.label}
            </div>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/[0.04]">
              <div className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
              <div
                className="absolute inset-y-[3px] rounded-[3px] transition-all duration-500"
                style={{
                  background: positive ? positiveColor : negativeColor,
                  left: positive ? '50%' : `${50 - pct}%`,
                  width: `${Math.max(1.5, pct)}%`,
                }}
              />
            </div>
            <div className="w-[62px] shrink-0 text-right font-mono text-[11.5px]" style={{ color: positive ? positiveColor : negativeColor }}>
              {positive ? '+' : ''}
              {r.value.toFixed(digits)}
              {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================
   ArcGauge — macOS style sweep gauge
   ========================================================================= */
export const ArcGauge = ({ value = 0, min = 0, max = 100, label, unit = '', size = 128, tone = '#0A84FF', sublabel }) => {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const r = 52;
  const cx = 64;
  const cy = 62;
  const startAngle = Math.PI * 0.78;
  const endAngle = Math.PI * 2.22;
  const ang = startAngle + (endAngle - startAngle) * pct;
  const arc = (a0, a1, radius) => {
    const p0 = { x: cx + radius * Math.cos(a0), y: cy + radius * Math.sin(a0) };
    const p1 = { x: cx + radius * Math.cos(a1), y: cy + radius * Math.sin(a1) };
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${p0.x.toFixed(2)},${p0.y.toFixed(2)} A${radius},${radius} 0 ${large} 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
  };
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.72} viewBox="0 0 128 92">
        <path d={arc(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="9" strokeLinecap="round" />
        {pct > 0.002 ? (
          <path d={arc(startAngle, ang, r)} fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round" />
        ) : null}
        <circle cx={cx + r * Math.cos(ang)} cy={cy + r * Math.sin(ang)} r="4" fill="#fff" stroke={tone} strokeWidth="3" />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="22" fill="#F2F2F7" fontFamily="JetBrains Mono, monospace" fontWeight="600">
          {typeof value === 'number' ? value.toFixed(Math.abs(value) < 10 ? 2 : 0) : value}
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="9.5" fill="#7c7c82" fontFamily="JetBrains Mono, monospace">
          {unit}
        </text>
      </svg>
      {label ? <div className="mt-1 text-[11.5px] font-medium text-ink-muted">{label}</div> : null}
      {sublabel ? <div className="text-2xs text-ink-faint">{sublabel}</div> : null}
    </div>
  );
};

/* =========================================================================
   RadarChart — subsystem health / risk spider
   ========================================================================= */
export const RadarChart = ({ axes = [], size = 240, tone = '#0A84FF', compareTone = '#FF9F0A', compare = null }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const n = Math.max(axes.length, 3);
  const pt = (i, value) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = Math.min(1, Math.max(0, value));
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  };
  const poly = (values) => values.map((v, i) => pt(i, v).map((c) => c.toFixed(2)).join(',')).join(' ');
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((f) => (
        <polygon key={f} points={poly(Array(n).fill(f))} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {axes.map((ax, i) => {
        const [x, y] = pt(i, 1);
        return <line key={ax.label} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {compare ? (
        <polygon points={poly(compare)} fill="none" stroke={compareTone} strokeWidth="1.4" strokeDasharray="4 3" opacity="0.85" />
      ) : null}
      <polygon points={poly(axes.map((a) => a.value))} fill={tone} fillOpacity="0.16" stroke={tone} strokeWidth="1.8" />
      {axes.map((ax, i) => {
        const [x, y] = pt(i, 1.18);
        return (
          <text
            key={`lbl-${ax.label}`}
            x={x}
            y={y}
            textAnchor={x > cx + 6 ? 'start' : x < cx - 6 ? 'end' : 'middle'}
            dominantBaseline="middle"
            fontSize="9.5"
            fill="#a1a1a6"
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
};

/* =========================================================================
   Heatmap — correlation matrix
   ========================================================================= */
export const Heatmap = ({ keys = [], values = [], digits = 2 }) => {
  const cell = 34;
  const labelW = 74;
  const size = keys.length;
  const colorFor = (v) => (v >= 0 ? `rgba(255, 69, 58, ${0.12 + Math.abs(v) * 0.72})` : `rgba(10, 132, 255, ${0.12 + Math.abs(v) * 0.72})`);
  return (
    <div className="overflow-x-auto no-scrollbar">
      <svg width={labelW + size * cell} height={labelW + size * cell} viewBox={`0 0 ${labelW + size * cell} ${labelW + size * cell}`}>
        {keys.map((k, i) => (
          <text key={`row-${k}`} x={labelW - 8} y={labelW + i * cell + cell / 2 + 3} textAnchor="end" fontSize="9.5" fill="#a1a1a6">
            {k}
          </text>
        ))}
        {keys.map((k, i) => (
          <text
            key={`col-${k}`}
            x={labelW + i * cell + cell / 2}
            y={labelW - 9}
            textAnchor="start"
            fontSize="9.5"
            fill="#a1a1a6"
            transform={`rotate(-35 ${labelW + i * cell + cell / 2} ${labelW - 9})`}
          >
            {k}
          </text>
        ))}
        {values.map((row, i) =>
          row.map((v, j) => (
            <g key={`c-${i}-${j}`}>
              <rect x={labelW + j * cell} y={labelW + i * cell} width={cell - 2} height={cell - 2} rx="4" fill={colorFor(v)} />
              <text
                x={labelW + j * cell + (cell - 2) / 2}
                y={labelW + i * cell + (cell - 2) / 2 + 3}
                textAnchor="middle"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fill="rgba(255,255,255,0.86)"
              >
                {v.toFixed(digits)}
              </text>
            </g>
          )),
        )}
      </svg>
    </div>
  );
};

/* =========================================================================
   HistogramChart — distribution with normal density overlay
   ========================================================================= */
export const HistogramChart = ({ bins = [], height = 150, tone = '#0A84FF', unit = '' }) => {
  const [wrapRef, width] = useElementWidth(420);
  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const maxDensity = Math.max(...bins.map((b) => b.density || 0), 1);
  const padL = 30;
  const padB = 22;
  const plotW = Math.max(60, width - padL - 12);
  const plotH = Math.max(40, height - padB - 10);
  const bw = plotW / Math.max(1, bins.length);
  const densityPath = bins
    .map((b, i) => `${i === 0 ? 'M' : 'L'}${padL + i * bw + bw / 2},${10 + plotH - ((b.density || 0) / maxDensity) * plotH}`)
    .join(' ');

  return (
    <div ref={wrapRef} className="w-full">
      <svg width="100%" height={height}>
        {bins.map((b, i) => {
          const h = (b.count / maxCount) * plotH;
          return (
            <rect
              key={`b-${i}`}
              x={padL + i * bw + 1}
              y={10 + plotH - h}
              width={Math.max(1, bw - 2)}
              height={h}
              rx="2"
              fill={tone}
              fillOpacity="0.55"
            />
          );
        })}
        <path d={densityPath} fill="none" stroke="#F2F2F7" strokeWidth="1.4" opacity="0.6" />
        <line x1={padL} x2={padL + plotW} y1={10 + plotH} y2={10 + plotH} stroke="rgba(255,255,255,0.14)" />
        {bins.length > 1 ? (
          <>
            <text x={padL} y={height - 6} fontSize="9.5" fill="#7c7c82" fontFamily="JetBrains Mono, monospace">
              {bins[0].x0.toFixed(1)}
            </text>
            <text x={padL + plotW} y={height - 6} textAnchor="end" fontSize="9.5" fill="#7c7c82" fontFamily="JetBrains Mono, monospace">
              {bins[bins.length - 1].x1.toFixed(1)}
              {unit}
            </text>
          </>
        ) : null}
        <text x={padL - 6} y={14} textAnchor="end" fontSize="9.5" fill="#7c7c82" fontFamily="JetBrains Mono, monospace">
          {maxCount}
        </text>
      </svg>
    </div>
  );
};

/* =========================================================================
   GanttChart — maintenance / RUL window planner
   ========================================================================= */
export const GanttChart = ({ tasks = [], horizonHours = 72 }) => {
  const maxT = Math.max(horizonHours, ...tasks.map((t) => t.end));
  const x = (t) => (t / maxT) * 100;
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((t) => (
        <div key={t.label} className="flex items-center gap-3">
          <div className="w-[128px] shrink-0 truncate text-[11.5px] text-ink-muted" title={t.label}>
            {t.label}
          </div>
          <div className="relative h-5 flex-1 rounded bg-white/[0.04]">
            <div
              className="absolute inset-y-[3px] rounded-[3px]"
              style={{ left: `${x(Math.max(0, t.start))}%`, width: `${Math.max(0.6, x(t.end - t.start))}%`, background: t.color || '#0A84FF', opacity: 0.85 }}
            />
            {t.marker ? (
              <div className="absolute inset-y-0 w-px bg-white/60" style={{ left: `${x(t.marker)}%` }} />
            ) : null}
          </div>
          <div className="w-[92px] shrink-0 text-right font-mono text-[11px] text-ink-faint">
            {t.start.toFixed(1)}–{t.end.toFixed(1)}h
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <div className="w-[128px] shrink-0" />
        <div className="relative h-4 flex-1 border-t border-line">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <span
              key={f}
              className="absolute top-0.5 font-mono text-2xs text-ink-faint"
              style={{ left: `${f * 100}%`, transform: f === 0 ? 'none' : f === 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {(maxT * f).toFixed(0)}h
            </span>
          ))}
        </div>
        <div className="w-[92px] shrink-0" />
      </div>
      <div className="pl-[128px] text-2xs text-ink-faint">White marker = predicted crossing of the maintenance threshold.</div>
    </div>
  );
};





