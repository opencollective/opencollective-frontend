import React from 'react';
import PropTypes from 'prop-types';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { Box } from '../../Grid';
import SearchBar from '../../SearchBar';

const FilterLabel = styled.label`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4e5052;
  margin-bottom: 10px;
`;

const SearchFormContainer = styled(Box)`
  width: 100%;
  min-width: 10rem;
`;

const ROUTE_PARAMS = ['collectiveSlug', 'offset'];

const UpdateSearchFilter = () => {
  const router = useRouter() || {};
  const { collectiveSlug, searchTerm } = router.query;
  const updateFilters = queryParams => {
    return router.push({
      pathname: `/${collectiveSlug}/updates`,
      query: omitBy({ ...router.query, ...queryParams }, (value, key) => !value || ROUTE_PARAMS.includes(key)),
    });
  };

  return (
    <Container>
      <FilterLabel htmlFor="update-filter-search">
        <FormattedMessage id="Update.Search" defaultMessage="Search" />
      </FilterLabel>
      <SearchFormContainer>
        <SearchBar
          id="update-filter-search"
          placeholder="Search by user, title, html..."
          height="38px"
          defaultValue={searchTerm}
          onSubmit={searchTerm => updateFilters({ searchTerm, offset: null })}
        />
      </SearchFormContainer>
    </Container>
  );
};

UpdateSearchFilter.propTypes = {
  slug: PropTypes.string,
  query: PropTypes.object,
};

export default React.memo(UpdateSearchFilter);
