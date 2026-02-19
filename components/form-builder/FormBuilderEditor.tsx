import React from 'react';
import { Eye, Plus } from 'lucide-react';
import FlipMove from 'react-flip-move';
import { FormattedMessage } from 'react-intl';

import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

import { CustomFormRenderer } from './CustomFormRenderer';
import { FormFieldEditor } from './FormFieldEditor';
import { FormFieldItem } from './FormFieldItem';
import type { CustomFormConfig, FormFieldConfig, SubFieldCondition } from './types';
import { createDefaultField, sortFieldsByOrder } from './utils';

type FormBuilderEditorProps = {
  value?: CustomFormConfig;
  onChange: (config: CustomFormConfig) => void;
  disabled?: boolean;
};

export const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ value, onChange, disabled }) => {
  const [editingField, setEditingField] = React.useState<FormFieldConfig | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [previewValues, setPreviewValues] = React.useState<Record<string, any>>({});
  const [editingSubFieldContext, setEditingSubFieldContext] = React.useState<{
    parentFieldId: string;
    answer: string;
  } | null>(null);

  const fields = React.useMemo(() => sortFieldsByOrder(value?.fields || []), [value]);

  const updateFields = (nextFields: FormFieldConfig[]) => {
    const normalized = nextFields.map((field, index) => ({ ...field, order: index }));
    onChange({ fields: normalized });
  };

  const handleAddField = () => {
    const draft = createDefaultField('shortText', fields.length);
    setEditingField(draft);
    setIsEditorOpen(true);
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(field => field.id === fieldId);
    if (currentIndex === -1) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) {
      return;
    }

    const reordered = [...fields];
    reordered.splice(newIndex, 0, reordered.splice(currentIndex, 1)[0]);
    updateFields(reordered);
  };

  const handleEditField = (field: FormFieldConfig) => {
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleRemoveField = (fieldId: string) => {
    updateFields(fields.filter(field => field.id !== fieldId));
  };

  const handleSaveField = (updatedField: FormFieldConfig, newAnswer?: string) => {
    // Check if this is a nested field edit
    if (editingSubFieldContext) {
      const { parentFieldId, answer } = editingSubFieldContext;

      const found = findFieldRecursive(fields, parentFieldId);
      if (!found) {
        return;
      }

      const parentField = found.field;
      const existingSubFields = parentField.subFields || [];
      const conditionIndex = existingSubFields.findIndex(condition => condition.answer === answer);
      if (conditionIndex === -1) {
        return;
      }

      const condition = existingSubFields[conditionIndex];
      const subFieldIndex = condition.subFields.findIndex(sf => sf.id === updatedField.id);
      if (subFieldIndex === -1) {
        return;
      }

      // If answer changed, move the sub-field to a different condition
      if (newAnswer && newAnswer !== answer) {
        // Remove from old condition
        const updatedSubFields = condition.subFields.filter((_, idx) => idx !== subFieldIndex);
        let updatedConditions: SubFieldCondition[];

        if (updatedSubFields.length === 0) {
          // Remove the entire condition if no sub-fields remain
          updatedConditions = existingSubFields.filter((_, idx) => idx !== conditionIndex);
        } else {
          // Update the condition with remaining sub-fields
          updatedConditions = [...existingSubFields];
          updatedConditions[conditionIndex] = {
            ...condition,
            subFields: updatedSubFields,
          };
        }

        // Add to new condition (or create it)
        const newConditionIndex = updatedConditions.findIndex(c => c.answer === newAnswer);
        if (newConditionIndex === -1) {
          // Create new condition
          updatedConditions.push({
            answer: newAnswer,
            subFields: [updatedField],
          });
        } else {
          // Add to existing condition
          updatedConditions[newConditionIndex] = {
            ...updatedConditions[newConditionIndex],
            subFields: [...updatedConditions[newConditionIndex].subFields, updatedField],
          };
        }

        // Update recursively
        const nextFields = updateFieldRecursive(fields, parentFieldId, field => ({
          ...field,
          subFields: updatedConditions,
        }));

        updateFields(nextFields);
      } else {
        // Just update the sub-field in place
        const updatedSubFields = [...existingSubFields];
        updatedSubFields[conditionIndex] = {
          ...condition,
          subFields: condition.subFields.map((sf, idx) => (idx === subFieldIndex ? updatedField : sf)),
        };

        // Update recursively
        const nextFields = updateFieldRecursive(fields, parentFieldId, field => ({
          ...field,
          subFields: updatedSubFields,
        }));

        updateFields(nextFields);
      }

      setEditingSubFieldContext(null);
    } else {
      // Regular field edit
      const exists = fields.some(field => field.id === updatedField.id);
      const nextOrder = exists ? updatedField.order : fields.length;
      const normalizedField = { ...updatedField, order: nextOrder };

      const nextFields = exists
        ? fields.map(field => (field.id === normalizedField.id ? normalizedField : field))
        : [...fields, normalizedField];

      updateFields(nextFields);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingField(null);
    setEditingSubFieldContext(null);
  };

  // Recursive helper to find a field by ID at any nesting level
  const findFieldRecursive = (
    fieldsToSearch: FormFieldConfig[],
    targetId: string,
  ): { field: FormFieldConfig; path: FormFieldConfig[] } | null => {
    for (const field of fieldsToSearch) {
      if (field.id === targetId) {
        return { field, path: [field] };
      }
      if (field.subFields) {
        for (const condition of field.subFields) {
          const found = findFieldRecursive(condition.subFields, targetId);
          if (found) {
            return { field: found.field, path: [field, ...found.path] };
          }
        }
      }
    }
    return null;
  };

  // Recursive helper to update a field at any nesting level
  const updateFieldRecursive = (
    fieldsToUpdate: FormFieldConfig[],
    targetId: string,
    updater: (field: FormFieldConfig) => FormFieldConfig,
  ): FormFieldConfig[] => {
    return fieldsToUpdate.map(field => {
      if (field.id === targetId) {
        return updater(field);
      }
      if (field.subFields) {
        return {
          ...field,
          subFields: field.subFields.map(condition => ({
            ...condition,
            subFields: updateFieldRecursive(condition.subFields, targetId, updater),
          })),
        };
      }
      return field;
    });
  };

  const handleAddSubQuestion = (parentFieldId: string, answer: string, subField: FormFieldConfig) => {
    const found = findFieldRecursive(fields, parentFieldId);
    if (!found) {
      return;
    }

    const parentField = found.field;
    const existingSubFields = parentField.subFields || [];

    // Find or create the condition for this answer
    const conditionIndex = existingSubFields.findIndex(condition => condition.answer === answer);
    let updatedSubFields: SubFieldCondition[];

    if (conditionIndex === -1) {
      // Create new condition
      updatedSubFields = [
        ...existingSubFields,
        {
          answer,
          subFields: [subField],
        },
      ];
    } else {
      // Add to existing condition
      updatedSubFields = [...existingSubFields];
      updatedSubFields[conditionIndex] = {
        ...updatedSubFields[conditionIndex],
        subFields: [...updatedSubFields[conditionIndex].subFields, subField],
      };
    }

    // Update the parent field with new subFields recursively
    const nextFields = updateFieldRecursive(fields, parentFieldId, field => ({
      ...field,
      subFields: updatedSubFields,
    }));

    updateFields(nextFields);
  };

  const handleEditSubField = (parentFieldId: string, answer: string, subField: FormFieldConfig) => {
    // Verify the parent field exists (could be nested)
    const found = findFieldRecursive(fields, parentFieldId);
    if (!found) {
      return;
    }
    setEditingSubFieldContext({ parentFieldId, answer });
    setEditingField(subField);
    setIsEditorOpen(true);
  };

  const handleRemoveSubField = (parentFieldId: string, answer: string, subFieldId: string) => {
    const found = findFieldRecursive(fields, parentFieldId);
    if (!found) {
      return;
    }

    const parentField = found.field;
    const existingSubFields = parentField.subFields || [];
    const conditionIndex = existingSubFields.findIndex(condition => condition.answer === answer);
    if (conditionIndex === -1) {
      return;
    }

    const condition = existingSubFields[conditionIndex];
    const updatedSubFields = condition.subFields.filter(sf => sf.id !== subFieldId);

    let updatedConditions: SubFieldCondition[];
    if (updatedSubFields.length === 0) {
      // Remove the entire condition if no sub-fields remain
      updatedConditions = existingSubFields.filter((_, idx) => idx !== conditionIndex);
    } else {
      // Update the condition with remaining sub-fields
      updatedConditions = [...existingSubFields];
      updatedConditions[conditionIndex] = {
        ...condition,
        subFields: updatedSubFields,
      };
    }

    // Update recursively
    const nextFields = updateFieldRecursive(fields, parentFieldId, field => ({
      ...field,
      subFields: updatedConditions,
    }));

    updateFields(nextFields);
  };

  const handleMoveSubField = (parentFieldId: string, answer: string, subFieldId: string, direction: 'up' | 'down') => {
    const found = findFieldRecursive(fields, parentFieldId);
    if (!found) {
      return;
    }

    const parentField = found.field;
    const existingSubFields = parentField.subFields || [];
    const conditionIndex = existingSubFields.findIndex(condition => condition.answer === answer);
    if (conditionIndex === -1) {
      return;
    }

    const condition = existingSubFields[conditionIndex];
    const subFieldIndex = condition.subFields.findIndex(sf => sf.id === subFieldId);
    if (subFieldIndex === -1) {
      return;
    }

    const newIndex = direction === 'up' ? subFieldIndex - 1 : subFieldIndex + 1;
    if (newIndex < 0 || newIndex >= condition.subFields.length) {
      return;
    }

    // Reorder sub-fields
    const reordered = [...condition.subFields];
    reordered.splice(newIndex, 0, reordered.splice(subFieldIndex, 1)[0]);

    const updatedSubFields = [...existingSubFields];
    updatedSubFields[conditionIndex] = {
      ...condition,
      subFields: reordered,
    };

    // Update recursively
    const nextFields = updateFieldRecursive(fields, parentFieldId, field => ({
      ...field,
      subFields: updatedSubFields,
    }));

    updateFields(nextFields);
  };

  console.log(fields);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold">
            <FormattedMessage defaultMessage="Questions" id="formBuilder.questions" />
          </p>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="Customize the questions that applicants will see on your application form."
              id="formBuilder.questions.help"
            />
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPreviewOpen(true)}
          disabled={disabled || fields.length === 0}
          className="gap-1"
        >
          <Eye size={16} />
          <FormattedMessage defaultMessage="Preview form" id="formBuilder.previewForm" />
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <FormattedMessage
            defaultMessage="No questions yet. Use “Add a question” to get started."
            id="formBuilder.emptyState"
          />
        </div>
      ) : (
        <FlipMove className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <FormFieldItem
              key={field.id}
              field={field}
              onEdit={handleEditField}
              onRemove={handleRemoveField}
              onMoveUp={() => handleMoveField(field.id, 'up')}
              onMoveDown={() => handleMoveField(field.id, 'down')}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              disabled={disabled}
              onAddSubQuestion={handleAddSubQuestion}
              onEditSubField={handleEditSubField}
              onRemoveSubField={handleRemoveSubField}
              onMoveSubField={handleMoveSubField}
            />
          ))}
        </FlipMove>
      )}

      <div className="mt-5 flex">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddField}
          disabled={disabled}
          className="gap-1"
        >
          <Plus size={16} />
          <FormattedMessage defaultMessage="Add a question" id="formBuilder.addQuestion" />
        </Button>
      </div>

      <FormFieldEditor
        field={editingField}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveField}
        parentField={
          editingSubFieldContext ? findFieldRecursive(fields, editingSubFieldContext.parentFieldId)?.field : undefined
        }
        currentAnswer={editingSubFieldContext?.answer}
      />

      <Dialog
        open={isPreviewOpen}
        onOpenChange={open => {
          setIsPreviewOpen(open);
          if (!open) {
            // Reset preview values when dialog closes
            setPreviewValues({});
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage defaultMessage="Form Preview" id="formBuilder.previewTitle" />
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CustomFormRenderer
              config={value}
              values={previewValues}
              onChange={(name, fieldValue) => {
                setPreviewValues(prev => ({ ...prev, [name]: fieldValue }));
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilderEditor;
