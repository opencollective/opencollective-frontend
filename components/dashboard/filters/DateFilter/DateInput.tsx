import React from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, CornerDownRight } from 'lucide-react';

import { stripTime } from '../../../../lib/date-utils';
import { useWindowResize, VIEWPORTS } from '../../../../lib/hooks/useWindowResize';

import { Calendar } from '../../../ui/Calendar';
import { Input } from '../../../ui/Input';
import { Popover, PopoverAnchor, PopoverContent } from '../../../ui/Popover';

export function DateInput({
  date,
  onChange,
  autoFocus = false,
}: {
  date?: string; // date string of format YYYY-MM-DD
  onChange: (date: string) => void;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef(null);
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;

  const dateAsDateTime = dayjs(date).toDate();

  const calendarOnSelect = (date: Date) => {
    onChange(stripTime(date));
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open}>
      <PopoverAnchor className="relative w-full">
        <div className="flex items-center gap-2">
          <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
          <div className="relative w-full">
            <CalendarIcon
              size={16}
              className={'pointer-events-none absolute bottom-0 left-3 top-0 h-full text-muted-foreground'}
            />
            <Input
              ref={inputRef}
              onFocus={() => setOpen(true)}
              autoFocus={autoFocus}
              className="pl-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              type="date"
              value={date ?? ''}
              onChange={e => onChange(e.target.value)}
            />
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        side={!isMobile ? 'right' : 'bottom'}
        className="w-auto p-0"
        sideOffset={12}
        onOpenAutoFocus={e => e.preventDefault()}
        onInteractOutside={e => {
          const inputIsFocused = document.activeElement === inputRef.current;
          const eventIsFocusingInput = e.target === inputRef.current;
          const shouldClose = !inputIsFocused && !eventIsFocusingInput;

          if (shouldClose) {
            setOpen(false);
          }
        }}
      >
        <Calendar mode="single" selected={dateAsDateTime} onSelect={calendarOnSelect} />
      </PopoverContent>
    </Popover>
  );
}
