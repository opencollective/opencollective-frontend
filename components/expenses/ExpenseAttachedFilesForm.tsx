import React from 'react';
import { FormikProps } from 'formik';
import { first, uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { Account, UploadFileResult } from '../../lib/graphql/types/v2/graphql';
import { attachmentDropzoneParams } from './lib/attachments';
import { expenseItemIsTouched } from './lib/items';
import { updateExpenseFormWithUploadResult } from './lib/ocr';

import { Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledDropzone from '../StyledDropzone';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import { ExpenseFormValues } from './types/FormValues';
import AddNewAttachedFilesButton from './AddNewAttachedFilesButton';
import ExpenseAttachedFiles from './ExpenseAttachedFiles';

const ExpenseAttachedFilesForm = ({
  collective,
  form,
  disabled,
  defaultValue,
  title,
  description,
  hasOCRFeature = false,
}: ExpenseAttachedFilesFormProps) => {
  const [files, setFiles] = React.useState(uniqBy(defaultValue, 'url'));
  const onGraphQLUploadSuccess = (uploadResults: UploadFileResult[]) => {
    const existingFiles = form.values.attachedFiles || [];
    setFiles([...existingFiles, ...uploadResults.map(result => result.file)]);

    // Invoices have a default empty item. If it's not touched, we overwrite it with the OCR result
    const firstItem = first(form.values.items);
    const itemIdxToReplace = firstItem && !expenseItemIsTouched(firstItem) ? 0 : undefined;
    updateExpenseFormWithUploadResult(collective, form, uploadResults, [itemIdxToReplace]);
  };

  return (
    <div>
      <Flex alignItems="center" my={16}>
        <Span color="black.600" fontSize="16px" lineHeight="21px">
          <FormattedMessage
            id="OptionalFieldLabel"
            defaultMessage="{field} (optional)"
            values={{
              field: (
                <Span color="black.900" fontSize="16px" fontWeight="bold">
                  {title}
                </Span>
              ),
            }}
          />
          &nbsp;
          <PrivateInfoIcon className="text-muted-foreground" />
        </Span>
        <StyledHr flex="1" borderColor="black.300" mx={2} />
        {files?.length > 0 && (
          <AddNewAttachedFilesButton
            disabled={disabled}
            onSuccess={newFiles => {
              const uploadedFiles = [...files, ...newFiles];
              setFiles(uploadedFiles);
              form.setFieldValue('attachedFiles', uploadedFiles);
            }}
            useGraphQL={hasOCRFeature}
            parseDocument={hasOCRFeature}
            onGraphQLSuccess={onGraphQLUploadSuccess}
          />
        )}
      </Flex>
      <P fontSize="13px" color="black.600" mb={16}>
        {description}
      </P>
      {files?.length > 0 ? (
        <ExpenseAttachedFiles
          files={files}
          onRemove={idx => {
            const updatedFiles = [...files];
            updatedFiles.splice(idx, 1);
            setFiles(updatedFiles);
            form.setFieldValue('attachedFiles', updatedFiles);
          }}
        />
      ) : (
        <StyledDropzone
          {...attachmentDropzoneParams}
          isMulti
          name="attachedFiles"
          kind="EXPENSE_ATTACHED_FILE"
          disabled={disabled}
          minHeight={72}
          onSuccess={uploadedFiles => {
            setFiles(uploadedFiles);
            form.setFieldValue('attachedFiles', uploadedFiles);
          }}
          useGraphQL={hasOCRFeature}
          parseDocument={hasOCRFeature}
          onGraphQLSuccess={onGraphQLUploadSuccess}
        />
      )}
    </div>
  );
};

type ExpenseAttachedFilesFormProps = {
  defaultValue?: Array<{ url: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  disabled?: boolean;
  form: FormikProps<ExpenseFormValues>;
  hasOCRFeature?: boolean;
  collective: Account;
};

export default ExpenseAttachedFilesForm;
