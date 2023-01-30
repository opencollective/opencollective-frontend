import React from 'react';
import { Plus, Times } from '@styled-icons/fa-solid';
import { DragIndicator } from '@styled-icons/material';
import { sortBy } from 'lodash';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormattedMessage } from 'react-intl';

import { SocialLink, SocialLinkInput, SocialLinkType } from '../../lib/graphql/types/v2/graphql';
import { isValidUrl } from '../../lib/utils';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledSelect from '../StyledSelect';
import { Span } from '../Text';

export type SocialLinksFormFieldProps = {
  value?: SocialLink[];
  touched?: boolean;
  onChange: (value: SocialLinkInput[]) => void;
};

export default function SocialLinksFormField({ value, touched, onChange }: SocialLinksFormFieldProps) {
  const onItemChange = React.useCallback(
    (socialLink, index) => {
      const newValues = [...value.slice(0, index), socialLink, ...value.slice(index + 1)];
      onChange(
        newValues.map(sl => ({
          url: sl.url,
          type: sl.type,
        })),
      );
    },
    [value, onChange],
  );

  const onRemoveItem = React.useCallback(
    index => {
      const newValues = [...value.slice(0, index), ...value.slice(index + 1)];
      onChange(
        newValues.map(sl => ({
          url: sl.url,
          type: sl.type,
        })),
      );
    },
    [value, onChange],
  );

  const addItem = React.useCallback(() => {
    const newValues = [...value, { url: '', type: SocialLinkType.WEBSITE }];
    onChange(
      newValues.map(sl => ({
        url: sl.url,
        type: sl.type,
      })),
    );
  }, [value, onChange]);

  const onMoveItem = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const movingItem = value[fromIndex];
      const newValues = [...value.slice(0, fromIndex), ...value.slice(fromIndex + 1)];
      newValues.splice(toIndex, 0, movingItem);
      onChange(
        newValues.map(sl => ({
          url: sl.url,
          type: sl.type,
        })),
      );
    },
    [value, onChange],
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Flex width="100%" flexDirection="column">
        {(value || []).map((socialLink, i) => {
          return (
            <SocialLinkItem
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              index={i}
              error={touched && !isValidUrl(socialLink.url)}
              onMoveItem={onMoveItem}
              value={socialLink}
              onChange={onItemChange}
              onRemoveItem={onRemoveItem}
            />
          );
        })}
        <Flex mt={2} justifyContent="center">
          <StyledButton
            disabled={value.length >= 10}
            type="button"
            buttonSize="tiny"
            buttonStyle="standard"
            onClick={addItem}
          >
            <Plus size="10px" />
            <Span ml={2}>
              <FormattedMessage defaultMessage="Add social link" />
            </Span>
          </StyledButton>
        </Flex>
      </Flex>
    </DndProvider>
  );
}

type SocialLinkTypePickerProps = {
  value: SocialLinkType;
  onChange: (value: SocialLinkType) => void;
} & any;

function SocialLinkTypePicker({ value, onChange, ...pickerProps }: SocialLinkTypePickerProps) {
  const options = [
    {
      value: SocialLinkType.WEBSITE.toString(),
      label: 'Website',
    },
    {
      value: SocialLinkType.DISCORD.toString(),
      label: 'Discord',
    },
    {
      value: SocialLinkType.FACEBOOK.toString(),
      label: 'Facebook',
    },
    {
      value: SocialLinkType.GITHUB.toString(),
      label: 'GitHub',
    },
    {
      value: SocialLinkType.GITLAB.toString(),
      label: 'GitLab',
    },
    {
      value: SocialLinkType.GIT.toString(),
      label: 'Git Repository',
    },
    {
      value: SocialLinkType.INSTAGRAM.toString(),
      label: 'Instagram',
    },
    {
      value: SocialLinkType.MASTODON.toString(),
      label: 'Mastodon',
    },
    {
      value: SocialLinkType.MATTERMOST.toString(),
      label: 'Mattermost',
    },
    {
      value: SocialLinkType.TUMBLR.toString(),
      label: 'Tumblr',
    },
    {
      value: SocialLinkType.TWITTER.toString(),
      label: 'Twitter',
    },
    {
      value: SocialLinkType.YOUTUBE.toString(),
      label: 'YouTube',
    },
    {
      value: SocialLinkType.MEETUP.toString(),
      label: 'Meetup',
    },
    {
      value: SocialLinkType.LINKEDIN.toString(),
      label: 'LinkedIn',
    },
    {
      value: SocialLinkType.SLACK.toString(),
      label: 'Slack',
    },
  ];

  return (
    <StyledSelect
      {...pickerProps}
      data-cy="social-link-type-picker"
      value={options.find(o => o.value === value?.toString())}
      defaultValue={options.find(o => o.value === SocialLinkType.WEBSITE.toString())}
      onChange={({ value }) => onChange(value)}
      options={sortBy(options, 'label')}
    />
  );
}

type SocialLinkItemProps = {
  value: SocialLink;
  error?: boolean;
  index: number;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onChange: (value: SocialLink, index: number) => void;
  onRemoveItem: (index: number) => void;
};

function SocialLinkItem({ value, error, index, onChange, onRemoveItem, onMoveItem }: SocialLinkItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ handlerId, isOver }, drop] = useDrop({
    accept: 'SocialLink',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      };
    },
    hover(item: { index: number }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }

      onMoveItem(dragIndex, hoverIndex);

      item.index = hoverIndex;
    },
  });

  const [, drag, dragPreview] = useDrag(
    () => ({
      type: 'SocialLink',
      item: { index },
    }),
    [value],
  );

  const onFieldChange = React.useCallback(
    (field, fieldValue) => {
      onChange(
        {
          ...value,
          [field]: fieldValue,
        },
        index,
      );
    },
    [onChange, index],
  );

  const onRemove = React.useCallback(() => {
    onRemoveItem(index);
  }, [onRemoveItem, index]);

  drag(drop(ref));
  return (
    <Flex ref={dragPreview} opacity={isOver ? 0 : 1} alignItems="center" my={1} gap="5px" data-handler-id={handlerId}>
      <div ref={ref}>
        <DragIndicator size="15px" style={{ cursor: 'grab' }} />
      </div>
      <Flex flexGrow={1} flexWrap="wrap" gap="5px">
        <Box width={['100%', '120px']}>
          <SocialLinkTypePicker value={value.type} onChange={type => onFieldChange('type', type)} />
        </Box>
        <StyledInput
          autoFocus={value.url === ''}
          error={error}
          flexGrow={1}
          value={value.url}
          onChange={e => onFieldChange('url', e.target.value)}
          placeholder="https://opencollective.com/"
        />
      </Flex>

      <StyledButton padding={0} width="20px" height="20px" type="button" buttonStyle="borderless" onClick={onRemove}>
        <Times size="10px" />
      </StyledButton>
    </Flex>
  );
}
