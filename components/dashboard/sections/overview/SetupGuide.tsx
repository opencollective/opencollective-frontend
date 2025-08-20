import React, { useEffect, useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import type { Category, Step } from '@/lib/setup-guide';
import { runChecks } from '@/lib/setup-guide';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import { Label } from '@/components/ui/Label';

const setupGuideQuery = gql`
  query SetupGuide($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      slug
      description
      currency
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
      ... on AccountWithContributions {
        contributionPolicy
      }
      ... on Organization {
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
              id
              kind
              code
              name
              hostOnly
              instructions
              friendlyName
              expensesTypes
              createdAt
              appliesTo
            }
          }
        }
      }
    }
  }
`;

const SetupStep = (step: Step) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div className="flex flex-row items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center">
          <Label
            className={`flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 px-1 py-1 text-sm transition-all data-completed:h-8 data-completed:w-8 data-completed:bg-green-100 data-completed:text-green-800`}
            data-completed={step.completed ? true : undefined}
          >
            {step.completed && <Check size="18px" />}
          </Label>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold" onClick={() => setIsExpanded(!isExpanded)}>
          {step.title}
          {isExpanded ? (
            <ChevronUp className="text-slate-700" size="18px" />
          ) : (
            <ChevronDown className="text-slate-700" size="18px" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="ml-12">
          <p className="text-sm text-slate-800">{step.description}</p>
          {step.action && (
            <Button className="mt-2" variant="outline" onClick={step.action.onClick} disabled={step.action.disabled}>
              {step.action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const SetupCategory = ({
  id,
  title,
  steps,
  expanded,
  setExpanded,
}: Category & { expanded: boolean; setExpanded: (string) => void }) => {
  const completedSteps = steps.filter(step => step.completed).length;
  const isCompleted = completedSteps === steps.length;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <button
        className="flex cursor-pointer flex-row items-center justify-between gap-2"
        onClick={() => setExpanded(expanded ? null : id)}
      >
        <h1 className="text-base font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          <Label
            className="flex cursor-pointer gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm data-completed:bg-green-100 data-completed:text-green-800"
            data-completed={isCompleted ? true : undefined}
          >
            <FormattedMessage
              defaultMessage="{completed}/{total} completed"
              id="SetupGuide.StepsCompleted"
              values={{ completed: completedSteps, total: steps.length }}
            />
          </Label>
          {expanded ? (
            <ChevronUp className="text-slate-700" size="24px" />
          ) : (
            <ChevronDown className="text-slate-700" size="24px" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="flex flex-col gap-4">
          {steps.map(step => (
            <SetupStep key={step.id} {...step} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SetupGuideCard = ({ account: _account, setOpen, open }) => {
  const router = useRouter();
  const { data } = useQuery(setupGuideQuery, {
    variables: { accountSlug: _account?.slug },
    skip: !_account,
    context: API_V2_CONTEXT,
  });
  const account = data?.account;
  const { LoggedInUser } = useLoggedInUser();
  // Undefined here means the initial state, after that we can set to null or a specific category ID
  const [expandedCategory, setExpandedCategory] = useState(undefined);
  const categories = useMemo(() => {
    return account ? runChecks({ account: account, router, LoggedInUser }) : [];
  }, [account, router, LoggedInUser]);

  const firstIncompleteCategory = useMemo(
    () => categories.find(category => category.steps.some(step => !step.completed)),
    [categories],
  );

  // Automatically expands the first incomplete category
  useEffect(() => {
    if (firstIncompleteCategory && expandedCategory === undefined) {
      setExpandedCategory(firstIncompleteCategory.id);
    }
  }, [firstIncompleteCategory, expandedCategory, account]);

  useEffect(() => {
    if (LoggedInUser && open === undefined && account && categories.length > 0) {
      const showGuideKey = `id${account.legacyId}`;
      const showGuide = LoggedInUser?.collective.settings?.showSetupGuide?.[showGuideKey];
      if (!firstIncompleteCategory && showGuide !== true) {
        setOpen(false);
      } else {
        setOpen(showGuide !== false ? true : false);
      }
    }
  }, [firstIncompleteCategory, account, categories, open, setOpen, LoggedInUser]);

  return (
    <Collapsible open={open}>
      <CollapsibleContent>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              <FormattedMessage defaultMessage="Setup guide" id="SetupGuide.Title" />
            </CardTitle>
            <CardDescription>Get going with Open Collective!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 divide-y">
            {categories?.map(category => (
              <SetupCategory
                key={category.id}
                expanded={expandedCategory === category.id}
                setExpanded={setExpandedCategory}
                {...category}
              />
            ))}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
