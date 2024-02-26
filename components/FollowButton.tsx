import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { Account, MemberRole } from '../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/DropdownMenu';
import { useToast } from './ui/useToast';

type FollowButtonProps = {
  className?: string;
  account: Pick<Account, 'slug'>;
  isHoverCard?: boolean;
};

export default function FollowButton({ className, account, isHoverCard }: FollowButtonProps) {
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const isFollowingAccount = React.useMemo(() => {
    if (!LoggedInUser) {
      return false;
    }
    return LoggedInUser.hasRole(MemberRole.FOLLOWER, account);
  }, [LoggedInUser, account]);

  const [followAccount] = useMutation(
    gql`
      mutation FollowAccount($accountSlug: String!) {
        followAccount(account: { slug: $accountSlug }) {
          member {
            id
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        accountSlug: account.slug,
      },
    },
  );

  const [unfollowAccount] = useMutation(
    gql`
      mutation UnfollowAccount($accountSlug: String!) {
        unfollowAccount(account: { slug: $accountSlug }) {
          member {
            id
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        accountSlug: account.slug,
      },
    },
  );

  const onButtonClick = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (!isFollowingAccount) {
        await followAccount();
      } else {
        await unfollowAccount();
      }
      await refetchLoggedInUser();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setIsLoading(false);
    }
  }, [isFollowingAccount, account, intl]);

  if (!LoggedInUser || LoggedInUser.collective.slug === account.slug) {
    return null;
  }

  // Use a dropdown to provide the unfollow action, unless it is in a hover card where dropdowns do not work (and hover cards are not available on mobile)
  if (isFollowingAccount && !isHoverCard) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="xs" variant="outline" loading={isLoading} className={cn('gap-0.5', className)}>
            <FormattedMessage id="Following" defaultMessage="Following" />
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onButtonClick}>
            <FormattedMessage id="actions.unfollow" defaultMessage="Unfollow" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      size="xs"
      variant="outline"
      disabled={isLoading}
      onClick={onButtonClick}
      loading={isLoading}
      className={cn(
        'group',
        isFollowingAccount && isHoverCard && 'hover:border-red-600 hover:bg-transparent hover:text-red-600',
        className,
      )}
    >
      {isFollowingAccount && isHoverCard ? (
        <React.Fragment>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <FormattedMessage id="actions.unfollow" defaultMessage="Unfollow" />
          </div>
          <span className="opacity-100 group-hover:opacity-0">
            <FormattedMessage id="Following" defaultMessage="Following" />
          </span>
        </React.Fragment>
      ) : (
        <FormattedMessage id="actions.follow" defaultMessage="Follow" />
      )}
    </Button>
  );
}
