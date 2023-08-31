import React from 'react';
import { gql, useQuery } from '@apollo/client';
import * as Popover from '@radix-ui/react-popover';
import { get } from 'lodash';
import { Badge, BookOpen, FlaskConical, LifeBuoy, LogOut, PocketKnife, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';

import Avatar from '../Avatar';
import { Box, Flex } from '../Grid';
import { HideGlobalScroll } from '../HideGlobalScroll';
import Image from '../Image';
import Link from '../Link';
import LoginBtn from '../LoginBtn';
import PreviewFeaturesModal from '../PreviewFeaturesModal';
import StyledButton from '../StyledButton';
import { HorziontalSeparator } from '../ui/Separator';

import { DrawerMenu } from './DrawerMenu';
import ProfileMenuMemberships from './ProfileMenuMemberships';

const memberInvitationsCountQuery = gql`
  query MemberInvitationsCount($memberAccount: AccountReferenceInput!) {
    memberInvitations(memberAccount: $memberAccount) {
      id
    }
  }
`;

const StyledProfileButton = styled(StyledButton)`
  padding: 0;
  background-color: white !important;
`;

const ProfileHeader = styled(Flex)`
  display: flex;

  .name {
    font-size: 14px;
    color: #0f172a;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .email {
    font-size: 12px;
    color: #64748b;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const PopoverMenuWrapper = styled(Flex)`
  background-color: white;
  border-radius: 16px;
  border: 1px solid ${props => props.theme.colors.black[100]};
  padding: 36px 24px 16px;
  margin-top: 5px;
  z-index: 3000;
  box-shadow:
    0px 0.4631686508655548px 0.792047381401062px 0px rgba(0, 0, 0, 0.03),
    0px 1.1708027124404907px 1.8449060916900635px 0px rgba(0, 0, 0, 0.03),
    0px 2.275846004486084px 3.4150261878967285px 0px rgba(0, 0, 0, 0.02),
    0px 4.104311943054199px 6.1252121925354px 0px rgba(0, 0, 0, 0.02),
    0px 7.566044330596924px 12.08122730255127px 0px rgba(0, 0, 0, 0.01),
    0px 18px 40px 0px rgba(0, 0, 0, 0.01);
`;

const PopoverMenuItem = styled(Link)`
  all: unset;

  svg:first-child {
    margin-right: 8px;
  }
  padding: 8px 12px;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  border-radius: 24px;
  color: ${props => props.theme.colors.black[700]};

  &:hover {
    color: initial;
    background-color: ${props => props.theme.colors.black[100]};
  }
`;

const FooterLinks = styled(Flex)`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`;

const ProfileMenu = () => {
  const router = useRouter();
  const { LoggedInUser, logout } = useLoggedInUser();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [showPreviewFeaturesModal, setShowPreviewFeaturesModal] = React.useState(false);
  const hasAvailablePreviewFeatures = LoggedInUser?.getAvailablePreviewFeatures()?.length > 0;
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;
  const { data } = useQuery(memberInvitationsCountQuery, {
    variables: { memberAccount: { slug: LoggedInUser?.collective?.slug } },
    skip: !LoggedInUser,
    context: API_V2_CONTEXT,
  });

  React.useEffect(() => {
    const handler = () => setMenuOpen(false);
    router.events.on('routeChangeStart', handler);
    return () => {
      router.events.off('routeChangeStart', handler);
    };
  }, [router]);

  if (!LoggedInUser) {
    return <LoginBtn />;
  }

  const pendingInvitations = data?.memberInvitations?.length > 0 ? data?.memberInvitations?.length : null;

  const content = (
    <Flex flexDirection="column" maxHeight={['100%', '80dvh']} overflow="hidden">
      <Flex flexDirection={['column', 'row']} overflow={['auto', 'hidden']}>
        <Flex flexDirection="column" width="164px">
          <ProfileHeader alignItems="center" overflow="hidden" pb="24px">
            <Box overflow="hidden">
              <div className="name">{LoggedInUser.collective.name}</div>
              <div className="email">{LoggedInUser.email}</div>
            </Box>
          </ProfileHeader>
          <Flex flexDirection="column" gap="16px">
            <PopoverMenuItem href="/help">
              <Flex alignItems="center">
                <LifeBuoy size={16} />
                <FormattedMessage id="home.helpAndSupport" defaultMessage="Help and support" />
              </Flex>
            </PopoverMenuItem>
            <PopoverMenuItem href="https://docs.opencollective.com/help/">
              <Flex alignItems="center">
                <BookOpen size={16} />
                <FormattedMessage id="menu.documentation" defaultMessage="Documentation" />
              </Flex>
            </PopoverMenuItem>
            {pendingInvitations && (
              <PopoverMenuItem href="/member-invitations">
                <Flex alignItems="center">
                  <Badge size={16} />
                  <FormattedMessage
                    id="menu.invitations"
                    defaultMessage="Invitations ({numberOfInvitations})"
                    values={{ numberOfInvitations: pendingInvitations }}
                  />
                </Flex>
              </PopoverMenuItem>
            )}
            <PopoverMenuItem href={`/dashboard/${LoggedInUser.collective.slug}/info`}>
              <Flex alignItems="center">
                <User size={16} />
                <FormattedMessage id="menu.account.settings" defaultMessage="Account settings" />
              </Flex>
            </PopoverMenuItem>
            {hasAvailablePreviewFeatures && (
              <PopoverMenuItem as="button" onClick={() => setShowPreviewFeaturesModal(true)}>
                <Flex alignItems="center">
                  <FlaskConical size={16} />
                  <FormattedMessage id="menu.preview.features" defaultMessage="Preview features" />
                </Flex>
              </PopoverMenuItem>
            )}
            {LoggedInUser.isRoot && (
              <PopoverMenuItem href="/opencollective/root-actions">
                <Flex alignItems="center">
                  <PocketKnife size={16} />
                  <FormattedMessage id="menu.root" defaultMessage="Root actions" />
                </Flex>
              </PopoverMenuItem>
            )}
            <PopoverMenuItem as="button" onClick={() => logout()}>
              <Flex alignItems="center">
                <LogOut size={14} />
                <FormattedMessage id="menu.logout" defaultMessage="Log out" />
              </Flex>
            </PopoverMenuItem>
          </Flex>
        </Flex>
        <ProfileMenuMemberships
          user={LoggedInUser}
          maxWidth="270px"
          overflowY={['initial', 'auto']}
          mt={['32px', '0']}
          ml={['0', '24px']}
          pl={['0', '24px']}
          borderLeft={['none', '1px solid #EAEAEC']}
          closeDrawer={() => setMenuOpen(false)}
        />
      </Flex>
      <Box>
        <HorziontalSeparator style={{ margin: '24px 0' }} />
        <Link href="/home">
          <Image src="/static/images/opencollectivelogo-footer-n.svg" alt="Open Collective" width={122} height={24} />
        </Link>
        <FooterLinks mt="16px" gap="32px">
          <Link href="/home">
            <FormattedMessage id="menu.homepage" defaultMessage="Homepage" />
          </Link>
          <Link href="/privacypolicy">
            <FormattedMessage id="menu.privacyPolicy" defaultMessage="Privacy" />
          </Link>
          <Link href="/tos">
            <FormattedMessage id="menu.termsOfAgreement" defaultMessage="Terms" />
          </Link>
        </FooterLinks>
      </Box>
    </Flex>
  );

  return (
    <React.Fragment>
      <Popover.Root onOpenChange={() => setMenuOpen(!isMenuOpen)} open={!isMobile && isMenuOpen}>
        <Popover.Trigger asChild>
          <StyledProfileButton isBorderless>
            <Flex alignItems="center" data-cy="user-menu-trigger" gridGap={2}>
              <Avatar collective={get(LoggedInUser, 'collective')} radius={40} />
            </Flex>
          </StyledProfileButton>
        </Popover.Trigger>
        <Popover.Portal>
          {!isMobile && (
            <Popover.Content align="end" style={{ zIndex: 3000 }}>
              <PopoverMenuWrapper>{content}</PopoverMenuWrapper>
              <HideGlobalScroll />
            </Popover.Content>
          )}
        </Popover.Portal>
      </Popover.Root>
      {isMobile && isMenuOpen && (
        <React.Fragment>
          <DrawerMenu onClose={() => setMenuOpen(false)} open={true} p="36px 24px 16px">
            {content}
          </DrawerMenu>
          <HideGlobalScroll />
        </React.Fragment>
      )}
      {showPreviewFeaturesModal && <PreviewFeaturesModal onClose={() => setShowPreviewFeaturesModal(false)} />}
    </React.Fragment>
  );
};
export default ProfileMenu;
