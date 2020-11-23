import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import { H4 } from '../../Text';

// Dynamicly load HTMLEditor to download it only if user can edit the page
const GoalsCoverLoadingPlaceholder = () => <LoadingPlaceholder height={400} />;
const GoalsCover = dynamic(() => import('../../GoalsCover'), {
  loading: GoalsCoverLoadingPlaceholder,
});

/**
 * Display the general goals for the collective
 */
const SectionGoals = ({ collective }) => {
  return (
    <Container background="rgb(245, 247, 250)" px={4} py={5} mt={3}>
      <Box pl={5}>
        <H4 fontWeight="500" color="black.900">
          <FormattedMessage
            id="Collective.Goals"
            defaultMessage="{collective}'s Goals"
            values={{
              collective: collective.name,
            }}
          />
        </H4>
      </Box>
      <GoalsCover collective={collective} />
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
