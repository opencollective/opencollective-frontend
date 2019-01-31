import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import StyledCard from './StyledCard';
import { Span } from './Text';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { formatCurrency } from '../lib/utils';
import StyledHr from './StyledHr';

const AmountLine = styled(Flex)``;
AmountLine.defaultProps = {
  justifyContent: 'space-between',
  my: 2,
  flexWrap: 'wrap',
};

const Label = styled(Span)`
  min-width: 200px;
`;
Label.defaultProps = {
  fontSize: 'Paragraph',
  mr: 1,
};

/**
 * Breakdowns a total amount to show the user where the money goes.
 */
const ContributionBreakdown = ({ amount, currency, tax, taxName, platformFee, hostFee, paymentFee }) => {
  return (
    <StyledCard maxWidth={464} px={[24, 48]} py={24}>
      <AmountLine>
        <Label fontWeight={500} color="black.800">
          <FormattedMessage id="contribution.netAmountForCollective" defaultMessage="Net amount for collective" />
        </Label>
        <Span fontSize="LeadParagraph" fontWeight={500} color="black.700">
          {formatCurrency(amount - amount * ((platformFee + hostFee + paymentFee) / 100), currency)}
        </Span>
      </AmountLine>
      <AmountLine>
        <Label color="black.500">
          <FormattedMessage id="contribution.platformFee" defaultMessage="Platform fee" />
          {` (-${platformFee}%)`}
        </Label>
        <Span fontSize="LeadParagraph" color="black.500">
          {formatCurrency(amount * (platformFee / 100), currency)}
        </Span>
      </AmountLine>
      {Boolean(hostFee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.hostFee" defaultMessage="Fiscal host fee" />
            {` (-${hostFee}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
            {formatCurrency(amount * (hostFee / 100), currency)}
          </Span>
        </AmountLine>
      )}
      {Boolean(paymentFee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
            {` (-${paymentFee}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
            {formatCurrency(amount * (paymentFee / 100), currency)}
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
      {Boolean(tax) && (
        <React.Fragment>
          <StyledHr my={3} />
          <AmountLine>
            <Label fontWeight="bold">
              {taxName} (+{tax}%)
            </Label>
            <Span fontSize="LeadParagraph">+ {formatCurrency(amount * (tax / 100), currency)}</Span>
          </AmountLine>
          <StyledHr my={3} />
          <AmountLine>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.total" defaultMessage="TOTAL" />
            </Label>
            <Span fontWeight="bold" fontSize="LeadParagraph">
              {formatCurrency(amount * (1 + tax / 100), currency)}
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
  platformFee: PropTypes.number,
  /** Host fees, as an integer percentage */
  hostFee: PropTypes.number,
  /** Payment processor fee, as an integer percentage */
  paymentFee: PropTypes.number,
  /** Tax value, as an integer percentage */
  tax: PropTypes.number,
  /** Tax name, only required if a tax is applied */
  taxName: PropTypes.string,
};

ContributionBreakdown.defaultProps = {
  platformFee: 5,
  hostFee: 0,
  paymentFee: 0,
};

export default ContributionBreakdown;
