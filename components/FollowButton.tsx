import React from 'react';
import { gql, useMutation } from '@apollo/client';
import clsx from 'clsx';
import { Minus, Plus } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import type { Account } from '../lib/graphql/types/v2/graphql';
import { MemberRole } from '../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import type { ButtonStyle } from '../lib/theme/variants/button';

import { useToast } from './ui/useToast';
import type { StyledButtonProps } from './StyledButton';
import StyledButton from './StyledButton';
import StyledSpinner from './StyledSpinner';

type FollowButtonProps = {
  className?: string;
  account: Pick<Account, 'slug'>;
  buttonProps?: StyledButtonProps;
  followLabel?: React.ReactNode;
  unfollowLabel?: React.ReactNode;
  followButtonStyle?: ButtonStyle;
  unfollowButtonStyle?: ButtonStyle;
};

export default function FollowButton(props: FollowButtonProps) {
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const isFollowingAccount = React.useMemo(() => {
    if (!LoggedInUser) {
      return false;
    }
    return LoggedInUser.hasRole(MemberRole.FOLLOWER, props.account);
  }, [LoggedInUser, props.account]);

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
        accountSlug: props.account.slug,
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
        accountSlug: props.account.slug,
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
  }, [isFollowingAccount, props.account, intl]);

  const UnfollowLabel = props.unfollowLabel || (
    <React.Fragment>
      <FormattedMessage id="actions.unfollow" defaultMessage="Unfollow" />
      <Minus className="ml-[0.2rem]" size="1rem" />
    </React.Fragment>
  );

  const FollowLabel = props.followLabel || (
    <React.Fragment>
      <FormattedMessage id="actions.follow" defaultMessage="Follow" />
      <Plus className="ml-[0.2rem]" size="1rem" />
    </React.Fragment>
  );

  const followButtonStyle = props.followButtonStyle || 'standard';
  const unfollowButtonStyle = props.unfollowButtonStyle || 'dangerSecondary';

  if (!LoggedInUser) {
    return null;
  }

  return (
    <StyledButton
      {...props.buttonProps}
      className={clsx('space-between flex h-7 min-w-[100px] items-center', props.className)}
      disabled={isLoading}
      buttonStyle={isFollowingAccount ? unfollowButtonStyle : followButtonStyle}
      onClick={onButtonClick}
    >
      {isFollowingAccount ? UnfollowLabel : FollowLabel}
      {isLoading && <StyledSpinner size="0.9em" />}
    </StyledButton>
  );
}
