import React from 'react';
import PropTypes from 'prop-types';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency, getCurrencySymbol } from '../../../lib/currency-utils';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import StyledCard from '../../StyledCard';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';

const FundAmounts = styled.div`
  height: 48px;
  border-radius: 10px;
  padding-top: 10px;
  padding-left: 5px;
  background: linear-gradient(to right, #9a7bf1 50%, #46347f 50%);

  @media (max-width: 832px) {
    height: 130px;
    border-right: 0px;
    background: linear-gradient(to bottom, #9a7bf1 50%, #46347f 50%);
  }
`;

const TotalFundsLabel = styled(Container)`
  font-size: 12px;
  display: table-cell;
  padding-left: 10px;
  height: 26px;
  border-radius: 5px;
  background-color: white;
  opacity: 80%;
`;

const TotalMoneyManagedSection = ({ currency, hostMetrics }) => {
  const {
    totalMoneyManaged,
    pendingPlatformFees,
    pendingPlatformTips,
    pendingHostFeeShare,
    platformTips,
    hostFees,
    platformFees,
  } = hostMetrics;
  const currentAmount = totalMoneyManaged.valueInCents;
  const projectedAmount =
    totalMoneyManaged.valueInCents +
    pendingPlatformFees.valueInCents +
    pendingPlatformTips.valueInCents +
    pendingHostFeeShare.valueInCents;
  const totalCollectiveFunds =
    totalMoneyManaged.valueInCents - platformTips.valueInCents - platformFees.valueInCents - hostFees.valueInCents;
  const totalHostFunds = hostFees.valueInCents;
  return (
    <div>
      <Flex flexWrap="wrap" my={14} alignItems="baseline">
        <Span fontSize={18} fontWeight="500">
          {formatCurrency(currentAmount, currency)}
        </Span>
        <Span fontSize={15} fontWeight="500" lineHeight="20px" ml="8px" mr="8px">
          /
        </Span>
        <Span fontSize={15} fontWeight="500" lineHeight="25px">
          {formatCurrency(projectedAmount, currency)}
        </Span>
        <Span fontSize={12} fontWeight="500" lineHeight="27px" ml="8px">
          <FormattedMessage id="TotalMoneyManagedSection.projected" defaultMessage="Projected" />
        </Span>
      </Flex>
      <Container display="flex" fontSize="11px" fontWeight="700" lineHeight="12px" alignItems="center">
        <Span textTransform="uppercase">
          <FormattedMessage
            id="TotalMoneyManagedSection.subHeading"
            defaultMessage="My Organization and My initiatives"
          />
        </Span>
      </Container>
      <Container mt={18} mb={12}>
        <FundAmounts>
          <Flex flexWrap="wrap">
            <Box width={[1, 1, 1 / 2]} pl="8px">
              <TotalFundsLabel minWidth="210px" style={{ verticalAlign: 'middle' }}>
                <Span fontWeight="700">{formatCurrency(totalCollectiveFunds, currency)}</Span> |{' '}
                <FormattedMessage id="Collectives" defaultMessage="Collectives" />
              </TotalFundsLabel>
            </Box>
            <Box width={[1, 1, 1 / 2]} pt={['35px', '35px', 0]} pl="8px">
              <TotalFundsLabel minWidth="230px" style={{ verticalAlign: 'middle' }}>
                <Span fontWeight="700">{formatCurrency(totalHostFunds, currency)}</Span> |{' '}
                <FormattedMessage id="TotalMoneyManagedSection.hostOrganization" defaultMessage="Host Organization" />
              </TotalFundsLabel>
            </Box>
          </Flex>
        </FundAmounts>
      </Container>
      <P minHeight="18px" fontSize="12px" fontWeight="400" lineHeight="18px" pt={12} pb={16}>
        <FormattedMessage
          id="Host.Metrics.TotalMoneyManages.description"
          defaultMessage="Total amount held in your bank account for the Host and its Collectives."
        />
      </P>
    </div>
  );
};

TotalMoneyManagedSection.propTypes = {
  currency: PropTypes.string,
  hostMetrics: PropTypes.object,
};

export default TotalMoneyManagedSection;
