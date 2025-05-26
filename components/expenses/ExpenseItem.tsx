import React from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { expenseItemsMustHaveFiles } from './lib/items';
import { getExpenseExchangeRateWarningOrError } from './lib/utils';
import expenseTypes from '@/lib/constants/expenseTypes';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import Container from '../Container';
import type { UploadedFile } from '../Dropzone';
import { DROPZONE_ACCEPT_ALL, MemoizedDropzone } from '../Dropzone';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import HTMLContent from '../HTMLContent';
import StyledHr from '../StyledHr';
import { Span } from '../Text';
import { toast } from '../ui/useToast';
import UploadedFilePreview from '../UploadedFilePreview';
import { Expense } from '@/lib/graphql/types/v2/graphql';

export const attachmentDropzoneParams = {
  accept: DROPZONE_ACCEPT_ALL,
  minSize: 10e2, // in bytes, =1kB
  maxSize: 10e6, // in bytes, =10MB
  limit: 15, // Max 15 files per upload
};

export function ExpenseItem({
  item,
  expense,
  openFileViewer,
  isLoading,
  onChangeAttachment = undefined,
}: {
  item: any;
  expense: Expense;
  openFileViewer?: (url: string) => void;
  isLoading: boolean;
  onChangeAttachment?: (file: UploadedFile | null) => void;
}) {
  const { loadingLoggedInUser } = useLoggedInUser();
  const intl = useIntl();

  return (
    <React.Fragment>
      <div className="my-6 flex flex-wrap" data-cy="expense-summary-item">
        {onChangeAttachment ? (
          <div className="mr-4 mb-4 w-full sm:w-auto">
            <MemoizedDropzone
              {...attachmentDropzoneParams}
              name="expense_item"
              // disabled={props.isSubmitting}
              kind="EXPENSE_ITEM"
              // id={attachmentId}
              // name={attachmentId}
              value={item.url}
              isMulti={false}
              showActions
              className="size-28"
              parseDocument={false}
              onSuccess={onChangeAttachment}
              onReject={msg => toast({ variant: 'error', message: msg })}
            />
          </div>
        ) : (
          item.url &&
          expenseItemsMustHaveFiles(expense.type) && (
            <div className="mr-4 mb-4 w-full sm:w-auto">
              <UploadedFilePreview
                url={item.url}
                isLoading={isLoading || loadingLoggedInUser}
                isPrivate={!item.url && !isLoading}
                size={[64, 48]}
                maxHeight={48}
                openFileViewer={openFileViewer}
              />
            </div>
          )
        )}
        <div className="flex flex-1 items-start justify-between">
          <div className="flex grow flex-col justify-center">
            {item.description ? (
              <HTMLContent
                content={item.description}
                fontSize="14px"
                color="black.900"
                collapsable
                fontWeight="500"
                maxCollapsedHeight={100}
                collapsePadding={22}
              />
            ) : (
              <Span color="black.600" fontStyle="italic">
                <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
              </Span>
            )}
            {expense?.type !== expenseTypes.GRANT && (
              <Span mt={1} fontSize="12px" color="black.700">
                <FormattedMessage
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{
                    item: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
                  }}
                />{' '}
                {/* Using timeZone=UTC as we only store the date as a UTC string, without time */}
                <FormattedDate value={item.incurredAt} dateStyle="long" timeZone="UTC" />{' '}
              </Span>
            )}
          </div>
          <Container
            fontSize={15}
            color="black.600"
            mt={2}
            textAlign="right"
            ml={3}
            data-cy="expense-summary-item-amount"
          >
            {item.amountV2?.exchangeRate ? (
              <div>
                <FormattedMoneyAmount
                  amount={Math.round(item.amountV2.valueInCents * item.amountV2.exchangeRate.value)}
                  currency={expense.currency}
                  amountClassName="font-medium text-foreground"
                  precision={2}
                />
                <div className="mt-[2px] text-xs">
                  <AmountWithExchangeRateInfo
                    amount={item.amountV2}
                    invertIconPosition
                    {...getExpenseExchangeRateWarningOrError(
                      intl,
                      item.amountV2.exchangeRate,
                      item.referenceExchangeRate,
                    )}
                  />
                </div>
              </div>
            ) : (
              <FormattedMoneyAmount
                amount={item.amountV2?.valueInCents || item.amount?.valueInCents || item.amount}
                currency={item.amountV2?.currency || item.amount?.currency || expense.currency}
                amountClassName="font-medium text-foreground"
                precision={2}
              />
            )}
          </Container>
        </div>
      </div>
      <StyledHr borderStyle="dotted" />
    </React.Fragment>
  );
}
