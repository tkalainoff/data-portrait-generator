import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PortraitData } from '../types';
import { renderPortrait } from '../utils/renderer';

interface PortraitCanvasProps {
  data: PortraitData | null;
  onRenderStart?: () => void;
  onRenderEnd?: () => void;
}

export interface PortraitCanvasHandle {
  download: () => void;
}

export const PortraitCanvas = forwardRef<PortraitCanvasHandle, PortraitCanvasProps>(
  ({ data, onRenderStart, onRenderEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Keep callback refs current on every render so the effect below can always
    // call the latest version without listing the callbacks as dependencies.
    // Listing inline arrow functions as deps causes a new reference on every
    // parent render, which would re-fire the effect and create an infinite loop.
    const onRenderStartRef = useRef(onRenderStart);
    const onRenderEndRef = useRef(onRenderEnd);
    onRenderStartRef.current = onRenderStart;
    onRenderEndRef.current = onRenderEnd;

    useImperativeHandle(ref, () => ({
      download() {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return;
        const link = document.createElement('a');
        const firstName = (data?.name ?? 'portrait').split(' ')[0].toLowerCase();
        const lastName = (data?.name ?? '').split(' ').slice(1).join('_').toLowerCase();
        link.download = lastName
          ? `${firstName}_${lastName}_portrait.png`
          : `${firstName}_portrait.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      },
    }));

    useEffect(() => {
      if (!data) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      let cancelled = false;
      onRenderStartRef.current?.();
      renderPortrait(canvas, data).then(() => {
        if (!cancelled) {
          setIsEmpty(false);
          onRenderEndRef.current?.();
        }
      });
      return () => { cancelled = true; };
    // Only re-run when the committed data changes — not when callbacks change.
    }, [data]);

    return (
      <div className="portrait-wrap">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className={`portrait-canvas${isEmpty ? ' portrait-empty' : ''}`}
          aria-label="Data portrait preview"
        />
        {isEmpty && (
          <div className="portrait-placeholder">
            <span>Fill in the form and click<br /><strong>Generate Portrait</strong></span>
          </div>
        )}
      </div>
    );
  },
);

PortraitCanvas.displayName = 'PortraitCanvas';
