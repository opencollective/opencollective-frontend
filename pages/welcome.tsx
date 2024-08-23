import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Image from '../components/Image';
import Link from '../components/Link';
import { Separator } from '../components/ui/Separator';

const Welcome = () => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();

  return (
    <AuthenticatedPage
      title={intl.formatMessage({ defaultMessage: 'Welcome to Open Collective!', id: 'fMZau6' })}
      showFooter={false}
      showProfileAndChangelogMenu={false}
      showSearch={false}
      menuItemsV2={{ solutions: false, product: false, company: false, docs: false }}
    >
      <div className="mb-16 mt-28 flex flex-col items-center justify-center lg:flex-row">
        <div className="flex flex-col text-center lg:pr-12">
          <div className="flex justify-center">
            <Image src="/static/images/oc-logo-watercolor-256.png" height={96} width={96} alt="OC Logo" />
          </div>
          <div className="w-full pl-4 pr-4 pt-10 lg:w-[404px] lg:pr-0">
            <div className="text-black-900 text-3xl font-bold leading-10">
              <FormattedMessage defaultMessage="Welcome to Open Collective!" id="fMZau6" />
            </div>
            <div className="text-black-800 pt-4 text-lg font-normal leading-7">
              <FormattedMessage
                defaultMessage="Now that you have created your personal account, there are a couple of things you can do from here..."
                id="9cMLO9"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 flex w-full flex-col items-center rounded-lg border shadow-sm lg:mt-0 lg:w-[520px]">
          <div className="-mt-16 rounded-full border-4 border-white bg-white">
            <Image src="/static/images/sample-avatar.png" height={128} width={128} alt="Avatar" />
          </div>
          <div className="text-black-900 pb-8 pt-10 text-2xl font-bold leading-8">{LoggedInUser?.collective?.name}</div>

          <div className="mt-2 w-full rounded-lg bg-white p-2 hover:bg-blue-50 lg:w-[472px]">
            <Link href="/create">
              <div className="flex items-center px-4 py-3">
                <div className="w-full">
                  <div className="text-black-900 text-lg font-bold leading-7">
                    <FormattedMessage id="collective.create" defaultMessage="Create Collective" />
                  </div>
                  <div className="text-black-700 pt-4 text-sm font-medium leading-6">
                    <FormattedMessage
                      defaultMessage="Create a Collective to be able to accept donations, apply for grants, and manage your budget transparently."
                      id="5xC/JS"
                    />
                  </div>
                </div>
                <div className="pl-10">
                  <Image src="/static/images/right-arrow.png" alt="Right Arrow" width={22} height={20} />
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-2 w-full rounded-lg bg-white p-2 hover:bg-blue-50 lg:w-[472px]">
            <Link href="/organizations/new">
              <div className="flex items-center px-4 py-3">
                <div className="w-full">
                  <div className="text-black-900 text-lg font-bold leading-7">
                    <FormattedMessage id="organization.create" defaultMessage="Create Organization" />
                  </div>
                  <div className="text-black-700 pt-4 text-sm font-medium leading-6">
                    <FormattedMessage
                      defaultMessage="Create a profile for your business to appear as a financial contributor, enable your employees to contribute on behalf of your company, and more."
                      id="mntSey"
                    />
                  </div>
                </div>
                <div className="pl-10">
                  <Image src="/static/images/right-arrow.png" alt="Right Arrow" width={22} height={20} />
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-2 w-full rounded-lg bg-white p-2 hover:bg-blue-50 lg:w-[472px]">
            <Link href="/search">
              <div className="flex items-center px-4 py-3">
                <div className="w-full">
                  <div className="text-black-900 text-lg font-bold leading-7">
                    <FormattedMessage defaultMessage="Contribute and engage with more Collectives" id="oEensl" />
                  </div>
                  <div className="text-black-700 pt-4 text-sm font-medium leading-6">
                    <FormattedMessage
                      defaultMessage="Discover active Collectives in the platform, contribute and engage with the communities that represent you."
                      id="JYgdfC"
                    />
                  </div>
                </div>
                <div className="pl-10">
                  <Image src="/static/images/right-arrow.png" alt="Right Arrow" width={22} height={20} />
                </div>
              </div>
            </Link>
          </div>

          <Separator className="mt-8 w-full px-6 lg:w-[472px]" />

          <div className="flex w-full justify-between px-4 py-7 text-sm lg:w-[472px]">
            {LoggedInUser && (
              <Link href={`/dashboard/${LoggedInUser.collective?.slug}/info`} className="text-blue-600 hover:underline">
                <FormattedMessage defaultMessage="Go to Dashboard" id="LxSJOb" />
              </Link>
            )}
            <Link href={`/help`} className="text-blue-600 hover:underline">
              <FormattedMessage defaultMessage="View documentation" id="IgOygF" />
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedPage>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default Welcome;
