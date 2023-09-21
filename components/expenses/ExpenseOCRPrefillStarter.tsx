import React from 'react';
import { FormikProps } from 'formik';
import { FormattedMessage } from 'react-intl';

import { useGraphQLFileUploader } from '../../lib/hooks/useGraphQLFileUploader';
import { updateExpenseFormWithUploadResult } from './lib/ocr';

import { Box, Flex } from '../Grid';
import LoadingGrid from '../LoadingGrid';
import { DROPZONE_ACCEPT_ALL } from '../StyledDropzone';
import StyledInput from '../StyledInput';
import StyledLinkButton from '../StyledLinkButton';
import StyledTag from '../StyledTag';
import { P } from '../Text';
import { useToasts } from '../ToastProvider';

import type { ExpenseFormValues } from './types/FormValues';

export const ExpenseOCRPrefillStarter = ({
  form,
  onSuccess,
}: {
  form: FormikProps<ExpenseFormValues>;
  onSuccess: () => void;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToasts();
  const { isUploading, uploadFile } = useGraphQLFileUploader({
    onSuccess: uploadResult => {
      updateExpenseFormWithUploadResult(form, uploadResult);
      addToast({
        type: 'SUCCESS',
        message: (
          <FormattedMessage defaultMessage="The expense has been automatically prefilled with the information from the document" />
        ),
      });

      onSuccess?.();
    },
  });

  return (
    <Box mb={24}>
      {isUploading ? (
        <Flex flexDirection="column" ml={3} justifyContent="center" alignItems="center" my={128}>
          <LoadingGrid size={128} />
          <P fontSize="16px" fontWeight="500" mt={4}>
            <FormattedMessage defaultMessage="Analyzing document..." />
          </P>
        </Flex>
      ) : (
        <Flex alignItems="center" my={4}>
          <StyledInput
            display="none"
            type="file"
            id="expense-ocr-prefill-starter"
            accept={Object.keys(DROPZONE_ACCEPT_ALL).join(', ')}
            ref={inputRef}
            onChange={event => {
              uploadFile({ file: event.target.files?.[0], kind: 'EXPENSE_ITEM', parseDocument: true });
            }}
          />
          <StyledTag type="info" fontSize="13px" mr={2}>
            <FormattedMessage defaultMessage="New!" />
          </StyledTag>
          <P fontSize="14px">
            <FormattedMessage
              defaultMessage="<UploadClick>Upload a document</UploadClick>, then let our AI assistant prefill the expense for you"
              values={{
                UploadClick(msg) {
                  return (
                    <StyledLinkButton
                      disabled={isUploading}
                      textDecoration="underline"
                      type="button"
                      onClick={() => {
                        if (inputRef.current) {
                          inputRef.current.click();
                        }
                      }}
                    >
                      {msg}
                    </StyledLinkButton>
                  );
                },
              }}
            />
          </P>
        </Flex>
      )}
    </Box>
  );
};
