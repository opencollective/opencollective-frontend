import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from '@apollo/client';
// import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';
import { cva } from 'class-variance-authority';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { i18nExpenseStatus, i18nExpenseType } from '../../lib/i18n/expense';

import { getVariableFromProps } from '../../pages/expense';
import { Flex } from '../Grid';

import { expensePageQuery } from './graphql/queries';
import expenseStatus from '../../lib/constants/expense-status';
// import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ExpenseDrawer({ open, handleClose, expense }) {
  const drawerActionsRef = React.useRef(null);
  const [drawerActionsContainer, setDrawerActionsContainer] = useState(null);

  const [getExpense, { data, loading, error, startPolling, stopPolling, refetch, fetchMore, client }] = useLazyQuery(
    expensePageQuery,
    {
      variables: getVariableFromProps({ legacyExpenseId: expense?.legacyId }),
      context: API_V2_CONTEXT,
    },
  );

  useEffect(() => {
    if (open) {
      getExpense();

      // Use timeout to set the ref just after the drawer is open to prevent setting it to undefined
      setTimeout(() => {
        setDrawerActionsContainer(drawerActionsRef?.current);
      }, 0);
    }
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="relative border-b px-4 py-6 pb-4  sm:px-6">
                        <div className="absolute right-6 top-5 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <span className="sr-only">Close panel</span>
                            <svg
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <ExpenseHeader expense={expense} />
                      </div>
                      <div className="relative flex-1 overflow-y-scroll px-4 pt-6 sm:px-6">
                        <h3 className="text-lg">Attached receipts</h3>

                        <ul className="mt-6 divide-y divide-gray-200 border-t border-gray-200 text-sm font-medium text-gray-500">
                          <li className="flex space-x-6 py-6">
                            <img
                              src="https://imgv2-2-f.scribdassets.com/img/document/326849951/original/43394639b8/1625820621?v=1"
                              alt="Model wearing men&#039;s charcoal basic tee in large."
                              className="h-24 w-24 flex-none cursor-pointer rounded-md border bg-gray-100 object-cover object-center shadow-sm"
                            />
                            <div className="flex-auto space-y-1">
                              <h3 className="text-gray-900">
                                <a href="#">Gothenburg - Berlin</a>
                              </h3>
                              <p>Sep 9, 2022</p>
                            </div>
                            <p className="flex-none font-medium text-gray-900">$223.54</p>
                          </li>

                          <li className="flex space-x-6 py-6">
                            <img
                              src="https://www.wanderu.com/blog/wp-content/uploads/2019/05/RESIZE_NEW-DB-Ticket-Example-Translated-768x1074.jpg"
                              alt="Model wearing men&#039;s charcoal basic tee in large."
                              className="h-24 w-24 flex-none cursor-pointer rounded-md border bg-gray-100 object-cover object-center shadow-sm"
                            />
                            <div className="flex-auto space-y-1">
                              <h3 className="text-gray-900">
                                <a href="#">Berlin - Gothenburg</a>
                              </h3>
                              <p>Sep 13, 2022</p>
                            </div>
                            <p className="flex-none font-medium text-gray-900">$182.40</p>
                          </li>
                        </ul>

                        <dl className="space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-500">
                          <div className="flex justify-between">
                            <dt>Subtotal</dt>
                            <dd className="text-gray-900">$364.00</dd>
                          </div>

                          <div className="flex justify-between">
                            <dt>Taxes</dt>
                            <dd className="text-gray-900">$12.00</dd>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900">
                            <dt className="text-base">Total</dt>
                            <dd className="text-base">$376.00</dd>
                          </div>
                        </dl>

                        <dl className="mt-16 grid grid-cols-3 gap-x-4 text-sm text-gray-600">
                          <div>
                            <dt className="font-medium text-gray-900">Paid to</dt>
                            <dd className="mt-2">
                              <address className="not-italic">
                                <span className="mb-2 flex items-center gap-2">
                                  <img
                                    src="https://images-staging.opencollective.com/gustav-larsson/5c88b00/avatar.png"
                                    className="h-8 w-8 rounded-full"
                                    alt="Avatar"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">Gustav Larsson</div>
                                    <div>@gustavlrsn</div>
                                  </div>
                                </span>
                                <span className="block">Gyllenkrooksgatan 23</span>

                                <span className="block">412 82 Göteborg, SE</span>
                              </address>
                            </dd>
                          </div>

                          <div>
                            <dt className="font-medium text-gray-900">Payout Method</dt>
                            <dd className="mt-2 space-y-2 sm:flex sm:space-x-4 sm:space-y-0">
                              <div className="flex-none">
                                <svg
                                  aria-hidden="true"
                                  width="36"
                                  height="24"
                                  viewBox="0 0 36 24"
                                  className="h-6 w-auto"
                                >
                                  <rect width="36" height="24" rx="4" fill="#224DBA" />
                                  <path
                                    d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z"
                                    fill="#fff"
                                  />
                                </svg>
                                <p className="sr-only">Visa</p>
                              </div>
                              <div className="flex-auto">
                                <p className="text-gray-900">Ending with 4242</p>
                                <p>Expires 12 / 21</p>
                              </div>
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-900">Paid from Fiscal Host</dt>
                            <dd className="mt-2">
                              <address className="not-italic">
                                <div className="mb-2 flex items-center gap-2">
                                  <img
                                    className="h-8 w-8"
                                    src="https://images.opencollective.com/opencollective/avatar.png"
                                    alt="Avatar"
                                  />{' '}
                                  <div>
                                    <div className="font-medium text-gray-900">Open Collective Inc</div>
                                    <div>@opencollective</div>
                                  </div>
                                </div>
                                <span className="block">440 N. Barranca Avenue</span>
                                <span className="block">Covina, CA 91723</span>
                              </address>
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-16 border-t border-gray-200 py-6">
                          <div className="mb-6 rounded-md bg-blue-50 p-4">
                            <div className="flex items-center">
                              <img
                                src="data:image/png;base64,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"
                                className="h-6 w-6 flex-shrink-0"
                                alt="Lock"
                              />
                              <div className="ml-3">
                                <div className="text-sm text-blue-600">
                                  Comments are private, only the expense submitter and admins can see them.
                                </div>
                              </div>
                            </div>
                          </div>
                          <ul className="space-y-6">
                            <li className="relative flex gap-x-4">
                              <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
                                <div className="w-px bg-gray-200"></div>
                              </div>
                              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300"></div>
                              </div>
                              <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                                <span className="font-medium text-gray-900">Gustav Larsson</span> submitted the expense.
                              </p>
                              <time
                                dateTime="2023-01-23T10:32"
                                className="flex-none py-0.5 text-sm leading-5 text-gray-500"
                              >
                                7d ago
                              </time>
                            </li>
                            <li className="relative flex gap-x-4">
                              <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
                                <div className="w-px bg-gray-200"></div>
                              </div>
                              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300"></div>
                              </div>
                              <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                                <span className="font-medium text-gray-900">Gustav Larsson</span> edited the expense.
                              </p>
                              <time
                                dateTime="2023-01-23T11:03"
                                className="flex-none py-0.5 text-sm leading-5 text-gray-500"
                              >
                                6d ago
                              </time>
                            </li>

                            <li className="relative flex gap-x-4">
                              <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
                                <div className="w-px bg-gray-200"></div>
                              </div>
                              <img
                                src="https://images-staging.opencollective.com/gustav-larsson/5c88b00/avatar.png"
                                alt=""
                                className="relative mt-3 h-6 w-6 flex-none rounded-full bg-gray-50"
                              />
                              <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200">
                                <div className="flex justify-between gap-x-4">
                                  <div className="py-0.5 text-sm leading-5 text-gray-500">
                                    <span className="font-medium text-gray-900">Gustav Larsson</span> commented
                                  </div>
                                  <time
                                    dateTime="2023-01-23T15:56"
                                    className="flex-none py-0.5 text-sm leading-5 text-gray-500"
                                  >
                                    3d ago
                                  </time>
                                </div>
                                <p className="text-sm leading-6 text-gray-500">
                                  First className tickets was only $15 more... Even got a nice breakfast!
                                </p>
                              </div>
                            </li>

                            <li className="relative flex gap-x-4">
                              <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
                                <div className="w-px bg-gray-200"></div>
                              </div>
                              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <svg
                                  className="h-6 w-6 text-blue-500"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                                <span className="font-medium text-gray-900">Alex Curren</span> approved the expense.
                              </p>
                              <time
                                dateTime="2023-01-24T09:20"
                                className="flex-none py-0.5 text-sm leading-5 text-gray-500"
                              >
                                1d ago
                              </time>
                            </li>
                            <li className="relative flex gap-x-4">
                              <div className="absolute left-0 top-0 flex h-6 w-6 justify-center">
                                <div className="w-px bg-gray-200"></div>
                              </div>
                              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <svg
                                  className="h-6 w-6 text-green-500"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>

                              <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                                <span className="font-medium text-gray-900">Chelsea Hagon</span> paid the expense.
                              </p>
                              <time
                                dateTime="2023-01-24T09:20"
                                className="flex-none py-0.5 text-sm leading-5 text-gray-500"
                              >
                                1d ago
                              </time>
                            </li>
                          </ul>

                          <div className="mt-6 flex gap-x-3">
                            <img
                              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                              alt=""
                              className="h-6 w-6 flex-none rounded-full bg-gray-50"
                            />
                            <form action="#" className="relative flex-auto">
                              <div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
                                <label htmlFor="comment" className="sr-only">
                                  Add your comment
                                </label>
                                <textarea
                                  rows={2}
                                  name="comment"
                                  id="comment"
                                  className="block w-full resize-none border-0 bg-transparent px-2 py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                  placeholder="Add your comment..."
                                ></textarea>
                              </div>

                              <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
                                <div className="flex items-center space-x-5">
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      className="-m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                                    >
                                      <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="sr-only">Attach a file</span>
                                    </button>
                                  </div>
                                  <div className="flex items-center">
                                    <div>
                                      <label id="listbox-label" className="sr-only">
                                        Your mood
                                      </label>
                                      <div className="relative">
                                        <button
                                          type="button"
                                          className="relative -m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                                          aria-haspopup="listbox"
                                          aria-expanded="true"
                                          aria-labelledby="listbox-label"
                                        >
                                          <span className="flex items-center justify-center">
                                            <span>
                                              <svg
                                                className="h-5 w-5 flex-shrink-0"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                              >
                                                <path
                                                  fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-4.464a.75.75 0 10-1.061-1.061 3.5 3.5 0 01-4.95 0 .75.75 0 00-1.06 1.06 5 5 0 007.07 0zM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              <span className="sr-only">Add your mood</span>
                                            </span>
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="submit"
                                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                  Comment
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 justify-end gap-4 px-4 py-4">
                      <button
                        type="button"
                        className="mr-auto inline-flex items-center gap-x-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        More actions
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="-mr-1 h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ExpenseDrawer.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  expense: PropTypes.shape({
    legacyId: PropTypes.number,
  }),
};

