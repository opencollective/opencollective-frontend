import React, { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { ArrowRight, Check, ChevronDown, ChevronUp, ListCheck, LockKeyhole, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

import type { WelcomeOrganizationQuery } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { cn } from '@/lib/utils';
import type { Category, Step } from '@/lib/welcome';
import { COLLECTIVE_CATEGORIES, INDIVIDUAL_CATEGORIES, ORGANIZATION_CATEGORIES, sortSteps } from '@/lib/welcome';

import { AccountingCategorySelectFieldsFragment } from '@/components/AccountingCategorySelect';
import { Drawer } from '@/components/Drawer';
import { DocumentationLink } from '@/components/Link';
import { SubmitExpenseFlow } from '@/components/submit-expense/SubmitExpenseFlow';
import { Button } from '@/components/ui/Button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import { planFeatures } from '../subscriptions/queries';

const welcomeOrganizationQuery = gql`
  query WelcomeOrganization($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      slug
      description
      currency
      type
      legacyId
      longDescription
      isHost
      tags
      settings
      location {
        id
        name
        address
        country
      }
      admins: members(role: ADMIN) {
        totalCount
      }
      adminInvites: memberInvitations(role: ADMIN) {
        id
      }
      connectedAccounts {
        id
        service
      }
      paymentMethods {
        id
        service
      }
      payoutMethods {
        id
        type
      }
      updates(limit: 1) {
        nodes {
          id
        }
      }
      projects: childrenAccounts(accountType: [PROJECT], limit: 1) {
        nodes {
          id
        }
      }
      approvedExpenses: expenses(status: APPROVED, direction: RECEIVED, limit: 1) {
        nodes {
          id
        }
      }
      policies {
        EXPENSE_POLICIES {
          invoicePolicy
          receiptPolicy
        }
      }
      ... on AccountWithPlatformSubscription {
        platformSubscription {
          isCurrent
          plan {
            id
            features {
              ...PlanFeatures
            }
          }
        }
      }
      ... on AccountWithContributions {
        contributionPolicy
        tiers(limit: 1) {
          nodes {
            id
          }
        }
      }
      ... on AccountWithHost {
        hostFeePercent
        isApproved
        approvedAt
        hostApplication {
          id
          createdAt
          status
        }
      }
      ... on Organization {
        hasHosting
        hasMoneyManagement
        host {
          id
          slug
          hostFeePercent
          policies {
            REQUIRE_2FA_FOR_ADMINS
            EXPENSE_POLICIES {
              invoicePolicy
              receiptPolicy
            }
          }
          accountingCategories {
            totalCount
            nodes {
              ...AccountingCategorySelectFields
            }
          }
        }
      }
    }
  }
  ${planFeatures}
  ${AccountingCategorySelectFieldsFragment}
`;

const ActionStep = (props: Step) => {
  const [isExpanded, setIsExpanded] = useState(!props.completed);

  return (
    <div>
      <div className="flex flex-row items-center gap-4 overflow-hidden">
        <div className="flex h-8 w-8 items-center justify-center">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 px-1 py-1 text-sm transition-all data-completed:h-8 data-completed:w-8 data-completed:bg-green-100 data-completed:text-green-800 data-locked:h-8 data-locked:w-8 data-locked:bg-blue-100 data-locked:text-blue-800`}
            data-completed={props.completed ? true : undefined}
            data-locked={props.requiresUpgrade ? true : undefined}
          >
            {props.requiresUpgrade ? <LockKeyhole size="16px" /> : props.completed ? <Check size="18px" /> : null}
          </div>
        </div>
        <button
          className="flex flex-nowrap items-center gap-2 overflow-x-hidden text-sm font-bold"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <p className="shrink overflow-x-hidden text-ellipsis whitespace-nowrap">{props.title}</p>
          <p>
            {isExpanded ? (
              <ChevronUp className="text-slate-700" size="18px" />
            ) : (
              <ChevronDown className="text-slate-700" size="18px" />
            )}
          </p>
        </button>
      </div>
      {isExpanded && (
        <div className="ml-12 flex flex-col items-start gap-2">
          {props.requiresUpgrade && (
            <Tooltip>
              <TooltipTrigger>
                <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  <FormattedMessage defaultMessage="Upgrade Required" id="xqbgY9" />
                </div>
                <TooltipContent>
                  <FormattedMessage
                    defaultMessage="This feature is not included in your current subscription plan."
                    id="fZAwAA"
                  />
                </TooltipContent>
              </TooltipTrigger>
            </Tooltip>
          )}
          {props.disabledMessage && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {props.disabledMessage}
            </span>
          )}
          <p className="text-sm text-slate-800">
            {props.description}{' '}
            {props.documentation && (
              <span className="inline-flex gap-1">
                <FormattedMessage defaultMessage="See" id="SetupGuide.Step.SeeDocumentation" />{' '}
                <DocumentationLink href={props.documentation.url} className="items-center">
                  {props.documentation.title}.
                </DocumentationLink>
              </span>
            )}
          </p>
          {props.action}
        </div>
      )}
    </div>
  );
};

const WelcomeDrawer = ({
  category,
  account,
  onClose,
  open,
}: {
  category: Category | null;
  account: WelcomeOrganizationQuery['account'];
  onClose: () => void;
  open: boolean;
}) => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const steps = category?.steps ? sortSteps(category.steps.map(step => step({ account, router, LoggedInUser }))) : [];
  const completedSteps = steps.filter(step => step.completed && !step.requiresUpgrade).length;
  const isCompleted = completedSteps === steps.length;

  return (
    <Drawer open={open} onClose={onClose} className="w-full max-w-xl" showCloseButton>
      <header className="mb-6 flex items-start justify-between">
        <div className="flex w-full flex-col gap-2">
          {category?.image || <Skeleton className="size-10" />}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">{category?.title || <Skeleton className="h-6 w-64" />}</h1>
            {category?.steps ? (
              <div
                className="flex gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm data-completed:bg-green-100 data-completed:text-green-800"
                data-completed={isCompleted ? true : undefined}
              >
                <FormattedMessage
                  defaultMessage="{completed}/{total} completed"
                  id="SetupGuide.StepsCompleted"
                  values={{ completed: completedSteps, total: steps.length }}
                />
              </div>
            ) : (
              <Skeleton className="h-8 w-32 rounded-full" />
            )}
          </div>
          <p className="text-sm text-slate-700">
            {category?.longDescription || category?.description || <Skeleton className="h-4 w-80" />}
          </p>
        </div>
      </header>
      <div className="flex grow flex-col justify-between gap-6">
        {steps.length > 0 && (
          <div className="flex flex-col gap-4">
            {steps.map(step => (
              <ActionStep key={step.id} {...step} />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};

const WelcomeCategoryButton = ({
  image,
  title,
  description,
  className,
  onClick,
  steps: _steps,
  account,
}: Partial<Category> & {
  onClick?: () => void;
  account?: WelcomeOrganizationQuery['account'];
}) => {
  const { LoggedInUser } = useLoggedInUser();
  const router = useRouter();
  const steps = account && _steps?.map(step => step({ account, LoggedInUser, router }));
  const completedSteps = steps?.filter(step => step.completed && !step.requiresUpgrade)?.length || 0;
  const isCompleted = completedSteps === steps?.length;

  return (
    <button
      className={cn(
        'relative isolate flex w-full cursor-pointer flex-col items-center justify-start gap-4 rounded-sm px-6 py-4 sm:min-h-40',
        className,
      )}
      onClick={onClick}
    >
      {steps && (
        <div className="absolute top-2 right-2 flex cursor-pointer items-center rounded-full bg-white px-2 py-1 text-xs text-slate-600">
          {isCompleted ? (
            <Check size={12} />
          ) : (
            <React.Fragment>
              <ListCheck size={12} className="mr-1" /> {completedSteps}/{steps.length}
            </React.Fragment>
          )}
        </div>
      )}
      {image}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="flex items-center gap-2 font-bold">
          {title}
          <ArrowRight size={17} />
        </h1>
        <small className="text-sm">{description}</small>
      </div>
    </button>
  );
};

export const WelcomeOrganization = ({ account: _account, setOpen, open }) => {
  const intl = useIntl();
  const { data } = useQuery<WelcomeOrganizationQuery>(welcomeOrganizationQuery, {
    variables: { accountSlug: _account?.slug },
    skip: !_account,

    fetchPolicy: 'cache-and-network',
  });
  const { LoggedInUser } = useLoggedInUser();
  // Undefined here means the initial state, after that we can set to null or a specific category ID
  const [expandedCategory, setExpandedCategory] = useState<null | string>(null);

  useEffect(() => {
    if (LoggedInUser && open === undefined && data?.account) {
      const showGuide = LoggedInUser?.shouldDisplaySetupGuide(data.account);
      setOpen(showGuide !== false ? true : false);
    }
  }, [data?.account, open, setOpen, LoggedInUser]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleContent>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              <FormattedMessage
                defaultMessage="What would like to do with the platform?"
                id="Welcome.Organization.Title"
              />
            </CardTitle>
            <CardDescription>
              <FormattedMessage
                defaultMessage="Choose your desired capabilities and follow the steps to setup & configure your organization."
                id="Welcome.Organization.Description"
              />
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setOpen(false)}
                aria-label={intl.formatMessage({ defaultMessage: 'Hide setup guide', id: 'SetupGuide.HideSetupGuide' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ORGANIZATION_CATEGORIES).map(([key, category]) => (
              <WelcomeCategoryButton
                key={key}
                {...category}
                account={data?.account}
                onClick={() => setExpandedCategory(key)}
              />
            ))}
          </CardContent>
          <WelcomeDrawer
            category={ORGANIZATION_CATEGORIES[expandedCategory]}
            account={data?.account}
            onClose={() => setExpandedCategory(null)}
            open={expandedCategory !== null}
          />
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const WelcomeCollective = ({ account: _account, setOpen, open }) => {
  const intl = useIntl();
  const { data } = useQuery<WelcomeOrganizationQuery>(welcomeOrganizationQuery, {
    variables: { accountSlug: _account?.slug },
    skip: !_account,

    fetchPolicy: 'cache-and-network',
  });
  const { LoggedInUser } = useLoggedInUser();
  // Undefined here means the initial state, after that we can set to null or a specific category ID
  const [expandedCategory, setExpandedCategory] = useState<null | string>(null);

  useEffect(() => {
    if (LoggedInUser && open === undefined && data?.account) {
      const showGuide = LoggedInUser?.shouldDisplaySetupGuide(data.account);
      setOpen(showGuide !== false ? true : false);
    }
  }, [data?.account, open, setOpen, LoggedInUser]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleContent>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              <FormattedMessage
                defaultMessage="What would like to do with the platform?"
                id="Welcome.Organization.Title"
              />
            </CardTitle>
            <CardDescription>
              <FormattedMessage
                defaultMessage="Get started with the basics or set up additional functionalities."
                id="Welcome.Collective.Description"
              />
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setOpen(false)}
                aria-label={intl.formatMessage({ defaultMessage: 'Hide setup guide', id: 'SetupGuide.HideSetupGuide' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(COLLECTIVE_CATEGORIES).map(([key, category]) => (
              <WelcomeCategoryButton
                key={key}
                {...category}
                account={data?.account}
                onClick={() => setExpandedCategory(key)}
              />
            ))}
          </CardContent>
          <WelcomeDrawer
            category={COLLECTIVE_CATEGORIES[expandedCategory]}
            account={data?.account}
            onClose={() => setExpandedCategory(null)}
            open={expandedCategory !== null}
          />
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const WelcomeIndividual = ({ open, setOpen }) => {
  const router = useRouter();
  const intl = useIntl();
  const [isExpenseFlowOpen, setIsExpenseFlowOpen] = useState(false);

  return (
    <React.Fragment>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                <FormattedMessage
                  defaultMessage="What would like to do with the platform?"
                  id="Welcome.Organization.Title"
                />
              </CardTitle>
              <CardDescription>
                <FormattedMessage
                  defaultMessage="Choose your desired capabilities and follow the steps to setup & configure your organization."
                  id="Welcome.Organization.Description"
                />
              </CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOpen(false)}
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Hide setup guide',
                    id: 'SetupGuide.HideSetupGuide',
                  })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WelcomeCategoryButton
                {...INDIVIDUAL_CATEGORIES.submitExpense}
                onClick={() => setIsExpenseFlowOpen(true)}
              />
              <WelcomeCategoryButton {...INDIVIDUAL_CATEGORIES.contribute} onClick={() => router.push('/search')} />
              <WelcomeCategoryButton
                {...INDIVIDUAL_CATEGORIES.createOrg}
                onClick={() => router.push('/signup/organization')}
              />
              <WelcomeCategoryButton
                {...INDIVIDUAL_CATEGORIES.createCollective}
                onClick={() => router.push('/create')}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      {isExpenseFlowOpen && (
        <SubmitExpenseFlow
          onClose={() => {
            setIsExpenseFlowOpen(false);
          }}
        />
      )}
    </React.Fragment>
  );
};
