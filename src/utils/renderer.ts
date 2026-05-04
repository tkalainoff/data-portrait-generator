import type { ChartType, Department, PortraitData, Tenure } from '../types';

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2;

const DEPARTMENT_FALLBACK: Record<Department, string> = {
  strategy: '#4A7FB5',
  creative: '#7B5EA7',
  technology: '#3A8A6E',
  operations: '#C07830',
  'client-services': '#A85070',
};

const TENURE_COUNTS: Record<Tenure, number> = {
  'less-than-1': 2,
  '1-3': 4,
  '3-5': 6,
  '5-10': 9,
  '10-plus': 12,
};

// ─── Asset loading ────────────────────────────────────────────────────────────

function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
  return `${base}${path}`;
}

async function tryLoadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ─── Position helpers ─────────────────────────────────────────────────────────

function tenureRingPositions(count: number): Array<{ x: number; y: number }> {
  const r = 248;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });
}

// Community badges arc: upper-left quadrant
function communityArcPositions(count: number): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  const r = 168;
  const startAngle = Math.PI * 1.08;
  const endAngle = Math.PI * 1.48;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = startAngle + t * (endAngle - startAngle);
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });
}

// Skills positions driven by chart type — upper and middle-center zone
function skillPositions(chart: ChartType, count: number): Array<{ x: number; y: number }> {
  const all: Record<ChartType, Array<{ x: number; y: number }>> = {
    bar: [
      { x: CX - 115, y: CY - 110 },
      { x: CX, y: CY - 110 },
      { x: CX + 115, y: CY - 110 },
      { x: CX - 115, y: CY - 48 },
      { x: CX, y: CY - 48 },
      { x: CX + 115, y: CY - 48 },
    ],
    line: [
      { x: CX - 140, y: CY - 55 },
      { x: CX - 85, y: CY - 115 },
      { x: CX - 25, y: CY - 72 },
      { x: CX + 35, y: CY - 130 },
      { x: CX + 95, y: CY - 88 },
      { x: CX + 148, y: CY - 140 },
    ],
    pie: (() => {
      const r = 104;
      return Array.from({ length: 6 }, (_, i) => ({
        x: CX + r * Math.cos((i / 6) * Math.PI * 2 - Math.PI / 2),
        y: CY - 62 + r * Math.sin((i / 6) * Math.PI * 2 - Math.PI / 2) * 0.72,
      }));
    })(),
    scatter: [
      { x: CX - 118, y: CY - 122 },
      { x: CX + 88, y: CY - 138 },
      { x: CX - 55, y: CY - 62 },
      { x: CX + 122, y: CY - 58 },
      { x: CX - 12, y: CY - 140 },
      { x: CX + 52, y: CY - 28 },
    ],
    map: [
      { x: CX - 110, y: CY - 120 },
      { x: CX, y: CY - 120 },
      { x: CX + 110, y: CY - 120 },
      { x: CX - 110, y: CY - 38 },
      { x: CX, y: CY - 38 },
      { x: CX + 110, y: CY - 38 },
    ],
    network: [
      { x: CX, y: CY - 148 },
      { x: CX - 128, y: CY - 88 },
      { x: CX + 128, y: CY - 88 },
      { x: CX - 135, y: CY - 5 },
      { x: CX + 135, y: CY - 5 },
      { x: CX, y: CY - 62 },
    ],
  };
  return all[chart].slice(0, count);
}

// ─── Layer draw functions ─────────────────────────────────────────────────────

