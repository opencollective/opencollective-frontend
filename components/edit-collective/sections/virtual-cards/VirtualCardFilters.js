import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../../../Container';
import { Box, Flex } from '../../../Grid';
import RequestVirtualCardBtn from '../../../RequestVirtualCardBtn';
import StyledButton from '../../../StyledButton';

import CollectiveFilter from './filters/CollectiveFilter';
import MerchantFilter from './filters/MerchantFilter';
import StatusFilter from './filters/StatusFilter';

const FilterContainer = styled(Box)`
  margin-bottom: 8px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

const VirtualCardFilters = ({
  filters,
  onChange,
  virtualCardMerchants,
  isCollectiveFilter,
  virtualCardCollectives,
  collective,
  host,
}) => {
  const allowRequestVirtualCard = get(host, 'settings.virtualcards.requestcard');

  const getFilterProps = name => {
    return {
      inputId: `virtual-cards-filter-${name}`,
      value: filters?.[name],
      onChange: value => {
        onChange({ ...filters, [name]: value === 'ALL' ? null : value });
      },
    };
  };

  const filterWidth = allowRequestVirtualCard ? 0.34 : 0.49;

  return (
    <Container>
      {isCollectiveFilter && (
        <FilterContainer mr={[0, '8px']} mb={['8px', 0]}>
          <FilterLabel htmlFor="virtual-card-filter-collective">
            <FormattedMessage id="VirtualCard.Collective" defaultMessage="Filter" />
          </FilterLabel>
          <CollectiveFilter
            {...getFilterProps('collectiveAccountIds')}
            virtualCardCollectives={virtualCardCollectives}
          />
        </FilterContainer>
      )}
      <Flex flexWrap="wrap">
        <FilterContainer mr={[0, '8px']} mb={['8px', 0]} width={[1, filterWidth]}>
          <FilterLabel htmlFor="virtual-card-filter-status">
            <FormattedMessage id="VirtualCard.Status" defaultMessage="Status" />
          </FilterLabel>
          <StatusFilter {...getFilterProps('state')} />
        </FilterContainer>
        <FilterContainer mr={[0, '8px']} mb={['8px', 0]} width={[1, filterWidth]}>
          <FilterLabel htmlFor="virtual-card-filter-amount">
            <FormattedMessage id="VirtualCard.Merchant" defaultMessage="Merchant" />
          </FilterLabel>
          <MerchantFilter {...getFilterProps('merchant')} virtualCardMerchants={virtualCardMerchants} />
        </FilterContainer>
        {allowRequestVirtualCard && (
          <RequestVirtualCardBtn collective={collective} host={host}>
            {btnProps => (
              <StyledButton m={3} {...btnProps} width={[1, 1 / 4]}>
                <FormattedMessage id="VirtualCards.RequestCardButton" defaultMessage="Request card" />
              </StyledButton>
            )}
          </RequestVirtualCardBtn>
        )}
      </Flex>
    </Container>
  );
};

VirtualCardFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  virtualCardMerchants: PropTypes.array,
  virtualCardCollectives: PropTypes.array,
  isCollectiveFilter: PropTypes.bool,
  host: PropTypes.object,
  collective: PropTypes.object,
};

export default React.memo(VirtualCardFilters);
