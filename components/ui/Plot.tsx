import React, { useEffect } from 'react';
import * as Plot from '@observablehq/plot';

import { useElementSize } from '@/lib/hooks/useElementSize';

export default function PlotFigure({ options, className }: { options: Plot.PlotOptions | null; className?: string }) {
  const { ref, width, height } = useElementSize({});

  useEffect(() => {
    if (options === null) {
      return;
    }
    const plot = Plot.plot({ ...options, width, height });
    ref.current.innerHTML = '';
    ref.current.append(plot);
    return () => plot.remove();
  }, [options, ref, height, width]);

  return <div ref={ref} className={className} />;
}

export { Plot };
