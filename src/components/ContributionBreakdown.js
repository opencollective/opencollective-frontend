import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { get } from 'lodash';

import StyledCard from './StyledCard';
import { Span } from './Text';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { formatCurrency, capitalize } from '../lib/utils';
import StyledHr from './StyledHr';
import getPaymentMethodFees from '../lib/fees';
import ExternalLinkNewTab from './ExternalLinkNewTab';

const AmountLine = styled(Flex)``;
AmountLine.defaultProps = {
  justifyContent: 'space-between',
  my: 2,
  flexWrap: 'wrap',
};

const Label = styled(Span)`
  min-width: 210px;
`;
Label.defaultProps = {
  fontSize: 'Paragraph',
  mr: 1,
};

/** Returns tax amount */
const calculateTaxAmount = (amount, tax) => {
  if (!tax || !tax.percentage) {
    return 0;
  }

  return amount * (tax.percentage / 100);
};

/**
 * Breakdowns a total amount to show the user where the money goes.
 */
const ContributionBreakdown = ({ amount, currency, tax, platformFeePercent, hostFeePercent, paymentMethod }) => {
  const platformFee = amount * (platformFeePercent / 100);
  const hostFee = amount * (hostFeePercent / 100);
  const pmFeeInfo = getPaymentMethodFees(paymentMethod, amount);
  const netAmountForCollective = amount - platformFee - hostFee - pmFeeInfo.fee;
  const { name: taxName, percentage: taxPercent } = tax || {};
  const taxAmount = calculateTaxAmount(amount, tax);

  return (
    <StyledCard width={1} maxWidth={464} px={[24, 48]} py={24}>
      <AmountLine>
        <Label fontWeight={500} color="black.800">
          <FormattedMessage id="contribution.netAmountForCollective" defaultMessage="Net amount for collective" />
        </Label>
        <Span fontSize="LeadParagraph" fontWeight={500} color="black.700">
          {formatCurrency(netAmountForCollective, currency)}
        </Span>
      </AmountLine>
      {Boolean(platformFee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.platformFeePercent" defaultMessage="Platform fee" />
            {` (-${platformFeePercent}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
            {formatCurrency(platformFee, currency)}
          </Span>
        </AmountLine>
      )}
      {Boolean(hostFeePercent) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.hostFeePercent" defaultMessage="Fiscal host fee" />
            {` (-${hostFeePercent}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
            {formatCurrency(hostFee, currency)}
          </Span>
        </AmountLine>
      )}
      {Boolean(pmFeeInfo.fee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
            {' ('}
            {pmFeeInfo.aboutURL ? (
              <ExternalLinkNewTab href={pmFeeInfo.aboutURL}>{capitalize(paymentMethod.service)}</ExternalLinkNewTab>
            ) : (
              capitalize(paymentMethod.service)
            )}
            {`, ${pmFeeInfo.isExact ? '-' : '~'}${pmFeeInfo.feePercent.toFixed(1)}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
            {!pmFeeInfo.isExact && '~ '}
            {formatCurrency(pmFeeInfo.fee, currency)}
          </Span>
        </AmountLine>
      )}

      <StyledHr borderStyle="dashed" my={3} />
      <AmountLine>
        <Label fontWeight="bold">
          <FormattedMessage id="contribution.your" defaultMessage="Your contribution" />
        </Label>
        <Span fontSize="LeadParagraph">{formatCurrency(amount, currency)}</Span>
      </AmountLine>
      {Boolean(taxAmount) && (
        <React.Fragment>
          <StyledHr my={3} />
          <AmountLine>
            <Label fontWeight="bold">
              {taxName} (+{taxPercent}%)
            </Label>
            <Span fontSize="LeadParagraph">+ {formatCurrency(taxAmount, currency)}</Span>
          </AmountLine>
          <StyledHr my={3} />
          <AmountLine>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.total" defaultMessage="TOTAL" />
            </Label>
            <Span fontWeight="bold" fontSize="LeadParagraph">
              {formatCurrency(amount + taxAmount, currency)}
            </Span>
          </AmountLine>
        </React.Fragment>
      )}
    </StyledCard>
  );
};

ContributionBreakdown.propTypes = {
  /** The total amount without tax in cents */
  amount: PropTypes.number.isRequired,
  /** The currency used for the transaction */
  currency: PropTypes.string.isRequired,
  /** Platform fee. Overriding this stands for test purposes only */
  platformFeePercent: PropTypes.number,
  /** Host fees, as an integer percentage */
  hostFeePercent: PropTypes.number,
  /** Tax as defined in host settings */
  tax: PropTypes.shape({
    /** Tax value, as an integer percentage */
    percentage: PropTypes.number,
    /** Tax name, only required if a tax is applied */
    name: PropTypes.string,
  }),
  /** Payment method, used to generate label and payment fee */
  paymentMethod: PropTypes.shape({
    /** Payment method service provider */
    service: PropTypes.string,
    /** Payment method type */
    type: PropTypes.string,
    /** Payment method currency */
    currency: PropTypes.string,
  }),
};

ContributionBreakdown.defaultProps = {
  platformFeePercent: 5,
  hostFeePercent: 0,
};

export default ContributionBreakdown;
