import React, { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, BarsArrowUpIcon } from '@heroicons/react/20/solid';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cx } from 'class-variance-authority';

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
    <div className="">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          {triggerTooltip ? (
            <Tooltip>
              <TooltipTrigger>
                <Listbox.Button
                  className={cx(
                    'text-sm  bg-white hover:bg-gray-50 rounded-md  flex items-center justify-center flex-nowrap gap-1 text-gray-500 font-medium ring-1 ring-inset ring-gray-300 hover:shadow transition-all shadow-sm',
                    className,
                  )}
                >
                  {trigger}
                </Listbox.Button>
              </TooltipTrigger>
              <TooltipContent>{triggerTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <Listbox.Button
              className={cx(
                'text-sm px-2.5 py-1.5 bg-white hover:bg-gray-50 rounded-md  flex items-center flex-nowrap gap-1 text-gray-900 font-medium ring-1 ring-inset ring-gray-300 hover:shadow transition-all shadow-sm',
                className,
              )}
            >
              {trigger}
            </Listbox.Button>
          )}

          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options
              className={cx(
                'absolute mt-1 z-50 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm',
                align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 transform -translate-x-1/2',
              )}
            >
              {options.map((option, personIdx) => (
                <Listbox.Option
                  key={personIdx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
