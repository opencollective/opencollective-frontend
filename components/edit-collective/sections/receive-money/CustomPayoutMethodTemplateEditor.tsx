import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import RichTextEditor from '../../../RichTextEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/Tabs';

import { CustomPayoutMethodInstructions } from './CustomPayoutMethodInstructions';

type CustomPayoutMethodTemplateEditorProps = {
  /** Current instructions template value */
  value: string;
  /** Callback when instructions change */
  onChange: (value: string) => void;
  /** Formatted values to use in preview */
  formattedValues: {
    account?: string;
    reference?: string;
    OrderId?: string;
    amount?: string;
    collective?: string;
    [key: string]: string | undefined;
  };
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional minimum height for the editor */
  editorMinHeight?: number;
  /** Optional data-cy attribute for testing */
  'data-cy'?: string;
  error?: boolean;
};

/**
 * Component that provides a RichTextEditor with template/preview tabs for editing
 * custom payout method instructions. The preview shows how the instructions will
 * look with variable replacements.
 */
export const CustomPayoutMethodTemplateEditor = ({
  value,
  onChange,
  formattedValues,
  placeholder,
  editorMinHeight = 200,
  error = undefined,
  'data-cy': dataCy,
}: CustomPayoutMethodTemplateEditorProps) => {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<'template' | 'preview'>('template');

  return (
    <Tabs
      value={activeTab}
      onValueChange={value => setActiveTab(value as 'template' | 'preview')}
      className="mt-4"
    >
      <TabsList>
        <TabsTrigger value="template">
          <FormattedMessage defaultMessage="Template" id="3JxaKs" />
        </TabsTrigger>
        <TabsTrigger value="preview">
          <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="template">
        <RichTextEditor
          version="simplified"
          withBorders
          error={error}
          kind="CUSTOM_PAYMENT_METHOD_TEMPLATE"
          inputName="instructions"
          defaultValue={value}
          onChange={e => onChange(e.target.value)}
          imageUploadEnabled
          placeholder={
            placeholder ||
            intl.formatMessage({
              defaultMessage: 'Enter payment instructions...',
              id: 'XQnAaA',
            })
          }
          editorMinHeight={editorMinHeight}
          data-cy={dataCy}
        />
      </TabsContent>
      <TabsContent value="preview">
        <div
          className="min-h-[275px] rounded border bg-gray-50 px-3 py-6 text-sm"
          id="instructions-preview"
        >
          <CustomPayoutMethodInstructions instructions={value} formattedValues={formattedValues} />
        </div>
      </TabsContent>
    </Tabs>
  );
};
