// Statistical analysis utilities

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  let ssYY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    ssXY += dx * dy;
    ssXX += dx * dx;
    ssYY += dy * dy;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const rSquared = ssXX === 0 || ssYY === 0 ? 0 : (ssXY * ssXY) / (ssXX * ssYY);

  return { slope, intercept, rSquared };
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value.toFixed(1)}M`;
  }
  return `$${value.toFixed(1)}M`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU").format(value);
}
