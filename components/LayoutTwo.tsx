import React, { Fragment, useState } from 'react';
import { Menu, Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
  Cog8ToothIcon,
  HomeIcon,
  InboxIcon,
  LifebuoyIcon,
  UserIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { Plus } from 'lucide-react';
// import { Inter } from 'next/font/google';
import Image from 'next/image';
import Footer from './NewFooter';
// import Link from 'next/link';
import Link from './Link';
import PopoverMenu from './Popover';

// import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'

// const inter = Inter({ subsets: ['latin'] });
import { cx } from 'class-variance-authority';
import { useRouter } from 'next/router';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import Avatar from '../components/Avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react';

import CommandDialog from './ui/command';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
const resources = [
  {
    name: 'Help & Support',
    description: 'Get all of your questions answered',
    href: '/help',
    icon: LifebuoyIcon,
  },
  {
    name: 'Docs',
    description: 'Learn how to maximize our platform',
    href: '#',
    icon: AcademicCapIcon,
  },
  {
    name: 'Join our Slack',
    description: 'Chat with community members and our team',
    href: '#',
    icon: ChatBubbleLeftRightIcon,
  },
];
const recentPosts = [
  {
    id: 1,
    title: 'Boost your conversion rate',
    href: '#',
    date: 'Mar 5, 2023',
    datetime: '2023-03-05',
  },
  {
    id: 2,
    title: 'How to use search engine optimization to drive traffic to your site',
    href: '#',
    date: 'Feb 25, 2023',
    datetime: '2023-02-25',
  },
  {
    id: 3,
    title: 'Improve your customer experience',
    href: '#',
    date: 'Feb 21, 2023',
    datetime: '2023-02-21',
  },
];

// const MenuItem = ({ href, children }) => {
//   const router = useRouter();
//   const isActive = router.pathname === href;
//   return (
//     <div className={cx('inline-flex items-center border-b-2', false ? 'border-[#1c62da] ' : ' border-transparent')}>
//       <Link
//         className={cx(
//           'bg-background z-10 flex items-center rounded px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
//           isActive ? 'bg-slate-100/75 text-slate-900' : 'text-slate-500',
//         )}
//         href={href}
//       >
//         {children}
//       </Link>
//     </div>
//   );
// };

export const MenuItem = React.forwardRef<
  HTMLButtonElement & HTMLAnchorElement,
  React.HTMLProps<HTMLButtonElement & HTMLAnchorElement>
>(({ className, onClick, href, children, ...props }, ref) => {
  const router = useRouter();
  const isActive = router.pathname === href;

  const styles = cx(
    'bg-background z-10 flex items-center rounded px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:text-slate-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
    isActive ? 'bg-slate-100/75 text-slate-900' : 'text-slate-500',
  );

  const trigger = href ? (
    <Link href={href} className={styles}>
      {children}
    </Link>
  ) : (
    <button ref={ref} className={styles} type="button" onClick={onClick}>
      {children}
    </button>
  );

  return (
    <div className={cx('inline-flex items-center border-b-2', false ? 'border-[#1c62da] ' : ' border-transparent')}>
      {trigger}
    </div>
  );
});
MenuItem.displayName = 'MenuItem';

export default function Layout({ children, settings }) {
  const { LoggedInUser, loadingLoggedInUser, logout } = useLoggedInUser();
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const loggedIn = !!LoggedInUser;
  const router = useRouter();

  console.log({ router, asPath: router.asPath, pathname: router.pathname });
  const loggedInOnHome = loggedIn && router.asPath === '/home';

  const userNavigation = [
    { name: 'Your Profile', href: '#' },
    { name: 'Settings', href: '#' },
    {
      name: 'Sign out',
      onClick: () => {
        console.log('logging out');
        logout();
        router.push('/');
      },
    },
  ];
  return (
    <div className={classNames('flex h-screen flex-col bg-white')}>
      <nav className="block border-b bg-white">
        <div className="mx-auto px-5">
          <div className="flex h-16 justify-between">
            <div className="flex flex-1 items-center">
              <div className="flex flex-shrink-0 items-center">
                <Link href={loggedIn ? '/dashboard' : '/'} className="flex items-center gap-4">
                  <Fragment>
                    <Image
                      alt="Icon"
                      className="h-9 w-9"
                      src="/static/images/oc-logo-watercolor-256.png"
                      width={36}
                      height={36}
                    />

                    {!loggedIn && (
                      <Image
                        alt="Logotype"
                        className="h-[21px] w-[141px]"
                        src="/static/images/logotype.svg"
                        width={141}
                        height={21}
                      />
                    )}
                  </Fragment>
                </Link>
              </div>
              <div
                className={classNames(
                  '-mb-px ml-6 flex flex-1 flex-nowrap items-center space-x-4 whitespace-nowrap',
                  loggedIn ? 'justify-start' : 'justify-center',
                )}
              >
                {loggedIn ? (
                  <Fragment>
                    <div className="inline-flex"></div>
                    <MenuItem href="/dashboard">Dashboard</MenuItem>

                    <MenuItem href="/search">Explore</MenuItem>
                    <div className="relative flex h-full items-center">
                      <Popover className={`relative flex h-full items-center`}>
                        <div
                          className="h-full items-center"
                          // onMouseEnter={() => handleEnter(open)}
                          // onMouseLeave={() => handleLeave(open)}
                        >
                          <Popover.Button as={Fragment}>
                            <MenuItem>
                              <Fragment>
                                Resources <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                              </Fragment>
                            </MenuItem>
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
                            <Popover.Panel className="absolute left-1/2 z-50 mt-4 -translate-x-1/2 transform px-4">
                              <div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-slate-900/5">
                                <div className="p-4">
                                  {resources.map(item => (
                                    <div
                                      key={item.name}
                                      className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-slate-50"
                                    >
                                      <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-slate-50 group-hover:bg-white">
                                        <item.icon
                                          className="h-6 w-6 text-slate-600 group-hover:text-indigo-600"
                                          aria-hidden="true"
                                        />
                                      </div>
                                      <div>
                                        <Link href={item.href} className="font-semibold text-slate-900">
                                          <span>
                                            {item.name}
                                            <span className="absolute inset-0" />
                                          </span>
                                        </Link>
                                        <p className="mt-1 text-slate-600">{item.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-slate-50 p-8">
                                  <div className="flex justify-between">
                                    <h3 className="text-sm font-semibold leading-6 text-slate-500">News & updates</h3>
                                    <Link href="#" className="text-sm font-semibold leading-6 text-indigo-600">
                                      <span>
                                        See all <span aria-hidden="true">&rarr;</span>
                                      </span>
                                    </Link>
                                  </div>
                                  <ul className="mt-6 space-y-6">
                                    {recentPosts.map(post => (
                                      <li key={post.id} className="relative">
                                        <time
                                          dateTime={post.datetime}
                                          className="block text-xs leading-6 text-slate-600"
                                        >
                                          {post.date}
                                        </time>
                                        <Link
                                          href={post.href}
                                          className="block truncate text-sm font-semibold leading-6 text-slate-900"
                                        >
                                          <span>
                                            {post.title}
                                            <span className="absolute inset-0" />
                                          </span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </Popover.Panel>
                          </Transition>
                        </div>
                      </Popover>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          className="relative flex h-full cursor-pointer items-center rounded p-1 hover:bg-slate-100"
                          onClick={() => setCommandDialogOpen(true)}
                        >
                          <svg
                            className="h-5 w-5 text-slate-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Search</TooltipContent>
                    </Tooltip>
                    {commandDialogOpen && (
                      <CommandDialog open={commandDialogOpen} setOpen={val => setCommandDialogOpen(val)} />
                    )}
                  </Fragment>
                ) : (
                  <Fragment>
                    <PopoverMenu
                      className=""
                      labelText={
                        <Fragment>
                          <span>Solutions</span>
                          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                        </Fragment>
                      }
                      content={<div></div>}
                    />
                    <PopoverMenu
                      className=""
                      labelText={
                        <Fragment>
                          <span>Product</span>
                          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                        </Fragment>
                      }
                      content={<div></div>}
                    />

                    <PopoverMenu
                      className=""
                      labelText={
                        <Fragment>
                          <span>Company</span>
                          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                        </Fragment>
                      }
                      content={<div></div>}
                    />
                    <PopoverMenu
                      className=""
                      labelText={
                        <Fragment>
                          <span>Help & Support</span>
                          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                        </Fragment>
                      }
                      content={<div></div>}
                    />

                    <div className="relative flex cursor-pointer items-center">
                      <svg
                        className="h-5 w-5 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </Fragment>
                )}
              </div>
            </div>
            {/* begin new past */}

            {/* end new paste */}
            {loggedIn ? (
              <div className=" ml-4 flex items-center">
                <Tooltip>
                  <TooltipTrigger>
                    <button
                      type="button"
                      className="mr-2 flex-shrink-0 rounded-full bg-white p-1 text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">View notifications</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                        />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>No new notifications</TooltipContent>
                </Tooltip>

                <Menu as="div" className="relative">
                  <Tooltip>
                    <TooltipTrigger>
                      <Menu.Button className="group flex items-center gap-1 p-1 text-slate-400 hover:text-slate-500 focus:outline-none focus:outline-none ">
                        <span className="sr-only">Open new items menu</span>
                        <div className="rounded-full p-1 group-hover:bg-slate-100 group-focus:bg-slate-100 group-focus:ring-2 group-focus:ring-blue-500 group-focus:ring-offset-2">
                          <Plus className="h-5 w-5  " />
                        </div>
                        {/* <ChevronDownIcon className="h-5 w-5" aria-hidden="true" /> */}
                      </Menu.Button>
                    </TooltipTrigger>
                    <TooltipContent>Create</TooltipContent>
                  </Tooltip>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {[
                        { name: 'Create Collective', href: '#' },
                        { name: 'Create Organization', href: '#' },
                        { name: 'Submit expense', href: '#' },
                      ].map(item => (
                        <Menu.Item key={item.name}>
                          {({ active }) => {
                            // if(item.onClick) {
                            //   return <button></button>
                            // }
                            return (
                              <a
                                href={item.href}
                                className={classNames(
                                  active ? 'bg-slate-100' : '',
                                  'block px-4 py-2 text-sm text-slate-700',
                                )}
                              >
                                {item.name}
                              </a>
                            );
                          }}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>

                <div className="relative ml-4 flex-shrink-0">
                  {(LoggedInUser || loadingLoggedInUser) && (
                    <Menu as="div" className="relative">
                      <Menu.Button className="group flex items-center gap-2 focus:outline-none">
                        <span className="sr-only">Open user menu</span>
                        <div className="flex gap-2">
                          <Avatar
                            className="h-10 w-10 group-focus:ring-2 group-focus:ring-indigo-500 group-focus:ring-offset-2"
                            collective={LoggedInUser?.collective}
                            radius={36}
                          />
                        </div>
                        <ChevronDownIcon className="h-5 w-5 text-slate-800" aria-hidden="true" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {userNavigation.map(item => (
                            <Menu.Item key={item.name}>
                              {({ active }) => {
                                if (item.onClick) {
                                  return (
                                    <button
                                      onClick={item.onClick}
                                      className={classNames(
                                        active ? 'bg-slate-100' : '',
                                        'block w-full px-4 py-2 text-left text-sm text-slate-700',
                                      )}
                                    >
                                      {item.name}
                                    </button>
                                  );
                                }

                                return (
                                  <a
                                    href={item.href}
                                    className={classNames(
                                      active ? 'bg-slate-100' : '',
                                      'block px-4 py-2 text-sm text-slate-700',
                                    )}
                                  >
                                    {item.name}
                                  </a>
                                );
                              }}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center">
                <button
                  type="button"
                  onClick={() => {
                    // setLoggedIn(true);
                    router.push('/signin');
                  }}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {loggedInOnHome && (
        <div>
          <div className="mt-6 flex items-center justify-center">
            <Image
              alt="Icon"
              className="h-9 w-9"
              src="/static/images/oc-logo-watercolor-256.png"
              width={36}
              height={36}
            />

            <Image
              alt="Logotype"
              className="h-[21px] w-[141px]"
              src="/static/images/logotype.svg"
              width={141}
              height={21}
            />
          </div>

          <div className="flex w-full items-center justify-center gap-2 py-6">
            <Fragment>
              <PopoverMenu
                className=""
                labelText={
                  <Fragment>
                    <span>Solutions</span>
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </Fragment>
                }
                content={<div></div>}
              />
              <PopoverMenu
                className=""
                labelText={
                  <Fragment>
                    <span>Product</span>
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </Fragment>
                }
                content={<div></div>}
              />

              <PopoverMenu
                className=""
                labelText={
                  <Fragment>
                    <span>Company</span>
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </Fragment>
                }
                content={<div></div>}
              />
            </Fragment>
          </div>
        </div>
      )}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      {/* <footer className="w-full border border-red-500">Footer</footer> */}
    </div>
  );
}
