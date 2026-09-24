import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import { CircleHelp, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

import Link from '../Link';
import { Separator } from '../ui/Separator';

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  }

  return undefined;
}

function DashboardErrorFallback({ error }: { error: unknown }) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const errorMessage = getErrorMessage(error);

  return (
    <div className="flex w-full flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Image src="/static/images/unexpected-error.png" alt="" width={312} height={202} className="h-auto w-auto" />
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">
            <FormattedMessage defaultMessage="Something went wrong" id="SectionError.Title" />
          </h2>
          <p className="text-muted-foreground">
            <FormattedMessage
              defaultMessage="We encountered an issue loading this {type,select,section{section}other{page}}. Please reload the page or contact support if the problem persists."
              id="+SSp9V"
              values={{ type: 'section' }}
            />
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => location.reload()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            <FormattedMessage id="error.reload" defaultMessage="Reload the page" />
          </Button>
          <Link href="/help">
            <Button size="sm" variant="outline">
              <CircleHelp className="mr-1 h-4 w-4" />
              <FormattedMessage defaultMessage="Check Help & Support" id="DashboardErrorBoundary.HelpSupport" />
            </Button>
          </Link>
        </div>
        {errorMessage && isDevelopment && (
          <Alert variant="destructive" className="mt-4 w-full">
            <AlertTitle className="flex items-center gap-2">
              <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-normal text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Dev Only
              </span>
              Error Details
            </AlertTitle>
            <Separator className="mt-2 mb-3 bg-red-200" />
            <AlertDescription>
              <p className="mt-2 font-mono text-xs break-words">{errorMessage}</p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

const DashboardErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      beforeCapture={scope => {
        scope.setTag('errorBoundary', 'dashboard-section');
      }}
      fallback={({ error }) => <DashboardErrorFallback error={error} />}
    >
      {children}
    </ErrorBoundary>
  );
};

export default DashboardErrorBoundary;
