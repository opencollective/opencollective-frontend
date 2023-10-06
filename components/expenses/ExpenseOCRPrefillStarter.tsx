import React from 'react';
import { FormikProps } from 'formik';
import { FormattedMessage } from 'react-intl';

import { Account, UploadFileResult } from '../../lib/graphql/types/v2/graphql';
import { useGraphQLFileUploader } from '../../lib/hooks/useGraphQLFileUploader';

import { Box, Flex } from '../Grid';
import { DROPZONE_ACCEPT_ALL } from '../StyledDropzone';
import StyledInput from '../StyledInput';
import StyledLinkButton from '../StyledLinkButton';
import StyledTag from '../StyledTag';
import { P } from '../Text';
import { useToasts } from '../ToastProvider';

import type { ExpenseFormValues } from './types/FormValues';

export const ExpenseOCRPrefillStarter = ({
  onSuccess,
  onUpload,
}: {
  form: FormikProps<ExpenseFormValues>;
  onUpload: () => void;
  onSuccess: (result: UploadFileResult[]) => void;
  collective: Account;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToasts();
  const { isUploading, uploadFile } = useGraphQLFileUploader({ onSuccess });

  return (
    <Box mb={24}>
      <Flex alignItems="center" my={4}>
        <StyledInput
          display="none"
          type="file"
          id="expense-ocr-prefill-starter"
          accept={Object.keys(DROPZONE_ACCEPT_ALL).join(', ')}
          ref={inputRef}
          multiple={true}
          onChange={event => {
            onUpload?.();
            addToast({
              type: 'INFO',
              message: (
                <FormattedMessage defaultMessage="Uploading document... You can continue filling the form while we process the document." />
              ),
            });

            uploadFile(
              Array.from(event.target.files).map(file => ({
                file: file as File,
                kind: 'EXPENSE_ITEM',
                parseDocument: true,
              })),
            );
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
    </Box>
  );
};
