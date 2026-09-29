/**
 * AeroTwin Analytics Kernel
 * Pure, dependency-free statistical / signal-processing helpers used by the
 * telemetry, prognostics and XAI views. Everything here is deterministic given
 * its inputs so charts stay reproducible between renders.
 */

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export const mean = (arr) => (arr.length ? sum(arr) / arr.length : 0);

export const variance = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return sum(arr.map((v) => (v - m) ** 2)) / (arr.length - 1);
};

export const stdev = (arr) => Math.sqrt(variance(arr));

export const minOf = (arr) => (arr.length ? Math.min(...arr) : 0);

export const maxOf = (arr) => (arr.length ? Math.max(...arr) : 0);

export const range = (arr) => maxOf(arr) - minOf(arr);

/** Linear-interpolated percentile (p in 0..1). */
export const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = clamp(p, 0, 1) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

/** Exponential moving average. */
export const ema = (arr, alpha = 0.25) => {
  const out = [];
  let prev = arr[0] ?? 0;
  arr.forEach((v) => {
    prev = alpha * v + (1 - alpha) * prev;
    out.push(prev);
  });
  return out;
};

/** Trailing moving average with window n (same length output, edge-padded). */
export const rollingMean = (arr, n = 5) => {
  if (!arr.length) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += 1) {
    const lo = Math.max(0, i - n + 1);
    out.push(mean(arr.slice(lo, i + 1)));
  }
  return out;
};

/** Ordinary least-squares fit y = m*x + b over (index, value). */
export const linreg = (values) => {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0, rmse: 0 };
  const xs = values.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(values);
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (values[i] - my);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const preds = xs.map((x) => slope * x + intercept);
  const ssRes = sum(values.map((v, i) => (v - preds[i]) ** 2));
  const ssTot = sum(values.map((v) => (v - my) ** 2));
  return {
    slope,
    intercept,
    r2: ssTot === 0 ? 0 : clamp(1 - ssRes / ssTot, -1, 1),
    rmse: Math.sqrt(ssRes / n),
  };
};

/**
 * Trend-aware forecast with a widening confidence cone.
 * Uses a damped linear extrapolation (partly regression, partly last value) so
 * forecasts degrade gracefully instead of flying off.
 */
export const forecast = (values, steps = 24, { damping = 0.55, ci = 1.96 } = {}) => {
  const { slope, intercept, rmse, r2 } = linreg(values);
  const n = values.length;
  const last = values[n - 1] ?? intercept;
  const residSigma = Math.max(rmse, stdev(values) * 0.25, 1e-6);
  const meanArr = [];
  const lower = [];
  const upper = [];
  for (let k = 1; k <= steps; k += 1) {
    const blend = Math.min(0.6, k / (steps * 2));
    const anchor = last * (1 - blend) + (slope * n + intercept) * blend;
    const y = anchor + slope * damping * k;
    const widen = residSigma * ci * Math.sqrt(k);
    meanArr.push(y);
    lower.push(y - widen);
    upper.push(y + widen);
  }
  return { mean: meanArr, lower, upper, slope, r2 };
};

/** z-score anomaly flags over a series. */
export const zScores = (values) => {
  const m = mean(values);
  const s = stdev(values) || 1e-6;
  return values.map((v) => (v - m) / s);
};

export const anomalies = (values, z = 3) =>
  zScores(values)
    .map((s, i) => ({ i, z: s, value: values[i], isAnomaly: Math.abs(s) >= z }))
    .filter((d) => d.isAnomaly);

/** Pearson correlation of two equal-length series. */
export const pearson = (a, b) => {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(-n);
  const bx = b.slice(-n);
  const ma = mean(ax);
  const mb = mean(bx);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i += 1) {
    num += (ax[i] - ma) * (bx[i] - mb);
    da += (ax[i] - ma) ** 2;
    db += (bx[i] - mb) ** 2;
  }
  if (da === 0 || db === 0) return 0;
  return clamp(num / Math.sqrt(da * db), -1, 1);
};

/** Correlation matrix for a { key: number[] } channel map. */
export const correlationMatrix = (channels) => {
  const keys = Object.keys(channels);
  return {
    keys,
    values: keys.map((k1) => keys.map((k2) => (k1 === k2 ? 1 : pearson(channels[k1], channels[k2])))),
  };
};

