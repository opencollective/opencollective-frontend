import React from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import { useToast } from '../../components/ui/useToast';

import { canUseMockImageUpload, mockImageUpload } from '../api';
import { i18nGraphqlException } from '../errors';
import { API_V2_CONTEXT, gql } from '../graphql/helpers';
import type { UploadedFileKind, UploadFileResult } from '../graphql/types/v2/graphql';

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
        expense {
          confidence
          description
          date
          amount {
            valueInCents
            currency
            exchangeRate {
              value
              fromCurrency
              toCurrency
              date
              source
              isApproximate
            }
          }
          items {
            description
            incurredAt
            url
            amount {
              valueInCents
              currency
            }
          }
        }
      }
    }
  }
`;

type useGraphQLFileUploaderProps = {
  onSuccess?: (result: UploadFileResult[]) => void;
  onReject?: (message: string | string[]) => void;
  mockImageGenerator?: () => string;
  isMulti?: boolean;
};

export const useGraphQLFileUploader = ({
  onSuccess = undefined,
  onReject = undefined,
  mockImageGenerator = undefined,
  isMulti = true,
}: useGraphQLFileUploaderProps) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [callUploadFile] = useMutation(uploadFileMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  const intl = useIntl();

  // A helper to make sure we always show the error somewhere
  const reportErrorMessage = React.useCallback(
    (errorMsg: string) => {
      if (onReject) {
        onReject(isMulti ? [errorMsg] : errorMsg);
      } else {
        toast({ variant: 'error', message: errorMsg });
      }
    },
    [onReject],
  );

  return {
    isUploading,
    uploadFile: React.useCallback(
      async (input: UploadFileInput | UploadFileInput[]) => {
        const allInputs = Array.isArray(input) ? input : [input];
        if (allInputs.length === 0) {
          return;
        }

        setIsUploading(true);
        try {
          let result;
          if (mockImageGenerator && canUseMockImageUpload()) {
            result = {
              data: {
                uploadFile: await Promise.all(
                  allInputs.map(async () => {
                    const imageUrl = await mockImageUpload(mockImageGenerator);
                    return { file: { id: uuid(), url: imageUrl, type: 'image/png' }, parsingResult: null };
                  }),
                ),
              },
            };
          } else {
            result = await callUploadFile({ variables: { files: allInputs } });
          }

          if (result.errors) {
            throw result.errors;
          }

          onSuccess?.(result.data.uploadFile);
        } catch (e) {
          reportErrorMessage(i18nGraphqlException(intl, e));
        } finally {
          setIsUploading(false);
        }
      },
      [onSuccess, onReject, mockImageGenerator, isMulti],
    ),
  };
};

type UploadFileInput = {
  file: File;
  kind: UploadedFileKind | `${UploadedFileKind}`;
  parseDocument?: boolean;
};
