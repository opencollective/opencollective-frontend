import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { TransactionTypes } from '../../lib/constants/transactions';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { renderDetailsString, saveInvoice } from '../../lib/transactions';

import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';

const DetailTitle = styled.p`
  margin: 8px 8px 4px 8px;
  color: #76777a;
  font-weight: 500;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 9px;
`;

const DetailDescription = styled.div`
  margin: 0 8px 8px 8px;
  font-size: 12px;
  color: #4e5052;
  letter-spacing: -0.04px;
`;

const DetailsContainer = styled(Flex)`
  background: #f7f8fa;
  font-size: 12px;
  padding: 16px 24px;

  ${props =>
    props.isCompact &&
    css`
      padding: 16px 24px 16px 24px;
    `}

  @media (max-width: 40em) {
    padding: 8px;
  }
`;

const TransactionDetails = ({
  canDownloadInvoice,
  type,
  isRefunded,
  toAccount,
  uuid,
  order,
  platformFee,
  hostFee,
  paymentMethod,
  paymentProcessorFee,
  amount,
  netAmount,
}) => {
  const intl = useIntl();
  const isCredit = type === TransactionTypes.CREDIT;
  const { loading: loadingInvoice, callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice);

  const hasAccessToInvoice = canDownloadInvoice && uuid;
  const hasInvoiceBtn = hasAccessToInvoice && !isRefunded && !isCredit && order;

  return (
    <DetailsContainer flexWrap="wrap" alignItems="flex-start">
      {(toAccount.host || paymentMethod) && (
        <Flex flexDirection="column" width={[1, 0.4]}>
          {toAccount.host && (
            <Box>
              <DetailTitle>
                <FormattedMessage id="Member.Role.FISCAL_HOST" defaultMessage="Fiscal Host" />
              </DetailTitle>
              <DetailDescription>
                <StyledLink as={LinkCollective} collective={toAccount.host} colorShade={600} />
              </DetailDescription>
            </Box>
          )}
          {paymentMethod && (
            <Box>
              <DetailTitle>
                <FormattedMessage id="PaidWith" defaultMessage="Paid With" />
              </DetailTitle>
              <DetailDescription>
                <PaymentMethodTypeWithIcon type={paymentMethod.type} fontSize={11} iconSize={16} />
              </DetailDescription>
            </Box>
          )}
        </Flex>
      )}
      <Flex flexDirection="column" width={[1, 0.4]}>
        <Box>
          <DetailTitle>
            <FormattedMessage id="transaction.details" defaultMessage="transaction details" />
          </DetailTitle>
          <DetailDescription>
            {renderDetailsString({
              amount,
              platformFee,
              hostFee,
              paymentProcessorFee,
              netAmount,
              isCredit,
              isRefunded,
              toAccount,
              intl,
            })}
          </DetailDescription>
          {hasInvoiceBtn && (
            <StyledButton
              buttonSize="small"
              loading={loadingInvoice}
              onClick={downloadInvoiceWith({ transactionUuid: uuid, toCollectiveSlug: toAccount.slug })}
              minWidth={140}
              background="transparent"
            >
              <FormattedMessage id="DownloadInvoice" defaultMessage="Download invoice" />
            </StyledButton>
          )}
        </Box>
      </Flex>
    </DetailsContainer>
  );
};

TransactionDetails.propTypes = {
  /** If true, a button to download invoice will be displayed when possible */
  canDownloadInvoice: PropTypes.bool,
  isRefunded: PropTypes.bool,
  fromAccount: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
  }).isRequired,
  toAccount: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    host: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
  }),
  order: PropTypes.shape({
    id: PropTypes.number,
    status: PropTypes.string,
  }),
  uuid: PropTypes.string,
  type: PropTypes.string,
  currency: PropTypes.string,
  description: PropTypes.string,
  createdAt: PropTypes.string,
  taxAmount: PropTypes.number,
  paymentMethod: PropTypes.shape({
    type: PropTypes.string,
  }),
  amount: PropTypes.shape({
    valueInCents: PropTypes.number,
    currency: PropTypes.string,
  }),
  netAmount: PropTypes.shape({
    valueInCents: PropTypes.number,
    currency: PropTypes.string,
  }),
  platformFee: PropTypes.shape({
    valueInCents: PropTypes.number,
    currency: PropTypes.string,
  }),
  paymentProcessorFee: PropTypes.shape({
    valueInCents: PropTypes.number,
    currency: PropTypes.string,
  }),
  hostFee: PropTypes.shape({
    valueInCents: PropTypes.number,
    currency: PropTypes.string,
  }),
  usingVirtualCardFromCollective: PropTypes.object,
};

export default TransactionDetails;
