import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VisualizationZoom } from './VisualizationZoom';

describe('VisualizationZoom', () => {
  it('changes, clamps, and resets the visualization scale', () => {
    render(<VisualizationZoom>{(zoom) => <output>{zoom}</output>}</VisualizationZoom>);

    const zoomIn = screen.getByRole('button', { name: 'Zoom in visualization' });
    const zoomOut = screen.getByRole('button', { name: 'Zoom out visualization' });
    const reset = screen.getByRole('button', { name: 'Reset visualization zoom to 100 percent' });

    expect(screen.getByText('1')).toBeInTheDocument();
    fireEvent.click(zoomIn);
    expect(screen.getByText('1.25')).toBeInTheDocument();
    fireEvent.click(reset);
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(zoomOut);
    expect(screen.getByText('0.75')).toBeInTheDocument();
    expect(zoomOut).toBeDisabled();

    for (let index = 0; index < 5; index += 1) fireEvent.click(zoomIn);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();
  });
});
