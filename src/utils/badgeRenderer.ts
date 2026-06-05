import type { BadgeData } from '../types/badge';

const WIDTH = 450;
const HEIGHT = 600;

function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
  return `${base}${path}`;
}

function badgeLayerUrl(filename: string): string {
  return assetUrl(`/assets/badge-layers_new/${filename}.png`);
}

function bleedLayerUrl(filename: string): string {
  return assetUrl(`/assets/badge-layers_new/Bleed/bleed_${filename}.png`);
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
    assetUrl('/assets/badge-layers_new/Header.png'),
    ...(data.is2025Attendee ? [assetUrl('/assets/badge-layers_new/2025_attendee.png')] : []),
    ...(data.name ? [badgeLayerUrl(data.name)] : []),
    ...(data.registration ? [badgeLayerUrl(data.registration)] : []),
    ...(data.regTimeCode ? [assetUrl(`/assets/badge-layers_new/Time-${data.regTimeCode}.png`)] : []),
    ...(data.attendeeCount ? [badgeLayerUrl(data.attendeeCount)] : []),
    ...(data.attendeeDays ? [badgeLayerUrl(data.attendeeDays)] : []),
  ];

  for (const path of layerPaths) {
    const img = await loadImage(path);
    if (img) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1.0;
    }
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

const BLEED_WIDTH = 975;
const BLEED_HEIGHT = 1275;

export async function renderBadgeBleed(
  canvas: HTMLCanvasElement,
  data: BadgeData,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = BLEED_WIDTH;
  canvas.height = BLEED_HEIGHT;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, BLEED_WIDTH, BLEED_HEIGHT);

  const layerPaths: string[] = [
    bleedLayerUrl('Header'),
    ...(data.is2025Attendee ? [bleedLayerUrl('2025_attendee')] : []),
    ...(data.name ? [bleedLayerUrl(data.name)] : []),
    ...(data.registration ? [bleedLayerUrl(data.registration)] : []),
    ...(data.regTimeCode ? [bleedLayerUrl(`Time-${data.regTimeCode}`)] : []),
    ...(data.attendeeCount ? [bleedLayerUrl(data.attendeeCount)] : []),
    ...(data.attendeeDays ? [bleedLayerUrl(data.attendeeDays)] : []),
  ];

  for (const path of layerPaths) {
    const img = await loadImage(path);
    if (img) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img, 0, 0, BLEED_WIDTH, BLEED_HEIGHT);
      ctx.globalAlpha = 1.0;
    }
  }

  await Promise.all([
    document.fonts.load('500 88px "Instrument Sans"'),
    document.fonts.load('600 58px "Cormorant Garamond"'),
  ]);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';

  ctx.font = '500 88px "Instrument Sans"';
  ctx.letterSpacing = '0px';
  ctx.fillText((data.firstName ?? '').toUpperCase(), 110, 1038);

  ctx.font = '600 58px "Cormorant Garamond"';
  ctx.letterSpacing = '-1.6px';
  ctx.fillText((data.lastName ?? '').toUpperCase(), 110, 1108);

  ctx.font = '400 40px "Instrument Sans"';
  ctx.letterSpacing = '0px';
  ctx.fillText((data.company ?? '').toUpperCase(), 110, 1198);
}

export async function bleedToBlob(data: BadgeData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderBadgeBleed(canvas, data);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}
