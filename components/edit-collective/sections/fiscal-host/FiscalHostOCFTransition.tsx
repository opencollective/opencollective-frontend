import React from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';

import Image from '../../../Image';
import Link from '../../../Link';
import MessageBox from '../../../MessageBox';
import StyledLink from '../../../StyledLink';
import { Button } from '../../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { LeaveHostModal } from '../../LeaveHostModal';

type Sections = 'recurringContributions' | 'balance' | 'moveHost' | 'moreOptions';

const ChevronButton = () => (
  <div className="flex items-center gap-1.5">
    <Button variant="ghost" size="icon-xs" className="-my-1 -mr-1 text-muted-foreground group-hover:bg-muted" asChild>
      <div>
        <ChevronDown size={18} className="transition-transform" />
      </div>
    </Button>
  </div>
);

const step1Label = 'Pause your Recurring Contributions';

/**
 * A component to provide information and action for collectives to transition out of OCF.
 */
export const FiscalHostOCFTransition = ({ collective }) => {
  const [openCollapsible, setOpenCollapsible] = React.useState<Sections>('recurringContributions');
  const [modal, setOpenModal] = React.useState<'leaveHost'>(null);
  const getOpenProps = (section: Sections) => ({
    open: openCollapsible === section,
    onOpenChange: (open: boolean) => setOpenCollapsible(open ? section : null), // Collapse other sections when opening a new one
  });

  return (
    <div>
      <h2 className="mb-4 text-base font-bold">Next Steps:</h2>
      <div className="mt-4 flex flex-col gap-3">
        {/** Recurring contributions */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('recurringContributions')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">{step1Label}</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p>
              Your Fiscal Host (Open Collective Foundation) is unable to accept contributions from the 15th of March. On
              this date all of your active recurring contributions will be paused. Once you have successfully found a
              new Fiscal Host we will notify your contributors and invite them to renew their contributions. You can
              learn more about this{' '}
              <StyledLink href="https://blog.opencollective.com/fiscal-host-transition/" openInNewTab>
                here
              </StyledLink>
              .
            </p>
            <MessageBox type="info" withIcon={false} className="mt-4">
              <div className="flex items-center gap-4">
                <Image priority src="/static/images/illustrations/eye.png" alt="" width={48} height={48} />
                <div>
                  <p>
                    We will send an automated email to inform your contributors that their contributions have been
                    paused.
                  </p>
                  <p>
                    We recommend publishing an update to inform your community of the circumstances so that they’re
                    aware of why these changes are taking place and what your plans are.
                  </p>
                </div>
              </div>
            </MessageBox>
            <div className="mt-4">
              <Link href={`${getCollectivePageRoute(collective)}/updates/new`}>
                <Button>Send an Update to your Contributors</Button>
              </Link>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {/** Balance */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('balance')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">Zero out your Open Collective Foundation balance</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p>If you still have a balance hosted by Open Collective Foundation, you have two options:</p>
            <ol className="mt-4 list-outside list-decimal pl-4">
              <li className="font-bold">
                Zero out your balance
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
                        Transfer your balance to Open Collective Foundation (Your current host)
                      </span>{' '}
                      <ExternalLink size={16} className="inline align-text-top" />
                    </Link>
                    <p className="mt-2 font-normal">
                      Choose this option if you have an agreement with OCF to transfer your funds to your new Fiscal
                      Host.
                    </p>
                  </li>
                </ul>
              </li>
              <li className="mt-4 font-bold">
                If you are not ready to zero your OCF balance but need to continue fundraising
                <p className="mt-2 font-normal">
                  Duplicate your collective and apply to a new Fiscal Host (see below: Join a new Fiscal Host on Open
                  Collective) to continue fundraising whilst spending down your remaining balance with Open Collective
                  Foundation.
                </p>
              </li>
            </ol>
          </CollapsibleContent>
        </Collapsible>
        {/** Move Host */}
        <Collapsible className="rounded-md border border-gray-300 p-4" {...getOpenProps('moveHost')}>
          <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between text-sm [&_svg]:data-[state=open]:rotate-180">
            <div className="font-medium">Join a new Fiscal Host on Open Collective</div>
            <ChevronButton />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 text-sm">
            <p>
              To continue fundraising on the Open Collective platform you will need to either find a new Fiscal Host, or
              become an independent collective. When your collective is again able to receive contributions we will send
              automated email notifications to your paused contributors and invite them to resume their recurring
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
            ) : (
              <p className="mt-4">
                In the coming days we will be releasing a tool to help you transition to a new Fiscal Host. Please check
                back here to initiate the process.
              </p>
            )}
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
                You will still need to zero out your Collective’s balance to leave OCF and archive your collective (see
                above: “{step1Label}”).
              </li>
              <li>
                You can{' '}
                <StyledLink as={Link} href={getDashboardRoute(collective, 'export')}>
                  export a list
                </StyledLink>{' '}
                of your contributors and reach out to them personally
              </li>
              <li>Your recurring contributions will be paused on the 15th of March.</li>
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
      {modal === 'leaveHost' && (
        <LeaveHostModal account={collective} host={collective.host} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
};
