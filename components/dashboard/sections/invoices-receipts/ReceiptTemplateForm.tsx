import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { UploadFileResult } from '@/lib/graphql/types/v2/graphql';

import Dropzone, { DROPZONE_ACCEPT_IMAGES } from '../../../Dropzone';
import { Input } from '../../../ui/Input';
import { Label } from '../../../ui/Label';
import { Textarea } from '../../../ui/Textarea';

import type { UseReceipt } from './hooks/useReceipt';
import { ReceiptField, ReceiptTemplate } from './hooks/useReceipt';

type ReceiptTemplateFormProps = {
  receipt: UseReceipt;
  onChange: () => void;
};

const EMBEDDED_IMAGE_SIZE = { type: 'exact', width: 400, height: 136 } as const;

const ReceiptTemplateForm = ({ receipt, onChange }: ReceiptTemplateFormProps) => {
  const { template, initialValues, placeholders, values, changeValues } = receipt;

  const handleChange = (field: { [key in ReceiptField]?: string }) => {
    const [[key, value]] = Object.entries(field);

    if (value === '' && key === ReceiptField.Title && template === ReceiptTemplate.Default) {
      changeValues({ title: placeholders.title });
    }

    changeValues(field);
    onChange();
  };
  const handleImageUploadSuccess = (uploadResults: UploadFileResult[]) => {
    if (uploadResults) {
      if (uploadResults.length > 0) {
        const url = uploadResults[0].file.url;
        handleChange({ [ReceiptField.EmbeddedImage]: url });
      } else {
        handleChange({ [ReceiptField.EmbeddedImage]: null });
      }
    }
  };
  const handleImageUploadClear = () => {
    handleChange({ [ReceiptField.EmbeddedImage]: null });
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
      </div>
      <Textarea
        id={`custom-message-${template}`}
        placeholder={placeholders.info}
        defaultValue={initialValues.info}
        onChange={e => handleChange({ [ReceiptField.Info]: e.target.value })}
        className="mt-2 mb-6 min-h-[150px] w-full text-[13px]"
        style={{ height: '150px' }}
      />
      <Label htmlFor={`embedded-image-${template}`} className="text-black-800 text-base leading-6 font-bold">
        <FormattedMessage defaultMessage="Embedded Image" id="x5mRqK" />
      </Label>
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="Add an image to embed in receipts (e.g., a signature or logo)." id="fE8hLt" />
      </p>
      <div className="mt-1.5 w-full max-w-[414px]">
        <Dropzone
          id={`embedded-image-${template}`}
          name={`embedded-image-${template}`}
          accept={DROPZONE_ACCEPT_IMAGES}
          minSize={0}
          maxSize={1_000_000} // 1MB
          useGraphQL={true}
          kind="RECEIPT_EMBEDDED_IMAGE"
          onGraphQLSuccess={handleImageUploadSuccess}
          onClear={handleImageUploadClear}
          isMulti={false}
          value={values.embeddedImage}
          className="w-full"
          showInstructions
          showActions
          imageSize={EMBEDDED_IMAGE_SIZE}
        />
      </div>
    </React.Fragment>
  );
};

export default ReceiptTemplateForm;
