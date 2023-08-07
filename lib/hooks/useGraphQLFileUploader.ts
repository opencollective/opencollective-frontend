import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { TOAST_TYPE, useToasts } from '../../components/ToastProvider';

import { i18nGraphqlException } from '../errors';
import { API_V2_CONTEXT } from '../graphql/helpers';
import { Currency, UploadedFileKind, UploadFileResult } from '../graphql/types/v2/graphql';

const uploadFileMutation = gql`
  mutation UploadFile($files: [UploadFileInput!]!) {
    uploadFile(files: $files) {
      file {
        id
        url
        name
        type
        size
      }
      parsingResult {
        success
        message
        confidence
        expense {
          description
          incurredAt
          amount {
            valueInCents
            currency
          }
        }
      }
    }
  }
`;

type useGraphQLFileUploaderProps = {
  onSuccess?: (result: UploadFileResult[]) => void;
  onReject?: (message: string) => void;
  mockImageGenerator?: () => string;
};

export const useGraphQLFileUploader = ({
  onSuccess = undefined,
  onReject = undefined,
  mockImageGenerator = undefined,
}: useGraphQLFileUploaderProps) => {
  const [callUploadFile, { loading }] = useMutation(uploadFileMutation, { context: API_V2_CONTEXT });
  const { addToast } = useToasts();
  const intl = useIntl();

  // A helper to make sure we always show the error somewhere
  const reportErrorMessage = React.useCallback(
    (errorMsg: string) => {
      if (onReject) {
        onReject(errorMsg);
      } else {
        addToast({ type: TOAST_TYPE.ERROR, message: errorMsg });
      }
    },
    [onReject],
  );

  return {
    isUploading: loading,
    uploadFile: React.useCallback(
      async (input: UploadFileInput | UploadFileInput[]) => {
        const allInputs = Array.isArray(input) ? input : [input];

        if (mockImageGenerator) {
          // Mock upload
          const mockedResults = allInputs.map(input => ({
            file: {
              id: 'mocked-id',
              url: mockImageGenerator(),
              name: input.file.name,
              type: input.file.type,
              size: input.file.size,
            },
            parsingResult: !input.parseDocument
              ? null
              : {
                  success: true,
                  message: 'Mocked parsing result',
                  confidence: 0.9,
                  expense: {
                    description: 'Mocked description',
                    incurredAt: '2021-01-01',
                    amount: {
                      valueInCents: 1000,
                      currency: 'USD' as Currency,
                    },
                  },
                },
          }));

          onSuccess?.(mockedResults);
        } else {
          // Start uploading
          try {
            const result = await callUploadFile({ variables: { files: allInputs } });
            if (result.errors) {
              throw result.errors;
            }

            onSuccess?.(result.data.uploadFile);
          } catch (e) {
            reportErrorMessage(i18nGraphqlException(intl, e));
          }
        }
      },
      [onSuccess, onReject],
    ),
  };
};

type UploadFileInput = {
  file: File;
  kind: UploadedFileKind | `${UploadedFileKind}`;
  parseDocument?: boolean;
};
