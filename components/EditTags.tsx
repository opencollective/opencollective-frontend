import React, { useEffect, useState } from 'react';
import { DocumentNode, useLazyQuery } from '@apollo/client';
import { debounce, uniqBy } from 'lodash';
import { Search, Tags, TagsIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { AccountReferenceInput, InputMaybe, Scalars } from '../lib/graphql/types/v2/graphql';

import { Button } from './ui/Button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import StyledTag from './StyledTag';

const getOptions = tags => {
  if (!tags || !tags.length) {
    return [];
  } else {
    return tags.map(tag => ({ label: tag, value: tag }));
  }
};

const useDebouncedSearch = (searchFunc, input, delay) => {
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (searchFunc) {
      // If there's no input, don't debounce, just call the search function.
      if (!input) {
        setIsDebouncing(false);
        searchFunc();
        return;
      }
      const debouncedSearch = debounce(() => {
        setIsDebouncing(false);
        searchFunc(input);
      }, delay);

      setIsDebouncing(true);

      debouncedSearch();

      return debouncedSearch.cancel;
    }
  }, [input]);

  return { isDebouncing };
};

type EditTagsProps = {
  suggestedTags?: string[];
  searchFunc?: (term?: string) => void;
  loading?: boolean;
  value: string[];
  onChange: (value: { label: string; value: string }[]) => void;
  defaultValue?: string[];
  disabled?: boolean;
};

type AutocompleteEditTagsProps = EditTagsProps & {
  query: DocumentNode;
  variables: {
    searchTerm?: InputMaybe<Scalars['String']>;
    host?: InputMaybe<AccountReferenceInput>;
    account?: InputMaybe<AccountReferenceInput>;
  };
};

export const AutocompleteEditTags = ({ query, variables, ...props }: AutocompleteEditTagsProps) => {
  const [search, { loading, data, previousData }] = useLazyQuery(query, {
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    variables,
  });
  const searchFunc = searchTerm =>
    search({
      variables: {
        searchTerm,
      },
    });
  const suggestedTags = (data || previousData)?.tagStats?.nodes.map(({ tag }) => tag) || [];
  return <EditTags {...props} suggestedTags={suggestedTags} loading={loading} searchFunc={searchFunc} />;
};

const EditTags = ({ suggestedTags, loading, searchFunc, value, onChange, defaultValue, disabled }: EditTagsProps) => {
  const intl = useIntl();
  const [tags, setTags] = React.useState(getOptions(value || defaultValue));
  const [inputValue, setInputValue] = React.useState('');

  const addTag = tag => {
    const newTags = uniqBy([...tags, { label: tag.toLowerCase(), value: tag.toLowerCase() }], 'value');
    setTags(newTags);
    onChange(newTags);
    setInputValue('');
  };

  const removeTag = (tag, update) => {
    const updatedTags = tags.filter(v => v.value !== tag);
    setTags(updatedTags);
    if (update) {
      onChange(updatedTags);
    }
  };
  const hasSearch = Boolean(searchFunc);
  const { isDebouncing } = useDebouncedSearch(searchFunc, inputValue, 500);
  const isLoading = loading || isDebouncing;

  const onSelect = value => addTag(value);

  const options = getOptions(suggestedTags ?? []);
  const filteredOptions = options?.filter(o => !value?.includes(o.value) && o.value !== inputValue);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map(tag => (
        <StyledTag
          key={tag.value}
          variant="rounded-right"
          color={disabled ? 'black.500' : 'black.700'}
          closeButtonProps={{
            onClick: () => removeTag(tag.value, true),
            disabled,
          }}
        >
          {tag.label}
        </StyledTag>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="xs"
            variant="outline"
            className="h-6 gap-1 border-dashed text-xs text-muted-foreground"
            data-cy="edit-tags-open"
          >
            <Tags size={16} />
            <span>
              <FormattedMessage defaultMessage="Add tag" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-48 p-0">
          <Command>
            <CommandInput
              customIcon={!hasSearch ? TagsIcon : Search}
              placeholder={intl.formatMessage({ defaultMessage: 'Add tag' })}
              value={inputValue}
              onValueChange={setInputValue}
              loading={isLoading}
              data-cy="edit-tags-input"
            />

            {(filteredOptions?.length > 0 || inputValue) && (
              <CommandList>
                {(filteredOptions.length > 0 || inputValue) && (
                  <CommandGroup
                    heading={!inputValue.length ? intl.formatMessage({ defaultMessage: 'Suggestions' }) : undefined}
                  >
                    {inputValue && (
                      <CommandItem value={inputValue} onSelect={onSelect} disabled={disabled}>
                        {inputValue.toLowerCase()}
                      </CommandItem>
                    )}
                    {filteredOptions.map(option => {
                      return (
                        <CommandItem key={option.value} value={option.value} onSelect={onSelect} disabled={disabled}>
                          {option.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default React.memo(EditTags);
