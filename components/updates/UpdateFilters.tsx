import React from 'react';

import { Box, Flex } from '../Grid';

import UpdateOrderByFilter from './filters/UpdateOrderByFilter';
import UpdateSearchFilter from './filters/UpdateSearchFilter';

type UpdateFiltersProps = {
  values?: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
};

const UpdateFilters = ({ values, onChange }: UpdateFiltersProps) => {
  const getOrderByFilterProps = (): {
    value: string;
    onChange: (value: string) => void;
  } => ({
    value: values?.orderBy as string,
    onChange: value => {
      onChange({ ...values, orderBy: value === 'ALL' ? null : value });
    },
  });

  const getSearchFilterProps = (): {
    searchTerm?: string;
    onChange: (searchTerm: string) => void;
  } => ({
    searchTerm: values?.searchTerm as string,
    onChange: searchTerm => {
      onChange({ ...values, searchTerm });
    },
  });

  return (
    <Flex flexWrap="wrap" gap="16px">
      <Box flex="1 0 150px">
        <UpdateOrderByFilter {...getOrderByFilterProps()} />
      </Box>
      <Box flex="10 0 250px">
        <UpdateSearchFilter {...getSearchFilterProps()} />
      </Box>
    </Flex>
  );
};

export default React.memo(UpdateFilters);
