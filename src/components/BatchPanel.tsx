import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import type { BadgeData } from '../types/badge';
import { parseAttendees } from '../utils/parseAttendees';
import { badgeToBlob, bleedToBlob, renderBadge, renderBadgeBleed } from '../utils/badgeRenderer';

function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
  return `${base}${path}`;
}

async function loadImageFor(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function drawCanvasCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const INSET = 37.5;
  const GAP = 12;
  const LEN = 54;
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'butt';

  const corners: [number, number, number, number][] = [
    [x + INSET,     y + INSET,     -1, -1], // top-left
    [x + w - INSET, y + INSET,      1, -1], // top-right
    [x + INSET,     y + h - INSET, -1,  1], // bottom-left
    [x + w - INSET, y + h - INSET,  1,  1], // bottom-right
  ];

  for (const [tx, ty, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(tx + dx * GAP, ty);
    ctx.lineTo(tx + dx * (GAP + LEN), ty);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, ty + dy * GAP);
    ctx.lineTo(tx, ty + dy * (GAP + LEN));
    ctx.stroke();
  }

  ctx.restore();
}

async function downloadBackSheet() {
  const canvas = document.createElement('canvas');
  canvas.width = 2550;
  canvas.height = 3300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 2550, 3300);
  const img = await loadImageFor(assetUrl('/assets/badge-layers_new/Bleed/bleed_Back.png'));
  if (img) {
    for (const x of [200, 1375]) {
      for (const y of [250, 1775]) {
        ctx.drawImage(img, x, y, 975, 1275);
      }
    }
  }
  drawCanvasCropMarks(ctx, 200,  250,  975, 1275);
  drawCanvasCropMarks(ctx, 1375, 250,  975, 1275);
  drawCanvasCropMarks(ctx, 200,  1775, 975, 1275);
  drawCanvasCropMarks(ctx, 1375, 1775, 975, 1275);
  const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const dataUrl = canvas.toDataURL('image/png');
  pdf.addImage(dataUrl, 'PNG', 0, 0, 215.9, 279.4);
  pdf.save('back_sheet.pdf');
}

async function downloadWalkUpBadge() {
  const canvas = document.createElement('canvas');
  canvas.width = 2550;
  canvas.height = 3300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 2550, 3300);
  const img = await loadImageFor(assetUrl('/assets/badge-layers_new/Bleed/bleed_BLANK_WALK-UP.png'));
  if (img) {
    for (const x of [200, 1375]) {
      for (const y of [250, 1775]) {
        ctx.drawImage(img, x, y, 975, 1275);
      }
    }
  }
  drawCanvasCropMarks(ctx, 200,  250,  975, 1275);
  drawCanvasCropMarks(ctx, 1375, 250,  975, 1275);
  drawCanvasCropMarks(ctx, 200,  1775, 975, 1275);
  drawCanvasCropMarks(ctx, 1375, 1775, 975, 1275);
  const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const dataUrl = canvas.toDataURL('image/png');
  pdf.addImage(dataUrl, 'PNG', 0, 0, 215.9, 279.4);
  pdf.save('walk_up_sheet.pdf');
}

const BADGE_W = 225; // display size (half of 450 for 2x density)
const BADGE_H = 300;

function BadgePreview({ data }: { data: BadgeData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderBadge(canvasRef.current, data);
    }
  }, [data]);

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

// US Letter: 215.9 × 279.4 mm
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const BLEED = 3.175; // 0.125 inch in mm

// Badge trim size in mm — badge canvas is 450×600 at 150dpi → 76.2×101.6 mm
const BADGE_TRIM_W = 76.2;
const BADGE_TRIM_H = 101.6;
// Cell size including bleed on all sides
const CELL_W = BADGE_TRIM_W + BLEED * 2;
const CELL_H = BADGE_TRIM_H + BLEED * 2;

// 2×2 grid: equal margins left/right and top/bottom
const MARGIN_X = (PAGE_W - CELL_W * 2) / 3; // space left, between, right
const MARGIN_Y = (PAGE_H - CELL_H * 2) / 3;

async function badgeToDataUrl(data: BadgeData): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderBadge(canvas, data);
  return canvas.toDataURL('image/png');
}

async function badgeToDataUrlBleed(data: BadgeData): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderBadgeBleed(canvas, data);
  return canvas.toDataURL('image/png');
}

