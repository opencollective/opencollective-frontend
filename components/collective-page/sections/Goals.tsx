import React from 'react';
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

export default React.memo(SectionGoals);
