import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage, useIntl} from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../../../Grid';

import MerchantFilter from './filters/MerchantFilter';
import StatusFilter from './filters/StatusFilter';
import Container from "../../../Container";
import CollectiveFilter from "./filters/CollectiveFilter";

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

const VirtualCardFilters = ({ filters, onChange, virtualCardMerchants, isCollectiveFilter, virtualCardCollectives }) => {
  const getFilterProps = name => {
    if (name === 'collective') {

    }
    return {
      inputId: `virtual-cards-filter-${name}`,
      value: filters?.[name],
      onChange: value => {
        onChange({ ...filters, [name]: value === 'ALL' ? null : value });
      },
    };
  };

  return (
    <Container>
      { isCollectiveFilter &&
        <FilterContainer mr={[0, '8px']} mb={['8px', 0]} flexGrow={1}>
          <FilterLabel htmlFor="virtual-card-filter-collective">
            <FormattedMessage id="VirtualCard.Collective" defaultMessage="Collective" />
          </FilterLabel>
          <CollectiveFilter {...getFilterProps('collectiveAccounts')} virtualCardCollectives={virtualCardCollectives}/>
        </FilterContainer>
      }
      <Flex flexDirection={['column', 'row']} flexGrow={[1, 0.5]}>
        <FilterContainer mr={[0, '8px']} mb={['8px', 0]} flexGrow={1}>
          <FilterLabel htmlFor="virtual-card-filter-status">
            <FormattedMessage id="VirtualCard.Status" defaultMessage="Status" />
          </FilterLabel>
          <StatusFilter {...getFilterProps('state')} />
        </FilterContainer>
        <FilterContainer mr={[0, '8px']} mb={['8px', 0]} flexGrow={1}>
          <FilterLabel htmlFor="virtual-card-filter-amount">
            <FormattedMessage id="VirtualCard.Merchant" defaultMessage="Merchant" />
          </FilterLabel>
          <MerchantFilter {...getFilterProps('merchant')} virtualCardMerchants={virtualCardMerchants} />
        </FilterContainer>
      </Flex>
    </Container>
  );
};

VirtualCardFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  virtualCardMerchants: PropTypes.object,
};

export default React.memo(VirtualCardFilters);
