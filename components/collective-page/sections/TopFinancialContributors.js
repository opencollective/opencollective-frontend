import React from 'react';
import { FormattedMessage } from 'react-intl';

import { getTopContributors } from '../../../lib/collective';
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

export default React.memo(SectionTopFinancialContributors);
