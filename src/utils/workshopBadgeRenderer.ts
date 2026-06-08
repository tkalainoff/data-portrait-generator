import type { WorkshopBadgeData } from '../types/workshopBadge';

const WIDTH = 450;
const HEIGHT = 600;
const BLEED_W = 975;
const BLEED_H = 1275;

function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
  return `${base}${path}`;
}

function workshopLayerUrl(filename: string): string {
  return assetUrl(`/assets/badge-layers-workshop/${encodeURIComponent(filename)}`);
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[workshop] failed to load layer: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

function resolveOrgType(v: string): string | null {
  const s = v.toLowerCase();
  if (s.includes('omnicom')) return 'an Omnicom agency company.png';
  if (s.includes('pharma') || s.includes('biotech')) return 'a pharma or biotech company.png';
  if (s.includes('another') || s.includes('other')) return 'another organization.png';
  return null;
}

function resolveSchedule(v: string): string | null {
  const s = v.toLowerCase();
  if (s.includes('early')) return 'Early Bird.png';
  if (s.includes('night') || s.includes('owl')) return 'Night Owl.png';
  return null;
}

function resolveChartType(v: string): string | null {
  const s = v.toLowerCase();
  if (s.includes('pie') || s.includes('donut')) return 'Pie or Donut- I am popular but sometimes hard to read.png';
  if (s.includes('line') || s.includes('area')) return 'Line or Area- I am the first to spot a trend.png';
  if (s.includes('scatter')) return 'Scatter- I am excellent at spotting correlations.png';
  if (s.includes('diagram') || s.includes('network')) return 'Diagram or Network- I am very organized.png';
  if (s.includes('big') || s.includes('number') || s.includes('a$$')) return 'Big A$$ Number-  I love making a statement.png';
  if (s.includes('bar')) return 'Bar- I am a jack-of-all-trades.png';
  return null;
}

function resolveComfortScore(score: number): string {
  if (score <= 2) return '0-1-2.png';
  if (score <= 7) return '3-4-5-6-7.png';
  return '8-9-10.png';
}

function resolveRole(v: string): string | null {
  const s = v.toLowerCase();
  if (s.includes('analyst')) return 'Analyst- I make sense of the big numbers.png';
  if (s.includes('designer')) return 'Designer- I visualize the big numbers and concepts.png';
  if (s.includes('developer')) return 'Developer- I build the system to gather the data.png';
  if (s.includes('researcher')) return 'Researcher- I dig into where the data can be found.png';
  return null;
}

function buildLayerFilenames(data: WorkshopBadgeData): string[] {
  const layers: string[] = [];
  const sched = resolveSchedule(data.schedule);
  if (sched) layers.push(sched);
  const chart = resolveChartType(data.chartType);
  if (chart) layers.push(chart);
  layers.push(resolveComfortScore(data.comfortScore));
  const role = resolveRole(data.role);
  if (role) layers.push(role);
  // Org affiliation drawn last so it sits on top of all other layers
  const org = resolveOrgType(data.orgType);
  if (org) layers.push(org);
  return layers;
}

export async function renderWorkshopBadge(
  canvas: HTMLCanvasElement,
  data: WorkshopBadgeData,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.globalAlpha = 0.85;
  for (const filename of buildLayerFilenames(data)) {
    const img = await loadImage(workshopLayerUrl(filename));
    if (img) ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  }
}

export async function workshopBadgeToBlob(data: WorkshopBadgeData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderWorkshopBadge(canvas, data);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

export async function renderWorkshopBadgeBleed(
  canvas: HTMLCanvasElement,
  data: WorkshopBadgeData,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = BLEED_W;
  canvas.height = BLEED_H;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, BLEED_W, BLEED_H);

  ctx.globalAlpha = 0.85;
  for (const filename of buildLayerFilenames(data)) {
    const img = await loadImage(workshopLayerUrl(filename));
    if (img) ctx.drawImage(img, 0, 0, BLEED_W, BLEED_H);
  }
}

export async function workshopBleedToBlob(data: WorkshopBadgeData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderWorkshopBadgeBleed(canvas, data);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}
