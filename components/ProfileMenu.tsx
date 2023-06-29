import React from 'react';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { get } from 'lodash';
import { ExternalLink, LogOut, Plus } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { useTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import MUIDrawer from '@mui/material/Drawer';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import StyledRoundButton from './StyledRoundButton';
import SiteMenuMemberships from './SiteMenuMemberships';
import { themeGet } from '@styled-system/theme-get';
import { User, FlaskConical, Settings, Home, X } from 'lucide-react';
import ChangelogTrigger from './changelog/ChangelogTrigger';
import Avatar from './Avatar';
import Container from './Container';
import { Flex } from './Grid';
import Hide from './Hide';
import Link from './Link';
import LoginBtn from './LoginBtn';
import PreviewFeaturesModal from './PreviewFeaturesModal';
import StyledButton from './StyledButton';
import { Dropdown, DropdownContent } from './StyledDropdown';
import { Span } from './Text';

const StyledProfileButton = styled(StyledButton)`
  padding: 0;
  background-color: white !important;
`;

const StyledDrawerContainer = styled.div<{ maxWidth: string }>`
  display: flex;
  height: 100vh;
  max-width: ${props => props.maxWidth};
  width: 100vw;
  flex-direction: column;

  hr {
    margin: 8px 0;
    border-color: #f3f4f6;
  }
`;

const StyledMUIDrawer = styled(MUIDrawer)`
  height: 100vh !important;

  .MuiDrawer-paper {
    border-radius: 12px 0 0 12px;
  }
`;

export const SummaryHeader = styled.span`
  > a {
    color: inherit;
    text-decoration: underline;
    outline: none;
    :hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

const CloseDrawerButton = styled(StyledRoundButton)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  color: #4b5563;
`;

const MenuLink = styled(Link)`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  &:hover {
    background: #f7f8fa;
    color: #1f2328;
  }
  padding: 8px;
  border-radius: 8px;
  color: #1f2328;
  svg {
    color: #4b5563;
  }
`;

const Footer = styled.div`
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f3f4f6;
`;

const StyledDropdownContainer = styled.div`
  position: relative;
  @media screen and (max-width: ${themeGet('breakpoints.0')}) {
    position: static;
  }
`;
const ProfileHeader = styled.div`
  padding: 0 16px;
  padding-bottom: 15px;
  display: flex;
  align-items: center;
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

const StyledMenuEntry = styled(Link)`
  border: 0;
  background-color: transparent;
  color: #334155;
  padding: 8px 8px;
  margin: 0 16px;
  font-size: 14px;
  border-radius: 6px;
  white-space: nowrap;
  vertical-align: middle;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  &:hover {
    background-color: #f4f5f7;
    color: #334155;
    text-decoration: none;
    svg {
      color: #334155;
    }
  }

  svg {
    color: #94a3b8;
    height: 14px;
    width: 14px;
  }

  @media screen and (max-width: ${themeGet('breakpoints.0')}) {
    font-size: 16px;
    padding: 12px;

    svg {
      height: 16px;
      width: 16px;
    }
  }

  ${props =>
    props.$isActive
      ? css({
          backgroundColor: 'primary.100',
        })
      : css({
          ':hover': {
            backgroundColor: 'black.50',
          },
        })}
`;

const ProfileDrawer = ({ onClose, open }) => {
  const [showPreviewFeaturesModal, setShowPreviewFeaturesModal] = React.useState(false);
  const { LoggedInUser, logout } = useLoggedInUser();
  const hasAvailablePreviewFeatures = LoggedInUser?.getAvailablePreviewFeatures()?.length > 0;
  const twoFactorPrompt = useTwoFactorAuthenticationPrompt();
  const disableEnforceFocus = Boolean(twoFactorPrompt?.isOpen);

  return (
    <React.Fragment>
      <StyledMUIDrawer anchor="right" open={open} onClose={onClose} disableEnforceFocus={disableEnforceFocus}>
        <StyledDrawerContainer maxWidth="280px">
          <Container position="relative" pt={'16px'}>
            <ProfileHeader>
              <Avatar collective={LoggedInUser.collective} radius={36} />
              <div>
                <div className="name">{LoggedInUser.collective.name}</div>
                <div className="email">{LoggedInUser.email}</div>
              </div>
            </ProfileHeader>
            <CloseDrawerButton type="button" isBorderless onClick={onClose}>
              <X size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            </CloseDrawerButton>
          </Container>
          <Flex py="12px" flex={1} flexDirection="column" overflowY="scroll">
            <Flex pb="12px" flexDirection="column">
              <StyledMenuEntry href={`/${LoggedInUser.collective.slug}`} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <User size={16} />
                  <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                </Flex>
              </StyledMenuEntry>
              <StyledMenuEntry href={`/dashboard/${LoggedInUser.collective.slug}`} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Home size={16} />
                  <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                </Flex>
              </StyledMenuEntry>
              <StyledMenuEntry href={`/dashboard/${LoggedInUser.collective.slug}/info`} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Settings size={16} />
                  <FormattedMessage id="Settings" defaultMessage="Settings" />
                </Flex>
              </StyledMenuEntry>

              {hasAvailablePreviewFeatures && (
                <StyledMenuEntry as="button" onClick={() => setShowPreviewFeaturesModal(true)}>
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
                </StyledMenuEntry>
              )}
              <StyledMenuEntry as="button" onClick={() => logout()}>
                <Flex alignItems="center" gridGap={2}>
                  <LogOut size={14} />
                  <FormattedMessage id="menu.logout" defaultMessage="Log out" />
                </Flex>
              </StyledMenuEntry>
            </Flex>
            <SiteMenuMemberships user={LoggedInUser} onClose={onClose} />
          </Flex>
          {/* <Footer>
           
          </Footer> */}
        </StyledDrawerContainer>
      </StyledMUIDrawer>

      {showPreviewFeaturesModal && <PreviewFeaturesModal onClose={() => setShowPreviewFeaturesModal(false)} />}
    </React.Fragment>
  );
};
const ProfileMenuDropdown = () => {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();

  if (!LoggedInUser) {
    return <LoginBtn />;
  }

  return (
    <React.Fragment>
      <StyledProfileButton isBorderless onClick={() => setShowProfileMenu(true)}>
        <Flex alignItems="center" data-cy="user-menu-trigger" gridGap={2}>
          <Avatar collective={get(LoggedInUser, 'collective')} radius={36} />
        </Flex>
      </StyledProfileButton>
      <ProfileDrawer open={showProfileMenu} onClose={() => setShowProfileMenu(false)} />
    </React.Fragment>
  );
};
export default ProfileMenuDropdown;
