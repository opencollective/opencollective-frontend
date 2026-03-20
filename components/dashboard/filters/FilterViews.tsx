import React from 'react';
import { isNil } from 'lodash';
import { ChevronRight } from 'lucide-react';

import type { Views } from '../../../lib/filters/filter-types';
import { cn } from '../../../lib/utils';

import { Skeleton } from '../../ui/Skeleton';

type FilterViewsProps = {
  views: Views<Record<string, unknown>>;
  activeViewId?: string;
  onChange: (id: string) => void;
  hideCounts?: boolean;
};

const abbreviateNumber = (number: number): string => {
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return String(number);
};

function FilterViews({ views, activeViewId, onChange, hideCounts }: FilterViewsProps) {
  const someViewsHaveCount = React.useMemo(() => views.some(v => !isNil(v.count)), [views]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    setIsOverflowing(el.scrollWidth > el.clientWidth);
    setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 1);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll]);

  const scrollRight = () => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    el.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className={cn('flex gap-2 overflow-x-auto', isOverflowing && 'pr-10')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {views.map(view => {
          const isSelected = view.id === activeViewId;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onChange(view.id)}
              data-cy={`view-${view.id}`}
              className={cn(
                'flex flex-col gap-0.5 overflow-hidden rounded-lg border-2 px-3 py-2.5 text-left text-slate-800 transition-colors',
                'min-w-28 shrink-0 grow basis-0',
                'ring-ring ring-inset focus:outline-hidden focus-visible:ring-2',
                isSelected ? 'border-primary bg-background shadow-sm' : 'border-border bg-background hover:bg-slate-50',
              )}
            >
              <span className={cn('truncate text-sm', isSelected ? 'font-medium text-primary' : '')}>{view.label}</span>
              {!hideCounts &&
                (someViewsHaveCount ? (
                  !isNil(view.count) && (
                    <span className={cn('text-base leading-5 font-bold', isSelected ? 'text-primary' : '')}>
                      {abbreviateNumber(view.count)}
                    </span>
                  )
                ) : (
                  <Skeleton className="h-5 w-10" />
                ))}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          <div className="absolute inset-y-0 right-0 h-full w-16 bg-gradient-to-l from-background from-30% to-transparent" />
          <button
            type="button"
            onClick={scrollRight}
            className="pointer-events-auto relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(FilterViews);
