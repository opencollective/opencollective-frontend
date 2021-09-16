import React from 'react';
import PropTypes from 'prop-types';

import Avatar from '../Avatar';
import { Box } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { H1 } from '../Text';

import Menu from './Menu';
import { MenuContainer } from './MenuComponents';

const AdminPanelSideBar = ({ collectiveSlug, collective, isLoading, selectedSection, onRoute, ...props }) => {
  return (
    <Box {...props}>
      <MenuContainer>
        <Box mb={32}>
          <Link href={`/${collectiveSlug}`}>
            <Avatar collective={collective} radius={56} />
          </Link>

          <H1 fontSize="16px" lineHeight="24px" fontWeight="700" letterSpacing="0.04px" mb={16} mt={12}>
            {isLoading ? <LoadingPlaceholder /> : collective.name}
          </H1>
        </Box>

        {isLoading ? (
          [...Array(5).keys()].map(i => (
            <li key={i}>
              <LoadingPlaceholder height={24} mb={2} borderRadius={8} />
            </li>
          ))
        ) : (
          <Menu {...{ collective, selectedSection, onRoute }} />
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
  collectiveSlug: PropTypes.string,
  onRoute: PropTypes.func,
};

export default AdminPanelSideBar;
