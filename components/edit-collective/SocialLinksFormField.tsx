import React, { useMemo } from 'react';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from '@styled-icons/fa-solid/Plus';
import { sortBy } from 'lodash';
import { GripVertical, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { SocialLink, SocialLinkInput } from '../../lib/graphql/types/v2/schema';
import { SocialLinkType } from '../../lib/graphql/types/v2/schema';
import { SocialLinkLabel } from '../../lib/social-links';
import { isValidUrl } from '../../lib/utils';

import StyledInput from '../StyledInput';
import StyledSelect from '../StyledSelect';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

type SocialLinksFormFieldProps = {
  value?: SocialLink[];
  touched?: boolean;
  onChange: (value: SocialLinkInput[]) => void;
  useLegacyInput?: boolean;
};

export default function SocialLinksFormField({
  value = [],
  touched,
  onChange,
  useLegacyInput = true,
}: SocialLinksFormFieldProps) {
  const [items, setItems] = React.useState(value.map(({ url, type }, i) => ({ url, type, sortId: i.toString() })));

  React.useEffect(() => {
    onChange(items.map(({ url, type }) => ({ url, type })));
  }, [items]);

  const onItemChange = React.useCallback(
    (socialLink, sortId) => {
      const newItems = items.map(item => {
        if (item.sortId === sortId) {
          return { ...item, ...socialLink };
        }
        return item;
      });
      setItems(newItems);
    },
    [items, onChange],
  );

  const onRemoveItem = React.useCallback(
    sortId => {
      const newItems = items.filter(item => item.sortId !== sortId);
      setItems(newItems);
    },
    [items, onChange],
  );

  const addItem = React.useCallback(() => {
    const newItems = [...items, { url: '', type: SocialLinkType.WEBSITE }].map((item, i) => ({
      ...item,
      sortId: i.toString(),
    }));
    setItems(newItems);
  }, [items, onChange]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.sortId === active.id);
      const newIndex = items.findIndex(item => item.sortId === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-2" data-cy="social-link-inputs">
        <SortableContext items={items.map(item => item.sortId)} strategy={verticalListSortingStrategy}>
          {items.map(socialLink => {
            return (
              <SocialLinkItem
                key={socialLink.sortId}
                error={touched && !isValidUrl(socialLink.url)}
                value={socialLink}
                onChange={onItemChange}
                onRemoveItem={onRemoveItem}
                useLegacyInput={useLegacyInput}
              />
            );
          })}
          <div className="flex justify-center gap-2">
            <Button disabled={value.length >= 10} type="button" size="sm" variant="outline" onClick={addItem}>
              <Plus size="10px" />
              <FormattedMessage defaultMessage="Add social link" id="FH4TgN" />
            </Button>
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
}

type SocialLinkTypePickerProps = {
  value: SocialLinkType;
  onChange: (value: SocialLinkType) => void;
  useLegacyInput?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const options = Object.keys(SocialLinkType).map(value => ({ value, label: SocialLinkLabel[value] }));

function SocialLinkTypePicker({ value, onChange, ...pickerProps }: SocialLinkTypePickerProps) {
  if (pickerProps.useLegacyInput) {
    return (
      <StyledSelect
        {...pickerProps}
        data-cy="social-link-type-picker"
        value={options.find(o => o.value === value?.toString())}
        defaultValue={options.find(o => o.value === SocialLinkType.WEBSITE.toString())}
        onChange={({ value }: { value: string }) => onChange(value as SocialLinkType)}
        options={sortBy(options, 'label')}
      />
    );
  } else {
    return (
      <Select value={value} onValueChange={(value: string) => onChange(value as SocialLinkType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortBy(options, 'label').map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
}

type SocialLinkItemProps = {
  value: SocialLink & { sortId: string };
  error?: boolean;
  onChange: (value: SocialLink, sortId: string) => void;
  onRemoveItem: (sortId: string) => void;
  useLegacyInput?: boolean;
};

function SocialLinkItem({ value, error, onChange, onRemoveItem, useLegacyInput }: SocialLinkItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: value.sortId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onFieldChange = React.useCallback(
    (field, fieldValue) => {
      onChange(
        {
          ...value,
          [field]: fieldValue,
        },
        value.sortId,
      );
    },
    [onChange, value],
  );

  const onUrlChange = React.useCallback(
    e => {
      const newUrl = e.target.value;
      onChange(
        {
          type: typeFromUrl(newUrl) ?? value.type,
          url: newUrl,
        },
        value.sortId,
      );
    },
    [onChange, value],
  );

  const onUrlBlur = React.useCallback(() => {
    const hasSchemaRegexp = /^[^:]+:\/\//;

    if (value.url.trim() === '') {
      return;
    }

    if (!value.url.match(hasSchemaRegexp)) {
      onChange(
        {
          ...value,
          url: `https://${value.url}`,
        },
        value.sortId,
      );
    }
  }, [onChange, value]);

  const onRemove = React.useCallback(() => {
    onRemoveItem(value.sortId);
  }, [onRemoveItem, value.sortId]);

  const InputComponent = useMemo(() => (useLegacyInput ? StyledInput : Input), [useLegacyInput]);

  return (
    <div ref={setNodeRef} style={style} className="items-top flex gap-2 sm:items-center">
      <div className="flex h-9 items-center" {...listeners} {...attributes}>
        <GripVertical size="15px" style={{ cursor: 'grab' }} />
      </div>
      <div className="flex flex-grow flex-col items-center gap-2 sm:flex-row">
        <div className="w-full min-w-24 sm:max-w-32">
          <SocialLinkTypePicker
            value={value.type}
            onChange={type => onFieldChange('type', type)}
            useLegacyInput={useLegacyInput}
          />
        </div>
        <InputComponent
          autoFocus={value.url === ''}
          error={error}
          flexGrow={1}
          value={value.url}
          onBlur={onUrlBlur}
          onChange={onUrlChange}
          placeholder="https://opencollective.com/"
        />
      </div>
      <Button tabIndex={-1} type="button" variant="outline" size="icon" onClick={onRemove}>
        <X size="18" />
      </Button>
    </div>
  );
}

const knownSocialLinkDomains = [
  { type: SocialLinkType.BLUESKY, regexp: /^(https:\/\/)?bsky.app/ },
  { type: SocialLinkType.DISCORD, regexp: /^(https:\/\/)?discord.com/ },
  { type: SocialLinkType.FACEBOOK, regexp: /^(https:\/\/)?(www\.)?facebook.com/ },
  { type: SocialLinkType.GITHUB, regexp: /^(https:\/\/)?github.com/ },
  { type: SocialLinkType.GITLAB, regexp: /^(https:\/\/)?gitlab.com/ },
  { type: SocialLinkType.INSTAGRAM, regexp: /^(https:\/\/)?(www\.)?instagram.com/ },
  { type: SocialLinkType.LINKEDIN, regexp: /^(https:\/\/)?(www\.)?linkedin.com/ },
  { type: SocialLinkType.MEETUP, regexp: /^(https:\/\/)?meetup.com/ },
  { type: SocialLinkType.SLACK, regexp: /^(https:\/\/)?[^.]+.?slack.com/ },
  { type: SocialLinkType.THREADS, regexp: /^(https:\/\/)?(www\.)?threads.net/ },
  { type: SocialLinkType.TIKTOK, regexp: /^(https:\/\/)?(www\.)?tiktok.com/ },
  { type: SocialLinkType.TUMBLR, regexp: /^(https:\/\/)?[^.]+\.?tumblr.com/ },
  { type: SocialLinkType.TWITCH, regexp: /^(https:\/\/)?(www\.)?twitch.tv/ },
  { type: SocialLinkType.TWITTER, regexp: /^(https:\/\/)?(twitter|x)\.com/ },
  { type: SocialLinkType.YOUTUBE, regexp: /^(https:\/\/)?(www\.)?youtube.com/ },
];

function typeFromUrl(url: string): SocialLinkType | null {
  for (const knownDomain of knownSocialLinkDomains) {
    if (url.match(knownDomain.regexp)) {
      return knownDomain.type;
    }
  }

  return null;
}
