import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../../Grid';
import PreviewModal from '../../PreviewModal';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledTextarea from '../../StyledTextarea';
import { Label, P, Span } from '../../Text';

const ReceiptTemplateForm = ({ showTipForDefaultTitle, value, onChange, placeholders, template }) => {
  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <React.Fragment>
      <Label htmlFor={`receipt-title-${template}`} color="black.800" fontSize="16px" fontWeight={700} lineHeight="24px">
        <FormattedMessage defaultMessage="Receipt title" />
      </Label>
      <StyledInput
        id={`receipt-title-${template}`}
        placeholder={placeholders.title}
        defaultValue={value.title}
        onChange={e => onChange(e.target.value, null)}
        width="100%"
        maxWidth={414}
        mt="6px"
      />
      {showTipForDefaultTitle && (
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
        defaultValue={value.info}
        onChange={e => onChange(null, e.target.value)}
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

ReceiptTemplateForm.propTypes = {
  showTipForDefaultTitle: PropTypes.bool,
  value: PropTypes.shape({ title: PropTypes.string, info: PropTypes.string }).isRequired,
  onChange: PropTypes.func.isRequired, // Gets an object like { title, info }
  placeholders: PropTypes.object.isRequired,
  template: PropTypes.string,
};

export default ReceiptTemplateForm;
