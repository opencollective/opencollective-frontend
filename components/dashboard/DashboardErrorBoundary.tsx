import React from 'react';
import { CircleHelp, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

import Link from '../Link';
import { Separator } from '../ui/Separator';

type DashboardErrorBoundaryProps = {
  children: React.ReactNode;
  /** Keys that will reset the boundary when they change */
  resetKeys?: ReadonlyArray<unknown>;
  /** Optional callback when the boundary resets */
  onReset?: () => void;
  /** Optional custom title for the fallback */
  title?: React.ReactNode;
};

type DashboardErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class DashboardErrorBoundary extends React.Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  state: DashboardErrorBoundaryState = { hasError: false };

  componentDidUpdate(prevProps: DashboardErrorBoundaryProps) {
    if (!this.state.hasError) {
      return;
    }

    const { resetKeys } = this.props;
    if (!resetKeys || !prevProps.resetKeys) {
      return;
    }

    const shouldReset =
      resetKeys.length !== prevProps.resetKeys.length ||
      resetKeys.some((key, index) => !Object.is(key, prevProps.resetKeys?.[index]));

    if (shouldReset) {
      this.reset();
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Dashboard section crashed', error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV !== 'production';

      return (
        <div className="flex w-full flex-col items-center justify-center px-4 py-8">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <Image
              src="/static/images/unexpected-error.png"
              alt=""
              width={312}
              height={202}
              className="h-auto w-auto"
            />
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold">
                {this.props.title || <FormattedMessage defaultMessage="Something went wrong" id="SectionError.Title" />}
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
            {this.state.error?.message && isDevelopment && (
              <Alert variant="destructive" className="mt-4 w-full">
                <AlertTitle className="flex items-center gap-2">
                  <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-normal text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Dev Only
                  </span>
                  Error Details
                </AlertTitle>
                <Separator className="mt-2 mb-3 bg-red-200" />
                <AlertDescription>
                  <p className="mt-2 font-mono text-xs break-words">{this.state.error.message}</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      );
    } else {
      return this.props.children;
    }
  }
}

export default DashboardErrorBoundary;
