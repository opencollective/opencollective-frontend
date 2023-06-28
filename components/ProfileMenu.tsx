import React from 'react';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { themeGet } from '@styled-system/theme-get';
import { get } from 'lodash';
import { ExternalLink, LogOut, Plus } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';

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

const StyledDropdownContent = styled(DropdownContent)`
  top: 52px;
  border-radius: 12px;
  right: 0;
  width: 260px;

  padding: 8px 0;
  hr {
    margin: 8px 0;
    border-color: #f3f4f6;
  }
  @media screen and (max-width: ${themeGet('breakpoints.0')}) {
    right: 0;
    left: 0;
    width: 100vw;
    max-width: 100vw;
    top: 64px;
    border-radius: 0;
  }
`;

const StyledDropdownContainer = styled.div`
  position: relative;
  @media screen and (max-width: ${themeGet('breakpoints.0')}) {
    position: static;
  }
`;
const ProfileHeader = styled.div`
  padding: 4px 16px;
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
  padding: 8px 12px;
  margin: 0 8px;
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
const ProfileMenuDropdown = () => {
  const [showPreviewFeaturesModal, setShowPreviewFeaturesModal] = React.useState(false);
  const { LoggedInUser, logout } = useLoggedInUser();
  const hasAvailablePreviewFeatures = LoggedInUser?.getAvailablePreviewFeatures()?.length > 0;

  if (!LoggedInUser) {
    return <LoginBtn />;
  }

  return (
    <React.Fragment>
      <Dropdown trigger="click">
        {({ triggerProps, dropdownProps }) => (
          <StyledDropdownContainer>
            <StyledProfileButton isBorderless {...triggerProps}>
              <Flex alignItems="center" data-cy="user-menu-trigger" gridGap={2}>
                <Avatar collective={get(LoggedInUser, 'collective')} radius={36} />
              </Flex>
            </StyledProfileButton>
            <Hide sm md lg>
              <Container position="absolute" mx={27} my={-47}>
                <ChangelogTrigger height="24px" width="24px" backgroundSize="9.49px 13.5px" />
              </Container>
            </Hide>
            <StyledDropdownContent {...dropdownProps}>
              <Flex flexDirection="column">
                <ProfileHeader>
                  <div className="name">{LoggedInUser.collective.name}</div>
                  <div className="email">{LoggedInUser.email}</div>
                </ProfileHeader>
                <hr />
                <StyledMenuEntry href={`/${LoggedInUser.collective.slug}`}>
                  <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                </StyledMenuEntry>
                <StyledMenuEntry href={`/dashboard/${LoggedInUser.collective.slug}`}>
                  <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                </StyledMenuEntry>
                <StyledMenuEntry href={`/dashboard/${LoggedInUser.collective.slug}/info`}>
                  <FormattedMessage id="Settings" defaultMessage="Settings" />
                </StyledMenuEntry>
                {hasAvailablePreviewFeatures && (
                  <StyledMenuEntry as="button" onClick={() => setShowPreviewFeaturesModal(true)}>
                    <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
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
                <hr />
                <StyledMenuEntry href="/create">
                  <FormattedMessage defaultMessage="New Collective" /> <Plus />
                </StyledMenuEntry>
                <StyledMenuEntry href="/organizations/new">
                  <FormattedMessage defaultMessage="New Organization" /> <Plus size={14} />
                </StyledMenuEntry>
                <hr />
                <StyledMenuEntry href="/home" openInNewTab>
                  <FormattedMessage defaultMessage="Open Collective Homepage" /> <ExternalLink size={14} />
                </StyledMenuEntry>
                <StyledMenuEntry href="/help" openInNewTab>
                  <FormattedMessage defaultMessage="Help & Support" /> <ExternalLink size={14} />
                </StyledMenuEntry>
                <StyledMenuEntry href="https://docs.opencollective.com" openInNewTab>
                  <FormattedMessage defaultMessage="Documentation" /> <ExternalLink size={14} />
                </StyledMenuEntry>
                <hr />
                <StyledMenuEntry as="button" onClick={() => logout()}>
                  <FormattedMessage id="menu.logout" defaultMessage="Log out" /> <LogOut size={14} />
                </StyledMenuEntry>
              </Flex>
            </StyledDropdownContent>
          </StyledDropdownContainer>
        )}
      </Dropdown>
      {showPreviewFeaturesModal && <PreviewFeaturesModal onClose={() => setShowPreviewFeaturesModal(false)} />}
    </React.Fragment>
  );
};
export default ProfileMenuDropdown;
