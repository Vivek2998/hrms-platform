import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col gap-1',
        month: 'flex flex-col gap-3',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold',
        nav: 'flex items-start gap-1 absolute inset-0 justify-between px-1 py-1.5',
        button_previous:
          'h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-accent transition-colors flex items-center justify-center',
        button_next:
          'h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-accent transition-colors flex items-center justify-center',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground w-8 font-normal text-[0.75rem] flex items-center justify-center py-0.5',
        week: 'flex w-full mt-0.5',
        day: 'relative p-0 text-center text-sm',
        day_button:
          'h-8 w-8 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center text-[0.8rem]',
        selected:
          '[&>button]:!bg-primary [&>button]:!text-primary-foreground [&>button]:hover:!bg-primary [&>button]:hover:!text-primary-foreground',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-semibold',
        outside: '[&>button]:text-muted-foreground [&>button]:opacity-40',
        disabled:
          '[&>button]:text-muted-foreground [&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:text-muted-foreground',
        range_start: '[&>button]:rounded-l-full',
        range_end: '[&>button]:rounded-r-full',
        range_middle:
          '[&>button]:bg-accent [&>button]:rounded-none [&>button]:hover:bg-accent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') return <ChevronLeft className="h-3.5 w-3.5" />;
          return <ChevronRight className="h-3.5 w-3.5" />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';
export { Calendar };