// Draw L-shaped crop marks at one corner of a trim box.
// (trimX, trimY) is the corner of the trim boundary.
// dx/dy indicate which direction marks extend (+1 or -1).
function drawCropMarks(
  pdf: jsPDF,
  trimX: number,
  trimY: number,
  dx: number,
  dy: number,
) {
  const GAP = 1;    // mm gap between trim edge and mark start
  const LEN = 5;    // mm mark length

  // horizontal arm
  const hx1 = trimX + dx * GAP;
  const hx2 = trimX + dx * (GAP + LEN);
  pdf.line(hx1, trimY, hx2, trimY);

  // vertical arm
  const vy1 = trimY + dy * GAP;
  const vy2 = trimY + dy * (GAP + LEN);
  pdf.line(trimX, vy1, trimX, vy2);
}

function addTrimMarksForCell(pdf: jsPDF, cellX: number, cellY: number) {
  // Trim boundary sits BLEED inset from the cell (image) edges
  const tx = cellX + BLEED;
  const ty = cellY + BLEED;
  const tx2 = cellX + CELL_W - BLEED;
  const ty2 = cellY + CELL_H - BLEED;

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.088); // 0.25pt in mm (1pt = 0.353mm)

  drawCropMarks(pdf, tx,  ty,  -1, -1); // top-left
  drawCropMarks(pdf, tx2, ty,   1, -1); // top-right
  drawCropMarks(pdf, tx,  ty2, -1,  1); // bottom-left
  drawCropMarks(pdf, tx2, ty2,  1,  1); // bottom-right
}

const CHUNK_SIZE = 40;

