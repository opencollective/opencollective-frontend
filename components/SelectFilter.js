import React, { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, BarsArrowUpIcon } from '@heroicons/react/20/solid';

export default function Example({ onChange, value, defaultValue, options }) {
  value = value || defaultValue;
  return (
    <div className="">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="text-sm px-2.5 py-1.5 bg-white hover:bg-gray-50 rounded-md  flex items-center flex-nowrap gap-1 text-gray-900 font-medium ring-1 ring-inset ring-gray-300 hover:shadow transition-all shadow-sm">
            <BarsArrowUpIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />

            <span className="block truncate">{value.label}</span>
            {/* <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span> */}
          </Listbox.Button>

          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute mt-1 z-50 right-0 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
