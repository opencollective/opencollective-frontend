import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getTopContributors } from '../../../lib/collective.lib';
import { CollectiveType } from '../../../lib/constants/collectives';

import Container from '../../Container';
import { H4 } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import TopContributors from '../TopContributors';

const TopContributorsContainer = styled.div`
  padding: 32px 16px;
  margin-top: 48px;
  background-color: #f5f7fa;
`;

/**
 * Top financial contributors widget.
 */
const SectionTopFinancialContributors = ({ collective, financialContributors }) => {
  const isEvent = collective.type === CollectiveType.EVENT;
  const [topOrganizations, topIndividuals] = getTopContributors(financialContributors);

  return (
    <Fragment>
      {!isEvent && (topOrganizations.length !== 0 || topIndividuals.length !== 0) && (
        <ContainerSectionContent>
          <TopContributorsContainer>
            <Container maxWidth={1090} m="0 auto" px={[15, 30]}>
              <H4 fontWeight="500" color="black.900" mb={3}>
                <FormattedMessage id="SectionContribute.TopContributors" defaultMessage="Top financial contributors" />
              </H4>
              <TopContributors
                organizations={topOrganizations}
                individuals={topIndividuals}
                currency={collective.currency}
              />
            </Container>
          </TopContributorsContainer>
        </ContainerSectionContent>
      )}
    </Fragment>
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
