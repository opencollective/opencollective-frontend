import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';

import AccountSwitcher from './AccountSwitcher';
import Menu from './Menu';
import { MenuContainer } from './MenuComponents';

const SidebarContainer = styled(Box)`
  border-right: 1px solid #e6e8eb;
  flex: 0 2 300px;
`;

const Sticky = styled.div`
  padding: 24px 16px;
  position: sticky;
  top: 0;
`;

const AdminPanelSideBar = ({
  activeSlug,
  collective,
  isAccountantOnly,
  isLoading,
  selectedSection,
  onRoute,
  ...props
}) => {
  return (
    <SidebarContainer {...props}>
      <Sticky>
        <MenuContainer>
          <AccountSwitcher activeSlug={activeSlug} isLoading={isLoading} />
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
  activeSlug: PropTypes.string,
};

export default AdminPanelSideBar;
