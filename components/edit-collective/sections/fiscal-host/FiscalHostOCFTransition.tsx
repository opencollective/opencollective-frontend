import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { ChevronDown, ExternalLink } from 'lucide-react';

import { getEnvVar } from '../../../../lib/env-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import {
  FiscalHostOcfTransitionQuery,
  FiscalHostOcfTransitionQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';
import { parseToBoolean } from '../../../../lib/utils';

import CollectivePicker from '../../../CollectivePicker';
import Image from '../../../Image';
import Link from '../../../Link';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledLink from '../../../StyledLink';
import { Button } from '../../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { LeaveHostModal } from '../../LeaveHostModal';

import OCFDuplicateAndApplyToHostModal from './OCFDuplicateAndApplyToHostModal';

type Sections =
  | 'recurringContributions'
  | 'balance'
  | 'moveHost'
  | 'externalHost'
  | 'moreOptions'
  | 'ownHost'
  | 'leaveHost'
  | 'reactivateContributions';

const fiscalHostOCFTransitionQuery = gql`
  query FiscalHostOCFTransition($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      features {
        RECEIVE_FINANCIAL_CONTRIBUTIONS
      }
      newAccounts: duplicatedAccounts(limit: 1) {
        totalCount
        nodes {
          id
          name
          slug
          imageUrl
          ... on AccountWithHost {
            host {
              id
              legacyId
            }
          }
        }
      }
      pausedContributions: orders(filter: INCOMING, status: PAUSED, includeIncognito: true) {
        totalCount
      }
    }
    hosts(limit: 200, offset: 0) {
      totalCount
      limit
      offset
      nodes {
        id
        legacyId
        createdAt
        settings
        type
        name
        slug
        description
        longDescription
        currency
        totalHostedAccounts
        hostFeePercent
        isTrustedHost
        location {
          id
          country
        }
        tags
      }
    }
  }
`;

const ChevronButton = () => (
  <div className="flex items-center gap-1.5">
    <Button variant="ghost" size="icon-xs" className="-my-1 -mr-1 text-muted-foreground group-hover:bg-muted" asChild>
      <div>
        <ChevronDown size={18} className="transition-transform" />
      </div>
    </Button>
  </div>
);

const step2Label = 'Your funds hosted by Open Collective Foundation';

/**
 * A component to provide information and action for collectives to transition out of OCF.
 */
