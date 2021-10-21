import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { find, sortBy, uniqBy } from 'lodash';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import Container from '../../../../Container';
import StyledRadioList from '../../../../StyledRadioList';
import StyledSelect from '../../../../StyledSelect';

const CollectiveFilter = ({ onChange, virtualCardCollectives }) => {
  const intl = useIntl();
  const router = useRouter();
  const { collectiveAccountIds } = router.query;
  const [isAllCollectives, setIsAllCollectives] = useState(!collectiveAccountIds);
  const collectiveFilters = [
    intl.formatMessage({
      id: 'VirtualCards.CollectiveFilter.AllCollectives',
      defaultMessage: 'All Collectives',
    }),
    intl.formatMessage({
      id: 'VirtualCards.CollectiveFilter.SpecificCollectives',
      defaultMessage: 'Specific Collective(s)',
    }),
  ];

  const getAllCollectives = () => {
    return sortBy(uniqBy(virtualCardCollectives, 'legacyId'), 'name').map(collective => {
      return {
        label: collective.name,
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
      <StyledRadioList
        id="virtual-cards-collective-filter"
        name="virtual-cards-collective-filter"
        options={collectiveFilters}
        defaultValue={isAllCollectives ? collectiveFilters[0] : collectiveFilters[1]}
        labelProps={{ width: null, mr: 2, mt: 2 }}
        onChange={({ value }) => {
          if (value === 'All hosted collectives') {
            onChange(undefined);
            setIsAllCollectives(true);
          } else {
            setIsAllCollectives(false);
          }
        }}
      />
      {!isAllCollectives && (
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
      )}
    </Container>
  );
};

CollectiveFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  virtualCardCollectives: PropTypes.array,
};

export default CollectiveFilter;
