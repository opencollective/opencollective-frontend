import React from 'react';
import PropTypes from 'prop-types';

import Container from '../Container';
import LoadingPlaceholder from '../LoadingPlaceholder';
import NotFound from '../NotFound';
import { OCFBannerWithData } from '../OCFBanner';

import Overview from './sections/overview/Overview';
import { SECTIONS } from './constants';

const DASHBOARD_COMPONENTS = {
  [SECTIONS.OVERVIEW]: Overview,
};

const DashboardSection = ({ account, isLoading, section, subpath }) => {
  if (isLoading) {
    return (
      <div className="w-full pb-6">
        <OCFBannerWithData isDashboard collective={account} hideNextSteps={section === 'host'} />
        <LoadingPlaceholder height={26} mb={4} maxWidth={500} />
        <LoadingPlaceholder height={300} />
      </div>
    );
  }

  const DashboardComponent = DASHBOARD_COMPONENTS[section];
  if (DashboardComponent) {
    return (
      <div className="w-full pb-6">
        <OCFBannerWithData isDashboard collective={account} hideNextSteps={section === 'host'} />
        <DashboardComponent accountSlug={account.slug} subpath={subpath} isDashboard />
      </div>
    );
  }

  return (
    <Container display="flex" justifyContent="center" alignItems="center">
      <NotFound />
    </Container>
  );
};

DashboardSection.propTypes = {
  isLoading: PropTypes.bool,
  section: PropTypes.string,
  subpath: PropTypes.arrayOf(PropTypes.string),
  /** The account. Can be null if isLoading is true */
  account: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default DashboardSection;
