import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import type { BadgeData } from '../types/badge';
import { parseAttendees } from '../utils/parseAttendees';
import { badgeToBlob, renderBadge } from '../utils/badgeRenderer';

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

export function BatchPanel() {
  const [attendees, setAttendees] = useState<BadgeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
        const blob = await badgeToBlob(person);
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
            onClick={handleDownloadAll}
            disabled={isDownloading}
          >
            {isDownloading
              ? `Generating ZIP…`
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
          Upload an Excel file with an <code>attendee_info</code> sheet to generate badges.
        </div>
      )}
    </div>
  );
}
