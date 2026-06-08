import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkshopBadgeData } from '../types/workshopBadge';
import { renderWorkshopBadge } from '../utils/workshopBadgeRenderer';

const DEFAULT_DATA: WorkshopBadgeData = {
  orgType: 'an Omnicom agency company',
  schedule: 'Early Bird',
  chartType: 'Bar',
  comfortScore: 5,
  role: 'Analyst',
};

const ORG_OPTIONS = [
  { value: 'an Omnicom agency company', label: 'An Omnicom agency company' },
  { value: 'a pharma or biotech company', label: 'A pharma or biotech company' },
  { value: 'another organization', label: 'Another organization' },
];

const SCHEDULE_OPTIONS = [
  { value: 'Early Bird', label: 'Early Bird' },
  { value: 'Night Owl', label: 'Night Owl' },
];

const CHART_OPTIONS = [
  { value: 'Pie or Donut', label: 'Pie or Donut' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Line or Area', label: 'Line or Area' },
  { value: 'Scatter', label: 'Scatter' },
  { value: 'Diagram or Network', label: 'Diagram or Network' },
  { value: 'Big A$$ Number', label: 'Big A$$ Number' },
];

const ROLE_OPTIONS = [
  { value: 'Analyst', label: 'Analyst' },
  { value: 'Designer', label: 'Designer' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Researcher', label: 'Researcher' },
];

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="check-group">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`check-pill${value === opt.value ? ' checked' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export function WorkshopPortrait() {
  const [formData, setFormData] = useState<WorkshopBadgeData>(DEFAULT_DATA);
  const [committed, setCommitted] = useState<WorkshopBadgeData | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onRenderStartRef = useRef<(() => void) | undefined>(undefined);
  const onRenderEndRef = useRef<(() => void) | undefined>(undefined);
  onRenderStartRef.current = () => setIsRendering(true);
  onRenderEndRef.current = () => { setIsRendering(false); setIsEmpty(false); };

  useEffect(() => {
    if (!committed || !canvasRef.current) return;
    let cancelled = false;
    onRenderStartRef.current?.();
    renderWorkshopBadge(canvasRef.current, committed).then(() => {
      if (!cancelled) onRenderEndRef.current?.();
    });
    return () => { cancelled = true; };
  }, [committed]);

  const handleGenerate = useCallback(() => {
    setCommitted({ ...formData });
  }, [formData]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || isEmpty) return;
    const link = document.createElement('a');
    link.download = 'workshop_portrait.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [isEmpty]);

  const set = <K extends keyof WorkshopBadgeData>(key: K, v: WorkshopBadgeData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: v }));

  return (
    <main className="app-main">
      <section className="form-panel" aria-label="Workshop portrait configuration">
        <form
          className="portrait-form"
          onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
        >
          <h2 className="form-title">Workshop Portrait</h2>

          <div className="field">
            <label>I am part of...</label>
            <RadioGroup
              name="orgType"
              options={ORG_OPTIONS}
              value={formData.orgType}
              onChange={(v) => set('orgType', v)}
            />
          </div>

          <div className="field">
            <label>I consider myself a(n)...</label>
            <RadioGroup
              name="schedule"
              options={SCHEDULE_OPTIONS}
              value={formData.schedule}
              onChange={(v) => set('schedule', v)}
            />
          </div>

          <div className="field">
            <label>If I was a chart, I would be a...</label>
            <RadioGroup
              name="chartType"
              options={CHART_OPTIONS}
              value={formData.chartType}
              onChange={(v) => set('chartType', v)}
            />
          </div>

          <div className="field">
            <label>
              When it comes to data visualization...{' '}
              <span className="hint">{formData.comfortScore} / 10</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={formData.comfortScore}
              onChange={(e) => set('comfortScore', parseInt(e.target.value, 10))}
              className="workshop-range"
            />
            <div className="workshop-range-labels">
              <span>0 — Just getting started</span>
              <span>10 — Total expert</span>
            </div>
          </div>

          <div className="field">
            <label>When it comes to data viz, I consider myself a(n)...</label>
            <RadioGroup
              name="role"
              options={ROLE_OPTIONS}
              value={formData.role}
              onChange={(v) => set('role', v)}
            />
          </div>

          <button type="submit" className="generate-btn" disabled={isRendering}>
            {isRendering ? 'Generating…' : 'Generate Portrait'}
          </button>
        </form>
      </section>

      <section className="preview-panel" aria-label="Workshop portrait preview">
        <div className="workshop-badge-wrap">
          <canvas
            ref={canvasRef}
            width={450}
            height={600}
            className={`workshop-badge-canvas${isEmpty ? ' portrait-empty' : ''}`}
            aria-label="Workshop badge preview"
          />
          {isEmpty && (
            <div className="portrait-placeholder">
              <span>Fill in the form and click<br /><strong>Generate Portrait</strong></span>
            </div>
          )}
        </div>
        {committed && !isRendering && (
          <button className="download-btn" onClick={handleDownload}>
            Download PNG (450×600)
          </button>
        )}
      </section>
    </main>
  );
}
