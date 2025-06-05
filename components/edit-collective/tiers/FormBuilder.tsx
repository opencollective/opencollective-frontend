import React from 'react';
import PropTypes from 'prop-types';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '../../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Switch } from '../../ui/Switch';
import { Textarea } from '../../ui/Textarea';

const FIELD_TYPES = {
  SHORT_TEXT: 'SHORT_TEXT',
  LONG_TEXT: 'LONG_TEXT',
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
};

const FormBuilder = ({ fields = [], onChange }) => {
  const intl = useIntl();

  const fieldTypeOptions = [
    {
      value: FIELD_TYPES.SHORT_TEXT,
      label: intl.formatMessage({ id: 'form.field.shortText', defaultMessage: 'Short Text' }),
    },
    {
      value: FIELD_TYPES.LONG_TEXT,
      label: intl.formatMessage({ id: 'form.field.longText', defaultMessage: 'Long Text' }),
    },
    { value: FIELD_TYPES.NUMBER, label: intl.formatMessage({ id: 'form.field.number', defaultMessage: 'Number' }) },
    { value: FIELD_TYPES.SELECT, label: intl.formatMessage({ id: 'form.field.select', defaultMessage: 'Select' }) },
    {
      value: FIELD_TYPES.MULTI_SELECT,
      label: intl.formatMessage({ id: 'form.field.multiSelect', defaultMessage: 'Multi Select' }),
    },
    {
      value: FIELD_TYPES.CHECKBOX,
      label: intl.formatMessage({ id: 'form.field.checkbox', defaultMessage: 'Checkbox' }),
    },
    { value: FIELD_TYPES.RADIO, label: intl.formatMessage({ id: 'form.field.radio', defaultMessage: 'Radio' }) },
  ];

  const handleAddField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      type: FIELD_TYPES.SHORT_TEXT,
      label: '',
      required: false,
      options: [],
    };
    onChange([...fields, newField]);
  };

  const handleRemoveField = fieldId => {
    onChange(fields.filter(field => field.id !== fieldId));
  };

  const handleFieldChange = (fieldId, changes) => {
    onChange(fields.map(field => (field.id === fieldId ? { ...field, ...changes } : field)));
  };

  const handleMoveField = (fieldId, direction) => {
    const currentIndex = fields.findIndex(field => field.id === fieldId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= fields.length) {
      return;
    }

    const newFields = [...fields];
    const [movedField] = newFields.splice(currentIndex, 1);
    newFields.splice(newIndex, 0, movedField);

    onChange(newFields);
  };

  const renderFieldEditor = (field, index) => {
    return (
      <div key={field.id} className="mb-3 flex gap-2">
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="mb-3">
            <Select value={field.type} onValueChange={value => handleFieldChange(field.id, { type: value })}>
              <SelectTrigger>
                <SelectValue
                  placeholder={intl.formatMessage({ id: 'form.field.selectType', defaultMessage: 'Select field type' })}
                />
              </SelectTrigger>
              <SelectContent>
                {fieldTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-3">
            <input
              value={field.label}
              onChange={e => handleFieldChange(field.id, { label: e.target.value })}
              placeholder={intl.formatMessage({ id: 'form.field.label', defaultMessage: 'Field Label' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="mb-3 flex items-center">
            <Switch
              checked={field.required}
              onCheckedChange={checked => handleFieldChange(field.id, { required: checked })}
            />
            <div className="ml-2">
              <FormattedMessage id="form.field.required" defaultMessage="Required" />
            </div>
          </div>
          {(field.type === FIELD_TYPES.SELECT ||
            field.type === FIELD_TYPES.MULTI_SELECT ||
            field.type === FIELD_TYPES.RADIO) && (
            <div className="mb-3">
              <Textarea
                value={field.options?.join('\n') || ''}
                onChange={e => handleFieldChange(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                placeholder={intl.formatMessage({ id: 'form.field.options', defaultMessage: 'Options (one per line)' })}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => handleRemoveField(field.id)} variant="outline" size="icon-xs">
            <Trash2 size={16} />
          </Button>
          <Button
            onClick={() => handleMoveField(field.id, 'up')}
            disabled={index === 0}
            variant="outline"
            size="icon-xs"
            title={intl.formatMessage({ id: 'form.field.moveUp', defaultMessage: 'Move up' })}
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            onClick={() => handleMoveField(field.id, 'down')}
            disabled={index === fields.length - 1}
            variant="outline"
            size="icon-xs"
            title={intl.formatMessage({ id: 'form.field.moveDown', defaultMessage: 'Move down' })}
          >
            <ArrowDown size={16} />
          </Button>
        </div>
      </div>
    );
  };

  const renderFieldPreview = field => {
    return (
      <div className="mb-3" key={field.id}>
        <div className="mb-1">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </div>
        {field.type === FIELD_TYPES.SHORT_TEXT && (
          <input
            placeholder={intl.formatMessage({ id: 'form.field.enterText', defaultMessage: 'Enter text' })}
            className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        )}
        {field.type === FIELD_TYPES.LONG_TEXT && (
          <Textarea placeholder={intl.formatMessage({ id: 'form.field.enterText', defaultMessage: 'Enter text' })} />
        )}
        {field.type === FIELD_TYPES.NUMBER && (
          <input
            type="number"
            placeholder="0"
            className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        )}
        {field.type === FIELD_TYPES.SELECT && (
          <Select>
            <SelectTrigger>
              <SelectValue
                placeholder={intl.formatMessage({ id: 'form.field.selectOption', defaultMessage: 'Select an option' })}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {field.type === FIELD_TYPES.MULTI_SELECT && (
          <Select>
            <SelectTrigger>
              <SelectValue
                placeholder={intl.formatMessage({ id: 'form.field.selectOptions', defaultMessage: 'Select options' })}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {field.type === FIELD_TYPES.CHECKBOX && <Switch />}
        {field.type === FIELD_TYPES.RADIO && (
          <div>
            {field.options?.map(option => (
              <div key={option} className="mb-1 flex items-center">
                <input type="radio" name={field.id} className="mr-2" />
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full gap-8">
      <div className="flex-1 overflow-y-auto">
        <div>{fields.map((field, index) => renderFieldEditor(field, index))}</div>
        <Button onClick={handleAddField} variant="outline" className="mt-3">
          <Plus size={16} className="mr-2" />
          <FormattedMessage id="form.addField" defaultMessage="Add Field" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3">
          <FormattedMessage id="form.preview" defaultMessage="Preview" />
        </div>
        {fields.map(renderFieldPreview)}
      </div>
    </div>
  );
};

FormBuilder.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      required: PropTypes.bool,
      options: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  onChange: PropTypes.func.isRequired,
};

export default FormBuilder;
