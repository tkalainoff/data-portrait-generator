import React, { useCallback, useRef, useState } from 'react';
import { Form } from './components/Form';
import { PortraitCanvas } from './components/PortraitCanvas';
import { BatchPanel } from './components/BatchPanel';
import { WorkshopBatchPanel } from './components/WorkshopBatchPanel';
import { WorkshopPortrait } from './components/WorkshopPortrait';
import type { PortraitCanvasHandle } from './components/PortraitCanvas';
import type { PortraitData } from './types';
import { SAMPLE_DATA } from './types';
import './App.css';

// 'portrait' is intentionally omitted from visible nav — keep the code and route
// intact so it can be re-surfaced by changing the default mode or adding the tab back.
type Mode = 'portrait' | 'badges' | 'workshop-badges' | 'workshop-portrait';

export default function App() {
  const [mode, setMode] = useState<Mode>('workshop-portrait');
  const [formData, setFormData] = useState<PortraitData>(SAMPLE_DATA);
  const [committed, setCommitted] = useState<PortraitData | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<PortraitCanvasHandle>(null);

  const handleGenerate = useCallback(() => {
    setCommitted({ ...formData });
  }, [formData]);

  const handleDownload = useCallback(() => {
    canvasRef.current?.download();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo-placeholder" />
          <span className="header-eyebrow">Innovation Week</span>
        </div>
        <div className="header-right">
          <h1 className="header-title">Data Portrait Generator</h1>
          <div className="mode-tabs">
            {/* Original Portrait tab hidden — code fully intact, re-add here to restore:
            <button
              className={`mode-tab${mode === 'portrait' ? ' active' : ''}`}
              onClick={() => setMode('portrait')}
            >
              Portrait
            </button>
            */}
            <button
              className={`mode-tab${mode === 'workshop-portrait' ? ' active' : ''}`}
              onClick={() => setMode('workshop-portrait')}
            >
              Workshop Portrait
            </button>
            <button
              className={`mode-tab${mode === 'workshop-badges' ? ' active' : ''}`}
              onClick={() => setMode('workshop-badges')}
            >
              Workshop Badges
            </button>
            <button
              className={`mode-tab${mode === 'badges' ? ' active' : ''}`}
              onClick={() => setMode('badges')}
            >
              Badges
            </button>
          </div>
        </div>
      </header>

      {/* Original Portrait — hidden from nav but fully functional */}
      {mode === 'portrait' && (
        <main className="app-main">
          <section className="form-panel" aria-label="Portrait configuration">
            <Form
              value={formData}
              onChange={setFormData}
              onGenerate={handleGenerate}
              isRendering={isRendering}
            />
          </section>
          <section className="preview-panel" aria-label="Portrait preview">
            <PortraitCanvas
              ref={canvasRef}
              data={committed}
              onRenderStart={() => setIsRendering(true)}
              onRenderEnd={() => setIsRendering(false)}
            />
            {committed && !isRendering && (
              <button className="download-btn" onClick={handleDownload}>
                Download PNG (600×600)
              </button>
            )}
          </section>
        </main>
      )}

      {mode === 'workshop-portrait' && <WorkshopPortrait />}

      {mode === 'workshop-badges' && (
        <main className="app-main-full">
          <WorkshopBatchPanel />
        </main>
      )}

      {mode === 'badges' && (
        <main className="app-main-full">
          <BatchPanel />
        </main>
      )}
    </div>
  );
}
