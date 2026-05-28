import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';

import { I18nSupportLink } from './I18nFormatters';

interface FeatureNotSupportedProps {
  showContactSupportLink?: boolean;
}

/**
 * A component to show a message when the feature is not supported by the account.
 */
const FeatureNotSupported = ({ showContactSupportLink = true }: FeatureNotSupportedProps) => {
  return (
    <div className="flex min-h-[min(52vh,480px)] w-full flex-col items-center justify-center px-4 py-10 sm:py-16">
      <Card
        className={cn(
          'mx-auto w-full max-w-lg gap-0 overflow-hidden border-border/60 bg-card py-0 shadow-md ring-1 ring-black/5',
          'dark:ring-white/10',
        )}
      >
        <CardHeader className="flex flex-col items-center gap-4 px-6 pt-8 pb-8 text-center sm:px-8 sm:pt-9 sm:pb-9">
          <div
            className="inline-flex items-center justify-center rounded-full bg-muted/90 px-5 py-2.5 text-muted-foreground shadow-inner ring-1 ring-border/70 dark:bg-muted/50"
            aria-hidden
          >
            <LockKeyhole className="size-6 stroke-[1.75]" />
          </div>
          <h1 className="max-w-[20ch] text-xl font-semibold tracking-tight text-balance text-foreground sm:max-w-none sm:text-[26px] sm:leading-8">
            <FormattedMessage defaultMessage="Access denied" id="T26lW2" />
          </h1>
        </CardHeader>
        <Separator className="bg-border/70" />
        <CardContent className="px-6 pt-9 pb-9 sm:px-8 sm:pt-10 sm:pb-10">
          <CardDescription className="mx-auto max-w-[42ch] text-center text-[15px] leading-[1.65] text-pretty text-muted-foreground sm:text-base sm:leading-relaxed [&_a]:font-medium [&_a]:underline-offset-4 [&_a]:hover:underline">
            <FormattedMessage
              id="FeatureNotSupported.description"
              defaultMessage="This page has not been activated for this account or you don't have permission to see it."
            />
            {showContactSupportLink && (
              <React.Fragment>
                {' '}
                <FormattedMessage
                  id="ContactSupportForDetails"
                  defaultMessage="Please contact <SupportLink>support</SupportLink> for more details."
                  values={{ SupportLink: I18nSupportLink }}
                />
              </React.Fragment>
            )}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureNotSupported;
