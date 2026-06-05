import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import type { BadgeData } from '../types/badge';
import { parseAttendees } from '../utils/parseAttendees';
import { badgeToBlob, bleedToBlob, renderBadge, renderBadgeBleed } from '../utils/badgeRenderer';

const BADGE_W = 225; // display size (half of 450 for 2x density)
const BADGE_H = 300;
const BLEED_DISPLAY_W = 244;
const BLEED_DISPLAY_H = 319;

type ExportMode = 'screen' | 'bleed';

function BadgePreview({ data, exportMode }: { data: BadgeData; exportMode: ExportMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (exportMode === 'bleed') {
      renderBadgeBleed(canvasRef.current, data);
    } else {
      renderBadge(canvasRef.current, data);
    }
  }, [data, exportMode]);

  if (exportMode === 'bleed') {
    return (
      <div className="badge-card">
        <canvas
          ref={canvasRef}
          width={975}
          height={1275}
          style={{ width: BLEED_DISPLAY_W, height: BLEED_DISPLAY_H, display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div className="badge-card">
      <canvas
        ref={canvasRef}
        width={450}
        height={600}
        style={{ width: BADGE_W, height: BADGE_H, display: 'block' }}
      />
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
  return `${base}${path}`;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[badge] failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

async function handleDownloadBackSheet() {
  const canvas = document.createElement('canvas');
  canvas.width = 2550;
  canvas.height = 3300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 2550, 3300);

  const img = await loadImage(assetUrl('/assets/badge-layers_new/Bleed/bleed_Back.png'));
  if (img) {
    const xs = [200, 1375];
    const ys = [250, 1775];
    for (const x of xs) {
      for (const y of ys) {
        ctx.drawImage(img, x, y, 975, 1275);
      }
    }
  }

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, 'back_sheet.png');
  }, 'image/png');
}

async function handleDownloadWalkUp() {
  const canvas = document.createElement('canvas');
  canvas.width = 975;
  canvas.height = 1275;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 975, 1275);

  const img = await loadImage(assetUrl('/assets/badge-layers_new/Bleed/bleed_BLANK_WALK-UP.png'));
  if (img) {
    ctx.drawImage(img, 0, 0, 975, 1275);
  }

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, 'walk_up_badge.png');
  }, 'image/png');
}

export function BatchPanel() {
  const [attendees, setAttendees] = useState<BadgeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('screen');

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const data = await parseAttendees(file);
      setAttendees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setAttendees([]);
    }
    // reset input so same file can be re-uploaded
    e.target.value = '';
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      for (const person of attendees) {
        const blob = exportMode === 'bleed'
          ? await bleedToBlob(person)
          : await badgeToBlob(person);
        const first = person.firstName.toLowerCase().replace(/\s+/g, '-') || 'unknown';
        const last = person.lastName.toLowerCase().replace(/\s+/g, '-') || 'unknown';
        zip.file(`${first}_${last}_badge.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'badges.zip');
    } finally {
      setIsDownloading(false);
    }
  }, [attendees, exportMode]);

  return (
    <div className="batch-panel">
      <div className="batch-mode-toggle">
        <button
          className={`batch-mode-btn${exportMode === 'screen' ? ' active' : ''}`}
          onClick={() => setExportMode('screen')}
        >
          Screen (900×1200)
        </button>
        <button
          className={`batch-mode-btn${exportMode === 'bleed' ? ' active' : ''}`}
          onClick={() => setExportMode('bleed')}
        >
          Print / Bleed (975×1275)
        </button>
      </div>

      <div className="batch-upload-row">
        <label className="batch-upload-label">
          <span>Upload attendee Excel (.xlsx)</span>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFile}
            className="batch-file-input"
          />
          <span className="batch-upload-btn">Choose file</span>
        </label>

        {attendees.length > 0 && (
          <button
            className="batch-download-btn"
            onClick={handleDownloadAll}
            disabled={isDownloading}
          >
            {isDownloading
              ? `Generating ZIP…`
              : `Download All as ZIP (${attendees.length})`}
          </button>
        )}
      </div>

      <div className="batch-extras-row">
        <button className="batch-extra-btn" onClick={handleDownloadBackSheet}>
          Download Back Sheet (8.5"×11")
        </button>
        <button className="batch-extra-btn" onClick={handleDownloadWalkUp}>
          Download Walk-Up Badge
        </button>
      </div>

      {error && <p className="batch-error">{error}</p>}

      {attendees.length > 0 && (
        <div className="badge-grid">
          {attendees.map((person, i) => (
            <BadgePreview key={i} data={person} exportMode={exportMode} />
          ))}
        </div>
      )}

      {attendees.length === 0 && !error && (
        <div className="batch-empty">
          Upload an Excel file with an <code>attendee_info</code> sheet to generate badges.
        </div>
      )}
    </div>
  );
}
