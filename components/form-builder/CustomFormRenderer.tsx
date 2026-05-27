import React from 'react';
import { FormattedMessage } from 'react-intl';

import { cn } from '@/lib/utils';

import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { DefaultSelect } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

import type { CustomFormConfig, FormFieldConfig } from './types';
import { sortFieldsByOrder } from './utils';

type CustomFormRendererProps = {
  config?: CustomFormConfig;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string | undefined>;
  disabled?: boolean;
};

const getInputId = (fieldId: string) => `custom-form-${fieldId}`;

const renderField = (
  field: FormFieldConfig,
  value: any,
  onChange: (name: string, value: any) => void,
  disabled?: boolean,
) => {
  const commonInputProps = {
    id: getInputId(field.id),
    name: field.id,
    placeholder: field.placeholder,
    value: value ?? '',
    disabled,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field.id, event.target.value),
  };

  switch (field.type) {
    case 'longText':
      return <Textarea className="min-h-24" {...commonInputProps} showCount maxLength={3000} />;
    case 'email':
      return <Input type="email" {...commonInputProps} />;
    case 'phone':
      return <Input type="tel" {...commonInputProps} />;
    case 'number':
      return <Input type="number" {...commonInputProps} />;
    case 'date':
      return <Input type="date" {...commonInputProps} />;
    case 'website':
      return <Input type="url" {...commonInputProps} />;
    case 'select': {
      const options = field.options?.map(option => ({ value: option, label: option })) || [];
      return (
        <DefaultSelect
          name={field.id}
          placeholder={field.placeholder || 'Select an option'}
          value={value || ''}
          setValue={selected => onChange(field.id, selected)}
          options={options}
        />
      );
    }
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={commonInputProps.id}
            name={commonInputProps.name}
            checked={Boolean(value)}
            onCheckedChange={checked => onChange(field.id, checked)}
            disabled={disabled}
          />
        </div>
      );
    case 'shortText':
    default:
      return <Input type="text" {...commonInputProps} />;
  }
};

// Helper to get the answer value as a string for condition matching
const getAnswerValue = (field: FormFieldConfig, value: any): string => {
  if (field.type === 'checkbox') {
    return value ? 'checked' : 'unchecked';
  }
  return String(value || '');
};

// Recursively render a field and its conditional sub-fields
const renderFieldWithSubFields = (
  field: FormFieldConfig,
  values: Record<string, any>,
  onChange: (name: string, value: any) => void,
  errors?: Record<string, string | undefined>,
  disabled?: boolean,
  level: number = 0,
): React.ReactNode => {
  const value = values?.[field.id];
  const error = errors?.[field.id];
  const required = field.required;

  // Only select and checkbox fields support conditional sub-fields
  const supportsSubFields = field.type === 'select' || field.type === 'checkbox';

  // Get the current answer value for condition matching
  const answerValue = supportsSubFields ? getAnswerValue(field, value) : '';

  // Find matching sub-field conditions (only if field supports sub-fields and has a value)
  const matchingConditions =
    supportsSubFields && answerValue
      ? field.subFields?.filter(condition => condition.answer === answerValue) || []
      : [];
  const subFieldsToRender = matchingConditions.flatMap(condition => condition.subFields);

  return (
    <div key={field.id} className={cn('flex flex-col gap-2')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={getInputId(field.id)} className="text-sm font-semibold">
            {!required ? (
              <FormattedMessage
                defaultMessage="{field} (optional)"
                id="OptionalFieldLabel"
                values={{
                  field: <span className="text-foreground">{field.label}</span>,
                }}
              />
            ) : (
              field.label
            )}
          </Label>
          {field.hint && <span className="text-xs text-muted-foreground">{field.hint}</span>}
          {field.placeholder && field.type !== 'checkbox' && (
            <span className="text-xs text-muted-foreground">{field.placeholder}</span>
          )}
        </div>
      </div>
      <div>{renderField(field, value, onChange, disabled)}</div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Render conditional sub-fields */}
      {subFieldsToRender.length > 0 && (
        <div className={cn('flex flex-col gap-4 border-l-2 py-2 pl-3')}>
          {subFieldsToRender
            .filter(subField => !subField.hidden)
            .map(subField => renderFieldWithSubFields(subField, values, onChange, errors, disabled, level + 1))}
        </div>
      )}
    </div>
  );
};

export const CustomFormRenderer: React.FC<CustomFormRendererProps> = ({
  config,
  values,
  onChange,
  errors,
  disabled,
}) => {
  const fields = sortFieldsByOrder(config?.fields || []).filter(field => !field.hidden);

  if (!fields.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.map(field => renderFieldWithSubFields(field, values, onChange, errors, disabled, 0))}
    </div>
  );
};

export default CustomFormRenderer;
