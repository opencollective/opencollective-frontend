import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';

import { getEnvVar } from '../../../lib/env-utils';
import { parseToBoolean } from '../../../lib/utils';

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
  if (parseToBoolean(getEnvVar('NEW_COLLECTIVE_NAVBAR'))) {
    return (
      <Container background="rgb(245, 247, 250)" px={4} py={5} mt={3}>
        <Box pl={5}>
          <H4 fontWeight="normal" color="black.700">
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
  } else {
    return (
      <Container background="rgb(245, 247, 250)" pt={5} pb={40}>
        <GoalsCover collective={collective} />
      </Container>
    );
  }
};

SectionGoals.propTypes = {
  /** The collective to display description for */
  collective: PropTypes.shape({
    settings: PropTypes.object,
    name: PropTypes.string,
  }).isRequired,
};

export default React.memo(SectionGoals);
