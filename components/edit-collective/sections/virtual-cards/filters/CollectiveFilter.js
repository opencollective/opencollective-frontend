import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import StyledRadioList from "../../../../StyledRadioList";
import Container from "../../../../Container";
import StyledSelect from "../../../../StyledSelect";
import {uniqBy} from "lodash";

const CollectiveFilter = ({ onChange, value, virtualCardCollectives }) => {
  const intl = useIntl();
  const [isAllCollectives, setIsAllCollectives] = useState(true);
  const collectiveFilters =[
    intl.formatMessage({id: 'VirtualCards.CollectiveFilter.AllCollectives', defaultMessage: "All hosted collectives"}),
    intl.formatMessage({id: 'VirtualCards.CollectiveFilter.SpecificCollectives', defaultMessage: "Specific collectives"}),
  ];

  const getAllCollectives = () => {
    return uniqBy(virtualCardCollectives, "slug").map(collective => {
      return {
        label: collective.name,
        value: collective.slug
      }});
  }

   return (
    <Container>
      <StyledRadioList
        id="virtual-cards-collective-filter"
        name="virtual-cards-collective-filter"
        options={collectiveFilters}
        defaultValue={collectiveFilters[0]}
        labelProps={{ width: null, mr: 2, mt:2 }}
        onChange={({ value }) => {
          setIsAllCollectives(value === 'All hosted collectives');
        }}
      />
      {!isAllCollectives &&
        <StyledSelect
          isMulti={true}
          options={getAllCollectives()}
          onChange={(selectedValues) => {
            onChange(selectedValues)
          }}
        />
      }
    </Container>
  );
};

CollectiveFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default CollectiveFilter;
