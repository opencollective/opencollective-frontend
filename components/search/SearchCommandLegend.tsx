import React from 'react';
import { ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';

export function SearchCommandLegend() {
  return (
    <div className="flex items-center gap-8 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <div className="flex size-6 items-center justify-center rounded-md border bg-background">
          <ArrowUp size={14} />
        </div>

        <div className="flex size-6 items-center justify-center rounded-md border bg-background">
          <ArrowDown size={14} />
        </div>
        <span>to navigate</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex size-6 items-center justify-center rounded-md border bg-background">
          <CornerDownLeft size={14} />
        </div>
        <span>to select</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex h-6 items-center justify-center rounded-md border bg-background px-1">esc</div>
        <span>to close</span>
      </div>
    </div>
  );
}
