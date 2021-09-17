import React from 'react';
import PropTypes from 'prop-types';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import StyledCard from '../../StyledCard';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';

const FundAmounts = styled.div`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background-color: #9a7bf1;
  border-right: 350px solid #46347f;
  padding-top: 10px;
  padding-left: 5px;

  @media (max-width: 1025px) {
    height: 130px;
    background-color: #9a7bf1;
    border-right: 0px;
    border-bottom: 40px solid #46347f;
  }
`;

const TotalFundsLabel = styled(Container)`
  display: table-cell;
  padding-left: 10px;
  height: 26px;
  border-radius: 5px;
  background-color: white;
  opacity: 80%;
  vertical-align: middle;
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
    <StyledCard borderColor="#46347F">
      <Container pl={27} pr={24} pt={16} pb={16} backgroundColor="#F6F5FF">
        <P minHeight="16px" fontSize="12px" fontWeight="500" lineHeight="16px" textTransform="uppercase">
          <Dollar size={14} color="#1300AB" />
          <FormattedMessage id="Host.Metrics.TotalMoneyManages" defaultMessage="Total Money Managed" />
        </P>
        <Flex flexWrap="wrap" mt={12} mb={14}>
          <Span fontSize={18} fontWeight="500">
            {formatCurrency(currentAmount, currency)}
          </Span>
          <Span fontSize={17} fontWeight="500" lineHeight="20px" ml="8px" mr="8px">
            /
          </Span>
          <Span fontSize={15} fontWeight="500" lineHeight="25px">
            {formatCurrency(projectedAmount, currency)}
          </Span>
          <Span fontSize={12} fontWeight="500" lineHeight="27px" ml="8px">
            <FormattedMessage id="TotalMoneyManagedSection.projected" defaultMessage="Projected" />
          </Span>
        </Flex>
        <P minHeight="12px" fontSize="11px" fontWeight="700" lineHeight="12px" textTransform="uppercase">
          <Span style={{ verticalAlign: 'middle' }}>
            <FormattedMessage
              id="TotalMoneyManagedSection.subHeading"
              defaultMessage="My Organization and My Collectives"
            />
          </Span>
          <Span ml={1}>
            <StyledTooltip
              content={() => (
                <FormattedMessage
                  id="Host.Metrics.TotalMoneyManages.description"
                  defaultMessage="Total amount held in your bank account for the Host and its Collectives."
                />
              )}
            >
              <InfoCircle size={14} />
            </StyledTooltip>
          </Span>
        </P>
        <Container mt={18} mb={12}>
          <FundAmounts>
            <TotalFundsLabel minWidth="210px">
              <P>
                <Span fontWeight="700">{formatCurrency(totalCollectiveFunds, currency)}</Span> |{' '}
                <FormattedMessage id="pricingTable.row.collectives" defaultMessage="Collectives" />
              </P>
            </TotalFundsLabel>
            <TotalFundsLabel
              minWidth="230px"
              position="relative"
              left={['-210px', '-210px', '-210px', '320px']}
              top={['85px', '85px', '85px', '0px']}
            >
              <P>
                <Span fontWeight="700">{formatCurrency(totalHostFunds, currency)}</Span> |{' '}
                <FormattedMessage id="TotalMoneyManagedSection.hostOrganization" defaultMessage="Host Organization" />
              </P>
            </TotalFundsLabel>
          </FundAmounts>
        </Container>
        <P minHeight="18px" fontSize="12px" fontWeight="400" lineHeight="18px" pt={12} pb={16}>
          <FormattedMessage
            id="Host.Metrics.TotalMoneyManages.description"
            defaultMessage="Total amount held in your bank account for the Host and its Collectives."
          />
        </P>
      </Container>
    </StyledCard>
  );
};

TotalMoneyManagedSection.propTypes = {
  currency: PropTypes.string,
  hostMetrics: PropTypes.object,
};

export default TotalMoneyManagedSection;
