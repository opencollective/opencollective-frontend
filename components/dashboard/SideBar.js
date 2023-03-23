import React from 'react';
import PropTypes from 'prop-types';

import { getCollectivePageRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import { Box } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { H1 } from '../Text';

import Menu from './Menu';
import { MenuContainer } from './MenuComponents';

const AdminPanelSideBar = ({ collective, isAccountantOnly, isLoading, selectedSection, onRoute, ...props }) => {
  const pageUrl = getCollectivePageRoute(collective);
  return (
    <Box {...props}>
      <MenuContainer>
        <Box mb={32}>
          {isLoading ? (
            <LoadingPlaceholder height={56} width={56} borderRadius="50%" />
          ) : (
            <Link href={pageUrl} data-cy="menu-account-avatar-link">
              <Avatar collective={collective} radius={56} />
            </Link>
          )}
          <H1 fontSize="16px" lineHeight="24px" fontWeight="700" letterSpacing="0.04px" mb={16} mt={12}>
            {isLoading ? (
              <LoadingPlaceholder height={24} maxWidth="75%" />
            ) : (
              <Link href={pageUrl}>{collective.name}</Link>
            )}
          </H1>
        </Box>

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
};

export default AdminPanelSideBar;
