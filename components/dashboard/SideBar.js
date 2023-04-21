import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { ShareFeedbackButton } from '../ShareFeedbackButton';

import AccountSwitcher from './AccountSwitcher';
import Menu from './Menu';
import { MenuContainer } from './MenuComponents';

const SidebarContainer = styled(Box)`
  border-right: 1px solid #e6e8eb;
`;

const Sticky = styled.div`
  padding: 24px 16px;
  position: sticky;
  top: 0;
`;

const AdminPanelSideBar = ({ collective, isAccountantOnly, isLoading, selectedSection, onRoute, ...props }) => {
  return (
    <SidebarContainer {...props}>
      <Sticky>
        <MenuContainer>
          <AccountSwitcher collective={collective} isLoading={isLoading} />
          <Box mt={2}>
            <ShareFeedbackButton show />
          </Box>
          {isLoading ? (
            <Box py={3}>
              {[...Array(5).keys()].map(i => (
                <li key={i}>
                  <LoadingPlaceholder
                    height={i === 0 ? 12 : 24}
                    mb={12}
                    borderRadius={8}
                    maxWidth={i === 0 ? '50%' : '70%'}
                  />
                </li>
              ))}
            </Box>
          ) : (
            <Menu {...{ collective, selectedSection, onRoute, isAccountantOnly }} />
          )}
        </MenuContainer>
      </Sticky>
    </SidebarContainer>
  );
};

AdminPanelSideBar.propTypes = {
  isLoading: PropTypes.bool,
  selectedSection: PropTypes.string,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isHost: PropTypes.bool,
  }),
  isAccountantOnly: PropTypes.bool,
  onRoute: PropTypes.func,
};

export default AdminPanelSideBar;
