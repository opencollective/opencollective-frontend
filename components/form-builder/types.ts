export type FieldType =
  | 'shortText'
  | 'longText'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'website';

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface SubFieldCondition {
  answer: string; // The answer value that triggers this sub-question
  subFields: FormFieldConfig[]; // Nested sub-questions
}

export interface FormFieldConfig {
  id: string;
  type: FieldType;
  label: string;
  hint?: string;
  placeholder?: string;
  required: boolean;
  hidden: boolean;
  options?: string[];
  validation?: FieldValidation;
  order: number;
  subFields?: SubFieldCondition[]; // Conditional sub-questions
}

export interface CustomFormConfig {
  fields: FormFieldConfig[];
}

export interface FieldTypeMetadata {
  label: string;
  description?: string;
  defaultPlaceholder?: string;
  supportsOptions?: boolean;
}
