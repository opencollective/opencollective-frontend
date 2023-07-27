import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';

import AccountSwitcher from './AccountSwitcher';
import Menu from './Menu';
import { MenuContainer } from './MenuComponents';

const Sticky = styled.div`
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
    <Box {...props} flexGrow={0} flexShrink={0} width={['100%', '100%', '288px']}>
      <Sticky>
        <MenuContainer>
          <AccountSwitcher activeSlug={activeSlug} isLoading={isLoading} />

          <Box py={2}>
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
    </Box>
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
