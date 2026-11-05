import * as React from 'react';
import { X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '../../lib/utils';

import { Badge } from './Badge';
import { InputGroup } from './Input';

interface TagInputProps {
  /** The current tags */
  value?: string[];
  /** Called with the new tags list whenever it changes */
  onChange?: (tags: string[]) => void;
  /** Suggested tags offered as one-click toggles below the input */
  suggestedTags?: string[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  'data-cy'?: string;
}

/**
 * Tag input built on `InputGroup` + `Badge`: type a value and press `Enter` (or `,`) to add
 * it as a tag. Click the cross on a badge - or press `Backspace` on an empty input - to remove
 * a tag. `suggestedTags` are displayed below the input and clicking one toggles it.
 */
function TagInput({
  value = [],
  onChange,
  suggestedTags = [],
  placeholder,
  disabled = false,
  name,
  id,
  className,
  'data-cy': dataCy,
}: TagInputProps) {
  const intl = useIntl();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  const addTag = (rawTag: string) => {
    const tag = (rawTag ?? '').trim();
    if (!tag || value.includes(tag)) {
      return;
    }
    onChange?.([...value, tag]);
  };

  const removeTag = (tag: string) => {
    onChange?.(value.filter(t => t !== tag));
  };

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  };

  const commitInputValue = () => {
    addTag(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Also prevents the comma from being typed and the form from being submitted
      commitInputValue();
    } else if (event.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!pasted.includes(',')) {
      return; // Let the input handle plain pastes
    }
    event.preventDefault();
    const newTags = [...value];
    pasted.split(',').forEach(part => {
      const tag = part.trim();
      if (tag && !newTags.includes(tag)) {
        newTags.push(tag);
      }
    });
    onChange?.(newTags);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeLabel = intl.formatMessage({ id: 'Remove', defaultMessage: 'Remove' });

  return (
    <div className={cn('w-full', className)}>
      <InputGroup
        ref={inputRef}
        className="flex h-auto min-h-10 w-full flex-col"
        prepend={
          value.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5">
              {value.map(tag => (
                <Badge key={tag} type="neutral" size="sm" className="gap-1 pr-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`${removeLabel} ${tag}`}
                    className="rounded-full p-0.5 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )
        }
        prependClassName="flex flex-wrap items-center gap-1.5 bg-transparent p-0"
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={
          placeholder ?? intl.formatMessage({ id: 'collective.tags.input.placeholder', defaultMessage: '+ Add tags' })
        }
        disabled={disabled}
        name={name}
        id={id}
        data-cy={dataCy}
      />
      {suggestedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">
            <FormattedMessage id="W4zXqr" defaultMessage="Popular tags:" />
          </span>
          {suggestedTags.map(tag => {
            const isSelected = value.includes(tag);
            return (
              <button key={tag} type="button" tabIndex={-1} aria-pressed={isSelected} onClick={() => toggleTag(tag)}>
                <Badge type="neutral" size="sm" round className={cn('cursor-pointer', isSelected && 'opacity-50')}>
                  {tag}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { TagInput };
