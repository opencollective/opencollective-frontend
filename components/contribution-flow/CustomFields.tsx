import React from 'react';
import { get, merge, pick } from 'lodash';
import type { HTMLInputTypeAttribute } from 'react';
import { useIntl } from 'react-intl';

import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledSelect from '../StyledSelect';
import StyledTextarea from '../StyledTextarea';

type CommonFieldAttributes = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  useRequiredLabel?: boolean;
  hideOptionalLabel?: boolean;
  hint?: string;
  helpText?: string;
  isPrivate?: boolean;
};

type SelectFieldAttributes = CommonFieldAttributes & {
  type: 'select';
  options: { value: string; label: string }[];
  settings?: { isMulti?: boolean };
};

type TextareaFieldAttributes = CommonFieldAttributes & {
  type: 'textarea';
};

type HTMLInputFieldAttributes = CommonFieldAttributes & {
  type: HTMLInputTypeAttribute;
  pattern?: string;
};

type InputFieldAttributes = SelectFieldAttributes | TextareaFieldAttributes | HTMLInputFieldAttributes;

type FieldAttributes = InputFieldAttributes | { type: 'separator' };

type FieldsConfig = {
  fields: FieldAttributes[];
  translations?: Record<
    string, // The locale
    Record<string, string> // An object like { originalString: 'Translated string' }
  >;
};

type CustomFieldsProps = {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  config: FieldsConfig;
};

const getTranslator = (fieldsConfig: FieldsConfig, locale: string) => {
  if (fieldsConfig?.['translations']) {
    return (value: string) => {
      const i18nKey = `${locale}.${value}`;
      return get(fieldsConfig['translations'], i18nKey, value);
    };
  } else {
    return value => value;
  }
};

const normalizeConfig = (config: FieldsConfig | FieldAttributes[] | null): FieldsConfig => {
  if (!config) {
    return null;
  } else if (Array.isArray(config)) {
    return { fields: config };
  } else {
    return config;
  }
};

export const buildCustomFieldsConfig = (
  ...fieldsConfig: Array<FieldsConfig | FieldAttributes[] | null>
): FieldsConfig => {
  return merge({}, ...fieldsConfig.map(normalizeConfig));
};

const CustomFieldSelect = ({
  fieldProps,
  customField,
  onChange,
  translate,
  value,
}: {
  fieldProps: Record<string, any>;
  customField: SelectFieldAttributes;
  onChange: (value: any) => void;
  translate: (value: string) => string;
  value: any;
}) => {
  const options = customField.options?.map(option => ({ ...option, label: translate(option.label) })) || [];
  return (
    <StyledSelect
      inputId={fieldProps.id}
      name={fieldProps.name}
      required={fieldProps.required}
      disabled={fieldProps.disabled}
      onChange={onChange}
      isMulti={(customField as SelectFieldAttributes).settings?.isMulti}
      placeholder={translate(customField.placeholder)}
      width={1}
      options={options}
      value={options.find(option => option.value === value)}
    />
  );
};

const CustomFields = ({ config, data, onChange }: CustomFieldsProps) => {
  const intl = useIntl();
  const translate = React.useMemo(() => getTranslator(config, intl.locale), [config, intl.locale]);

  return config.fields.map((customFieldConfig, idx) => {
    if (customFieldConfig.type === 'separator') {
      // eslint-disable-next-line react/no-array-index-key
      return <StyledHr key={`separator-${idx}`} borderColor="black.200" my={2} />;
    }

    const customField = customFieldConfig as InputFieldAttributes;
    return (
      <StyledInputField
        // eslint-disable-next-line react/no-array-index-key
        key={`${idx}-${customField.name}`}
        mt={3}
        htmlFor={`custom-field-input-${customField.name}`}
        inputType={customField.type}
        width="100%"
        label={translate(customField.label || customField.name)}
        hint={translate(customField.hint)}
        helpText={translate(customField.helpText)}
        {...pick(customField, ['name', 'required', 'disabled', 'useRequiredLabel', 'hideOptionalLabel', 'isPrivate'])}
      >
        {fieldProps =>
          customField.type === 'textarea' ? (
            <StyledTextarea
              autoSize
              {...fieldProps}
              onChange={({ target }) => onChange({ ...data, [customField.name]: target.value })}
              maxHeight={500}
              minHeight={150}
              placeholder={translate(customField.placeholder)}
            />
          ) : customField.type === 'select' ? (
            <CustomFieldSelect
              fieldProps={fieldProps}
              customField={customField as SelectFieldAttributes}
              onChange={({ value }) => onChange({ ...data, [customField.name]: value })}
              value={data?.[fieldProps.name]}
              translate={translate}
            />
          ) : (
            <StyledInput
              {...fieldProps}
              width={1}
              value={data?.[customField.name] || ''}
              mt={customField.type === 'checkbox' ? '2px !important' : 0}
              css={customField.type === 'checkbox' ? { flex: '0 0 1em' } : undefined}
              placeholder={translate(customField.placeholder)}
              pattern={(customField as HTMLInputFieldAttributes).pattern}
              onChange={e =>
                onChange({
                  ...data,
                  [customField.name]: customField.type === 'checkbox' ? e.target.checked : e.target.value,
                })
              }
            />
          )
        }
      </StyledInputField>
    );
  });
};

export default CustomFields;
