import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { getDashboardUrl } from '@/lib/stripe/dashboard';
import { getDashboardRoute } from '@/lib/url-helpers';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import { Label } from '@/components/ui/Label';

type SetupStep = {
  id: string;
  title: string | ReactNode;
  completed: boolean;
  description: string | ReactNode;
  action?: {
    label: string | ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
};

type SetupCategory = {
  id: string;
  title: string | ReactNode;
  steps: Array<SetupStep>;
};

const SetupStep = (step: SetupStep) => {
  const [isExpanded, setIsExpanded] = useState(!step.completed);

  return (
    <div>
      <div className="flex flex-row items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center">
          <Label
            className={`flex h-8 w-8 items-center justify-center rounded-full px-1 py-1 text-sm ${step.completed ? 'bg-green-100 text-green-800' : 'h-4 w-4 bg-gray-200'}`}
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

export const SetupCategory = ({ title, steps }: SetupCategory) => {
  const completedSteps = useMemo(() => steps.filter(step => step.completed).length, [steps]);
  const [isExpanded, setIsExpanded] = useState(completedSteps < steps.length);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <button className="flex flex-row items-center justify-between gap-2" onClick={() => setIsExpanded(!isExpanded)}>
        <h1 className="text-base font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          <Label className="rounded-full bg-slate-100 px-4 py-2 text-sm">
            <FormattedMessage
              defaultMessage="{completed}/{total} completed"
              id="SetupGuide.StepsCompleted"
              values={{ completed: completedSteps, total: steps.length }}
            />
          </Label>
          {isExpanded ? (
            <ChevronUp className="text-slate-700" size="24px" />
          ) : (
            <ChevronDown className="text-slate-700" size="24px" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="flex flex-col gap-4">
          {steps.map(step => (
            <SetupStep key={step.id} {...step} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SetupGuideCard = ({ account }) => {
  const router = useRouter();

  const categories: SetupCategory[] = [
    {
      id: 'verification',
      title: <FormattedMessage defaultMessage="Verification" id="SetupGuide.Verification" />,
      steps: [
        {
          id: 'verify-email',
          title: <FormattedMessage defaultMessage="Verify your email" id="SetupGuide.VerifyEmail" />,
          completed: true,
          description: (
            <FormattedMessage
              defaultMessage="We sent you an email to verify your account. Please check your inbox and click the link."
              id="SetupGuide.VerifyEmail.Description"
            />
          ),
        },
        {
          id: 'invite-admins',
          title: <FormattedMessage defaultMessage="Invite additional admins" id="SetupGuide.InviteAdmins" />,
          completed: false,
          description: (
            <FormattedMessage
              defaultMessage="We require there be at least two admins in the organizations. This guarantees that no one person holds exclusive access to the account. It also reduces the potential for fraudulent use of the account."
              id="SetupGuide.InviteAdmins.Description"
            />
          ),
          action: {
            label: <FormattedMessage defaultMessage="Go to Team" id="SetupGuide.InviteAdmins.Action" />,
            onClick: () => {
              router.push(getDashboardRoute(account, 'team'));
            },
          },
        },
      ],
    },
    {
      id: 'financials',
      title: <FormattedMessage defaultMessage="Financials" id="SetupGuide.Financials" />,
      steps: [],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          <FormattedMessage defaultMessage="Setup guide" id="SetupGuide.Title" />
        </CardTitle>
        {/* <CardDescription>Get going with Open Collective!</CardDescription> */}
      </CardHeader>
      <CardContent className="flex flex-col gap-6 divide-y">
        {categories.map(category => (
          <SetupCategory key={category.id} {...category} />
        ))}
      </CardContent>
    </Card>
  );
};
