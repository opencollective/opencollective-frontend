import React from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DefaultSelect } from '../ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

import { FormFieldEditor } from './FormFieldEditor';
import type { FormFieldConfig } from './types';
import { createDefaultField, getFieldTypeLabel } from './utils';

type FormFieldItemProps = {
  field: FormFieldConfig;
  onEdit: (field: FormFieldConfig) => void;
  onRemove?: (fieldId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  onAddSubQuestion?: (parentFieldId: string, answer: string, subField: FormFieldConfig) => void;
  onEditSubField?: (parentFieldId: string, answer: string, subField: FormFieldConfig) => void;
  onRemoveSubField?: (parentFieldId: string, answer: string, subFieldId: string) => void;
  onMoveSubField?: (parentFieldId: string, answer: string, subFieldId: string, direction: 'up' | 'down') => void;
  level?: number; // Nesting level for visual hierarchy
  conditionLabel?: string; // Label for the condition (e.g., "When answer is: Code")
  parentFieldId?: string; // ID of parent field (for nested fields)
  answer?: string; // Answer value for this condition (for nested fields)
};

export const FormFieldItem = React.forwardRef<HTMLDivElement, FormFieldItemProps>(
  (
    {
      field,
      onEdit,
      onRemove,
      onMoveUp,
      onMoveDown,
      isFirst,
      isLast,
      disabled,
      onAddSubQuestion,
      onEditSubField,
      onRemoveSubField,
      onMoveSubField,
      level = 0,
      conditionLabel,
      parentFieldId,
      answer,
    },
    ref,
  ) => {
    const intl = useIntl();
    const [showSubQuestions, setShowSubQuestions] = React.useState(false);
    const [selectedAnswer, setSelectedAnswer] = React.useState<string>('');
    const [editingSubField, setEditingSubField] = React.useState<FormFieldConfig | null>(null);
    const [isSubFieldEditorOpen, setIsSubFieldEditorOpen] = React.useState(false);
    const previousHasSubQuestionsRef = React.useRef<boolean>(false);

    const supportsSubQuestions = field.type === 'select' || field.type === 'checkbox';
    const hasSubQuestions = field.subFields && field.subFields.length > 0;

    // Calculate total number of sub-questions across all conditions
    const totalSubQuestionsCount = React.useMemo(() => {
      if (!field.subFields) {
        return 0;
      }
      return field.subFields.reduce((total, condition) => total + condition.subFields.length, 0);
    }, [field.subFields]);

    // Auto-expand only when sub-questions are first added (not when user manually hides)
    React.useEffect(() => {
      const previouslyHadSubQuestions = previousHasSubQuestionsRef.current;
      previousHasSubQuestionsRef.current = hasSubQuestions;

      // Only auto-expand if sub-questions were just added (transition from false to true)
      if (hasSubQuestions && !previouslyHadSubQuestions && !showSubQuestions) {
        setShowSubQuestions(true);
      }
    }, [hasSubQuestions, showSubQuestions]);

    // Get answer options for the conditional select
    const answerOptions = React.useMemo(() => {
      if (field.type === 'select' && field.options) {
        return field.options.map(option => ({ value: option, label: option }));
      } else if (field.type === 'checkbox') {
        return [
          { value: 'checked', label: intl.formatMessage({ defaultMessage: 'Checked', id: 'formBuilder.checked' }) },
          {
            value: 'unchecked',
            label: intl.formatMessage({ defaultMessage: 'Unchecked', id: 'formBuilder.unchecked' }),
          },
        ];
      }
      return [];
    }, [field.type, field.options, intl]);

    const handleAddSubQuestionClick = () => {
      if (!selectedAnswer) {
        return;
      }
      const draft = createDefaultField('shortText', 0);
      setEditingSubField(draft);
      setIsSubFieldEditorOpen(true);
    };

    const handleSaveSubField = (subField: FormFieldConfig) => {
      if (onAddSubQuestion && selectedAnswer) {
        onAddSubQuestion(field.id, selectedAnswer, subField);
        setSelectedAnswer('');
        setEditingSubField(null);
        setIsSubFieldEditorOpen(false);
      }
    };

    const handleCloseSubFieldEditor = () => {
      setIsSubFieldEditorOpen(false);
      setEditingSubField(null);
      // Don't reset selectedAnswer here - user might want to try again with same answer
    };

    const isNested = level > 0;

    const handleEdit = () => {
      if (isNested && onEditSubField && parentFieldId && answer) {
        onEditSubField(parentFieldId, answer, field);
      } else {
        onEdit(field);
      }
    };

    const handleRemove = () => {
      if (isNested && onRemoveSubField && parentFieldId && answer) {
        onRemoveSubField(parentFieldId, answer, field.id);
      } else if (onRemove) {
        onRemove(field.id);
      }
    };

    const handleMoveUp = () => {
      if (isNested && onMoveSubField && parentFieldId && answer) {
        onMoveSubField(parentFieldId, answer, field.id, 'up');
      } else if (onMoveUp) {
        onMoveUp();
      }
    };

    const handleMoveDown = () => {
      if (isNested && onMoveSubField && parentFieldId && answer) {
        onMoveSubField(parentFieldId, answer, field.id, 'down');
      } else if (onMoveDown) {
        onMoveDown();
      }
    };

    return (
      <div ref={ref}>
        {/* Condition label for nested fields */}
        {conditionLabel && <div className="mb-1 text-xs font-medium text-muted-foreground">{conditionLabel}</div>}

        <div className="flex w-full gap-2">
          {/* Field content */}
          <div className="flex grow items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  <Badge size="xs" className="px-2" round>
                    {getFieldTypeLabel(field.type)}
                  </Badge>
                  {field.hidden ? (
                    <Badge size="xs" type="outline" className="px-2" round>
                      <FormattedMessage defaultMessage="Hidden" id="formBuilder.badge.hidden" />
                    </Badge>
                  ) : field.required ? (
                    <Badge size="xs" type="warning" className="px-2" round>
                      <FormattedMessage defaultMessage="Required" id="formBuilder.badge.required" />
                    </Badge>
                  ) : (
                    <Badge size="xs" type="success" className="px-2" round>
                      <FormattedMessage defaultMessage="Optional" id="formBuilder.badge.optional" />
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex h-full items-center gap-3 border-l pl-4">
              <Button variant="outline" size="sm" onClick={handleEdit} disabled={disabled} className="gap-1">
                <Pencil size={14} />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemove}
                      disabled={disabled}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <FormattedMessage defaultMessage="Remove question" id="formBuilder.removeQuestion" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Move buttons */}
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={handleMoveUp}
              disabled={isFirst || disabled}
              aria-label="Move up"
            >
              <ChevronUp size={12} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={handleMoveDown}
              disabled={isLast || disabled}
              aria-label="Move down"
            >
              <ChevronDown size={12} />
            </Button>
          </div>
        </div>

        {/* Sub-questions section */}
        {supportsSubQuestions && (
          <div className="flex w-[calc(100%-40px)] flex-col gap-2 pl-4">
            {!showSubQuestions ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSubQuestions(true)}
                disabled={disabled}
                className="w-full gap-1 border-r border-b border-l border-dashed text-sm"
              >
                {hasSubQuestions ? (
                  <FormattedMessage
                    defaultMessage="Show {count, plural, one {1 sub-question} other {{count} sub-questions}}"
                    id="formBuilder.showSubQuestions"
                    values={{ count: totalSubQuestionsCount }}
                  />
                ) : (
                  <React.Fragment>
                    <Plus size={14} />
                    <FormattedMessage defaultMessage="Add sub-questions" id="formBuilder.addSubQuestions" />
                  </React.Fragment>
                )}
              </Button>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      <FormattedMessage defaultMessage="Sub-questions" id="formBuilder.subQuestions" />
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSubQuestions(false);
                        setSelectedAnswer('');
                      }}
                      disabled={disabled}
                      className="h-6 px-2 text-xs"
                    >
                      {hasSubQuestions ? (
                        <FormattedMessage defaultMessage="Hide" id="formBuilder.hide" />
                      ) : (
                        <FormattedMessage defaultMessage="Close" id="close" />
                      )}
                    </Button>
                  </div>

                  {/* Display existing sub-questions recursively */}
                  {hasSubQuestions && (
                    <div className="flex flex-col gap-3 border-t pt-3">
                      {field.subFields?.map(condition => {
                        const conditionLabelText = intl.formatMessage(
                          {
                            defaultMessage: 'When answer is: {answer}',
                            id: 'formBuilder.whenAnswerIsValue',
                          },
                          { answer: condition.answer },
                        );
                        return (
                          <div key={condition.answer} className="flex flex-col gap-2">
                            {condition.subFields.map((subField, subIndex) => (
                              <FormFieldItem
                                key={subField.id}
                                field={subField}
                                onEdit={onEdit}
                                onRemove={onRemove}
                                onMoveUp={onMoveUp}
                                onMoveDown={onMoveDown}
                                isFirst={subIndex === 0}
                                isLast={subIndex === condition.subFields.length - 1}
                                disabled={disabled}
                                onAddSubQuestion={onAddSubQuestion}
                                onEditSubField={onEditSubField}
                                onRemoveSubField={onRemoveSubField}
                                onMoveSubField={onMoveSubField}
                                level={level + 1}
                                conditionLabel={subIndex === 0 ? conditionLabelText : undefined}
                                parentFieldId={field.id}
                                answer={condition.answer}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new sub-question form */}
                  <div className="flex flex-col gap-2 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        <FormattedMessage defaultMessage="When answer is" id="formBuilder.whenAnswerIs" />
                      </span>
                      <div className="flex-1">
                        <DefaultSelect
                          name="sub-question-answer"
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSubQuestionClick}
                      disabled={!selectedAnswer || disabled}
                      className="w-fit gap-1"
                    >
                      <Plus size={14} />
                      <FormattedMessage defaultMessage="Add sub-question" id="formBuilder.addSubQuestion" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sub-field editor modal */}
        {editingSubField && (
          <FormFieldEditor
            field={editingSubField}
            open={isSubFieldEditorOpen}
            onClose={handleCloseSubFieldEditor}
            onSave={handleSaveSubField}
          />
        )}
      </div>
    );
  },
);
