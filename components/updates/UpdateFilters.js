import React from 'react';
import PropTypes from 'prop-types';

import { Box, Flex } from '../Grid';

import UpdateSearchFilter from './filters/UpdateSearchFilter';
import UpdateSortByFilter from './filters/UpdateSortByFilter';

const UpdateFilters = ({ values, onChange }) => {
  const getFilterProps = name => ({
    inputId: `updates-filter-${name}`,
    value: values?.[name],
    onChange: value => {
      onChange({ ...values, [name]: value === 'ALL' ? null : value });
    },
  });

  return (
    <Flex flexWrap="wrap">
      <Box width={[1, 1, 2 / 12]} mr={['none', '15px']}>
        <UpdateSortByFilter {...getFilterProps('sortBy')} />
      </Box>
      <Box width={[1, 1, '82%']}>
        <UpdateSearchFilter {...getFilterProps('searchTerm')} />
      </Box>
    </Flex>
  );
};

UpdateFilters.propTypes = {
  values: PropTypes.object,
  onChange: PropTypes.func,
};

export default React.memo(UpdateFilters);
