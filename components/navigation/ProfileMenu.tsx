import React from 'react';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import ProfileMenuMemberships from './ProfileMenuMemberships';
import { themeGet } from '@styled-system/theme-get';
import { User, FlaskConical, Settings, Home, LogOut, PocketKnife } from 'lucide-react';
import ChangelogTrigger from '../changelog/ChangelogTrigger';
import Avatar from '../Avatar';
import { Flex, Box } from '../Grid';
import LoginBtn from '../LoginBtn';
import PreviewFeaturesModal from '../PreviewFeaturesModal';
import StyledButton from '../StyledButton';
import { DrawerMenu, DrawerCloseButton, DrawerMenuItem } from './DrawerMenu';
import { Span } from '../Text';

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

const ProfileDrawer = ({ onClose, open }) => {
  const [showPreviewFeaturesModal, setShowPreviewFeaturesModal] = React.useState(false);
  const { LoggedInUser, logout } = useLoggedInUser();
  const hasAvailablePreviewFeatures = LoggedInUser?.getAvailablePreviewFeatures()?.length > 0;

  return (
    <React.Fragment>
      <DrawerMenu anchor="right" open={open} onClose={onClose}>
        <React.Fragment>
          <ProfileHeader>
            <Flex gridGap={2} alignItems="center" overflow="hidden">
              <Avatar collective={LoggedInUser.collective} radius={32} />
              <Box overflow="hidden">
                <div className="name">{LoggedInUser.collective.name}</div>
                <div className="email">{LoggedInUser.email}</div>
              </Box>
            </Flex>
            <DrawerCloseButton onClick={onClose} />
          </ProfileHeader>
          <Flex py="12px" flex={1} flexDirection="column" overflowY="scroll">
            <Flex pb="12px" flexDirection="column">
              <DrawerMenuItem href={`/${LoggedInUser.collective.slug}`} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <User size={16} />
                  <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href={`/dashboard/${LoggedInUser.collective.slug}`} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Home size={16} />
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
                    {/** Not i18n on purpose, this is for platform admins only */}
                    Root Actions
                  </Flex>
                </DrawerMenuItem>
              )}
              <DrawerMenuItem as="button" onClick={() => logout()}>
                <Flex alignItems="center" gridGap={2}>
                  <LogOut size={14} />
                  <FormattedMessage id="menu.logout" defaultMessage="Log out" />
                </Flex>
              </DrawerMenuItem>
            </Flex>
            <ProfileMenuMemberships user={LoggedInUser} closeDrawer={onClose} />
          </Flex>
        </React.Fragment>
      </DrawerMenu>

      {showPreviewFeaturesModal && <PreviewFeaturesModal onClose={() => setShowPreviewFeaturesModal(false)} />}
    </React.Fragment>
  );
};
const ProfileMenu = () => {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();

  if (!LoggedInUser) {
    return <LoginBtn />;
  }

  return (
    <React.Fragment>
      <StyledProfileButton isBorderless onClick={() => setShowProfileMenu(true)}>
        <Flex alignItems="center" data-cy="user-menu-trigger" gridGap={2}>
          <Avatar collective={get(LoggedInUser, 'collective')} radius={32} />
        </Flex>
      </StyledProfileButton>
      <ProfileDrawer open={showProfileMenu} onClose={() => setShowProfileMenu(false)} />
    </React.Fragment>
  );
};
export default ProfileMenu;
