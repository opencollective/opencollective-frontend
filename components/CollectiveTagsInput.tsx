import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { useIntl } from 'react-intl';
import {
  components as ReactSelectComponents,
  InputProps,
  MultiValueGenericProps,
  MultiValueProps,
  OptionProps,
} from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { SortableContainer, SortableElement, SortableHandle, SortEndHandler } from 'react-sortable-hoc';

import { IGNORED_TAGS } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import colors from '../lib/theme/colors';
import withData from '../lib/withData';

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

// Sorting logic from https://react-select.com/advanced#sortable-multiselect
function arrayMove<T>(array: readonly T[], from: number, to: number) {
  const slicedArray = array.slice();
  slicedArray.splice(to < 0 ? array.length + to : to, 0, slicedArray.splice(from, 1)[0]);
  return slicedArray;
}

const SortableMultiValue = SortableElement((props: MultiValueProps) => {
  // This prevents the menu from being opened/closed when the user clicks
  // on a value to begin dragging it
  const onMouseDown = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const innerProps = { ...props.innerProps, onMouseDown };
  return <ReactSelectComponents.MultiValue {...props} innerProps={innerProps} />;
});

const SortableMultiValueLabel = SortableHandle((props: MultiValueGenericProps) => (
  <ReactSelectComponents.MultiValueLabel {...props} />
));

const SortableSelect = SortableContainer(AsyncCreatableSelect);

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

function CollectiveTagsInput({ defaultValue = [], onChange, client }) {
  const intl = useIntl();
  const [selected, setSelected] = useState(defaultValue.map(tag => ({ label: tag, value: tag })) || []);

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  const onSortEnd: SortEndHandler = ({ oldIndex, newIndex }) => {
    const newValue = arrayMove(selected, oldIndex, newIndex);
    setSelected(newValue);
  };

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
    <SortableSelect
      useDragHandle
      // react-sortable-hoc props:
      axis="xy"
      onSortEnd={onSortEnd}
      distance={0}
      // small fix for https://github.com/clauderic/react-sortable-hoc/pull/352:
      getHelperDimensions={({ node }) => node.getBoundingClientRect()}
      // react-select props:
      openMenuOnFocus
      placeholder={intl.formatMessage({ id: 'collective.tags.input.placeholder', defaultMessage: '+ Add tags' })}
      isMulti
      value={selected}
      components={{
        MultiValue: SortableMultiValue,
        MultiValueLabel: SortableMultiValueLabel,
        Input,
        Option,
      }}
      defaultOptions={true}
      loadOptions={fetchTags}
      onChange={selectedOptions => setSelected(selectedOptions)}
      data-cy="tags-select"
      styles={{
        multiValue: baseStyles => ({
          ...baseStyles,
          borderRadius: '2px 12px 12px 2px',
          overflow: 'hidden',
        }),
        multiValueLabel: baseStyles => ({
          ...baseStyles,
          cursor: 'grab',
        }),
        multiValueRemove: (baseStyles, state) => ({
          ...baseStyles,
          color: state.isFocused ? colors.black[900] : colors.black[600],
          backgroundColor: state.isFocused ? colors.black[400] : 'transparent',
          borderRadius: 0,
          paddingLeft: '3px',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: colors.black[400],
            color: colors.black[900],
          },
        }),
        control: (baseStyles, state) => ({
          ...baseStyles,
          boxShadow: `inset 0px 2px 2px ${colors.primary[50]}`,
          borderColor: state.isFocused ? colors.primary[500] : colors.black[300],
          '&:hover': {
            borderColor: state.isFocused ? colors.primary[500] : colors.primary[300],
          },
        }),
      }}
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
