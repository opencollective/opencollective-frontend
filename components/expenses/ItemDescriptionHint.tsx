import React from 'react';
import { FieldProps, FormikProps } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import StyledLinkButton from '../StyledLinkButton';

import { ExpenseFormValues } from './types/FormValues';

type ExpenseItemDescriptionHintProps = {
  form: FormikProps<ExpenseFormValues>;
  item: ExpenseFormValues['items'][0];
  isInvoice: boolean;
  field: FieldProps['field'];
};

export const ExpenseItemDescriptionHint = ({ item, isInvoice, form, field }: ExpenseItemDescriptionHintProps) => {
  const [hideHint, setHideHint] = React.useState(false);
  const intl = useIntl();
  const suggested = item.__itemParsingResult?.description || item.__parsingResult?.description;

  if (suggested && suggested !== field.value) {
    return (
      <React.Fragment>
        <FormattedMessage
          id="expense.description.suggested"
          defaultMessage="Suggested: {description}"
          values={{
            description: (
              <StyledLinkButton
                title={intl.formatMessage({ defaultMessage: 'Use suggested description' })}
                onClick={() => {
                  form.setFieldValue(field.name, suggested);
                  setHideHint(true);
                }}
              >
                {suggested}
              </StyledLinkButton>
            ),
          }}
        />
      </React.Fragment>
    );
  } else if (!hideHint) {
    return isInvoice
      ? intl.formatMessage({
          defaultMessage: 'Specify item or activity and timeframe, e.g. "Volunteer Training, April 2023"',
        })
      : intl.formatMessage({
          defaultMessage: 'Describe the expense, e.g. "Dinner with the team"',
        });
  } else {
    return null;
  }
};
