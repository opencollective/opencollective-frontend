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

const HostAdminCollectiveFilters = ({ filters, onChange }) => {
  const getFilterProps = name => ({
    inputId: `collectives-filter-${name}`,
    value: filters?.[name],
    onChange: value => {
      onChange({ ...filters, [name]: value === 'ALL' ? null : value });
    },
  });

  return (
    <Grid gridGap={18} gridTemplateColumns={['1fr', '1fr 1fr']} maxWidth={400}>
      <div>
        <FilterLabel htmlFor="collectives-filter-sort-by">
          <FormattedMessage id="SortBy" defaultMessage="Sort by" />
        </FilterLabel>
        <CollectiveSortByFilter {...getFilterProps('sort-by')} />
      </div>
      <div>
        <FilterLabel htmlFor="collectives-filter-fees-structure">
          <FormattedMessage id="FeeStructure" defaultMessage="Fee structure" />
        </FilterLabel>
        <CollectiveHostFeeStructureFilter {...getFilterProps('fees-structure')} />
      </div>
    </Grid>
  );
};

HostAdminCollectiveFilters.propTypes = {
  filters: PropTypes.object,
  onChange: PropTypes.func,
};

export default HostAdminCollectiveFilters;
