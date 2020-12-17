import React from 'react';
import PropTypes from 'prop-types';
import { SliderAlt } from '@styled-icons/boxicons-regular/SliderAlt';
import { defineMessages, FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { HOST_FEE_STRUCTURE } from '../../lib/constants/host-fee-structure';
import { getCurrencySymbol } from '../../lib/currency-utils';
import { formatHostFeeStructure } from '../../lib/i18n/host-fee-structure';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import StyledRoundButton from '../StyledRoundButton';
import { P, Span } from '../Text';

import AddFundsModal from './AddFundsModal';
import CollectiveFeesStructureModal from './CollectiveFeesStructureModal';

const msg = defineMessages({
  addFunds: {
    id: 'menu.addFunds',
    defaultMessage: 'Add Funds',
  },
  feeStructure: {
    id: 'FeeStructure',
    defaultMessage: 'Fee structure',
  },
});

const SectionTitle = props => (
  <Flex alignItems="center" mb={1}>
    <P
      textTransform="uppercase"
      fontSize="9px"
      lineHeight="14px"
      fontWeight="600"
      color="black.500"
      letterSpacing="0.6px"
      {...props}
    />
    <StyledHr borderColor="black.300" flex="1" ml={3} />
  </Flex>
);

const PlusIcon = styled.div`
  position: absolute;
  background: white;
  border-radius: 100%;
  width: 12px;
  height: 12px;
  font-size: 14px;
  left: 20px;
  top: -3px;
  color: ${props => props.theme.colors.green[600]};
`;

export const BoldMsg = msg => (
  <Span color="black.900" fontWeight="bold" fontSize="14px">
    {msg}
  </Span>
);

const HostAdminCollectiveCard = ({ since, collective, host, ...props }) => {
  const intl = useIntl();
  const [currentModal, setCurrentModal] = React.useState(null);
  const balance = collective.stats.balance.valueInCents || 0;
  const nbFinancialContributors = collective.totalFinancialContributors || 0;
  return (
    <StyledCollectiveCard collective={collective} bodyHeight={320} {...props}>
      <Box px={3} mb={16}>
        <Container mb={22} lineHeight="19px" color="black.600">
          <P mb={2} fontSize="12px">
            <FormattedMessage
              id="FinancialContributorsCountWithBold"
              defaultMessage="<bold>{count}</bold> {count, plural, one {financial contributor} other {financial contributors} }"
              values={{ count: nbFinancialContributors, bold: BoldMsg }}
            />
          </P>
          <P fontSize="12px">
            <FormattedMessage
              id="AmountBalance"
              defaultMessage="{amount} balance"
              values={{
                amount: (
                  <Span fontSize="14px">
                    <FormattedMoneyAmount
                      amount={balance}
                      currency={collective.currency}
                      currencyCodeStyles={{ color: 'black.900', fontWeight: 'bold' }}
                    />
                  </Span>
                ),
              }}
            />
          </P>
        </Container>
        <SectionTitle>
          <FormattedMessage id="FeeStructure" defaultMessage="Fee structure" />
        </SectionTitle>
        <P fontSize="12px" lineHeight="18px" color="black.800" mb={3}>
          {formatHostFeeStructure(intl, collective.hostFeesStructure)}
          {collective.hostFeesStructure === HOST_FEE_STRUCTURE.CUSTOM_FEE && ` (${collective.hostFeePercent}%)`}
        </P>
        <SectionTitle>
          <FormattedMessage id="HostingSince" defaultMessage="Hosting since" />
        </SectionTitle>
        <P fontSize="12px" lineHeight="18px" color="black.800">
          <FormattedDate value={since} day="numeric" month="long" year="numeric" />
        </P>
        <Container display="flex" alignItems="center" position="relative" mt={20}>
          <StyledRoundButton
            buttonStyle="successSecondary"
            size={32}
            fontSize="16px"
            onClick={() => setCurrentModal('addFunds')}
            title={intl.formatMessage(msg.addFunds)}
          >
            {getCurrencySymbol(collective.currency)}
            <PlusIcon>+</PlusIcon>
          </StyledRoundButton>
          <StyledRoundButton
            ml={2}
            size={32}
            onClick={() => setCurrentModal('feesStructure')}
            title={intl.formatMessage(msg.feeStructure)}
          >
            <SliderAlt size={14} color="#9D9FA3" />
          </StyledRoundButton>
        </Container>
      </Box>
      {currentModal === 'addFunds' && (
        <AddFundsModal show collective={collective} host={host} onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'feesStructure' && (
        <CollectiveFeesStructureModal collective={collective} host={host} onClose={() => setCurrentModal(null)} />
      )}
    </StyledCollectiveCard>
  );
};

HostAdminCollectiveCard.propTypes = {
  since: PropTypes.string,
  host: PropTypes.object,
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    hostFeesStructure: PropTypes.oneOf([null, ...Object.values(HOST_FEE_STRUCTURE)]),
    hostFeePercent: PropTypes.number,
    totalFinancialContributors: PropTypes.number,
    stats: PropTypes.shape({
      balance: PropTypes.shape({
        valueInCents: PropTypes.number,
      }),
    }),
  }).isRequired,
};

export default HostAdminCollectiveCard;
