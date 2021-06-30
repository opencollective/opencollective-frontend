import React from 'react';
import PropTypes from 'prop-types';
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

const UpdateSearchFilter = ({ searchTerm, onChange }) => {
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
          onSubmit={onChange}
        />
      </SearchFormContainer>
    </Container>
  );
};

UpdateSearchFilter.propTypes = {
  searchTerm: PropTypes.string,
  onChange: PropTypes.func,
};

export default React.memo(UpdateSearchFilter);
