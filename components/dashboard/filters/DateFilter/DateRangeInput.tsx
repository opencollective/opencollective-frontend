import React from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, CornerDownRight } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { stripTime } from '../../../../lib/date-utils';
import { useWindowResize, VIEWPORTS } from '../../../../lib/hooks/useWindowResize';

import { Calendar } from '../../../ui/Calendar';
import { Input } from '../../../ui/Input';
import { Popover, PopoverAnchor, PopoverContent } from '../../../ui/Popover';

export function DateRangeInput({ value, onChange }) {
  const fromInputRef = React.useRef(null);
  const toInputRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;

  const dateRange: DateRange = {
    from: value?.gte ? dayjs(value.gte).toDate() : undefined,
    to: value?.lte ? dayjs(value.lte).toDate() : undefined,
  };

  const calendarOnSelect = (dateRange: DateRange) =>
    onChange({ ...value, gte: stripTime(dateRange?.from), lte: stripTime(dateRange?.to) });

  return (
    <div className={'grid gap-2'}>
      <Popover open={open}>
        <PopoverAnchor asChild>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
              <div className="relative w-full">
                <CalendarIcon
                  size={16}
                  className={'pointer-events-none absolute bottom-0 left-3 top-0 h-full text-muted-foreground'}
                />
                <Input
                  ref={fromInputRef}
                  onFocus={() => setOpen(true)}
                  autoFocus
                  className="pl-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  type="date"
                  value={value.gte ?? ''}
                  onChange={e =>
                    onChange({
                      ...value,
                      gte: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
              <div className="relative w-full">
                <CalendarIcon
                  size={16}
                  className={'pointer-events-none absolute bottom-0 left-3 top-0 h-full text-muted-foreground'}
                />
                <Input
                  ref={toInputRef}
                  onFocus={() => setOpen(true)}
                  className="pl-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  type="date"
                  value={value.lte ?? ''}
                  onChange={e =>
                    onChange({
                      ...value,
                      lte: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          onOpenAutoFocus={e => e.preventDefault()}
          onInteractOutside={e => {
            const inputIsFocused =
              document.activeElement === fromInputRef.current || document.activeElement === toInputRef.current;
            const eventIsFocusingInput = e.target === fromInputRef.current || e.target === toInputRef.current;
            const shouldClose = !inputIsFocused && !eventIsFocusingInput;

            if (shouldClose) {
              setOpen(false);
            }
          }}
          side={!isMobile ? 'right' : 'bottom'}
          sideOffset={12}
          className="w-auto p-0"
        >
          <Calendar
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={calendarOnSelect}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
