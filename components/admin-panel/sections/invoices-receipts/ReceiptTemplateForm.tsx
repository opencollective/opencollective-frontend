import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../../../Grid';
import PreviewModal from '../../../PreviewModal';
import StyledButton from '../../../StyledButton';
import StyledInput from '../../../StyledInput';
import StyledTextarea from '../../../StyledTextarea';
import { Label, P, Span } from '../../../Text';

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
      <Label htmlFor={`receipt-title-${template}`} color="black.800" fontSize="16px" fontWeight={700} lineHeight="24px">
        <FormattedMessage defaultMessage="Receipt title" />
      </Label>
      <StyledInput
        id={`receipt-title-${template}`}
        placeholder={placeholders.title}
        defaultValue={initialValues.title}
        onChange={e => handleChange({ [ReceiptField.Title]: e.target.value })}
        width="100%"
        maxWidth={414}
        mt="6px"
      />
      {template === ReceiptTemplate.Default && (
        <P mt="6px">
          <FormattedMessage
            defaultMessage="Keep this field empty to use the default title: {receiptTitlePlaceholder}."
            values={{ receiptTitlePlaceholder: placeholders.title }}
          />
        </P>
      )}
      <Flex justifyContent="space-between" flexDirection={['column', 'row']} pt="26px">
        <Label
          htmlFor={`custom-message-${template}`}
          color="black.800"
          fontSize="16px"
          fontWeight={700}
          lineHeight="24px"
        >
          <FormattedMessage defaultMessage="Custom Message" />
        </Label>
        <StyledButton
          buttonStyle="secondary"
          buttonSize="tiny"
          maxWidth="78px"
          pt="4px"
          pb="4px"
          pl="14px"
          pr="14px"
          height="24px"
          onClick={() => setShowPreview(true)}
        >
          <Span fontSize="13px" fontWeight={500} lineHeight="16px">
            <FormattedMessage defaultMessage="Preview" />
          </Span>
        </StyledButton>
      </Flex>
      <StyledTextarea
        id={`custom-message-${template}`}
        placeholder={placeholders.info}
        defaultValue={initialValues.info}
        onChange={e => handleChange({ [ReceiptField.Info]: e.target.value })}
        width="100%"
        height="150px"
        fontSize="13px"
        mt="14px"
        mb="23px"
      />
      {showPreview && (
        <PreviewModal
          heading={<FormattedMessage defaultMessage="Receipt Preview" />}
          onClose={() => setShowPreview(false)}
          previewImage="/static/images/invoice-title-preview.jpg"
          imgHeight="548.6px"
          imgWidth="667px"
        />
      )}
    </React.Fragment>
  );
};

export default ReceiptTemplateForm;