export function BatchPanel() {
  const [attendees, setAttendees] = useState<BadgeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isProdPdfGenerating, setIsProdPdfGenerating] = useState(false);
  const [isDoublePdfGenerating, setIsDoublePdfGenerating] = useState(false);
  const [doublePdfProgress, setDoublePdfProgress] = useState('');

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

  const handleDownloadDoubleSidedPdf = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsDoublePdfGenerating(true);
    setDoublePdfProgress('Loading assets…');

    try {
      const backImg = await loadImageFor(
        assetUrl('/assets/badge-layers_new/Bleed/bleed_Back.png')
      );

      let backDataUrl: string | null = null;
      if (backImg) {
        const c = document.createElement('canvas');
        c.width = backImg.naturalWidth || 975;
        c.height = backImg.naturalHeight || 1275;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(backImg, 0, 0, c.width, c.height);
        backDataUrl = c.toDataURL('image/png');
      }

      const totalChunks = Math.ceil(attendees.length / CHUNK_SIZE);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, attendees.length);
        const chunk = attendees.slice(start, end);

        setDoublePdfProgress(`Chunk ${chunkIndex + 1} of ${totalChunks}…`);

        const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
        let isFirstPage = true;

        for (let i = 0; i < chunk.length; i++) {
          const posInPage = i % 4;
          const col = i % 2;
          const row = Math.floor(i / 2) % 2;

          if (posInPage === 0 && !isFirstPage) {
            // Back page for the completed group of 4
            pdf.addPage();
            for (let b = 0; b < 4; b++) {
              const bc = b % 2;
              const br = Math.floor(b / 2);
              // Mirror column so backs align when flipped on long edge
              const backCol = 1 - bc;
              const bx = MARGIN_X + backCol * (CELL_W + MARGIN_X);
              const by = MARGIN_Y + br * (CELL_H + MARGIN_Y);
              if (backDataUrl) pdf.addImage(backDataUrl, 'PNG', bx, by, CELL_W, CELL_H);
              addTrimMarksForCell(pdf, bx, by);
            }
            // New front page for the next group
            pdf.addPage();
          }

          if (posInPage === 0) isFirstPage = false;

          const x = MARGIN_X + col * (CELL_W + MARGIN_X);
          const y = MARGIN_Y + row * (CELL_H + MARGIN_Y);
          const dataUrl = await badgeToDataUrlBleed(chunk[i]);
          pdf.addImage(dataUrl, 'PNG', x, y, CELL_W, CELL_H);
          addTrimMarksForCell(pdf, x, y);
        }

        // Back page for the last (possibly partial) group
        const lastGroupCount = chunk.length % 4 || 4;
        pdf.addPage();
        for (let b = 0; b < lastGroupCount; b++) {
          const bc = b % 2;
          const br = Math.floor(b / 2);
          const backCol = 1 - bc;
          const bx = MARGIN_X + backCol * (CELL_W + MARGIN_X);
          const by = MARGIN_Y + br * (CELL_H + MARGIN_Y);
          if (backDataUrl) pdf.addImage(backDataUrl, 'PNG', bx, by, CELL_W, CELL_H);
          addTrimMarksForCell(pdf, bx, by);
        }

        const suffix = totalChunks > 1 ? `_${chunkIndex + 1}of${totalChunks}` : '';
        pdf.save(`badges_double_sided${suffix}.pdf`);
      }
    } finally {
      setIsDoublePdfGenerating(false);
      setDoublePdfProgress('');
    }
  }, [attendees]);

  const handleDownloadAll = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      for (const person of attendees) {
        const blob = await bleedToBlob(person);
        const first = person.firstName.toLowerCase().replace(/\s+/g, '-') || 'unknown';
        const last = person.lastName.toLowerCase().replace(/\s+/g, '-') || 'unknown';
        zip.file(`${first}_${last}_badge.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'badges.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [attendees]);

  const handleDownloadPdf = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsPdfGenerating(true);
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

      for (let i = 0; i < attendees.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2) % 2;
        const posInPage = (i % 4);

        if (i > 0 && posInPage === 0) pdf.addPage();

        const x = MARGIN_X + col * (CELL_W + MARGIN_X);
        const y = MARGIN_Y + row * (CELL_H + MARGIN_Y);

        const dataUrl = await badgeToDataUrl(attendees[i]);
        pdf.addImage(dataUrl, 'PNG', x, y, CELL_W, CELL_H);
      }

      pdf.save('badges_print.pdf');
    } finally {
      setIsPdfGenerating(false);
    }
  }, [attendees]);

  const handleDownloadProdPdf = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsProdPdfGenerating(true);
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

      for (let i = 0; i < attendees.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2) % 2;
        const posInPage = i % 4;

        if (i > 0 && posInPage === 0) pdf.addPage();

        const x = MARGIN_X + col * (CELL_W + MARGIN_X);
        const y = MARGIN_Y + row * (CELL_H + MARGIN_Y);

        const dataUrl = await badgeToDataUrlBleed(attendees[i]);
        pdf.addImage(dataUrl, 'PNG', x, y, CELL_W, CELL_H);
        addTrimMarksForCell(pdf, x, y);
      }

      // Footer note on each page
      const pageCount = pdf.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.setTextColor(150);
        pdf.text('Trim marks shown — bleed 0.125in / 3mm', PAGE_W / 2, PAGE_H - 4, { align: 'center' });
      }

      pdf.save('badges_production.pdf');
    } finally {
      setIsProdPdfGenerating(false);
    }
  }, [attendees]);

  return (
    <div className="batch-panel">
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
            onClick={handleDownloadDoubleSidedPdf}
            disabled={isDoublePdfGenerating}
          >
            {isDoublePdfGenerating
              ? (doublePdfProgress || 'Generating PDF…')
              : `Download Batch Sheet PDF (Double-Sided)`}
          </button>
        )}

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

        {/* Print PDF (no crop marks) — temporarily hidden, remove comment to restore */}
        {/* {attendees.length > 0 && (
          <button
            className="batch-download-btn"
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
          >
            {isPdfGenerating ? `Generating PDF…` : `Download Print PDF`}
          </button>
        )} */}

        {attendees.length > 0 && (
          <button
            className="batch-download-btn"
            onClick={handleDownloadProdPdf}
            disabled={isProdPdfGenerating}
          >
            {isProdPdfGenerating ? `Generating PDF…` : `Download Batch Sheet PDF`}
          </button>
        )}

        <button className="batch-download-btn" onClick={downloadBackSheet}>
          Download Back Sheet PDF
        </button>

        <button className="batch-download-btn" onClick={downloadWalkUpBadge}>
          Download Walk-Up Sheet PDF
        </button>
      </div>

      {error && <p className="batch-error">{error}</p>}

      {attendees.length > 0 && (
        <div className="badge-grid">
          {attendees.map((person, i) => (
            <BadgePreview key={i} data={person} />
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
