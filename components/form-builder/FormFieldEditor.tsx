import React from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { DefaultSelect } from '../ui/Select';
import { Separator } from '../ui/Separator';
import { Switch } from '../ui/Switch';

import type { FieldType, FormFieldConfig } from './types';
import { FIELD_TYPE_METADATA, validateFieldConfig } from './utils';

type FormFieldEditorProps = {
  field: FormFieldConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (field: FormFieldConfig, answer?: string) => void;
  parentField?: FormFieldConfig; // Parent field for nested sub-questions
  currentAnswer?: string; // Current answer value for the condition
};

const fieldTypeOptions = Object.entries(FIELD_TYPE_METADATA).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  field,
  open,
  onClose,
  onSave,
  parentField,
  currentAnswer,
}) => {
  const intl = useIntl();
  const [draft, setDraft] = React.useState<FormFieldConfig | null>(field);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string>(currentAnswer || '');
  const [errors, setErrors] = React.useState<string[]>([]);
  const previousTypeRef = React.useRef<FieldType | undefined>(field?.type);

  React.useEffect(() => {
    setDraft(field);
    setSelectedAnswer(currentAnswer || '');
    setErrors([]);
    previousTypeRef.current = field?.type;
  }, [field, open, currentAnswer]);

  const updateField = <Key extends keyof FormFieldConfig>(key: Key, value: FormFieldConfig[Key]) => {
    setDraft(current => {
      if (!current) {
        return current;
      }
      // Reset validation when type changes
      if (key === 'type' && previousTypeRef.current !== value) {
        previousTypeRef.current = value as FieldType;
        return { ...current, [key]: value, validation: undefined };
      }
      return { ...current, [key]: value };
    });
  };

  const handleSave = () => {
    if (!draft) {
      return;
    }
    const validationErrors = validateFieldConfig(draft);

    // Validate that an answer is selected for nested fields
    if (isNestedField && !selectedAnswer) {
      setErrors([
        ...validationErrors,
        intl.formatMessage({
          defaultMessage: 'Please select an answer condition for this nested field.',
          id: 'formBuilder.nestedFieldAnswerRequired',
        }),
      ]);
      return;
    }

    setErrors(validationErrors);
    if (validationErrors.length) {
      return;
    }
    // If this is a nested field, always pass the selected answer
    const answerToSave = isNestedField ? selectedAnswer : undefined;
    onSave(draft, answerToSave);
    onClose();
  };

  // Get answer options for the parent field condition
  const answerOptions = React.useMemo(() => {
    if (!parentField) {
      return [];
    }
    if (parentField.type === 'select' && parentField.options) {
      return parentField.options.map(option => ({ value: option, label: option }));
    } else if (parentField.type === 'checkbox') {
      return [
        { value: 'checked', label: intl.formatMessage({ defaultMessage: 'Checked', id: 'formBuilder.checked' }) },
        {
          value: 'unchecked',
          label: intl.formatMessage({ defaultMessage: 'Unchecked', id: 'formBuilder.unchecked' }),
        },
      ];
    }
    return [];
  }, [parentField, intl]);

  const isNestedField = Boolean(parentField);

  const showOptions = draft?.type === 'select';
  const isTextType = draft?.type === 'shortText' || draft?.type === 'longText';
  const isNumberType = draft?.type === 'number';
  const isDateType = draft?.type === 'date';
  const showLengthValidation = isTextType;
  const showValueValidation = isNumberType || isDateType;

  const addOption = () => {
    if (!draft) {
      return;
    }
    const newOptions = [...(draft.options || []), ''];
    updateField('options', newOptions);
  };

  const removeOption = (index: number) => {
    if (!draft || !draft.options) {
      return;
    }
    const newOptions = draft.options.filter((_, i) => i !== index);
    updateField('options', newOptions);
  };

  const updateOption = (index: number, value: string) => {
    if (!draft || !draft.options) {
      return;
    }
    const newOptions = [...draft.options];
    newOptions[index] = value;
    updateField('options', newOptions);
  };

  const moveOptionUp = (index: number) => {
    if (!draft || !draft.options || index === 0) {
      return;
    }
    const newOptions = [...draft.options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    updateField('options', newOptions);
  };

  const moveOptionDown = (index: number) => {
    if (!draft || !draft.options || index === draft.options.length - 1) {
      return;
    }
    const newOptions = [...draft.options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    updateField('options', newOptions);
  };

  // Helper to format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateValue: number | undefined): string => {
    if (!dateValue) {
      return '';
    }
    // If it's a timestamp, convert to date string
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  };

  // Helper to parse date from input to timestamp
  const parseDateFromInput = (dateString: string): number | undefined => {
    if (!dateString) {
      return undefined;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date.getTime();
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-xl" aria-describedby="edit-form-field-description">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Edit question" id="formBuilder.editQuestion" />
          </DialogTitle>
          <p id="edit-form-field-description" className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Customize the questions for your application form." id="9tQTbg" />
          </p>
        </DialogHeader>

        {draft && (
          <div className="flex flex-col gap-4">
            {/* Condition editor for nested fields */}
            {isNestedField && parentField && (
              <div className="mb-3 flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs">
                <Label htmlFor="field-condition" className="text-foreground">
                  <FormattedMessage
                    defaultMessage="Parent condition: {parentLabel}"
                    id="formBuilder.parentCondition"
                    values={{ parentLabel: <span className="text-muted-foreground">{parentField.label}</span> }}
                  />
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="When answer is" id="formBuilder.whenAnswerIs" />
                  </span>
                  <div className="flex-1">
                    <DefaultSelect
                      name="field-condition"
                      placeholder={intl.formatMessage({
                        defaultMessage: 'Select answer',
                        id: 'formBuilder.selectAnswer',
                      })}
                      value={selectedAnswer}
                      setValue={setSelectedAnswer}
                      options={answerOptions}
                    />
                  </div>
                </div>
                {answerOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="No answer options available for this parent field type."
                      id="formBuilder.noAnswerOptions"
                    />
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="field-label">
                <FormattedMessage defaultMessage="Label" id="label" />
              </Label>
              <Input
                id="field-label"
                value={draft.label}
                onChange={event => updateField('label', event.target.value)}
                placeholder={intl.formatMessage({
                  defaultMessage: 'Question label',
                  id: 'formBuilder.label.placeholder',
                })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="field-type">
                <FormattedMessage defaultMessage="Field type" id="formBuilder.fieldType" />
              </Label>
              <DefaultSelect
                name="field-type"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Select field type',
                  id: 'formBuilder.fieldType.placeholder',
                })}
                value={draft.type}
                setValue={value => updateField('type', value as FieldType)}
                options={fieldTypeOptions}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="field-hint" className="text-muted-foreground">
                <FormattedMessage
                  defaultMessage="{field} (optional)"
                  id="OptionalFieldLabel"
                  values={{
                    field: (
                      <span className="text-foreground">
                        {intl.formatMessage({ defaultMessage: 'Hint', id: 'formBuilder.hint' })}
                      </span>
                    ),
                  }}
                />
              </Label>
              <Input
                id="field-hint"
                value={draft.hint || ''}
                onChange={event => updateField('hint', event.target.value)}
                placeholder={intl.formatMessage({
                  defaultMessage: 'Helpful text shown above the placeholder',
                  id: 'formBuilder.hint.placeholder',
                })}
              />
            </div>

            {draft.type !== 'checkbox' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="field-placeholder" className="text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="{field} (optional)"
                    id="OptionalFieldLabel"
                    values={{
                      field: (
                        <span className="text-foreground">
                          {intl.formatMessage({ defaultMessage: 'Placeholder', id: 'formBuilder.placeholder' })}
                        </span>
                      ),
                    }}
                  />
                </Label>
                <Input
                  id="field-placeholder"
                  value={draft.placeholder || ''}
                  onChange={event => updateField('placeholder', event.target.value)}
                  placeholder={
                    FIELD_TYPE_METADATA[draft.type]?.defaultPlaceholder ||
                    intl.formatMessage({ defaultMessage: 'Placeholder', id: 'formBuilder.placeholder.fallback' })
                  }
                />
              </div>
            )}

            {showOptions && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="field-options">
                    <FormattedMessage defaultMessage="Options" id="formBuilder.options" />
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4" />
                    <FormattedMessage defaultMessage="Add option" id="formBuilder.addOption" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {(draft.options || []).map((option, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={event => updateOption(index, event.target.value)}
                        placeholder={intl.formatMessage({
                          defaultMessage: 'Option label',
                          id: 'formBuilder.optionLabel.placeholder',
                        })}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveOptionUp(index)}
                        disabled={index === 0}
                        aria-label={intl.formatMessage({
                          defaultMessage: 'Move option up',
                          id: 'formBuilder.moveOptionUp',
                        })}
                      >
                        <ChevronUp size={12} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveOptionDown(index)}
                        disabled={index === (draft.options?.length || 0) - 1}
                        aria-label={intl.formatMessage({
                          defaultMessage: 'Move option down',
                          id: 'formBuilder.moveOptionDown',
                        })}
                      >
                        <ChevronDown size={12} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        aria-label={intl.formatMessage({
                          defaultMessage: 'Remove option',
                          id: 'formBuilder.removeOption',
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!draft.options || draft.options.length === 0) && (
                    <p className="rounded-md border border-dashed border-gray-300 p-2 text-sm text-muted-foreground">
                      <FormattedMessage
                        defaultMessage='No options yet. Click "Add option" to add one.'
                        id="formBuilder.noOptions"
                      />
                    </p>
                  )}
                </div>
              </div>
            )}

            {showLengthValidation && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="field-min-length" className="text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="{field} (optional)"
                      id="OptionalFieldLabel"
                      values={{
                        field: (
                          <span className="text-foreground">
                            {intl.formatMessage({
                              defaultMessage: 'Min length',
                              id: 'formBuilder.validation.minLength',
                            })}
                          </span>
                        ),
                      }}
                    />
                  </Label>
                  <Input
                    id="field-min-length"
                    type="number"
                    min="0"
                    value={draft.validation?.minLength ?? ''}
                    onChange={event =>
                      updateField('validation', {
                        ...draft.validation,
                        minLength: event.target.value ? Number(event.target.value) : undefined,
                      })
                    }
                    placeholder={intl.formatMessage({
                      defaultMessage: 'e.g. 1',
                      id: 'formBuilder.validation.minLength.placeholder',
                    })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="field-max-length" className="text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="{field} (optional)"
                      id="OptionalFieldLabel"
                      values={{
                        field: (
                          <span className="text-foreground">
                            {intl.formatMessage({
                              defaultMessage: 'Max length',
                              id: 'formBuilder.validation.maxLength',
                            })}
                          </span>
                        ),
                      }}
                    />
                  </Label>
                  <Input
                    id="field-max-length"
                    type="number"
                    min="0"
                    value={draft.validation?.maxLength ?? ''}
                    onChange={event =>
                      updateField('validation', {
                        ...draft.validation,
                        maxLength: event.target.value ? Number(event.target.value) : undefined,
                      })
                    }
                    placeholder={intl.formatMessage({
                      defaultMessage: 'e.g. 255',
                      id: 'formBuilder.validation.maxLength.placeholder',
                    })}
                  />
                </div>
              </div>
            )}

            {showValueValidation && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="field-min" className="text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="{field} (optional)"
                      id="OptionalFieldLabel"
                      values={{
                        field: (
                          <span className="text-foreground">
                            {isNumberType
                              ? intl.formatMessage({
                                  defaultMessage: 'Min value',
                                  id: 'formBuilder.validation.minValue',
                                })
                              : intl.formatMessage({
                                  defaultMessage: 'Min date',
                                  id: 'formBuilder.validation.minDate',
                                })}
                          </span>
                        ),
                      }}
                    />
                  </Label>
                  <Input
                    id="field-min"
                    type={isDateType ? 'date' : 'number'}
                    value={isDateType ? formatDateForInput(draft.validation?.min) : (draft.validation?.min ?? '')}
                    onChange={event =>
                      updateField('validation', {
                        ...draft.validation,
                        min: isDateType
                          ? parseDateFromInput(event.target.value)
                          : event.target.value
                            ? Number(event.target.value)
                            : undefined,
                      })
                    }
                    placeholder={
                      isDateType
                        ? intl.formatMessage({
                            defaultMessage: 'YYYY-MM-DD',
                            id: 'formBuilder.validation.minDate.placeholder',
                          })
                        : intl.formatMessage({
                            defaultMessage: 'e.g. 1',
                            id: 'formBuilder.validation.minValue.placeholder',
                          })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="field-max" className="text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="{field} (optional)"
                      id="OptionalFieldLabel"
                      values={{
                        field: (
                          <span className="text-foreground">
                            {intl.formatMessage({
                              defaultMessage: 'Max value',
                              id: 'formBuilder.validation.maxValue',
                            })}
                          </span>
                        ),
                      }}
                    />
                  </Label>
                  <Input
                    id="field-max"
                    type={isDateType ? 'date' : 'number'}
                    value={isDateType ? formatDateForInput(draft.validation?.max) : (draft.validation?.max ?? '')}
                    onChange={event =>
                      updateField('validation', {
                        ...draft.validation,
                        max: isDateType
                          ? parseDateFromInput(event.target.value)
                          : event.target.value
                            ? Number(event.target.value)
                            : undefined,
                      })
                    }
                    placeholder={
                      isDateType
                        ? intl.formatMessage({
                            defaultMessage: 'YYYY-MM-DD',
                            id: 'formBuilder.validation.maxDate.placeholder',
                          })
                        : intl.formatMessage({
                            defaultMessage: 'e.g. 100',
                            id: 'formBuilder.validation.maxValue.placeholder',
                          })
                    }
                  />
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                <ul className="list-disc space-y-1 pl-4">
                  {errors.map(error => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">
                  <FormattedMessage defaultMessage="Required" id="formBuilder.required" />
                </p>
                <p className="text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Applicants must answer" id="formBuilder.required.help" />
                </p>
              </div>
              <Switch checked={draft.required} onCheckedChange={checked => updateField('required', Boolean(checked))} />
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
          </Button>
          <Button onClick={handleSave} disabled={!draft}>
            <FormattedMessage defaultMessage="Save" id="save" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