export const ExpenseHeader = ({ expense }) => {
  const intl = useIntl();
  return (
    <div>
      <div className="flex flex-col space-y-8">
        <div className="mb-2 flex items-center gap-2">
          <img className="h-6 w-6 rounded-md object-cover shadow" src={expense.account.imageUrl} alt="Manyverse logo" />
          <h3 className="inline-block cursor-pointer text-sm font-medium hover:underline">{expense.account.name}</h3>
          <span className="text-gray-300">/</span>{' '}
          <span className="text-sm text-gray-500"> {i18nExpenseType(intl, expense.type, expense.legacyId)}</span>
        </div>
      </div>
      <div className="my-1 flex items-start justify-between">
        <h2
          className="cursor-pointer text-2xl font-semibold leading-6 text-gray-900 hover:underline"
          id="slide-over-title"
        >
          <span>{expense.description} </span>
          <span className="text-gray-400">#{expense.legacyId}</span>
        </h2>
        <ExpenseStatus status={expense.status} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <img src={expense.createdByAccount.imageUrl} className="h-5 w-5 rounded-full" alt="avatar" />
          <p className="text-sm text-gray-500">
            <span className="cursor-pointer font-medium text-gray-900 hover:underline">
              {expense.createdByAccount.name}
            </span>{' '}
            submitted on {dayjs(expense.createdAt).format('MMM D, YYYY')}
          </p>
        </div>
      </div>
    </div>
  );
};

