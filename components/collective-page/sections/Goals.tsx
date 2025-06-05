import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

import Container from '../../Container';
import LoadingPlaceholder from '../../LoadingPlaceholder';

// Dynamicly load Goals cover to download it if enabled
const GoalsCoverLoadingPlaceholder = () => <LoadingPlaceholder height={400} />;
const GoalsCover = dynamic(() => import('../../GoalsCover'), {
  loading: GoalsCoverLoadingPlaceholder,
});

/**
 * Display the general goals for the collective
 */
const SectionGoals = ({ collective }) => {
  return (
    <Container background="rgb(245, 247, 250)" pt={5} pb={40}>
      <Container maxWidth="80%" m="0 auto">
        <GoalsCover collective={collective} />
      </Container>
    </Container>
  );
};

SectionGoals.propTypes = {
  /** The collective to display description for */
  collective: PropTypes.shape({
    settings: PropTypes.object,
    name: PropTypes.string,
  }).isRequired,
};

export default React.memo(SectionGoals);
