import React from 'react';
import PropTypes from 'prop-types';

import { Box, Flex } from '../Grid';

import UpdateOrderByFilter from './filters/UpdateOrderByFilter';
import UpdateSearchFilter from './filters/UpdateSearchFilter';

const UpdateFilters = ({ values, onChange }) => {
  const getFilterProps = name => ({
    inputId: `updates-filter-${name}`,
    value: values?.[name],
    onChange: value => {
      onChange({ ...values, [name]: value === 'ALL' ? null : value });
    },
  });

  return (
    <Flex flexWrap="wrap" gap="16px">
      <Box flex="1 0 150px">
        <UpdateOrderByFilter {...getFilterProps('orderBy')} />
      </Box>
      <Box flex="10 0 250px">
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
