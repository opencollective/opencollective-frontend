import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { color, typography } from 'styled-system';

import { getNextChargeDate } from '../../lib/date-utils';
import getPaymentMethodFees from '../../lib/fees';
import { i18nTaxType } from '../../lib/i18n/taxes';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box } from '../Grid';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
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
  margin-right: 4px;
  color: inherit;
  flex: 0 1 70%;
  margin-right: 8px;
  word-break: break-word;
`;

Label.defaultProps = {
  fontWeight: 400,
};

const Amount = styled(Span)`
  flex: 1 1 30%;
  text-align: right;
`;

const ContributionSummary = ({ collective, stepDetails, stepSummary, stepPayment }) => {
  const intl = useIntl();
  const totalAmount = getTotalAmount(stepDetails, stepSummary);
  const pmFeeInfo = getPaymentMethodFees(stepPayment?.paymentMethod, totalAmount, collective.currency);
  const platformContribution = stepDetails.platformContribution || 0;

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
          {Boolean(platformContribution) && (
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
                  amount={platformContribution}
                  currency={collective.currency}
                  amountStyles={{ color: 'black.700', fontWeight: 400 }}
                />
              </Amount>
            </AmountLine>
          )}
          {Boolean(pmFeeInfo.fee) && (
            <AmountLine color="black.700">
              <Label>
                <FormattedMessage
                  id="PaymentProviderFees.Label"
                  defaultMessage="{providerName} fees"
                  values={{ providerName: pmFeeInfo.name }}
                />
              </Label>
              <Amount>
                {!pmFeeInfo.isExact && (
                  <Box display="inline-block" mr={1} verticalAlign="text-bottom">
                    <StyledTooltip
                      verticalAlign="top"
                      content={
                        <Span>
                          <FormattedMessage
                            id="Fees.ApproximationDisclaimer"
                            defaultMessage="This amount could vary due to currency exchange or other payment processor fees that we cannot predict."
                          />
                          {pmFeeInfo.aboutURL && (
                            <React.Fragment>
                              <br />
                              <br />
                              <StyledLink href={pmFeeInfo.aboutURL} openInNewTab>
                                <FormattedMessage
                                  id="LearnMoreAboutServiceFees"
                                  defaultMessage="Learn more about {service} fees"
                                  values={{ service: pmFeeInfo.name }}
                                />
                              </StyledLink>
                            </React.Fragment>
                          )}
                        </Span>
                      }
                    >
                      <InfoCircle size="16px" color="#76777A" />
                    </StyledTooltip>
                  </Box>
                )}
                <FormattedMoneyAmount
                  amount={pmFeeInfo.fee}
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
        <Label fontWeight="500">
          <FormattedMessage id="TodaysCharge" defaultMessage="Today's charge" />
        </Label>
        <Amount fontWeight="700">
          <FormattedMoneyAmount amount={totalAmount} currency={collective.currency} amountStyles={null} />
        </Amount>
      </AmountLine>
      {Boolean(pmFeeInfo.fee) && (
        <AmountLine color="black.700">
          <Label>
            <FormattedMessage
              id="NetAmountFor"
              defaultMessage="Net amount for {name}"
              values={{ name: collective.name }}
            />
          </Label>
          <Amount>
            <FormattedMoneyAmount
              amount={totalAmount - pmFeeInfo.fee - platformContribution}
              currency={collective.currency}
              amountStyles={null}
            />
          </Amount>
        </AmountLine>
      )}
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
  stepPayment: PropTypes.object,
};

export default ContributionSummary;
