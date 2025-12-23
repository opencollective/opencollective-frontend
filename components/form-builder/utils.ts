import { v7 as uuid } from 'uuid';

import type { FieldType, FieldTypeMetadata, FormFieldConfig } from './types';

export const FIELD_TYPE_METADATA: Record<FieldType, FieldTypeMetadata> = {
  shortText: {
    label: 'Short Text',
    defaultPlaceholder: 'Enter text',
  },
  longText: {
    label: 'Long Text',
    defaultPlaceholder: 'Enter a longer response',
  },
  email: {
    label: 'Email',
    defaultPlaceholder: 'email@example.com',
  },
  phone: {
    label: 'Phone',
    defaultPlaceholder: '+1 555 123 4567',
  },
  number: {
    label: 'Number',
    defaultPlaceholder: '123',
  },
  date: {
    label: 'Date',
    defaultPlaceholder: 'YYYY-MM-DD',
  },
  select: {
    label: 'Select',
    defaultPlaceholder: 'Select an option',
    supportsOptions: true,
  },
  checkbox: {
    label: 'Checkbox',
    defaultPlaceholder: '',
  },
  website: {
    label: 'Website',
    defaultPlaceholder: 'https://example.com',
  },
};

export const createDefaultField = (type: FieldType, order = 0): FormFieldConfig => {
  return {
    id: uuid(),
    type,
    label: '',
    placeholder: undefined,
    required: false,
    hidden: false,
    options: undefined,
    validation: undefined,
    order,
  };
};

export const getFieldTypeLabel = (type: FieldType) => FIELD_TYPE_METADATA[type]?.label || type;

export const sortFieldsByOrder = (fields: FormFieldConfig[]) =>
  [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const validateFieldConfig = (field: FormFieldConfig): string[] => {
  const errors: string[] = [];

  if (!field.label?.trim()) {
    errors.push('Label is required');
  }

  if (field.type === 'select') {
    if (!field.options?.length) {
      errors.push('Select fields require at least one option');
    }
  }

  if (field.validation) {
    const { min, max, minLength, maxLength } = field.validation;
    if (typeof min === 'number' && typeof max === 'number' && min > max) {
      errors.push('Validation min cannot be greater than max');
    }
    if (typeof minLength === 'number' && typeof maxLength === 'number' && minLength > maxLength) {
      errors.push('Validation minLength cannot be greater than maxLength');
    }
  }

  return errors;
};
