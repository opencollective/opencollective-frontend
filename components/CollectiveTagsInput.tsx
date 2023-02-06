import React, { Fragment, MouseEventHandler, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import debouncePromise from 'debounce-promise';
import AnimateHeight from 'react-animate-height';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  components as ReactSelectComponents,
  ContainerProps,
  InputProps,
  MultiValueGenericProps,
  MultiValueProps,
  OnChangeValue,
  OptionProps,
  Props,
} from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import {
  SortableContainer,
  SortableContainerProps,
  SortableElement,
  SortableHandle,
  SortEndHandler,
} from 'react-sortable-hoc';
import styled from 'styled-components';

import { IGNORED_TAGS } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import colors from '../lib/theme/colors';
import withData from '../lib/withData';

import { Flex } from './Grid';
import { Span } from './Text';

const StyledTagButton = styled.button<{ isSelected: boolean }>`
  border-radius: 2px 12px 12px 2px;
  padding: 3px 10px 3px 6px;
  color: black.700;
  background: #f0f2f5;
  font-size: 12px;
  border: 0;
  cursor: pointer;
  opacity: ${props => (props.isSelected ? '25%' : '100%')};
  transition: opacity 0.1s;
  &:focus {
    outline: none;
  }
`;

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

export type TagOption = {
  label: string;
  value: string;
};

// Sorting logic from https://react-select.com/advanced#sortable-multiselect
function arrayMove<T>(array: readonly T[], from: number, to: number) {
  const slicedArray = array.slice();
  slicedArray.splice(to < 0 ? array.length + to : to, 0, slicedArray.splice(from, 1)[0]);
  return slicedArray;
}

const SortableSelect = SortableContainer(AsyncCreatableSelect) as React.ComponentClass<Props & SortableContainerProps>;

const SortableMultiValue = SortableElement((props: MultiValueProps<TagOption>) => {
  // This prevents the menu from being opened/closed when the user clicks
  // on a value to begin dragging it
  const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const innerProps = { ...props.innerProps, onMouseDown };
  return <ReactSelectComponents.MultiValue {...props} innerProps={innerProps} />;
});

const SortableMultiValueLabel = SortableHandle((props: MultiValueGenericProps) => (
  <ReactSelectComponents.MultiValueLabel {...props} />
));

const Input = (props: InputProps) => {
  return <ReactSelectComponents.Input {...props} data-cy={'tags-select-input'} />;
};

const Option = ({ innerProps, ...props }: OptionProps) => {
  return (
    <ReactSelectComponents.Option
      {...props}
      innerProps={
        {
          ...innerProps,
          'data-cy': `tags-select-option-${props.data['value']}`,
        } as React.HTMLProps<HTMLDivElement>
      }
    />
  );
};

const SelectContainer = ({ innerProps, ...props }: ContainerProps) => (
  <ReactSelectComponents.SelectContainer
    {...props}
    innerProps={{ ...innerProps, 'data-cy': 'tags-select' } as React.HTMLProps<HTMLDivElement>}
  />
);

function CollectiveTagsInput({ defaultValue = [], onChange, client, suggestedTags = [] }) {
  const intl = useIntl();
  const [selected, setSelected] = useState<readonly TagOption[]>(
    defaultValue?.map(tag => ({ label: tag, value: tag })) || [],
  );

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
      const tags = data.tagStats.nodes
        .filter(({ tag }) => !IGNORED_TAGS.includes(tag))
        .map(({ tag }) => ({
          label: tag,
          value: tag,
        }));
      return tags;
    }
    return [];
  };

  const debouncedFetchTags = debouncePromise(fetchTags, 500, { leading: true });

  return (
    <Fragment>
      <SortableSelect
        useDragHandle
        // cacheOptions
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
        menuPortalTarget={document.body}
        components={{
          // @ts-ignore We're failing to provide a required index prop to SortableElement
          MultiValue: SortableMultiValue,
          // @ts-ignore We're failing to provide a required index prop to SortableElement
          MultiValueLabel: SortableMultiValueLabel,
          SelectContainer,
          Input,
          Option,
        }}
        defaultOptions
        loadOptions={inputValue => debouncedFetchTags(inputValue)}
        onChange={(selectedOptions: OnChangeValue<TagOption, true>) => setSelected(selectedOptions)}
        styles={{
          multiValue: baseStyles => ({
            ...baseStyles,
            borderRadius: '2px 12px 12px 2px',
            background: colors.black[100],
            overflow: 'hidden',
            zIndex: 9999,
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
          menuPortal: styles => ({ ...styles, zIndex: 9999 }),
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
      <AnimateHeight height={suggestedTags?.length > 0 ? 'auto' : 0}>
        <Flex mt={2} gap={'6px'} flexWrap="wrap" alignItems={'center'}>
          {suggestedTags && (
            <Span color="black.600" mr={1}>
              <FormattedMessage defaultMessage="Popular tags:" />
            </Span>
          )}

          {suggestedTags?.map(tag => {
            const isSelected = selected.some(({ value }) => value === tag);
            return (
              <StyledTagButton
                type="button"
                tabIndex={-1}
                key={tag}
                isSelected={isSelected}
                onClick={() =>
                  isSelected
                    ? setSelected(selected.filter(({ value }) => value !== tag))
                    : setSelected([...selected, { value: tag, label: tag }])
                }
              >
                {tag}
              </StyledTagButton>
            );
          })}
        </Flex>
      </AnimateHeight>
    </Fragment>
  );
}

CollectiveTagsInput.propTypes = {
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  renderUpdatedTags: PropTypes.bool,
  onChange: PropTypes.func,
  client: PropTypes.object,
};

export default withData(CollectiveTagsInput);
