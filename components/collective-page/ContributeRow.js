import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { injectIntl } from 'react-intl';

import { H3 } from '../Text';
import HorizontalScroller from '../HorizontalScroller';

import ContributeCard from './ContributeCard';
import ContributeCardsContainer from './ContributeCardsContainer';
import ContainerSectionContent from './ContainerSectionContent';

/**
 * Contribute cards rendered in an horizontally scrollable container. Implemented
 * as a separate component so update made on this component doesn't re-trigger the render
 * function for the entire contribute section.
 */
class ContributeRow extends React.PureComponent {
  static propTypes = {
    /** Row title. Use this to describe the types of the contributions */
    title: PropTypes.node.isRequired,
    /** Defines ways to contribute */
    contributionTypes: PropTypes.arrayOf(
      PropTypes.shape({
        /** A unique key that represents this contribution */
        key: PropTypes.string.isRequired,
      }),
    ).isRequired,
    /** from injectIntl */
    intl: PropTypes.object,
  };

  render() {
    const { contributionTypes, title, intl } = this.props;

    return (
      <HorizontalScroller>
        {(ref, Chevrons) => (
          <div>
            <ContainerSectionContent>
              <Flex justifyContent="space-between" alignItems="center" mb={3}>
                <H3 fontSize="H5" fontWeight="normal" color="black.900">
                  {title}
                </H3>
                <Box m={2} flex="0 0 50px">
                  <Chevrons />
                </Box>
              </Flex>
            </ContainerSectionContent>

            <ContributeCardsContainer ref={ref}>
              {contributionTypes.map(wayToContribute => (
                <Box key={wayToContribute.key} px={[3, 4]}>
                  <ContributeCard intl={intl} contribution={wayToContribute} />
                </Box>
              ))}
            </ContributeCardsContainer>
          </div>
        )}
      </HorizontalScroller>
    );
  }
}

export default injectIntl(ContributeRow);