export const getExpenseStatusMsgType = status => {
  switch (status) {
    case expenseStatus.REJECTED:
    case expenseStatus.SPAM:
    case expenseStatus.ERROR:
      return 'error';
    case expenseStatus.PENDING:
    case expenseStatus.UNVERIFIED:
      return 'warning';
    case expenseStatus.SCHEDULED_FOR_PAYMENT:
    case expenseStatus.APPROVED:
      return 'info';
    case expenseStatus.PAID:
    case 'COMPLETED':
      return 'success';
  }
};

function ExpenseStatus({ status }) {
  const intl = useIntl();
  const statusStyles = cva('inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-medium', {
    variants: {
      type: {
        error: 'bg-red-100 text-red-700 fill-red-700',
        warning: 'bg-yellow-100 text-yellow-700 fill-yellow-500',
        info: 'bg-blue-100 text-blue-700 fill-blue-500',
        success: 'bg-green-100 text-green-700 fill-green-500',
      },
    },
  });
  return (
    <span className={statusStyles({ type: getExpenseStatusMsgType(status) })}>
      <svg className="h-1.5 w-1.5" viewBox="0 0 6 6" aria-hidden="true">
        <circle cx="3" cy="3" r="3" />
      </svg>
      {i18nExpenseStatus(intl, status)}
    </span>
  );
}
