import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from '@styled-icons/fa-solid/Plus';
import { Times } from '@styled-icons/fa-solid/Times';
import { PriceTags } from '@styled-icons/icomoon/PriceTags';
import { uniqBy } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import { Manager, Popper, Reference } from 'react-popper';
import styled, { css } from 'styled-components';

import useGlobalBlur from '../lib/hooks/useGlobalBlur';
import useKeyboardKey, { ESCAPE_KEY } from '../lib/hooks/useKeyboardKey';

import { Box, Flex } from './Grid';
import StyledCard from './StyledCard';
import StyledTag from './StyledTag';

const TagIcon = styled(PriceTags)`
  margin-right: 4px;
`;

export const EditTag = styled(StyledTag).attrs({
  variant: 'rounded-right',
  tabIndex: 0,
})`
  border: 1px dashed;
  cursor: pointer;
  position: relative;
  padding: 2px 10px 2px 6px;
  background-color: ${props => props.theme.colors.white.full};
  border-color: ${props => props.theme.colors.black[200]};
  color: ${props => props.theme.colors.black[700]};
  margin-right: 4px;
  margin-bottom: 4px;
  &:not([disabled]) {
    &:hover,
    &:focus {
      background-color: ${props => props.theme.colors.white.full};
      border-color: ${props => props.theme.colors.blue[500]};
      svg {
        color: ${props => props.theme.colors.blue[500]};
      }
    }
  }
  &:focus {
    outline: 0;
  }
  &[disabled] {
    cursor: not-allowed;
    background: #f0f1f2;
  }
  ${props =>
    props.active &&
    css`
      background-color: ${props => props.theme.colors.blue[50]};
      border-color: ${props => props.theme.colors.blue[600]};
      svg {
        color: ${props => props.theme.colors.blue[600]};
      }
      color: ${props => props.theme.colors.black[900]};
    `}
`;

const Input = styled.input`
  font-size: 12px;
  line-height: 18px;
  border: 0;
  margin-left: 10px;
  outline: none;
  width: auto;
  ::placeholder {
    color: ${props => props.theme.colors.black[400]};
  }
`;

const InputWrapper = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 9; // To make sure tags are not appearing over the input
  padding: 12px 16px;
  background-color: inherit;
  :not(:only-child) {
    border-bottom: 1px solid ${props => props.theme.colors.black[300]};
  }
`;

const TagWrapper = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  :not(:first-child) {
    border-top: 1px solid ${props => props.theme.colors.black[300]};
  }
`;

const TagActionButton = styled.button`
  cursor: pointer;
  text-align: center;
  background-color: transparent;
  border: none;
  padding: 5px;
  line-height: inherit;
  &:disabled {
    cursor: not-allowed;
  }
`;

const AddTagButton = styled(TagActionButton)`
  &:not([disabled]) {
    color: ${props => props.theme.colors.blue[400]};
    &:hover,
    &:focus {
      color: ${props => props.theme.colors.blue[600]};
    }
  }
`;

const DeleteTagButton = styled(TagActionButton)`
  color: ${props => props.theme.colors.black[400]};
  &:hover {
    color: ${props => props.theme.colors.black[600]};
  }
`;

const messages = defineMessages({
  placeholder: {
    id: 'StyledInputTags.Placeholder',
    defaultMessage: 'Create New Tag',
  },
  editLabel: {
    id: 'StyledInputTags.EditLabel',
    defaultMessage: 'Edit Tags',
  },
  addLabel: {
    id: 'StyledInputTags.AddLabel',
    defaultMessage: 'Add Tags',
  },
});

const getOptions = tags => {
  if (!tags || !tags.length) {
    return [];
  } else {
    return tags.map(tag => ({ label: tag, value: tag }));
  }
};

