import type { BadgeData } from '../types/badge';

const WIDTH = 450;
const HEIGHT = 600;

function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
  return `${base}${path}`;
}

function badgeLayerUrl(filename: string): string {
  const normalized = filename
    .replace(/_External$/, '_external')
    .replace(/_Internal$/, '_internal')
    .replace(/_Production$/, '_production');
  return assetUrl(`/assets/badge-layers/${normalized}.png`);
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[badge] failed to load layer: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

export async function renderBadge(
  canvas: HTMLCanvasElement,
  data: BadgeData,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const layerPaths: string[] = [
    assetUrl('/assets/badge-layers/Header.png'),
    ...(data.is2025Attendee ? [assetUrl('/assets/badge-layers/2025-attendee.png')] : []),
    ...(data.name ? [badgeLayerUrl(data.name)] : []),
    ...(data.registration ? [badgeLayerUrl(data.registration)] : []),
    ...(data.regTimeCode ? [assetUrl(`/assets/badge-layers/Time-${data.regTimeCode}.png`)] : []),
    ...(data.attendeeCount ? [badgeLayerUrl(data.attendeeCount)] : []),
    ...(data.attendeeDays ? [badgeLayerUrl(data.attendeeDays)] : []),
  ];

  for (const path of layerPaths) {
    const img = await loadImage(path);
    if (img) ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  }

  await Promise.all([
    document.fonts.load('500 22px "Instrument Sans"'),
    document.fonts.load('600 14px "Cormorant Garamond"'),
  ]);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';

  ctx.font = '500 44px "Instrument Sans"';
  ctx.letterSpacing = '0px';
  ctx.fillText((data.firstName ?? '').toUpperCase(), 36, 500);

  ctx.font = '600 29px "Cormorant Garamond"';
  ctx.letterSpacing = '-0.8px';
  ctx.fillText((data.lastName ?? '').toUpperCase(), 36, 535);

  ctx.font = '400 20px "Instrument Sans"';
  ctx.letterSpacing = '0px';
  ctx.fillText((data.company ?? '').toUpperCase(), 36, 580);
}

export async function badgeToBlob(data: BadgeData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderBadge(canvas, data);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}
