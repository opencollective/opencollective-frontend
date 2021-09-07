import React from 'react';
import PropTypes from 'prop-types';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import StyledCard from '../../StyledCard';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';

const Messages = defineMessages({
  heading: {
    id: 'TotalMoneyManagedSection.heading',
    defaultMessage: 'Total Money Managed',
  },
  subHeading: {
    id: 'TotalMoneyManagedSection.subHeading',
    defaultMessage: 'My Organization and My Collectives',
  },
  totalAmountHeld: {
    id: 'TotalMoneyManagedSection.totalAmountHeld',
    defaultMessage: 'Total amount held in your bank account for the Host and its Collectives',
  },
  titleDescription: {
    id: 'TotalMoneyManagedSection.titleTooltip',
    defaultMessage: 'Total amount held in your bank account for the Host and its Collectives.',
  },
});

const FundAmounts = styled.div`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background-color: #9a7bf1;
  border-right: 350px solid #46347f;

  @media (max-width: 750px) {
    height: 130px;
    background-color: #9a7bf1;
    border-right: 0px;
    border-bottom: 40px solid #46347f;
  }
`;

const TotalFundsLabel = styled.div`
  width: 210px;
  height: 26px;
  border-radius: 5px;
  background-color: white;
  opacity: 80%;
  vertical-align: center;
`;

const TotalMoneyManagedSection = ({
  currentAmount,
  projectedAmount,
  totalCollectiveFunds,
  totalHostFunds,
  currency,
}) => {
  const intl = useIntl();
  return (
    <StyledCard borderColor="#46347F">
      <Container pl={27} pr={24} pt={16} pb={16} backgroundColor="#F6F5FF">
        <P minHeight="16px" fontSize="12px" fontWeight="500" lineHeight="16px" textTransform="uppercase">
          <Dollar size={14} color="#1300AB" />
          {intl.formatMessage(Messages.heading)}
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
            Projected
          </Span>
        </Flex>
        <P minHeight="12px" fontSize="11px" fontWeight="700" lineHeight="12px" textTransform="uppercase">
          <Span style={{ verticalAlign: 'middle' }}>{intl.formatMessage(Messages.subHeading)}</Span>
          <Span ml={1}>
            <StyledTooltip content={() => intl.formatMessage(Messages.titleDescription)}>
              <InfoCircle size={14} />
            </StyledTooltip>
          </Span>
        </P>
        <Container mt={18} mb={12}>
          <FundAmounts>
            {/* TODO: Align the items */}
            {/* <TotalFundsLabel>*/}
            {/*  {`${formatCurrency(totalCollectiveFunds, currency)} | My Collectives`}*/}
            {/* </TotalFundsLabel>*/}
            {/* <TotalFundsLabel>*/}
            {/*  {formatCurrency(totalHostFunds, currency)}*/}
            {/* </TotalFundsLabel>*/}
          </FundAmounts>
        </Container>
        <P minHeight="18px" fontSize="12px" fontWeight="400" lineHeight="18px" pt={12} pb={16}>
          {intl.formatMessage(Messages.titleDescription)}
        </P>
      </Container>
    </StyledCard>
  );
};

TotalMoneyManagedSection.propTypes = {
  currentAmount: PropTypes.number,
  projectedAmount: PropTypes.number,
  totalCollectiveFunds: PropTypes.number,
  totalHostFunds: PropTypes.number,
  currency: PropTypes.string,
};

export default TotalMoneyManagedSection;
