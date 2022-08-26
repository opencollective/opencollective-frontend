import React from 'react';
import PropTypes from 'prop-types';
import { find, sortBy, uniqBy } from 'lodash';
import { useRouter } from 'next/router';

import Container from '../../../../Container';
import StyledSelect from '../../../../StyledSelect';

const CollectiveFilter = ({ onChange, virtualCardCollectives }) => {
  const router = useRouter();
  const { collectiveAccountIds } = router.query;

  const getAllCollectives = () => {
    return sortBy(uniqBy(virtualCardCollectives, 'legacyId'), 'name').map(collective => {
      const label = collective.parentAccount
        ? `${collective.parentAccount.name} - ${collective.name}`
        : collective.name;
      return {
        label,
        value: String(collective.legacyId),
      };
    });
  };

  const findCollectiveFilters = () => {
    return collectiveAccountIds
      ?.split(',')
      .map(collectiveAccountId => find(getAllCollectives(), { value: collectiveAccountId }));
  };

  return (
    <Container>
      <StyledSelect
        inputId="virtual-card-collective-picker"
        isMulti={true}
        useCompactMode
        options={getAllCollectives()}
        value={findCollectiveFilters()}
        onChange={selectedValues => {
          let selectedValuesString = '';
          selectedValues?.forEach(
            selectedValue => (selectedValuesString = `${selectedValue.value},${selectedValuesString}`),
          );
          onChange(selectedValuesString.slice(0, -1));
        }}
      />
    </Container>
  );
};

CollectiveFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  virtualCardCollectives: PropTypes.array,
};

export default CollectiveFilter;
