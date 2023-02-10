import React, { Fragment, MouseEventHandler, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery } from '@apollo/client';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { debounce } from 'lodash';
import AnimateHeight from 'react-animate-height';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  components as ReactSelectComponents,
  ContainerProps,
  InputProps,
  MultiValueProps,
  OnChangeValue,
  OptionProps,
} from 'react-select';
import CreatableSelect from 'react-select/creatable';

import { IGNORED_TAGS } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import colors from '../lib/theme/colors';

import { Flex } from './Grid';
import StyledTag from './StyledTag';
import { Span } from './Text';

export const searchTagsQuery = gql`
  query SearchTags($term: String) {
    tagStats(tagSearchTerm: $term) {
      nodes {
        id
        tag
      }
    }
  }
`;

type TagOption = {
  label: string;
  value: string;
};

const MultiValue = (props: MultiValueProps<TagOption>) => {
  // This prevents the menu from being opened/closed when the user clicks
  // on a value to begin dragging it
  const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.data.value,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? '0.4' : undefined,
  };

  return (
    <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
      <StyledTag
        m="4px"
        variant="rounded-right"
        maxHeight="none"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
        closeButtonProps={{ ...props.removeProps, isFocused: props.isFocused, onPointerDown: e => e.stopPropagation() }}
      >
        {props.children}
      </StyledTag>
    </div>
  );
};

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

const debouncedSearch = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 500);

function CollectiveTagsInput({ defaultValue = [], onChange, suggestedTags = [] }) {
  const intl = useIntl();
  const [searchTags, { loading: fetching, data }] = useLazyQuery(searchTagsQuery, {
    context: API_V2_CONTEXT,
  });
  const [debouncing, setDebouncing] = useState<boolean>(false);
  const loading = fetching || debouncing;
  const [input, setInput] = useState<string>('');
  const [options, setOptions] = useState<TagOption[]>([]);
  const [selected, setSelected] = useState<readonly TagOption[]>(
    defaultValue?.map(tag => ({ label: tag, value: tag })) || [],
  );
  const [draggingTag, setDraggingTag] = useState<string | null>(null);

  // Fix for infinity loop bug in dnd-kit with variable width items: https://github.com/clauderic/dnd-kit/issues/842#issuecomment-1192622612
  const [overItemsForDelta, setOverItemsForDelta] = useState({});

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  useEffect(() => {
    if (input?.length) {
      setDebouncing(true);
      debouncedSearch(searchTags, {
        term: input,
      });
    } else {
      // Skip debouncing when input is empty (on initial load for instance)
      searchTags();
    }
  }, [input]);

  useEffect(() => {
    if (!fetching) {
      setOptions(
        data?.tagStats?.nodes
          .filter(({ tag }) => !IGNORED_TAGS.includes(tag))
          .map(({ tag }) => ({
            label: tag,
            value: tag,
          })) || [],
      );
      setDebouncing(false);
    }
  }, [fetching, data]);

  function handleDragOver(event) {
    const { active, over, delta } = event;

    const jsonDelta = JSON.stringify(delta);
    if (over && active.id !== over.id && !overItemsForDelta[jsonDelta]) {
      setSelected(selected => {
        const oldIndex = selected.findIndex(item => item.value === active.id);
        const newIndex = selected.findIndex(item => item.value === over.id);
        return arrayMove(selected, oldIndex, newIndex);
      });
      setOverItemsForDelta({ ...overItemsForDelta, [jsonDelta]: over.id });
    }
  }

  function handleDragStart(event) {
    setDraggingTag(event.active.id);
  }

  function handleDragEnd() {
    setDraggingTag(null);
    setOverItemsForDelta({});
  }

  return (
    <Fragment>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragEnd}
      >
        <SortableContext items={selected.map(o => o.value)}>
          <CreatableSelect
            openMenuOnFocus
            placeholder={intl.formatMessage({ id: 'collective.tags.input.placeholder', defaultMessage: '+ Add tags' })}
            isMulti
            value={selected}
            menuPortalTarget={document.body}
            components={{
              MultiValue,
              SelectContainer,
              Input,
              Option,
            }}
            onInputChange={value => setInput(value)}
            options={options}
            isLoading={loading}
            onChange={(selectedOptions: OnChangeValue<TagOption, true>) => setSelected(selectedOptions)}
            styles={{
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
        </SortableContext>
        <DragOverlay>
          {draggingTag ? (
            <StyledTag
              m="4px"
              variant="rounded-right"
              style={{ cursor: 'grabbing', color: 'black' }}
              maxHeight="none"
              backgroundColor="black.200"
              closeButtonProps={true}
            >
              {draggingTag}
            </StyledTag>
          ) : null}
        </DragOverlay>
      </DndContext>
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
              <StyledTag
                variant="rounded-right"
                type="button"
                tabIndex={-1}
                key={tag}
                closeButtonProps={false}
                style={{ opacity: isSelected ? 0.5 : 1, cursor: 'pointer' }}
                onClick={() =>
                  isSelected
                    ? setSelected(selected.filter(({ value }) => value !== tag))
                    : setSelected([...selected, { value: tag, label: tag }])
                }
              >
                {tag}
              </StyledTag>
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
  onChange: PropTypes.func,
  preload: PropTypes.bool,
};

export default CollectiveTagsInput;
