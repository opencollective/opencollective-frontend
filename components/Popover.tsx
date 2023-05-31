import React, { Fragment, useRef } from 'react';
import { Popover, Transition } from '@headlessui/react';

// duration can be tweaked at convenience
const timeoutDuration = 120;

const PopoverMenu = ({ className, labelText, content }) => {
  const triggerRef = useRef(null);
  // const timeOutRef = useRef();
  // const timeInRef = useRef();

  // const handleEnter = isOpen => {
  //   clearTimeout(timeOutRef.current);
  //   if (!isOpen) {
  //     timeInRef.current = setTimeout(() => {
  //       triggerRef.current?.click();
  //     }, timeoutDuration);
  //   }
  //   // !isOpen && triggerRef.current?.click();
  // };

  // const handleLeave = isOpen => {
  //   clearTimeout(timeInRef.current);

  //   timeOutRef.current = setTimeout(() => {
  //     isOpen && triggerRef.current?.click();
  //   }, timeoutDuration);
  // };

  return (
    <Popover className={`relative flex h-full items-center ${className}`}>
      {({ open }) => (
        <div
          className="h-full items-center"
          // onMouseEnter={() => handleEnter(open)}
          // onMouseLeave={() => handleLeave(open)}
        >
          <Popover.Button
            type="button"
            ref={triggerRef}
            className="inline-flex h-full items-center gap-0.5  border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {labelText}
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-1/2 z-50 mt-3 -translate-x-1/2 transform px-4">
              {content}
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
};

export default PopoverMenu;
