import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';

import Menu from './TopSideMenu';
import { MenuContainer } from './TopSideMenuComponents';

const SidebarContainer = styled(Box)`
  @media screen and (max-width: ${themeGet('breakpoints.1')}) {
    border-right: 0;
    border-bottom: 1px solid #e6e8eb;
  }
`;

const Sticky = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 10;
`;

const AdminPanelSideBar = ({
  collective,
  activeSlug,
  isAccountantOnly,
  isLoading,
  selectedSection,
  onRoute,
  ...props
}) => {
  return (
    <SidebarContainer {...props} flexGrow={0} flexShrink={0} width={['100%', '100%', '280px']}>
      <Sticky>
        <MenuContainer>
          {/* <AccountSwitcher activeSlug={activeSlug} /> */}

          <Box>
            {isLoading ? (
              <Box>
                {[...Array(5).keys()].map(i => (
                  <li key={i}>
                    <LoadingPlaceholder height={24} mb={12} borderRadius={8} maxWidth={'70%'} />
                  </li>
                ))}
              </Box>
            ) : (
              <Menu {...{ collective, selectedSection, onRoute, isAccountantOnly }} />
            )}
          </Box>
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
