import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { color, typography } from 'styled-system';

import { getNextChargeDate } from '../../lib/date-utils';
import { i18nTaxType } from '../../lib/i18n/taxes';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import { getTotalAmount } from './utils';

const AmountLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: 400;
  padding: 7px 0;
  line-height: 18px;

  ${color}
  ${typography}
`;

const Label = styled(Span)`
  font-weight: 500;
  margin-right: 4px;
  color: inherit;
  flex: 0 1 70%;
  margin-right: 8px;
  word-break: break-word;
`;

const Amount = styled.span`
  flex: 1 1 30%;
  text-align: right;
`;

const ContributionSummary = ({ collective, stepDetails, stepSummary }) => {
  const intl = useIntl();
  return (
    <Container fontSize="12px">
      <P fontWeight="500" fontSize="inherit" mb={3}>
        <FormattedMessage id="ContributionSummary" defaultMessage="Contribution Summary" />
      </P>
      {stepDetails && (
        <React.Fragment>
          {stepDetails.quantity > 1 && (
            <AmountLine color="black.700">
              <Label>
                <FormattedMessage id="contribution.quantity" defaultMessage="Quantity" />
              </Label>
              <Amount>{stepDetails.quantity}</Amount>
            </AmountLine>
          )}
          <AmountLine color="black.700">
            <Label>
              <FormattedMessage
                id="ContributionToProject"
                defaultMessage="Contribution to {projectName}"
                values={{ projectName: collective.name }}
              />
            </Label>
            <Amount>
              <FormattedMoneyAmount
                amount={stepDetails.amount}
                currency={collective.currency}
                amountStyles={{ color: 'black.700', fontWeight: 400 }}
              />
            </Amount>
          </AmountLine>
          {Boolean(stepSummary?.amount) && (
            <AmountLine color="black.700">
              <Label>{i18nTaxType(intl, stepSummary.taxType)}</Label>
              <Amount>
                <FormattedMoneyAmount
                  amount={stepSummary.amount}
                  currency={collective.currency}
                  amountStyles={{ color: 'black.700', fontWeight: 400 }}
                />
              </Amount>
            </AmountLine>
          )}
          {Boolean(stepDetails.platformContribution) && (
            <AmountLine color="black.700">
              <Label>
                <FormattedMessage
                  id="SupportProject"
                  defaultMessage="Support {projectName}"
                  values={{ projectName: 'Open Collective' }}
                />
              </Label>
              <Amount>
                <FormattedMoneyAmount
                  amount={stepDetails.platformContribution}
                  currency={collective.currency}
                  amountStyles={{ color: 'black.700', fontWeight: 400 }}
                />
              </Amount>
            </AmountLine>
          )}
        </React.Fragment>
      )}

      <StyledHr borderColor="black.500" my={1} />
      <AmountLine color="black.800" fontWeight="500">
        <Label>
          <FormattedMessage id="TodaysCharge" defaultMessage="Today's charge" />
        </Label>
        <Amount fontWeight="700">
          <FormattedMoneyAmount
            amount={getTotalAmount(stepDetails, stepSummary)}
            currency={collective.currency}
            amountStyles={null}
          />
        </Amount>
      </AmountLine>
      <StyledHr borderColor="black.500" my={1} />
      {stepDetails?.interval && (
        <P color="black.700" fontSize="11px" fontStyle="italic" mt={2}>
          <FormattedMessage
            id="ContributionSummary.NextCharge"
            defaultMessage="Next charge on {date} and then the first day of {interval, select, month {each month} year {same month each year}}. You can cancel anytime or edit your contribution in your settings."
            values={{
              date: (
                <FormattedDate
                  value={getNextChargeDate(new Date(), stepDetails.interval)}
                  day="numeric"
                  month="long"
                  year="numeric"
                />
              ),
              interval: stepDetails.interval,
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
