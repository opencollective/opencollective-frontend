import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';

import Menu from './TopBarMenu';
import { MenuContainer } from './TopBarMenuComponents';

const SidebarContainer = styled(Box)`
  border-bottom: 1px solid #e6e8eb;
`;

const Sticky = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
`;

const AdminPanelTopBar = ({
  collective,
  activeSlug,
  isAccountantOnly,
  isLoading,
  selectedSection,
  onRoute,
  expandedSection,
  menuItems,
  ...props
}) => {
  return (
    <div className="border-b">
      <div className="flex px-4 py-2 md:px-6">
        {/* <AccountSwitcher activeSlug={activeSlug} /> */}

        {isLoading ? (
          <Box>
            {[...Array(5).keys()].map(i => (
              <li key={i}>
                <LoadingPlaceholder height={24} mb={12} borderRadius={8} maxWidth={'70%'} />
              </li>
            ))}
          </Box>
        ) : (
          <Menu {...{ collective, menuItems, selectedSection, onRoute, isAccountantOnly, expandedSection }} />
        )}
      </div>
    </div>
  );
};

AdminPanelTopBar.propTypes = {
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

export default AdminPanelTopBar;
