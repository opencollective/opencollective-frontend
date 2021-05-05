import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Grid } from '../Grid';

import CollectiveHostFeeStructureFilter from './admin-collective-filters/CollectiveHostFeeStructureFilter';
import CollectiveSortByFilter from './admin-collective-filters/CollectiveSortByFilter';

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

export const COLLECTIVE_FILTER = {
  SORT_BY: 'sort-by',
  FEE_STRUCTURE: 'fees-structure',
};

const HostAdminCollectiveFilters = ({ filters, values, onChange }) => {
  const getFilterProps = name => ({
    inputId: `collectives-filter-${name}`,
    value: values?.[name],
    onChange: value => {
      onChange({ ...values, [name]: value === 'ALL' ? null : value });
    },
  });

  return (
    <Grid gridGap={18} gridTemplateColumns={['1fr', '1fr 1fr']} maxWidth={400}>
      {filters.includes(COLLECTIVE_FILTER.SORT_BY) && (
        <div>
          <FilterLabel htmlFor="collectives-filter-sort-by">
            <FormattedMessage id="SortBy" defaultMessage="Sort by" />
          </FilterLabel>
          <CollectiveSortByFilter {...getFilterProps(COLLECTIVE_FILTER.SORT_BY)} />
        </div>
      )}
      {filters.includes(COLLECTIVE_FILTER.FEE_STRUCTURE) && (
        <div>
          <FilterLabel htmlFor="collectives-filter-fees-structure">
            <FormattedMessage id="FeeStructure" defaultMessage="Fee structure" />
          </FilterLabel>
          <CollectiveHostFeeStructureFilter {...getFilterProps(COLLECTIVE_FILTER.FEE_STRUCTURE)} />
        </div>
      )}
    </Grid>
  );
};

HostAdminCollectiveFilters.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.oneOf(Object.values(COLLECTIVE_FILTER))).isRequired,
  values: PropTypes.object,
  onChange: PropTypes.func,
};

export default HostAdminCollectiveFilters;
