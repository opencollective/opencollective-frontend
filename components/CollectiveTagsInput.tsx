import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { useIntl } from 'react-intl';
import { components as ReactSelectComponents, InputProps, OptionProps } from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';

import { IGNORED_TAGS } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import colors from '../lib/theme/colors';
import withData from '../lib/withData';

import { customComponents } from './StyledSelect';

export const searchTagsQuery = gql`
  query SearchTags($term: String!) {
    tagStats(tagSearchTerm: $term) {
      nodes {
        id
        tag
      }
    }
  }
`;

const Input = (props: InputProps) => {
  return <ReactSelectComponents.Input {...props} data-cy={'tags-select-input'} />;
};

const Option = ({ innerProps, ...props }: OptionProps) => {
  return (
    <ReactSelectComponents.Option
      {...props}
      innerProps={{
        ...innerProps,
        'data-cy': `tags-select-option-${props.data['value']}`,
      }}
    />
  );
};

function CollectiveTagsInput({ defaultValue = [], onChange, client, ...props }) {
  const intl = useIntl();
  const fetchTags = async inputValue => {
    const { data } = await client.query({
      query: searchTagsQuery,
      variables: { term: inputValue },
      context: API_V2_CONTEXT,
    });

    if (data && data.tagStats.nodes) {
      return data.tagStats.nodes
        .filter(({ tag }) => !IGNORED_TAGS.includes(tag))
        .map(({ tag }) => ({
          label: tag,
          value: tag,
        }));
    }

    return [];
  };

  return (
    <AsyncCreatableSelect
      openMenuOnFocus
      placeholder={intl.formatMessage({ id: 'collective.tags.input.placeholder', defaultMessage: '+ Add tags' })}
      isMulti
      components={{
        MultiValue: customComponents.MultiValue,
        SelectContainer: customComponents.SelectContainer,
        Input,
        Option,
      }}
      defaultValue={defaultValue.map(tag => ({ label: tag, value: tag }))}
      defaultOptions={true}
      loadOptions={fetchTags}
      onChange={onChange}
      data-cy="tags-select"
      styles={{
        control: (baseStyles, state) => ({
          ...baseStyles,
          boxShadow: `inset 0px 2px 2px ${colors.primary[50]}`,
          borderColor: state.isFocused ? colors.primary[500] : colors.black[300],
          '&:hover': {
            borderColor: state.isFocused ? colors.primary[500] : colors.primary[300],
          },
        }),
      }}
      {...props}
    />
  );
}

CollectiveTagsInput.propTypes = {
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  renderUpdatedTags: PropTypes.bool,
  onChange: PropTypes.func,
  client: PropTypes.object,
};

export default withData(CollectiveTagsInput);