const StyledInputTags = ({ suggestedTags, value, onChange, renderUpdatedTags, defaultValue, disabled, ...props }) => {
  const { formatMessage } = useIntl();
  const inputRef = React.useRef();
  const wrapperRef = React.useRef();
  const scrollerRef = React.useRef();
  const [isOpen, setOpen] = React.useState(false);
  const [tags, setTags] = React.useState(getOptions(value || defaultValue));
  const [inputValue, setInputValue] = React.useState('');
  const availableSuggestedTags = suggestedTags?.filter(st => !tags.some(t => t.value === st));

  const handleClose = React.useCallback(() => {
    if (isOpen) {
      setOpen(false);
    }
  }, [isOpen]);

  const addTag = tag => {
    const newTags = uniqBy([...tags, { label: tag.toLowerCase(), value: tag.toLowerCase() }], 'value');
    setTags(newTags);
    onChange(newTags);
  };

  const handleToggleInput = () => {
    if (isOpen) {
      handleClose();
    } else {
      setOpen(true);
      setTimeout(() => inputRef?.current?.focus(), 50);
    }
  };

  const removeTag = (tag, update) => {
    const updatedTags = tags.filter(v => v.value !== tag);
    setTags(updatedTags);
    if (update) {
      onChange(updatedTags);
    }
  };

  // Close when clicking outside
  useGlobalBlur(wrapperRef, outside => {
    if (outside) {
      handleClose();
    }
  });

  // Closes the modal upon the `ESC` key press.
  useKeyboardKey({ callback: handleClose, keyMatch: ESCAPE_KEY });

  return (
    <Manager>
      <Flex ref={wrapperRef} flexWrap="wrap">
        {(renderUpdatedTags ? tags : getOptions(value))?.map(tag => (
          <StyledTag
            key={tag.value}
            variant="rounded-right"
            mr="4px"
            mb="4px"
            color={disabled ? 'black.500' : 'black.700'}
            closeButtonProps={{
              onClick: () => removeTag(tag.value, true),
              disabled,
            }}
          >
            {tag.label}
          </StyledTag>
        ))}
        <Reference>
          {({ ref }) => (
            <Flex ref={ref}>
              <EditTag
                data-cy="styled-input-tags-open"
                active={isOpen}
                onClick={handleToggleInput}
                disabled={disabled}
                onKeyDown={e => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    handleToggleInput();
                  }
                }}
              >
                <TagIcon size="14px" />{' '}
                {tags?.length > 0 ? formatMessage(messages.editLabel) : formatMessage(messages.addLabel)}
              </EditTag>
            </Flex>
          )}
        </Reference>
        {isOpen && (
          <Popper placement="bottom">
            {({ placement, ref, style }) => (
              <div
                data-placement={placement}
                ref={ref}
                style={{
                  ...style,
                  zIndex: 9999,
                }}
              >
                <StyledCard
                  m={1}
                  overflow="auto"
                  overflowY="auto"
                  {...props}
                  ref={scrollerRef}
                  boxShadow="0px 4px 10px #C4C7CC"
                >
                  <InputWrapper color="black.400">
                    <TagIcon size="16px" />
                    <Input
                      data-cy="styled-input-tags-input"
                      disabled={disabled}
                      placeholder={formatMessage(messages.placeholder)}
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onBlur={() => {
                        if (!availableSuggestedTags?.length) {
                          handleClose();
                        }
                      }}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newTag = e.target.value.trim();
                          if (!newTag) {
                            return;
                          }

                          addTag(newTag);
                          setInputValue('');
                          if (!renderUpdatedTags) {
                            // Wait until new tag renders, otherwise we'll scroll to the second-last tag
                            requestAnimationFrame(() => scrollerRef.current?.scrollTo(0, Number.MAX_SAFE_INTEGER), 30);
                          }
                        }
                      }}
                    />
                  </InputWrapper>
                  {(suggestedTags?.length || tags?.length) > 0 && (
                    <Box flexGrow="1">
                      {!availableSuggestedTags?.length
                        ? null
                        : availableSuggestedTags.map(st => (
                            <TagWrapper key={st} px="16px" py="8px" backgroundColor="blue.50">
                              <StyledTag type="info" variant="rounded-right">
                                {st}
                              </StyledTag>
                              <AddTagButton
                                data-cy={`styled-input-tags-add-suggestion-${st}`}
                                disabled={disabled}
                                onClick={() => {
                                  addTag(st);
                                  // When adding the last suggested tag, focus the input
                                  setTimeout(() => inputRef?.current?.focus(), 50);
                                }}
                                onBlur={() => {
                                  if (st === suggestedTags[suggestedTags.length - 1]) {
                                    handleToggleInput();
                                  }
                                }}
                              >
                                <Plus size="10px" />
                              </AddTagButton>
                            </TagWrapper>
                          ))}
                      {!renderUpdatedTags &&
                        tags.map(tag => (
                          <TagWrapper key={tag.value} px="16px" py="8px" autoFocus>
                            <StyledTag variant="rounded-right">{tag.label}</StyledTag>
                            <DeleteTagButton
                              data-cy={`styled-input-tags-remove-${tag.value}`}
                              disabled={disabled}
                              onClick={() => {
                                removeTag(tag.value);
                              }}
                            >
                              <Times size="10px" />
                            </DeleteTagButton>
                          </TagWrapper>
                        ))}
                    </Box>
                  )}
                </StyledCard>
              </div>
            )}
          </Popper>
        )}
      </Flex>
    </Manager>
  );
};

StyledInputTags.propTypes = {
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  renderUpdatedTags: PropTypes.bool,
  onChange: PropTypes.func,
  ...StyledCard.propTypes,
};

StyledInputTags.defaultProps = {
  maxHeight: ['50vh', null, '30vh'],
  minWidth: '240px',
  renderUpdatedTags: true,
};

export default React.memo(StyledInputTags);
