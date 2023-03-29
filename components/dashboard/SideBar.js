import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';

import Menu from './Menu';
import { MenuContainer } from './MenuComponents';
import Switcher from './Switcher';

const SidebarContainer = styled.div`
  border-right: 1px solid #e6e8eb;
  // padding: 16px;
  // position: sticky;
  // top: 0;
`;

const Sticky = styled.div`
  // border-right: 1px solid #e6e8eb;
  padding: 16px;
  position: sticky;
  top: 0;
`;

const AdminPanelSideBar = ({
  collective,
  isAccountantOnly,
  // LoggedInUser,
  isLoading,
  selectedSection,
  onRoute,
  // ...props
}) => {
  return (
    <SidebarContainer>
      <Sticky>
        <MenuContainer>
          <Switcher collective={collective} isLoading={isLoading} />

          {isLoading ? (
            [...Array(5).keys()].map(i => (
              <li key={i}>
                <LoadingPlaceholder height={24} mb={2} borderRadius={8} maxWidth="80%" />
              </li>
            ))
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
  // LoggedInUser: PropTypes.object,
  isAccountantOnly: PropTypes.bool,
  onRoute: PropTypes.func,
};

export default AdminPanelSideBar;
