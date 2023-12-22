import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { getTopContributors } from '../../../lib/collective.lib';
import { CollectiveType } from '../../../lib/constants/collectives';

import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';
import TopContributors from '../TopContributors';

/**
 * Top financial contributors widget.
 */
const SectionTopFinancialContributors = ({ collective, financialContributors }) => {
  const isEvent = collective.type === CollectiveType.EVENT;
  const [topOrganizations, topIndividuals] = getTopContributors(financialContributors);

  if (isEvent || (!topOrganizations.length && !topIndividuals.length)) {
    return null;
  }

  return (
    <ContainerSectionContent pb={4}>
      <SectionTitle>
        <FormattedMessage id="SectionContribute.TopContributors" defaultMessage="Top financial contributors" />
      </SectionTitle>
      <TopContributors organizations={topOrganizations} individuals={topIndividuals} currency={collective.currency} />
    </ContainerSectionContent>
  );
};

SectionTopFinancialContributors.propTypes = {
  collective: PropTypes.shape({
    type: PropTypes.string.isRequired,
    currency: PropTypes.string,
  }),

  financialContributors: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
      isBacker: PropTypes.bool,
      tiersIds: PropTypes.arrayOf(PropTypes.number),
    }),
  ),
};

export default React.memo(SectionTopFinancialContributors);