function drawFallbackBackground(ctx: CanvasRenderingContext2D, dept: Department) {
  ctx.fillStyle = DEPARTMENT_FALLBACK[dept];
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function drawTypography(
  ctx: CanvasRenderingContext2D,
  name: string,
  jobTitle: string,
  pronouns: string,
) {
  const nameY = 402;
  const titleY = 434;
  const pronounsY = 460;

  // Soft dark radial backdrop for legibility
  const grad = ctx.createRadialGradient(CX, 445, 0, CX, 445, 168);
  grad.addColorStop(0, 'rgba(0,0,0,0.58)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 310, SIZE, 290);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 8;

  ctx.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(name.toUpperCase(), CX, nameY, 460);

  ctx.font = '17px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.93)';
  ctx.fillText(jobTitle, CX, titleY, 420);

  if (pronouns.trim()) {
    ctx.font = 'italic 14px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.76)';
    ctx.fillText(pronouns, CX, pronounsY, 320);
  }

  ctx.shadowBlur = 0;
}

// Draw network spoke lines before placing skill tokens
function drawNetworkSpokes(
  ctx: CanvasRenderingContext2D,
  positions: Array<{ x: number; y: number }>,
) {
  if (positions.length < 2) return;
  const hub = positions[positions.length - 1];
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < positions.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(positions[i].x, positions[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw line chart connector path before skill tokens
function drawLineConnector(
  ctx: CanvasRenderingContext2D,
  positions: Array<{ x: number; y: number }>,
) {
  if (positions.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(positions[0].x, positions[0].y);
  for (let i = 1; i < positions.length; i++) {
    ctx.lineTo(positions[i].x, positions[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export async function renderPortrait(
  canvas: HTMLCanvasElement,
  data: PortraitData,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = SIZE;
  canvas.height = SIZE;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // ── Circular clip (applied for all subsequent drawing) ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.clip();

  // ── Layer 1: Department background ──
  const bgImg = await tryLoadImage(assetUrl(`/assets/department/${data.department}.svg`));
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, SIZE, SIZE);
  } else {
    drawFallbackBackground(ctx, data.department);
  }

  // ── Layer 2: Chart motif overlay (structural pattern, low opacity) ──
  const chartImg = await tryLoadImage(assetUrl(`/assets/charts/${data.favorite_chart}.svg`));
  if (chartImg) {
    ctx.globalAlpha = 0.22;
    ctx.drawImage(chartImg, 0, 0, SIZE, SIZE);
    ctx.globalAlpha = 1.0;
  }

  // ── Layer 3: Tenure ring ──
  const tenureImg = await tryLoadImage(assetUrl(`/assets/tenure/${data.tenure}.svg`));
  const tPositions = tenureRingPositions(TENURE_COUNTS[data.tenure]);
  for (const pos of tPositions) {
    if (tenureImg) {
      ctx.drawImage(tenureImg, pos.x - 14, pos.y - 14, 28, 28);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Layer 4: Community badges (upper-left arc) ──
  const communityImgs = await Promise.all(
    data.community_contributions.map((c) =>
      tryLoadImage(assetUrl(`/assets/community/${c}.svg`)),
    ),
  );
  const cPositions = communityArcPositions(data.community_contributions.length);
  communityImgs.forEach((img, i) => {
    const pos = cPositions[i];
    if (!pos) return;
    if (img) {
      ctx.drawImage(img, pos.x - 24, pos.y - 24, 48, 48);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // ── Layer 5: Desk motif (lower-right zone) ──
  const deskImg = await tryLoadImage(assetUrl(`/assets/desk/${data.desk_location}.svg`));
  const deskX = 418, deskY = 408;
  if (deskImg) {
    ctx.drawImage(deskImg, deskX - 26, deskY - 26, 52, 52);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(deskX, deskY, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Layer 6: Skills tokens (layout driven by chart type) ──
  const skillImgs = await Promise.all(
    data.skills.map((s) => tryLoadImage(assetUrl(`/assets/skills/${s}.svg`))),
  );
  const sPositions = skillPositions(data.favorite_chart, data.skills.length);

  // Chart-type connectors drawn before tokens
  if (data.favorite_chart === 'network') drawNetworkSpokes(ctx, sPositions);
  if (data.favorite_chart === 'line') drawLineConnector(ctx, sPositions);
  if (data.favorite_chart === 'map') {
    // Grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    const xs = [...new Set(sPositions.map((p) => p.x))].sort((a, b) => a - b);
    const ys = [...new Set(sPositions.map((p) => p.y))].sort((a, b) => a - b);
    for (const x of xs) {
      ctx.beginPath(); ctx.moveTo(x, ys[0] - 20); ctx.lineTo(x, ys[ys.length - 1] + 20); ctx.stroke();
    }
    for (const y of ys) {
      ctx.beginPath(); ctx.moveTo(xs[0] - 20, y); ctx.lineTo(xs[xs.length - 1] + 20, y); ctx.stroke();
    }
    ctx.restore();
  }

  skillImgs.forEach((img, i) => {
    const pos = sPositions[i];
    if (!pos) return;
    if (img) {
      ctx.drawImage(img, pos.x - 24, pos.y - 24, 48, 48);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // ── Layer 7: Typography (always on top, readable) ──
  drawTypography(ctx, data.name, data.job_title, data.pronouns);

  ctx.restore(); // releases circular clip
}
