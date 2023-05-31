import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';
import { cx } from 'class-variance-authority';

export default function Switch({ enabled, setEnabled, label, description = undefined }) {
  return (
    <HeadlessSwitch.Group as="div" className="flex items-center justify-between">
      <span className="flex flex-grow flex-col">
        <HeadlessSwitch.Label as="span" className="text-sm font-medium leading-6 text-gray-900" passive>
          {label}
        </HeadlessSwitch.Label>
        {description && (
          <HeadlessSwitch.Description as="span" className="text-sm text-gray-500">
            {description}
          </HeadlessSwitch.Description>
        )}
      </span>
      <HeadlessSwitch
        checked={enabled}
        onChange={setEnabled}
        className={cx(
          enabled ? 'bg-blue-600' : 'bg-gray-200',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          )}
        />
      </HeadlessSwitch>
    </HeadlessSwitch.Group>
  );
}
