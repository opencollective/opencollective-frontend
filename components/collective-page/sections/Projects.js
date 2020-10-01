import React from 'react';
import PropTypes from 'prop-types';
import css from '@styled-system/css';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/Contribute';
import ContributeProject from '../../contribute-cards/ContributeProject';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box, Flex } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import SectionTitle from '../SectionTitle';

const CONTRIBUTE_CARD_PADDING_X = [15, 18];

const ContributeCardContainer = styled(Box).attrs({ px: CONTRIBUTE_CARD_PADDING_X })(
  css({
    scrollSnapAlign: ['center', null, 'start'],
  }),
);

class SectionProjects extends React.PureComponent {
  static propTypes = {
    projects: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string,
      isActive: PropTypes.bool,
    }),
    isAdmin: PropTypes.bool,
  };

  getContributeCardsScrollDistance(width) {
    const oneCardScrollDistance = CONTRIBUTE_CARD_WIDTH + CONTRIBUTE_CARD_PADDING_X[0] * 2;
    if (width <= oneCardScrollDistance * 2) {
      return oneCardScrollDistance;
    } else if (width <= oneCardScrollDistance * 4) {
      return oneCardScrollDistance * 2;
    } else {
      return oneCardScrollDistance * 3;
    }
  }

  render() {
    const { collective, projects, isAdmin } = this.props;

    if ((projects.length === 0 || !collective.isActive) && !isAdmin) {
      return null;
    }

    return (
      <Box pt={[4, 5]} data-cy="Projects">
        <ContainerSectionContent>
          <SectionTitle>
            <FormattedMessage id="CollectivePage.SectionProjects.Title" defaultMessage="Projects" />
          </SectionTitle>
        </ContainerSectionContent>

        <Box mb={4}>
          <HorizontalScroller getScrollDistance={this.getContributeCardsScrollDistance}>
            {(ref, Chevrons) => (
              <div>
                <ContainerSectionContent>
                  <Flex justifyContent="space-between" alignItems="center" mb={3}>
                    <Box m={2} flex="0 0 50px">
                      <Chevrons />
                    </Box>
                  </Flex>
                </ContainerSectionContent>

                <ContributeCardsContainer ref={ref}>
                  {projects.map(project => (
                    <Box key={project.id} px={CONTRIBUTE_CARD_PADDING_X}>
                      <ContributeProject collective={collective} project={project} disableCTA={!project.isActive} />
                    </Box>
                  ))}
                  {isAdmin && (
                    <ContributeCardContainer minHeight={150}>
                      <CreateNew route={`/${collective.slug}/projects/create`}>
                        <FormattedMessage id="SectionProjects.CreateProject" defaultMessage="Create Project" />
                      </CreateNew>
                    </ContributeCardContainer>
                  )}
                </ContributeCardsContainer>
              </div>
            )}
          </HorizontalScroller>
        </Box>
      </Box>
    );
  }
}

export default SectionProjects;
