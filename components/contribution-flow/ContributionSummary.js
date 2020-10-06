import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { color, typography } from 'styled-system';

import { getNextChargeDate } from '../../lib/date-utils';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import { getTotalAmount } from './utils';

const AmountLine = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-weight: 400;
  padding: 7px 0;
  line-height: 18px;

  ${color}
  ${typography}
`;

const Label = styled.span`
  font-weight: 500;
  margin-right: 4px;
  color: inherit;
`;

const ContributionSummary = ({ collective, stepDetails, stepSummary }) => {
  return (
    <Container fontSize="12px">
      <P fontWeight="500" fontSize="inherit" mb={3}>
        <FormattedMessage id="ContributionSummary" defaultMessage="Contribution Summary" />
      </P>
      <AmountLine color="black.700">
        <Label>
          <FormattedMessage
            id="ContributionToProject"
            defaultMessage="Contribution to {projectName}"
            values={{ projectName: collective.name }}
          />
        </Label>
        <span>
          <FormattedMoneyAmount
            amount={stepDetails.amount}
            currency={collective.currency}
            amountStyles={{ color: 'black.700', fontWeight: 400 }}
          />
        </span>
      </AmountLine>
      {Boolean(stepDetails?.platformContribution) && (
        <AmountLine color="black.700">
          <Label>
            <FormattedMessage
              id="SupportProject"
              defaultMessage="Support {projectName}"
              values={{ projectName: 'Open Collective' }}
            />
          </Label>
          <span>
            <FormattedMoneyAmount
              amount={stepDetails.platformContribution}
              currency={collective.currency}
              amountStyles={{ color: 'black.700', fontWeight: 400 }}
            />
          </span>
        </AmountLine>
      )}
      <StyledHr borderColor="black.500" my={1} />
      <AmountLine color="black.800" fontWeight="500">
        <Label>
          <FormattedMessage id="TodaysCharge" defaultMessage="Today's charge" />
        </Label>
        <Span fontWeight="700">
          <FormattedMoneyAmount
            amount={getTotalAmount(stepDetails, stepSummary)}
            currency={collective.currency}
            amountStyles={null}
          />
        </Span>
      </AmountLine>
      <StyledHr borderColor="black.500" my={1} />
      {stepDetails?.interval && (
        <P color="black.700" fontSize="11px" fontStyle="italic" mt={2}>
          <FormattedMessage
            id="ContributionSummary.NextCharge"
            defaultMessage="Next charge on {date} and then the first day of each month. You can cancel anytime or edit your contribution in your settings."
            values={{
              date: (
                <FormattedDate
                  value={getNextChargeDate(new Date(), stepDetails.interval)}
                  day="numeric"
                  month="long"
                  year="numeric"
                />
              ),
            }}
          />
        </P>
      )}
    </Container>
  );
};

ContributionSummary.propTypes = {
  collective: PropTypes.object,
  stepDetails: PropTypes.object,
  stepSummary: PropTypes.object,
};

export default ContributionSummary;
