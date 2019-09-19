import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import memoizeOne from 'memoize-one';

import { CollectiveType } from '../../../lib/constants/collectives';
import { H3 } from '../../Text';
import StyledButton from '../../StyledButton';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import ContributeCustom from '../../contribute-cards/ContributeCustom';
import ContributeTier from '../../contribute-cards/ContributeTier';
import ContributeEvent from '../../contribute-cards/ContributeEvent';

import ContributeCardsContainer from '../ContributeCardsContainer';
import ContainerSectionContent from '../ContainerSectionContent';
import TopContributors from '../TopContributors';
import SectionTitle from '../SectionTitle';
import CreateNew from '../../contribute-cards/CreateNew';

const CONTRIBUTE_CARD_PADDING_X = [3, 21];

/**
 * The contribute section, implemented as a pure component to avoid unnecessary
 * re-renders when scrolling.
 */
class SectionContribute extends React.PureComponent {
  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        contributors: PropTypes.arrayOf(PropTypes.object),
      }),
    ),
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string,
    }),
    contributorsStats: PropTypes.object,
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        isBacker: PropTypes.bool,
        tiersIds: PropTypes.arrayOf(PropTypes.number),
      }),
    ),
    isAdmin: PropTypes.bool,
  };

  getTopContributors = memoizeOne(contributors => {
    const topOrgs = [];
    const topIndividuals = [];

    for (const contributor of contributors) {
      // We only care about financial contributors that donated $$$
      if (!contributor.isBacker || !contributor.totalAmountDonated) {
        continue;
      }

      // Put contributors in the array corresponding to their types
      if (contributor.type === CollectiveType.USER) {
        topIndividuals.push(contributor);
      } else if (contributor.type === CollectiveType.ORGANIZATION || contributor.type === CollectiveType.COLLECTIVE) {
        topOrgs.push(contributor);
      }

      if (topIndividuals.length >= 10 && topOrgs.length >= 10) {
        break;
      }
    }

    // If one of the two categories is not filled, complete with more contributors from the other
    const nbColsPerCategory = 2;
    const nbFreeColsFromOrgs = nbColsPerCategory - Math.ceil(topOrgs.length / 5);
    const nbFreeColsFromIndividuals = nbColsPerCategory - Math.ceil(topOrgs.length / 5);
    let takeNbOrgs = 10;
    let takeNbIndividuals = 10;

    if (nbFreeColsFromOrgs > 0) {
      takeNbIndividuals += nbFreeColsFromOrgs * 5;
    } else if (nbFreeColsFromIndividuals > 0) {
      takeNbOrgs += nbFreeColsFromIndividuals * 5;
    }

    return [topOrgs.slice(0, takeNbOrgs), topIndividuals.slice(0, takeNbIndividuals)];
  });

  getFinancialContributorsWithoutTier = memoizeOne(contributors => {
    return contributors.filter(c => c.isBacker && (c.tiersIds.length === 0 || c.tiersIds[0] === null));
  });

  hasContributors = memoizeOne(contributors => {
    return contributors.find(c => c.isBacker);
  });

  render() {
    const { collective, tiers, events, contributors, contributorsStats, isAdmin } = this.props;
    const [topOrganizations, topIndividuals] = this.getTopContributors(contributors);
    const financialContributorsWithoutTier = this.getFinancialContributorsWithoutTier(contributors);
    const hasNoContributor = !this.hasContributors(contributors);
    const hasNoContributorForEvents = !events.find(event => event.contributors.length > 0);

    return (
      <Box pt={[4, 5]}>
        <ContainerSectionContent>
          <SectionTitle>
            <FormattedMessage id="CP.Contribute.Title" defaultMessage="Become a contributor" />
          </SectionTitle>
        </ContainerSectionContent>

        <Box mb={4}>
          <HorizontalScroller>
            {(ref, Chevrons) => (
              <div>
                <ContainerSectionContent>
                  <Flex justifyContent="space-between" alignItems="center" mb={3}>
                    <H3 fontSize="H5" fontWeight="600" color="black.700">
                      <FormattedMessage id="CP.Contribute.Financial" defaultMessage="Financial contributions" />
                    </H3>
                    <Box m={2} flex="0 0 50px">
                      <Chevrons />
                    </Box>
                  </Flex>
                </ContainerSectionContent>

                <ContributeCardsContainer ref={ref}>
                  <Box px={CONTRIBUTE_CARD_PADDING_X}>
                    <ContributeCustom
                      collective={collective}
                      contributors={financialContributorsWithoutTier}
                      stats={contributorsStats}
                      hideContributors={hasNoContributor}
                    />
                  </Box>
                  {tiers.map(tier => (
                    <Box key={tier.id} px={CONTRIBUTE_CARD_PADDING_X}>
                      <ContributeTier collective={collective} tier={tier} hideContributors={hasNoContributor} />
                    </Box>
                  ))}
                  {isAdmin && (
                    <Box px={CONTRIBUTE_CARD_PADDING_X}>
                      <CreateNew route={`/${collective.slug}/edit/tiers`}>
                        <FormattedMessage id="Contribute.CreateTier" defaultMessage="Create Contribution Tier" />
                      </CreateNew>
                    </Box>
                  )}
                </ContributeCardsContainer>
              </div>
            )}
          </HorizontalScroller>
        </Box>
        {(isAdmin || events.length > 0) && (
          <HorizontalScroller>
            {(ref, Chevrons) => (
              <div>
                <ContainerSectionContent>
                  <Flex justifyContent="space-between" alignItems="center" mb={3}>
                    <H3 fontSize="H5" fontWeight="600" color="black.700">
                      <FormattedMessage id="section.events.title" defaultMessage="Events" />
                    </H3>
                    <Box m={2} flex="0 0 50px">
                      <Chevrons />
                    </Box>
                  </Flex>
                </ContainerSectionContent>

                <ContributeCardsContainer ref={ref}>
                  {events &&
                    events.map(event => (
                      <Box key={event.id} px={CONTRIBUTE_CARD_PADDING_X}>
                        <ContributeEvent
                          collective={collective}
                          event={event}
                          hideContributors={hasNoContributorForEvents}
                        />
                      </Box>
                    ))}
                  {isAdmin && (
                    <Box px={CONTRIBUTE_CARD_PADDING_X} minHeight={150}>
                      <CreateNew route={`/${collective.slug}/events/create`}>
                        <FormattedMessage id="event.create.btn" defaultMessage="Create Event" />
                      </CreateNew>
                    </Box>
                  )}
                </ContributeCardsContainer>
              </div>
            )}
          </HorizontalScroller>
        )}
        <ContainerSectionContent>
          <Link route="contribute" params={{ collectiveSlug: collective.slug, verb: 'contribute' }}>
            <StyledButton buttonSize="large" mt={3} width={1} p="10px">
              <FormattedMessage id="SectionContribute.All" defaultMessage="View all the ways to contribute" /> →
            </StyledButton>
          </Link>
        </ContainerSectionContent>
        {(topOrganizations.length !== 0 || topIndividuals.length !== 0) && (
          <TopContributors
            organizations={topOrganizations}
            individuals={topIndividuals}
            currency={collective.currency}
          />
        )}
      </Box>
    );
  }
}

export default SectionContribute;
