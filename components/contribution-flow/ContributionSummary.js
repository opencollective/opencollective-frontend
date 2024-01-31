import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { get } from 'lodash';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { color, flex, typography } from 'styled-system';

import INTERVALS from '../../lib/constants/intervals';
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

const AmountLine = styled.div.attrs({
  'data-cy': 'ContributionSummary-AmountLine',
})`
  display: flex;
  justify-content: space-between;
  font-weight: 400;
  padding: 7px 0;
  line-height: 18px;
  color: #4e5052;

  ${color}
  ${typography}
`;

const Label = styled(Span)`
  margin-right: 4px;
  color: inherit;
  flex: 0 1 70%;
  margin-right: 8px;
  word-break: break-word;
  ${flex}
`;

Label.defaultProps = {
  fontWeight: 400,
};

const Amount = styled(Span)`
  flex: 1 1 30%;
  text-align: right;
`;

const ContributionSummary = ({ collective, stepDetails, stepSummary, stepPayment, currency, tier, renderTax }) => {
  const intl = useIntl();
  const amount = stepDetails.amount;
  const totalAmount = getTotalAmount(stepDetails, stepSummary);
  const pmFeeInfo = getPaymentMethodFees(stepPayment?.paymentMethod, totalAmount, currency);
  const platformTip = get(stepDetails, 'platformTip', 0);
  const showQuantity = stepDetails.quantity > 1 || ['TICKET', 'PRODUCT'].includes(tier?.type);
  const contributionName = tier?.name ? `${collective.name} - "${tier.name}"` : collective.name;
  return (
    <Container>
      {stepDetails && (
        <React.Fragment>
          {showQuantity && (
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
                values={{ projectName: contributionName }}
              />
            </Label>
            <Amount>
              <FormattedMoneyAmount
                amount={amount || 0}
                currency={currency}
                amountStyles={{ color: 'black.700', fontWeight: 400 }}
              />
            </Amount>
          </AmountLine>
          {Boolean(stepSummary?.taxType) &&
            (renderTax ? (
              renderTax({ AmountLine, Amount, Label })
            ) : (
              <AmountLine color="black.700">
                <Label>
                  {i18nTaxType(intl, stepSummary.taxType)} {stepSummary.percentage}%
                </Label>
                <Amount>
                  <FormattedMoneyAmount
                    amount={stepSummary.amount}
                    currency={currency}
                    amountStyles={{ color: 'black.700', fontWeight: 400 }}
                  />
                </Amount>
              </AmountLine>
            ))}

          {Boolean(platformTip) && (
            <AmountLine color="black.700">
              <Label>
                {stepDetails.isNewPlatformTip ? (
                  <FormattedMessage defaultMessage="Optional tip to the platform" />
                ) : (
                  <FormattedMessage
                    id="SupportProject"
                    defaultMessage="Support {projectName}"
                    values={{ projectName: 'Doohi Collective' }}
                  />
                )}
              </Label>
              <Amount data-cy="ContributionSummary-Tip">
                <FormattedMoneyAmount
                  amount={platformTip}
                  currency={currency}
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
        <Amount fontWeight="700" data-cy="ContributionSummary-TodaysCharge">
          <FormattedMoneyAmount amount={totalAmount} currency={currency} amountStyles={null} />
        </Amount>
      </AmountLine>
      {Boolean(pmFeeInfo.fee) && (
        <React.Fragment>
          <AmountLine color="black.700">
            <Label>
              {pmFeeInfo.name ? (
                <FormattedMessage
                  id="PaymentProviderFees.Label"
                  defaultMessage="{isExact, select, false {Estimated } other {}}{providerName} fees"
                  values={{ providerName: pmFeeInfo.name, isExact: pmFeeInfo.isExact }}
                />
              ) : (
                <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
              )}
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
                          defaultMessage="This amount can vary due to currency exchange rates or depending on the selected service."
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
                amount={pmFeeInfo.fee || null}
                currency={currency}
                amountStyles={{ color: 'black.700', fontWeight: 400 }}
              />
            </Amount>
          </AmountLine>
          <AmountLine color="black.700">
            <Label>
              <FormattedMessage
                id="NetAmountFor"
                defaultMessage="Net amount for {name}"
                values={{ name: collective.name }}
              />
            </Label>
            <Amount>
              {!pmFeeInfo.isExact && (
                <Box display="inline-block" mr={1} verticalAlign="text-bottom">
                  <StyledTooltip
                    verticalAlign="top"
                    content={
                      <FormattedMessage defaultMessage="Net Amount = Today's charge - Payment processor fee - Support Doohi Collective" />
                    }
                  >
                    <InfoCircle size="16px" color="#76777A" />
                  </StyledTooltip>
                </Box>
              )}
              <FormattedMoneyAmount
                amount={totalAmount - pmFeeInfo.fee - platformTip}
                currency={currency}
                amountStyles={null}
              />
            </Amount>
          </AmountLine>
        </React.Fragment>
      )}
      <StyledHr borderColor="black.500" my={1} />
      {stepDetails?.interval && stepDetails?.interval !== INTERVALS.oneTime && (
        <P color="black.800" fontSize="12px" mt={3}>
          {!stepPayment || stepPayment.isKeyOnly ? (
            <FormattedMessage
              id="ContributionSummary.NextCharge"
              defaultMessage="If you select PayPal, you will be charged on the same day each month. Otherwise the next charge will be on {date} and then the first day of {interval, select, month {each month} year {the same month each year} other {}}. You can cancel or edit this contribution by going to 'Manage Contributions'."
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
          ) : (
            <React.Fragment>
              <FormattedMessage
                id="withColon"
                defaultMessage="{item}:"
                values={{ item: <FormattedMessage defaultMessage="Next charge date" /> }}
              />{' '}
              <FormattedDate
                value={getNextChargeDate(new Date(), stepDetails.interval, stepPayment?.paymentMethod?.service)}
                day="numeric"
                month="long"
                year="numeric"
              />
              <Box display="inline-block" ml={1} verticalAlign="text-bottom">
                <StyledTooltip
                  verticalAlign="top"
                  content={
                    <FormattedMessage
                      id="ContributionSummary.NextCharge"
                      defaultMessage="If you select PayPal, you will be charged on the same day each month. Otherwise the next charge will be on {date} and then the first day of {interval, select, month {each month} year {the same month each year} other {}}. You can cancel or edit this contribution by going to 'Manage Contributions'."
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
                  }
                >
                  <InfoCircle size="15px" color="#76777A" />
                </StyledTooltip>
              </Box>
            </React.Fragment>
          )}
        </P>
      )}
    </Container>
  );
};

ContributionSummary.propTypes = {
  collective: PropTypes.object,
  tier: PropTypes.object,
  stepDetails: PropTypes.object,
  stepSummary: PropTypes.object,
  stepPayment: PropTypes.object,
  currency: PropTypes.string,
  renderTax: PropTypes.func,
};

export default ContributionSummary;
