import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { cx } from 'class-variance-authority';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';

import AccountSwitcher from './AccountSwitcher';
import Menu from './Menu';
import { MenuContainer } from './MenuComponents';
import { SettingsContext } from '../../lib/SettingsContext';

const Sticky = styled.div`
  padding: 20px 16px;
  position: sticky;
  top: 0;
`;

const AdminPanelSideBar = ({ collective, isAccountantOnly, isLoading, selectedSection, onRoute, ...props }) => {
  const { settings } = React.useContext(SettingsContext);
  return (
    <div
      className={cx(
        'sm:block hidden  w-full max-w-[280px] shrink-0 border-r border-slate-200/75 ',
        settings.sidebarGrayBg ? 'bg-slate-50/75 ' : settings.mainGrayBg ? 'bg-white' : '',
        settings.shadowsSidebar ? 'shadow-inner' : '',
      )}
    >
      <Sticky>
        <MenuContainer>
          <AccountSwitcher collective={collective} isLoading={isLoading} />
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
            <Menu settings={settings} {...{ collective, selectedSection, onRoute, isAccountantOnly }} />
          )}
        </MenuContainer>
      </Sticky>
    </div>
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
