import React, { Fragment, useState } from 'react';
import { Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cx } from 'class-variance-authority';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/Select';

export default function Example({
  onChange,
  value,
  defaultValue,
  options,
  trigger,
  triggerTooltip,
  className,
  align = 'right',
}) {
  value = value || defaultValue;
  return (
    <Select onValueChange={value => onChange(value)} value={value}>
      <SelectTrigger className="max-w-[160px]">{trigger}</SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem value={option.value} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return <div>Select filter</div>;
  //   return (
  //     <div className="">
  //       <Listbox value={value} onChange={onChange}>
  //         <div className="relative">
  //           {triggerTooltip ? (
  //             <Tooltip>
  //               <TooltipTrigger>
  //                 <Listbox.Button
  //                   className={cx(
  //                     'flex  flex-nowrap items-center justify-center  gap-1 rounded-md bg-white text-sm font-medium text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow',
  //                     className,
  //                   )}
  //                 >
  //                   {trigger}
  //                 </Listbox.Button>
  //               </TooltipTrigger>
  //               <TooltipContent>{triggerTooltip}</TooltipContent>
  //             </Tooltip>
  //           ) : (
  //             <Listbox.Button
  //               className={cx(
  //                 'flex flex-nowrap items-center gap-1 rounded-md bg-white  px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow',
  //                 className,
  //               )}
  //             >
  //               {trigger}
  //             </Listbox.Button>
  //           )}

  //           <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
  //             <Listbox.Options
  //               className={cx(
  //                 'absolute z-50 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm',
  //                 align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2 transform',
  //               )}
  //             >
  //               {options.map((option, personIdx) => (
  //                 <Listbox.Option
  //                   key={personIdx}
  //                   className={({ active }) =>
  //                     `relative cursor-default select-none py-2 pl-10 pr-4 ${
  //                       active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
  //                     }`
  //                   }
  //                   value={option}
  //                 >
  //                   {({ selected }) => (
  //                     <>
  //                       <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
  //                         {option.label}
  //                       </span>
  //                       {selected ? (
  //                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
  //                           <Check size={20} aria-hidden="true" />
  //                         </span>
  //                       ) : null}
  //                     </>
  //                   )}
  //                 </Listbox.Option>
  //               ))}
  //             </Listbox.Options>
  //           </Transition>
  //         </div>
  //       </Listbox>
  //     </div>
  //   );
}