/** Naive DFT magnitude spectrum (Hann-windowed, first `bins` positive bins). */
export const spectrum = (values, bins = 32) => {
  const n = Math.min(values.length, 128);
  const slice = values.slice(-n);
  if (n < 8) return Array(bins).fill(0);
  const windowed = slice.map((v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
  const m = mean(windowed);
  const out = [];
  for (let k = 1; k <= bins; k += 1) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t += 1) {
      const ang = (2 * Math.PI * k * t) / n;
      re += (windowed[t] - m) * Math.cos(ang);
      im -= (windowed[t] - m) * Math.sin(ang);
    }
    out.push(Math.sqrt(re * re + im * im) / (n / 2));
  }
  const peak = maxOf(out) || 1;
  return out.map((v) => (v / peak) * 100);
};

/** Uniform histogram with an optional normal-curve density overlay. */
export const histogram = (values, binCount = 16, lo, hi) => {
  const l = lo ?? minOf(values);
  const h = hi ?? maxOf(values);
  const w = (h - l) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, i) => ({ x0: l + i * w, x1: l + (i + 1) * w, count: 0 }));
  values.forEach((v) => {
    const idx = clamp(Math.floor((v - l) / w), 0, binCount - 1);
    bins[idx].count += 1;
  });
  const m = mean(values);
  const s = stdev(values) || 1e-6;
  bins.forEach((b) => {
    const xc = (b.x0 + b.x1) / 2;
    b.density = ((values.length * w) / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-((xc - m) ** 2) / (2 * s * s));
  });
  return bins;
};

/** Two-parameter Weibull reliability / hazard primitives. */
export const weibull = (t, beta = 2.4, eta = 900) => ({
  survival: Math.exp(-((t / eta) ** beta)),
  hazard: (beta / eta) * ((t / eta) ** (beta - 1)),
});

/** Gamma-process style degradation mean/variance path used in the RUL view. */
export const degradationPath = ({ from = 100, ratePerHour = 0.12, horizonHours = 240, steps = 48 }) => {
  const dt = horizonHours / steps;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i * dt;
    return { t, value: Math.max(0, from - ratePerHour * Math.pow(t, 1.08)) };
  });
};

/**
 * Remaining useful life estimate from a degrading health index.
 * Projects the fitted trend until it crosses the failure threshold and converts
 * the residual scatter into a 95% confidence interval.
 */
export const estimateRul = (healthSeries, { threshold = 40, sampleSeconds = 1 } = {}) => {
  const { slope, rmse, r2 } = linreg(healthSeries);
  const n = healthSeries.length;
  const current = healthSeries[n - 1] ?? 100;
  const slopePerHour = slope * (3600 / Math.max(sampleSeconds, 1));

  if (slopePerHour >= -0.0005 || current <= threshold) {
    const nominal = current <= threshold ? 0 : Math.min(9999, (current - threshold) / 0.12);
    return {
      rulHours: nominal,
      lower: nominal * 0.85,
      upper: nominal * 1.15,
      slopePerHour: Math.abs(slopePerHour),
      degradationPerHour: Math.abs(slopePerHour),
      r2,
      confidence: clamp(Math.max(r2, 0.35), 0, 0.99),
      etaHours: Math.max(24, nominal),
      beta: 2.4,
      isDegrading: false,
    };
  }

  const rulHours = clamp(Math.abs((current - threshold) / slopePerHour), 0.05, 20000);
  const scatterPenalty = clamp(rmse / Math.max(current, 1), 0.01, 0.6);
  return {
    rulHours,
    lower: Math.max(0.05, rulHours * (1 - 0.35 * scatterPenalty - 0.08)),
    upper: rulHours * (1 + 0.35 * scatterPenalty + 0.08),
    slopePerHour: Math.abs(slopePerHour),
    degradationPerHour: Math.abs(slopePerHour),
    r2,
    confidence: clamp(0.55 + 0.45 * Math.max(r2, 0), 0, 0.99),
    etaHours: rulHours * 1.35,
    beta: 2.2 + 0.6 * Math.max(r2, 0),
    isDegrading: true,
  };
};

/** Bias-corrected sample statistics bundle for a channel. */
export const describe = (values) => ({
  n: values.length,
  mean: mean(values),
  std: stdev(values),
  min: minOf(values),
  max: maxOf(values),
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  trend: linreg(values),
});

export const fmt = (v, digits = 1) => {
  if (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(1)}k`;
  return Number(v).toFixed(digits);
};

export const fmtClock = (totalHours) => {
  if (!Number.isFinite(totalHours)) return '—';
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const healthTone = (status) => {
  switch (status) {
    case 'CRITICAL':
      return { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/35', dot: 'bg-danger', label: 'Critical' };
    case 'DEGRADED':
      return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/35', dot: 'bg-warning', label: 'Degraded' };
    default:
      return { text: 'text-success', bg: 'bg-success/10', border: 'border-success/30', dot: 'bg-success', label: 'Nominal' };
  }
};

