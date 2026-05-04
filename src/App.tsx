import React, { useCallback, useRef, useState } from 'react';
import { Form } from './components/Form';
import { PortraitCanvas } from './components/PortraitCanvas';
import type { PortraitCanvasHandle } from './components/PortraitCanvas';
import type { PortraitData } from './types';
import { SAMPLE_DATA } from './types';
import './App.css';

export default function App() {
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
        <div className="header-inner">
          <span className="header-eyebrow">Innovation Week</span>
          <h1 className="header-title">Data Portrait Generator</h1>
        </div>
      </header>

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
    </div>
  );
}