export const FiscalHostOCFTransition = ({ collective }) => {
  const [openCollapsible, setOpenCollapsible] = React.useState<Sections>('recurringContributions');
  const [modal, setOpenModal] = React.useState<'leaveHost' | 'applyFlow'>(null);
  const [selectedHost, setSelectedHost] = React.useState(null);
  const hasOCFDuplicateFlow = parseToBoolean(getEnvVar('OCF_DUPLICATE_FLOW'));
  const { data, error, loading, refetch } = useQuery<
    FiscalHostOcfTransitionQuery,
    FiscalHostOcfTransitionQueryVariables
  >(fiscalHostOCFTransitionQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: collective.slug,
    },
  });
  const getOpenProps = (section: Sections) => ({
    open: openCollapsible === section,
    onOpenChange: (open: boolean) => setOpenCollapsible(open ? section : null), // Collapse other sections when opening a new one
  });

  if (loading) {
    return <Loading />;
  } else if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div>
      <h2 className="mb-4 text-base font-bold">Your Options and Next Steps:</h2>
      <p className="text-sm">
        Open Collective Foundation has{' '}
        <StyledLink openInNewTab href="https://docs.opencollective.foundation/#what-are-our-options">
          published guidance about your options over the coming months
        </StyledLink>
        ; the following next steps are designed to support you during your transition:
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {/** Recurring contributions */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('recurringContributions')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">Paused Recurring Contributions</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p className="font-semibold">
              On March 15th we paused{' '}
              {data.account.pausedContributions.totalCount > 0 && data.account.pausedContributions.totalCount}
              recurring contributions to your Collective.
            </p>
            <br />
            <p>
              We have emailed your contributors letting them know that their contributions have been paused and that
              they may be invited to reactivate them later. You can learn more about this{' '}
              <StyledLink openInNewTab href="https://blog.opencollective.com/fiscal-host-transition/">
                here
              </StyledLink>
              .
            </p>
            <MessageBox type="info" withIcon={false} className="mt-4">
              <div className="flex items-center gap-4">
                <Image priority src="/static/images/illustrations/eye.png" alt="" width={48} height={48} />
                <p>
                  If you haven’t already, we recommend publishing an update to inform your community of the
                  circumstances so that they’re aware of why these changes are taking place and what your plans are.
                </p>
              </div>
            </MessageBox>
            <div className="mt-4">
              <Link href={`${getCollectivePageRoute(collective)}/updates/new`}>
                <Button variant="outline">Send an Update to your Contributors</Button>
              </Link>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {/** Balance */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('balance')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">{step2Label}</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p>
              You can continue to submit expenses which will be paid out by Open Collective Foundation until the 30th of
              September 2024.
            </p>
            <ul className="list-outside list-disc pl-4 font-normal">
              <li className="mt-4 text-neutral-700">
                <Link href={`${getCollectivePageRoute(collective)}/expenses/new`}>
                  <span className="underline">Submit expenses</span>{' '}
                  <ExternalLink size={16} className="inline align-text-top" />
                </Link>
              </li>
              <li className="mt-4">
                <Link href={getDashboardRoute(collective, 'advanced')}>
                  <span className="underline">
                    Transfer your balance to Open Collective Foundation (Your current Fiscal Host)
                  </span>{' '}
                  <ExternalLink size={16} className="inline align-text-top" />
                </Link>
              </li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
        {/** Move Host */}
        {!data.account.newAccounts.totalCount && (
          <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('moveHost')}>
            <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
              <div className="font-medium">Find a new Fiscal Host on Open Collective</div>
              <ChevronButton />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 text-sm">
              <p>
                In order to transfer any remaining funds or assets by the 30th of September 2024 you will need to find a
                new Fiscal Host. Open Collective Foundation has published{' '}
                <StyledLink
                  openInNewTab
                  href="https://docs.opencollective.foundation/leaving-ocf#if-you-are-transitioning-to-another-501-c-3-or-fiscal-sponsor"
                >
                  guidance about entities that are eligible
                </StyledLink>{' '}
                and the information they require and directed Collectives to{' '}
                <StyledLink
                  openInNewTab
                  href="https://docs.opencollective.foundation/#where-can-i-find-a-list-of-other-fiscal-sponsors"
                >
                  resources from other mission-aligned fiscal sponsor networks
                </StyledLink>
                . Open Collective Inc. has also published and is actively maintaining{' '}
                <StyledLink openInNewTab href="https://blog.opencollective.com/fiscal-hosting-options/">
                  a list of fiscal host organizations that may be willing to host your Collective
                </StyledLink>
                .
              </p>
              <br />
              <p>
                To re activate your recurring contributions you will need to find a new Fiscal Host on the Open
                Collective platform. We will then email your contributors and invite them to reactivate their recurring
                contributions.
              </p>
              {collective.stats.balance === 0 ? (
                <div className="mt-4">
                  <p>
                    Your current OCF balance is zero. Therefore, you can leave OCF and then apply to a new Fiscal Host.
                  </p>
                  <Button className="mt-4" variant="outline" onClick={() => setOpenModal('leaveHost')}>
                    Leave Host
                  </Button>
                </div>
              ) : hasOCFDuplicateFlow ? (
                <div className="mt-4">
                  <p>
                    Your balance is not empty. In order to move to a new fiscal host, you will need to zero your balance
                    with Open Collective Foundation or use the application flow below to duplicate your Collective and
                    apply to a new Fiscal Host.
                  </p>
                  <div className="mt-3 flex gap-4">
                    <div className="max-w-[300px]">
                      <CollectivePicker
                        collectives={(data.hosts.nodes || []).filter(host => ![host.slug].includes('foundation'))}
                        isLoading={loading}
                        placeholder="Select a new Fiscal Host"
                        onChange={({ value }) => setSelectedHost(value)}
                      />
                    </div>
                    <Button disabled={!selectedHost} variant="outline" onClick={() => setOpenModal('applyFlow')}>
                      Open the application flow
                    </Button>
                  </div>
                </div>
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        )}
        {/** Starting your own Fiscal Host */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('ownHost')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">Starting your own Fiscal Host</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p className="italic">
              Please note this is a lengthy commitment and requires setting up your own legal status and financial
              compliance i.e. bank accounts, accounting and taxes.
            </p>
            <br />
            <p>
              To transfer any remaining funds and assets from Open Collective Foundation, you will need to form a
              non-profit corporation with 501(c)(3) status or an equivalency determination i.e. a charity.
            </p>
            <br />
            <p>
              If you do not need to transfer funds or assets, you are free to create a new entity to host your
              Collective, including hosting your project yourself independently. Read more about{' '}
              <StyledLink
                openInNewTab
                href="https://docs.opencollective.com/help/independent-collectives/about-independent-collectives"
              >
                independent collectives
              </StyledLink>{' '}
              and{' '}
              <StyledLink openInNewTab href="https://docs.opencollective.com/help/fiscal-hosts/create-a-fiscal-host">
                starting a fiscal host organization
              </StyledLink>
              .
            </p>
            <br />
            <p>
              Be aware that unless you have a 501(c)(3) or an equivalency determination i.e. your new Fiscal Host is a
              charity, you will not be able to offer tax-deductible donations and will not be able to resume
              contributions where this is a benefit. For example if you receive contributions from a Donor Advised Fund
              (DAF).
            </p>
          </CollapsibleContent>
        </Collapsible>
        {/** Leave OCF */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('leaveHost')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">Leaving Open Collective Foundation</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p>
              Open Collective Foundation have published guidance for their member collectives, beginning with an
              offboarding process.{' '}
              <StyledLink openInNewTab href="https://docs.opencollective.foundation/leaving-ocf">
                Read more about leaving Open Collective Foundation
              </StyledLink>
              . If your new fiscal host is using the Open Collective platform, and the above has been completed you will
              be able to unhost Open Collective Foundation and apply to your new fiscal host.
            </p>
            {collective.stats.balance === 0 && (
              <div className="mt-4">
                <Button className="mt-4" variant="outline" onClick={() => setOpenModal('leaveHost')}>
                  Leave Host
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
        {/** Reactivating your recurring contributions */}
        {data.account.pausedContributions.totalCount > 0 && (
          <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('reactivateContributions')}>
            <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
              <div className="font-medium">Reactivating your recurring contributions</div>
              <ChevronButton />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 text-sm">
              <p>
                To resume your {data.account.pausedContributions.totalCount} recurring contributions you will need to
                find or start a new Fiscal Host that is on the Open Collective platform.
              </p>
              <br />
              <p>
                Once your collective has successfully transferred to a new fiscal host on the Open Collective platform,
                we will provide a feature to notify your contributors to reactivate their recurring contributions.
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
        {/** External Host */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('externalHost')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">Your new Fiscal Host isn’t on Open Collective</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p>
              If you are interested in how our platform can support your collective and new Fiscal Host, we are happy to
              start with a preliminary talk with you or connect with your new Fiscal Host directly. Our aim is to foster
              growth and ease the transition to your new Fiscal Host. Fill out{' '}
              <StyledLink href="https://coda.io/form/New-Hosts-to-Open-Collective_dHYnsICyU0b" openInNewTab>
                this form
              </StyledLink>{' '}
              and we’ll reach out.
            </p>
          </CollapsibleContent>
        </Collapsible>
        {/** More Options */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('moreOptions')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">More options</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p className="font-bold">If you haven’t found a Fiscal Host on the Open Collective Platform</p>
            <ul className="mt-4 list-outside list-disc pl-4">
              <li>
                You will still need to zero out your Collective’s balance to leave OCF and archive your Collective (see
                above: “{step2Label}”).
              </li>
              <li>
                You can{' '}
                <StyledLink as={Link} href={getDashboardRoute(collective, 'export')}>
                  export a list
                </StyledLink>{' '}
                of your contributors and reach out to them personally
              </li>
              <li>
                When you leave Open Collective, an email will be sent to your contributors informing them of your exit.
              </li>
              <li>
                We recommend you{' '}
                <StyledLink as={Link} href={`${getCollectivePageRoute(collective)}/updates/new`}>
                  send an update
                </StyledLink>{' '}
                to your contributors so they are aware of what’s happening.
              </li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {modal === 'leaveHost' ? (
        <LeaveHostModal account={collective} host={collective.host} onClose={() => setOpenModal(null)} />
      ) : modal === 'applyFlow' ? (
        <OCFDuplicateAndApplyToHostModal
          collective={collective}
          hostSlug={selectedHost.slug}
          onClose={() => setOpenModal(null)}
          onSuccess={async () => {
            await refetch();
          }}
        />
      ) : null}
    </div>
  );
};
