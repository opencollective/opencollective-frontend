import React from 'react';
import styled from 'styled-components';

import type { Account } from '../lib/graphql/types/v2/graphql';
import { getAvatarBorderRadius } from '../lib/image-utils';

import Avatar from './Avatar';
import LinkCollective from './LinkCollective';

type AvatarWithLinkProps = {
  account: Pick<Account, 'name' | 'type' | 'isIncognito' | 'slug' | 'imageUrl'>;
  secondaryAccount?: Partial<Account> | null;
  /** The size in pixels */
  size: number;
};

const DualAvatarContainer = styled.div`
  position: relative;
`;

type SecondaryAvatarContainerProps = {
  borderRadius: string | number;
};

const SecondaryAvatarContainer = styled.div<SecondaryAvatarContainerProps>`
  position: absolute;
  background: white;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: -8px;
  right: -8px;
  width: 50%;
  height: 50%;
  border-radius: ${({ borderRadius }) => borderRadius};
`;

/**
 * [GraphQL V2 ONLY] A wrapper around `Avatar` that wraps it in a Link, with support for an optional second
 * profile to be displayed in the corner.
 */
export const AvatarWithLink = ({ account, secondaryAccount, size }: AvatarWithLinkProps) => {
  const mainAvatar = (
    <LinkCollective collective={account}>
      <Avatar collective={account} radius={size} />
    </LinkCollective>
  );

  if (!secondaryAccount) {
    return mainAvatar;
  } else {
    return (
      <DualAvatarContainer>
        {mainAvatar}
        <SecondaryAvatarContainer borderRadius={getAvatarBorderRadius(secondaryAccount.type)}>
          <LinkCollective collective={secondaryAccount}>
            <Avatar collective={secondaryAccount} radius={size / 2} />
          </LinkCollective>
        </SecondaryAvatarContainer>
      </DualAvatarContainer>
    );
  }
};
