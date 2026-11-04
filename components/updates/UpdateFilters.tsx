import React from 'react';

import { Box, Flex } from '../Grid';

import UpdateOrderByFilter from './filters/UpdateOrderByFilter';
import UpdateSearchFilter from './filters/UpdateSearchFilter';

type UpdateFiltersProps = {
  values?: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
};

const UpdateFilters = ({ values, onChange }: UpdateFiltersProps) => {
  // Both filters receive the same props; each one only consumes the relevant ones (see PLAN.md)
  const getFilterProps = (
    name: string,
  ): {
    inputId: string;
    value: string;
    onChange: (value: string) => void;
  } => ({
    inputId: `updates-filter-${name}`,
    value: values?.[name] as string,
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

export default React.memo(UpdateFilters);
