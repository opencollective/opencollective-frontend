import React from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import memoizeOne from 'memoize-one';

import { CollectiveType } from '../../lib/constants/collectives';
import { formatCurrency } from '../../lib/utils';
import { H2 } from '../Text';
import StyledButton from '../StyledButton';
import Link from '../Link';

import { ContributionTypes } from './_constants';
import ContributeRow from './ContributeRow';
import ContainerSectionContent from './ContainerSectionContent';
import TopContributors from './TopContributors';

/**
 * The contribute section, implemented as a pure component to avoid unnecessary
 * re-renders when scrolling.
 */
class SectionContribute extends React.PureComponent {
  static propTypes = {
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string,
    }),
    tiers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        description: PropTypes.string,
        hasLongDescription: PropTypes.bool,
        interval: PropTypes.string,
        goal: PropTypes.number,
        stats: PropTypes.shape({
          totalRecurringDonations: PropTypes.number,
          totalDonated: PropTypes.number,
        }),
      }),
    ),
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        description: PropTypes.string,
        image: PropTypes.string,
      }),
    ),
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
      }),
    ),
    intl: PropTypes.object,
  };

  static messages = defineMessages({
    customContribution: {
      id: 'CollectivePage.Contribute.Custom',
      defaultMessage: 'Custom contribution',
    },
    customContributionDetails: {
      id: 'CollectivePage.Contribute.Custom.Description',
      defaultMessage: 'Nothing there for you? Make a custom one time or recurring contribution.',
    },
    fallbackDescription: {
      id: 'TierCard.DefaultDescription',
      defaultMessage:
        '{tierName, select, backer {Become a backer} sponsor {Become a sponsor} other {Join us}} {minAmount, select, 0 {} other {for {minAmountWithCurrency} {interval, select, month {per month} year {per year} other {}}}} and help us sustain our activities!',
    },
  });

  static getContributionTypeFromTier(tier) {
    if (tier.goal) {
      return ContributionTypes.FINANCIAL_GOAL;
    }
    return tier.interval ? ContributionTypes.FINANCIAL_RECURRING : ContributionTypes.FINANCIAL_ONE_TIME;
  }

  static getWayToContributeFromTier(collective, tier, intl) {
    const tierRoute = `/${collective.slug}/contribute/${tier.slug}-${tier.id}`;
    const currency = tier.currency || collective.currency;
    let description = tier.description;
    if (!description) {
      const minAmount = tier.amountType === 'FLEXIBLE' ? tier.minAmount : tier.amount;
      description = intl.formatMessage(SectionContribute.messages.fallbackDescription, {
        minAmount,
        tierName: tier.name,
        minAmountWithCurrency: minAmount && formatCurrency(minAmount, currency),
        interval: tier.interval,
      });
    }

    return {
      key: `tier-${tier.id}`,
      type: SectionContribute.getContributionTypeFromTier(tier),
      title: tier.name,
      contributeRoute: `${tierRoute}/checkout`,
      detailsRoute: tier.hasLongDescription ? tierRoute : null,
      description,
      interval: tier.interval,
      goal: tier.goal,
      raised: tier.interval ? tier.stats.totalRecurringDonations : tier.stats.totalDonated,
      currency,
    };
  }

  static getWayToContributeFromEvent(collective, event) {
    return {
      key: `event-${event.id}`,
      type: ContributionTypes.EVENT_PARTICIPATE,
      title: event.name,
      contributeRoute: `/${collective.slug}/events/${event.slug}`,
      detailsRoute: `/${collective.slug}/events/${event.slug}`,
      description: event.description,
    };
  }

  /**
   * Takes a list of tiers and return an array like [financialContributions, moreWaysToContribute]
   * The returned contributions are properly formatted to be passed to `ContributeRow`.
   */
  getWaysToContribute = memoizeOne((collective, tiers, events) => {
    const { intl } = this.props;

    const financialContributions = [
      // Static way to contribute: /donate
      {
        key: 'donate',
        type: ContributionTypes.FINANCIAL_CUSTOM,
        title: intl.formatMessage(SectionContribute.messages.customContribution),
        description: intl.formatMessage(SectionContribute.messages.customContributionDetails),
        contributeRoute: `/${collective.slug}/donate`,
      },
      // Add tiers as ways to contribute
      ...(tiers || []).map(tier => {
        return SectionContribute.getWayToContributeFromTier(collective, tier, intl);
      }),
    ];

    // Add events as ways to contribute
    const moreWaysToContribute = (events || []).map(event => {
      return SectionContribute.getWayToContributeFromEvent(collective, event);
    });

    return [financialContributions, moreWaysToContribute];
  });

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

  render() {
    const { collective, tiers, events, contributors } = this.props;
    const [financialContributions, otherWaysToContribute] = this.getWaysToContribute(collective, tiers, events);
    const [topOrganizations, topIndividuals] = this.getTopContributors(contributors);

    return (
      <Box py={[4, 5]}>
        <ContainerSectionContent>
          <H2 mb={3} fontWeight="normal" color="black.900">
            <FormattedMessage id="CollectivePage.Contribute" defaultMessage="Contribute" />
          </H2>
        </ContainerSectionContent>
        <Box mb={4}>
          <ContributeRow
            contributionTypes={financialContributions}
            title={
              <FormattedMessage
                id="CollectivePage.FinancialContributor"
                defaultMessage="Become a financial contributor"
              />
            }
          />
        </Box>
        {otherWaysToContribute.length > 0 && (
          <ContributeRow
            contributionTypes={otherWaysToContribute}
            title={
              <FormattedMessage id="CollectivePage.MoreWaysToContribute" defaultMessage="More ways to contribute" />
            }
          />
        )}
        <ContainerSectionContent>
          <Link route="tiers" params={{ collectiveSlug: collective.slug, verb: 'contribute' }}>
            <StyledButton buttonSize="large" mt={3} width={1}>
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

export default injectIntl(SectionContribute);
