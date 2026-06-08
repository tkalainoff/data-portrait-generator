import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import type { WorkshopBadgeData } from '../types/workshopBadge';
import { parseWorkshopAttendees } from '../utils/parseWorkshopAttendees';
import { renderWorkshopBadge, renderWorkshopBadgeBleed } from '../utils/workshopBadgeRenderer';

// ── PDF layout constants (identical to BatchPanel) ────────────────────────────
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const BLEED = 3.175;
const BADGE_TRIM_W = 76.2;
const BADGE_TRIM_H = 101.6;
const CELL_W = BADGE_TRIM_W + BLEED * 2;
const CELL_H = BADGE_TRIM_H + BLEED * 2;
const MARGIN_X = (PAGE_W - CELL_W * 2) / 3;
const MARGIN_Y = (PAGE_H - CELL_H * 2) / 3;

const BADGE_W = 225;
const BADGE_H = 300;
const CHUNK_SIZE = 40;

function drawCropMarks(pdf: jsPDF, trimX: number, trimY: number, dx: number, dy: number) {
  const GAP = 1;
  const LEN = 5;
  pdf.line(trimX + dx * GAP, trimY, trimX + dx * (GAP + LEN), trimY);
  pdf.line(trimX, trimY + dy * GAP, trimX, trimY + dy * (GAP + LEN));
}

function addTrimMarksForCell(pdf: jsPDF, cellX: number, cellY: number) {
  const tx = cellX + BLEED;
  const ty = cellY + BLEED;
  const tx2 = cellX + CELL_W - BLEED;
  const ty2 = cellY + CELL_H - BLEED;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.088);
  drawCropMarks(pdf, tx,  ty,  -1, -1);
  drawCropMarks(pdf, tx2, ty,   1, -1);
  drawCropMarks(pdf, tx,  ty2, -1,  1);
  drawCropMarks(pdf, tx2, ty2,  1,  1);
}

async function badgeToDataUrlBleed(data: WorkshopBadgeData): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderWorkshopBadgeBleed(canvas, data);
  return canvas.toDataURL('image/png');
}

// ── Badge preview card ────────────────────────────────────────────────────────
function BadgePreview({ data }: { data: WorkshopBadgeData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) renderWorkshopBadge(canvasRef.current, data);
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

// ── Main component ────────────────────────────────────────────────────────────
export function WorkshopBatchPanel() {
  const [attendees, setAttendees] = useState<WorkshopBadgeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProdPdfGenerating, setIsProdPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const data = await parseWorkshopAttendees(file);
      setAttendees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setAttendees([]);
    }
    e.target.value = '';
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < attendees.length; i++) {
        const canvas = document.createElement('canvas');
        await renderWorkshopBadge(canvas, attendees[i]);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
        });
        const idx = String(i + 1).padStart(3, '0');
        zip.file(`badge_${idx}.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workshop_badges.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [attendees]);

  const handleDownloadProdPdf = useCallback(async () => {
    if (attendees.length === 0) return;
    setIsProdPdfGenerating(true);
    const totalChunks = Math.ceil(attendees.length / CHUNK_SIZE);

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, attendees.length);
        const chunk = attendees.slice(start, end);

        setPdfProgress(`Chunk ${chunkIndex + 1} of ${totalChunks}…`);

        const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

        for (let i = 0; i < chunk.length; i++) {
          const col = i % 2;
          const row = Math.floor(i / 2) % 2;
          const posInPage = i % 4;
          if (i > 0 && posInPage === 0) pdf.addPage();

          const x = MARGIN_X + col * (CELL_W + MARGIN_X);
          const y = MARGIN_Y + row * (CELL_H + MARGIN_Y);
          const dataUrl = await badgeToDataUrlBleed(chunk[i]);
          pdf.addImage(dataUrl, 'PNG', x, y, CELL_W, CELL_H);
          addTrimMarksForCell(pdf, x, y);
        }

        const pageCount = pdf.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
          pdf.setPage(p);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6);
          pdf.setTextColor(150);
          pdf.text('Trim marks shown — bleed 0.125in / 3mm', PAGE_W / 2, PAGE_H - 4, { align: 'center' });
        }

        const suffix = totalChunks > 1 ? `_${chunkIndex + 1}of${totalChunks}` : '';
        pdf.save(`workshop_badges${suffix}.pdf`);
      }
    } finally {
      setIsProdPdfGenerating(false);
      setPdfProgress('');
    }
  }, [attendees]);

  return (
    <div className="batch-panel">
      <div className="batch-upload-row">
        <label className="batch-upload-label">
          <span>Upload workshop Excel (.xlsx)</span>
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
            onClick={handleDownloadProdPdf}
            disabled={isProdPdfGenerating}
          >
            {isProdPdfGenerating
              ? (pdfProgress || 'Generating PDF…')
              : `Download Batch Sheet PDF`}
          </button>
        )}

        {attendees.length > 0 && (
          <button
            className="batch-download-btn"
            onClick={handleDownloadZip}
            disabled={isDownloading}
          >
            {isDownloading
              ? 'Generating ZIP…'
              : `Download All as ZIP (${attendees.length})`}
          </button>
        )}
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
          Upload a workshop Excel file to generate badges.
        </div>
      )}
    </div>
  );
}
