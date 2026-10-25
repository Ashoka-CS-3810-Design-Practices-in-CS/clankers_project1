import { useState, type ReactNode } from 'react';

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

interface VisualizationZoomProps {
  readonly children: (zoom: number) => ReactNode;
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function VisualizationZoom({ children }: VisualizationZoomProps) {
  const [zoom, setZoom] = useState(1);
  const percentage = Math.round(zoom * 100);

  return (
    <div className="zoomable-canvas" data-zoom={zoom}>
      <div className="zoom-toolbar" role="group" aria-label="Visualization zoom">
        <button
          type="button"
          onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out visualization"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="zoom-reset"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          aria-label="Reset visualization zoom to 100 percent"
          title="Reset zoom"
        >
          {percentage}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in visualization"
          title="Zoom in"
        >
          +
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          Visualization zoom {percentage} percent
        </span>
      </div>
      <div className="zoomable-canvas-content">{children(zoom)}</div>
    </div>
  );
}
