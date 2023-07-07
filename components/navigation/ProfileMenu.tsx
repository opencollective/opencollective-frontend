import React from 'react';
import { get } from 'lodash';
import {
  BookOpen,
  FlaskConical,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PocketKnife,
  Settings,
  User,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar from '../Avatar';
import { Box, Flex } from '../Grid';
import LoginBtn from '../LoginBtn';
import PreviewFeaturesModal from '../PreviewFeaturesModal';
import StyledButton from '../StyledButton';
import { Span } from '../Text';

import { DrawerCloseButton, DrawerMenu, DrawerMenuItem } from './DrawerMenu';
import ProfileMenuMemberships from './ProfileMenuMemberships';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

const StyledDropdownContent = styled(DropdownMenu.Content)`
  min-width: 220px;
  background-color: white;
  border-radius: 12px;
  padding: 0px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  display: flex;
  flex-direction: column;
  hr {
    margin: 8px 0;
    border-color: #f3f4f6;
  }
`;
const StyledProfileButton = styled(StyledButton)`
  padding: 0;
  background-color: white !important;
`;

const ProfileHeader = styled.div`
  padding: 0 16px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  grid-gap: 8px;
  border-bottom: 1px solid #f3f4f6;
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

const ProfileDrawer = ({ onClose, open, setShowPreviewFeaturesModal }) => {
  return (
    <React.Fragment>
      <DrawerMenu anchor="right" open={open} onClose={onClose}>
        <MenuContents setShowPreviewFeaturesModal={setShowPreviewFeaturesModal} onClose={onClose} />
      </DrawerMenu>
    </React.Fragment>
  );
};

const MenuContents = ({ setShowPreviewFeaturesModal, onClose, isDropdown }) => {
  const { LoggedInUser, logout } = useLoggedInUser();

  const hasAvailablePreviewFeatures = LoggedInUser?.getAvailablePreviewFeatures()?.length > 0;
  const removeSiteMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD_REMOVE_SITE_MENU);
  const removeLegacyCollectiveList = LoggedInUser?.hasPreviewFeatureEnabled(
    PREVIEW_FEATURE_KEYS.DASHBOARD_REMOVE_LEGACY_COLLECTIVE_LIST,
  );

  return (
    <React.Fragment>
      <ProfileHeader>
        <Flex gridGap={2} alignItems="center" overflow="hidden">
          {!isDropdown && <Avatar collective={LoggedInUser.collective} radius={36} />}
          <Box overflow="hidden">
            <div className="name">{LoggedInUser.collective.name}</div>
            <div className="email">{LoggedInUser.email}</div>
          </Box>
        </Flex>
        {!isDropdown && <DrawerCloseButton onClick={onClose} />}
      </ProfileHeader>
      <Flex pt="12px" flex={1} flexDirection="column" overflowY="auto">
        <Flex pb="12px" flexDirection="column">
          <DrawerMenuItem href={`/${LoggedInUser.collective.slug}`} onClick={onClose}>
            <Flex alignItems="center" gridGap={2}>
              <User size={16} />
              <FormattedMessage id="menu.profile" defaultMessage="Profile" />
            </Flex>
          </DrawerMenuItem>
          <DrawerMenuItem href={`/dashboard/${LoggedInUser.collective.slug}`} onClick={onClose}>
            <Flex alignItems="center" gridGap={2}>
              <LayoutDashboard size={16} />
              <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
            </Flex>
          </DrawerMenuItem>
          <DrawerMenuItem href={`/dashboard/${LoggedInUser.collective.slug}/info`} onClick={onClose}>
            <Flex alignItems="center" gridGap={2}>
              <Settings size={16} />
              <FormattedMessage id="Settings" defaultMessage="Settings" />
            </Flex>
          </DrawerMenuItem>

          {hasAvailablePreviewFeatures && (
            <DrawerMenuItem as="button" onClick={() => setShowPreviewFeaturesModal(true)}>
              <Flex alignItems="center" gridGap={2}>
                <FlaskConical size={16} />
                <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
              </Flex>
              <Span
                fontSize="12px"
                ml={1}
                style={{ borderRadius: 20 }}
                py="2px"
                px="6px"
                display="inline-block"
                bg="primary.200"
                color="black.800"
              >
                <FormattedMessage defaultMessage="New!" />
              </Span>
            </DrawerMenuItem>
          )}
          {LoggedInUser.isRoot && (
            <DrawerMenuItem href="/opencollective/root-actions" onClick={onClose}>
              <Flex alignItems="center" gridGap={2}>
                <PocketKnife size={16} />
                <FormattedMessage id="RootActions" defaultMessage="Root Actions" />
              </Flex>
            </DrawerMenuItem>
          )}

          {removeSiteMenu && (
            <React.Fragment>
              <hr />
              <DrawerMenuItem href={`/home`} openInNewTab>
                <Flex alignItems="center" gridGap={2}>
                  <Home size={16} />
                  <FormattedMessage defaultMessage="Open Collective Homepage" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href={`/help`}>
                <Flex alignItems="center" gridGap={2}>
                  <LifeBuoy size={16} />
                  <FormattedMessage defaultMessage="Help & Support" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href={`https://docs.opencollective.com`} openInNewTab>
                <Flex alignItems="center" gridGap={2}>
                  <BookOpen size={16} />
                  <FormattedMessage defaultMessage="Docs" />
                </Flex>
              </DrawerMenuItem>
              <hr />
            </React.Fragment>
          )}
          <DrawerMenuItem as="button" onClick={() => logout()}>
            <Flex alignItems="center" gridGap={2}>
              <LogOut size={14} />
              <FormattedMessage id="menu.logout" defaultMessage="Log out" />
            </Flex>
          </DrawerMenuItem>
        </Flex>
        {!removeLegacyCollectiveList && <ProfileMenuMemberships user={LoggedInUser} closeDrawer={onClose} />}
      </Flex>
    </React.Fragment>
  );
};
const ProfileMenu = () => {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showPreviewFeaturesModal, setShowPreviewFeaturesModal] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();

  if (!LoggedInUser) {
    return <LoginBtn />;
  }
  const removeSiteMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD_REMOVE_SITE_MENU);
  const removeLegacyCollectiveList = LoggedInUser?.hasPreviewFeatureEnabled(
    PREVIEW_FEATURE_KEYS.DASHBOARD_REMOVE_LEGACY_COLLECTIVE_LIST,
  );

  const useDrawer = !removeLegacyCollectiveList;

  return (
    <React.Fragment>
      {useDrawer ? (
        <React.Fragment>
          <StyledProfileButton isBorderless onClick={() => setShowProfileMenu(true)}>
            <Flex alignItems="center" data-cy="user-menu-trigger" gridGap={2}>
              <Avatar collective={get(LoggedInUser, 'collective')} radius={36} />
            </Flex>
          </StyledProfileButton>
          <ProfileDrawer
            open={showProfileMenu}
            onClose={() => setShowProfileMenu(false)}
            setShowPreviewFeaturesModal={setShowPreviewFeaturesModal}
          />
        </React.Fragment>
      ) : (
        <DropdownMenu.Root open={showProfileMenu} onOpenChange={setShowProfileMenu}>
          <DropdownMenu.Trigger asChild>
            <StyledProfileButton isBorderless>
              <Flex alignItems="center" data-cy="user-menu-trigger" gridGap={2}>
                <Avatar collective={get(LoggedInUser, 'collective')} radius={36} />
              </Flex>
            </StyledProfileButton>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <StyledDropdownContent className="DropdownMenuContent" sideOffset={5} align="end">
              <MenuContents
                open={showProfileMenu}
                onClose={() => setShowProfileMenu(false)}
                setShowPreviewFeaturesModal={setShowPreviewFeaturesModal}
                isDropdown
              />
            </StyledDropdownContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
      {showPreviewFeaturesModal && <PreviewFeaturesModal onClose={() => setShowPreviewFeaturesModal(false)} />}
    </React.Fragment>
  );
};
export default ProfileMenu;
