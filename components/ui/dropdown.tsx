/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/prop-types */
import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cx } from 'class-variance-authority';

import Link from '../Link';

export const DropdownMenu = React.forwardRef<
  React.ElementRef<typeof Menu>,
  React.ComponentPropsWithoutRef<typeof Menu>
>(({ className, ...props }, ref) => (
  <Menu as="div" ref={ref} className={cx('relative inline-block text-left', className)} {...props} />
));
DropdownMenu.displayName = Menu.displayName;

export const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof Menu.Button>,
  React.ComponentPropsWithoutRef<typeof Menu.Button>
>(({ className, ...props }, ref) => (
  //   <div>
  <Menu.Button as={React.Fragment} ref={ref} className={className} {...props} />
  //   </div>
));
DropdownMenuTrigger.displayName = Menu.Button.displayName;

export const DropdownMenuItems = React.forwardRef<
  React.ElementRef<typeof Menu.Items>,
  React.ComponentPropsWithoutRef<typeof Menu.Items> & { align?: 'right' | 'left' }
>(({ className, align = 'right', ...props }, ref) => {
  const useDividers = false;
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        ref={ref}
        className={cx(
          'absolute z-50 mt-2 w-48  rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
          useDividers && 'divide-y divide-slate-100',
          align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          className,
        )}
        {...props}
      />
    </Transition>
  );
});
DropdownMenuItems.displayName = Menu.Items.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & { href?: string }
>(({ className, onClick, href, children, ...props }, ref) => (
  <Menu.Item ref={ref} {...props}>
    {({ active }) => {
      const styles = cx(
        active ? 'bg-slate-100 text-slate-900' : 'text-slate-700',
        'w-full block px-4 py-2 text-sm text-left',
      );
      if (href) {
        return (
          <Link href={href} className={styles}>
            {children}
          </Link>
        );
      }

      return (
        <button className={styles} type="button" onClick={onClick}>
          {children}
        </button>
      );
    }}
  </Menu.Item>
));
DropdownMenuItem.displayName = Menu.Item.displayName;
