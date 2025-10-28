import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import PreviewModal from '../../../PreviewModal';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Label } from '../../../ui/Label';
import { Textarea } from '../../../ui/Textarea';

import type { UseReceipt } from './hooks/useReceipt';
import { ReceiptField, ReceiptTemplate } from './hooks/useReceipt';

type ReceiptTemplateFormProps = {
  receipt: UseReceipt;
  onChange: () => void;
};

const ReceiptTemplateForm = ({ receipt, onChange }: ReceiptTemplateFormProps) => {
  const { template, initialValues, placeholders, changeValues } = receipt;
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (field: { [key in ReceiptField]?: string }) => {
    const [[key, value]] = Object.entries(field);

    if (value === '' && key === ReceiptField.Title && template === ReceiptTemplate.Default) {
      changeValues({ title: placeholders.title });
    }

    if (value) {
      changeValues(field);
    }

    onChange();
  };

  return (
    <React.Fragment>
      <Label htmlFor={`receipt-title-${template}`} className="text-black-800 text-base leading-6 font-bold">
        <FormattedMessage defaultMessage="Receipt title" id="tOMmos" />
      </Label>
      {template === ReceiptTemplate.Default && (
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            defaultMessage="Keep this field empty to use the default title: {receiptTitlePlaceholder}."
            id="DsfNxu"
            values={{ receiptTitlePlaceholder: placeholders.title }}
          />
        </p>
      )}
      <Input
        id={`receipt-title-${template}`}
        placeholder={placeholders.title}
        defaultValue={initialValues.title}
        onChange={e => handleChange({ [ReceiptField.Title]: e.target.value })}
        className="mt-1.5 w-full max-w-[414px]"
      />
      <div className="mt-3 flex flex-col items-center justify-between gap-2 md:flex-row">
        <Label htmlFor={`custom-message-${template}`} className="text-black-800 text-base leading-6 font-bold">
          <FormattedMessage defaultMessage="Custom Message" id="+jDZdn" />
        </Label>
        <Button variant="outline" size="xs" className="max-w-[78px]" type="button" onClick={() => setShowPreview(true)}>
          <span className="text-[13px] leading-4 font-medium">
            <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
          </span>
        </Button>
      </div>
      <Textarea
        id={`custom-message-${template}`}
        placeholder={placeholders.info}
        defaultValue={initialValues.info}
        onChange={e => handleChange({ [ReceiptField.Info]: e.target.value })}
        className="mt-2 mb-6 min-h-[150px] w-full text-[13px]"
        style={{ height: '150px' }}
      />
      {showPreview && (
        <PreviewModal
          heading={<FormattedMessage defaultMessage="Receipt Preview" id="F21ZZ6" />}
          onClose={() => setShowPreview(false)}
          previewImage="/static/images/invoice-title-preview.jpg"
          imgHeight={548.6}
          imgWidth={667}
        />
      )}
    </React.Fragment>
  );
};

export default ReceiptTemplateForm;
