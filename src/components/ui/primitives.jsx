import React from 'react';
import { clsx } from 'clsx';

/* =========================================================================
   Small, composable shell primitives used across every view.
   ========================================================================= */

export const Panel = ({ className, children, ...rest }) => (
  <section className={clsx('panel', className)} {...rest}>
    {children}
  </section>
);

export const PanelHeader = ({ title, subtitle, icon: Icon, actions, className }) => (
  <header className={clsx('panel-header', className)}>
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-ink-faint" /> : null}
      <div className="min-w-0">
        <div className="panel-title truncate">{title}</div>
        {subtitle ? <div className="panel-sub truncate">{subtitle}</div> : null}
      </div>
    </div>
    {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
  </header>
);

export const PanelBody = ({ className, children }) => <div className={clsx('panel-body', className)}>{children}</div>;

export const SectionHeading = ({ title, subtitle, actions, className }) => (
  <div className={clsx('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
    <div>
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      {subtitle ? <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-ink-faint">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);

export const Badge = ({ tone = 'neutral', children, className }) => (
  <span className={clsx('badge', `badge-${tone}`, className)}>{children}</span>
);

export const StatusDot = ({ tone = '#30D158', pulse = true }) => (
  <span className={clsx('status-dot', pulse && 'pulse')} style={{ background: tone, color: tone }} />
);

export const Meter = ({ value = 0, max = 100, tone = '#0A84FF', height = 5 }) => (
  <div className="meter-track" style={{ height }}>
    <div className="meter-fill" style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`, background: tone }} />
  </div>
);

export const StatTile = ({ label, value, unit, delta, deltaTone, hint, icon: Icon, children, className }) => (
  <div className={clsx('panel px-3.5 py-3', className)}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-ink-faint">{label}</span>
      {Icon ? <Icon className="h-3.5 w-3.5 text-ink-dim" /> : null}
    </div>
    <div className="mt-1.5 flex items-baseline gap-1.5">
      <span className="font-mono text-[19px] font-semibold leading-none text-ink">{value}</span>
      {unit ? <span className="text-[11px] text-ink-faint">{unit}</span> : null}
    </div>
    {delta ? (
      <div className="mt-1.5 text-[11px] text-ink-faint">
        <span className="font-mono" style={{ color: deltaTone }}>
          {delta}
        </span>
      </div>
    ) : null}
    {hint ? <div className="mt-1 text-2xs leading-snug text-ink-dim">{hint}</div> : null}
    {children}
  </div>
);

export const KeyValue = ({ items = [], columns = 1, className }) => (
  <dl className={clsx('grid gap-x-6', columns === 2 && 'sm:grid-cols-2', className)}>
    {items.map((it) => (
      <div key={it.label} className="spec-row">
        <dt>{it.label}</dt>
        <dd style={it.tone ? { color: it.tone } : undefined}>{it.value}</dd>
      </div>
    ))}
  </dl>
);

export const Segmented = ({ options = [], value, onChange, className }) => (
  <div className={clsx('segmented', className)}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        className={value === o.value ? 'is-active' : ''}
        onClick={() => onChange(o.value)}
        title={o.hint}
      >
        {o.icon ? <o.icon className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" /> : null}
        {o.label}
      </button>
    ))}
  </div>
);

export const ChipRow = ({ options = [], value, onChange, className }) => (
  <div className={clsx('flex flex-wrap items-center gap-2', className)}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        className={clsx('chip', value === o.value && 'is-active')}
        onClick={() => onChange(o.value)}
      >
        {o.icon ? <o.icon className="h-3.5 w-3.5" /> : null}
        {o.label}
      </button>
    ))}
  </div>
);

export const ToolButton = ({ active, children, title, onClick, className, disabled }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={clsx('icon-btn', active && 'is-active', disabled && 'opacity-40', className)}
  >
    {children}
  </button>
);

export const Toggle = ({ checked, onChange, label, hint }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-3 py-1.5 text-left"
  >
    <span>
      <span className="block text-[12.5px] text-ink">{label}</span>
      {hint ? <span className="block text-2xs text-ink-dim">{hint}</span> : null}
    </span>
    <span
      className="relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors"
      style={{ background: checked ? 'var(--app-accent)' : 'rgba(255,255,255,0.16)' }}
    >
      <span
        className="absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-all"
        style={{ left: checked ? 14 : 2 }}
      />
    </span>
  </button>
);

export const Slider = ({ label, value, min = 0, max = 100, step = 1, onChange, format }) => (
  <div className="w-full">
    <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className="font-mono text-ink-faint">{format ? format(value) : value}</span>
    </div>
    <input
      type="range"
      className="w-full"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

export const Table = ({ columns = [], rows = [], dense = false }) => (
  <div className="overflow-x-auto no-scrollbar">
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={c.align ? { textAlign: c.align } : undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i}>
            {columns.map((c) => (
              <td
                key={c.key}
                style={c.align ? { textAlign: c.align } : undefined}
                className={dense ? '!py-1.5' : undefined}
              >
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Callout = ({ tone = 'accent', icon: Icon, title, children, className }) => {
  const toneMap = {
    accent: 'border-accent/30 bg-accent/10 text-ink',
    warning: 'border-warning/30 bg-warning/10 text-ink',
    danger: 'border-danger/35 bg-danger/10 text-ink',
    success: 'border-success/30 bg-success/10 text-ink',
    neutral: 'border-line bg-white/[0.03] text-ink',
  };
  const iconTone = {
    accent: 'text-accent',
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
    neutral: 'text-ink-muted',
  };
  return (
    <div className={clsx('rounded-xl border px-3.5 py-3', toneMap[tone], className)}>
      <div className="flex items-start gap-2.5">
        {Icon ? <Icon className={clsx('mt-0.5 h-4 w-4 shrink-0', iconTone[tone])} /> : null}
        <div className="min-w-0">
          {title ? <div className="text-[12.5px] font-semibold">{title}</div> : null}
          <div className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{children}</div>
        </div>
      </div>
    </div>
  );
};

