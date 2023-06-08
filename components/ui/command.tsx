import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import SearchForm from '../NewSearchForm';
import Avatar from '../Avatar';
const recentlyVisited = [
  {
    id: 8686,
    slug: 'opencollective',
    type: 'ORGANIZATION',
    isIncognito: false,
    name: 'Open Collective',
    currency: 'USD',
    isHost: true,
    endsAt: null,
    imageUrl: 'https://images.opencollective.com/opencollective/019a512/logo.png',
  },
  {
    id: 14076,
    slug: 'keepassxc',
    type: 'COLLECTIVE',
    isIncognito: false,
    name: 'KeePassXC',
    currency: 'USD',
    isHost: false,
    endsAt: null,
    imageUrl: 'https://images.opencollective.com/keepassxc/3a25727/logo.png',
    categories: [],
  },
  {
    id: 48347,
    slug: 'cobudget',
    type: 'COLLECTIVE',
    isIncognito: false,
    name: 'Cobudget',
    currency: 'EUR',
    isHost: false,
    endsAt: null,
    imageUrl: 'https://images.opencollective.com/cobudget/84e4d55/logo.png',
  },
];
export default function CommandMenu({ open, setOpen }: any) {
  return (
    <Transition.Root show={open} as={Fragment} appear>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <SearchForm autoFocus onClose={() => setOpen(false)} />
              <div className="pt-4 pb-2">
                <h3 className="text-xs px-4 font-medium text-slate-800 mb-2">Recently visited profiles</h3>
                <div className="space-y-1 px-2">
                  {recentlyVisited.map(collective => (
                    <div
                      key={collective.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      <Avatar collective={collective} radius={32} />{' '}
                      <p className="text-sm font-medium text-slate-800">{collective.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
