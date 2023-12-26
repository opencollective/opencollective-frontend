import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

export enum ReceiptTemplate {
  Default = 'default',
  Alternative = 'alternative',
}

export enum ReceiptField {
  Title = 'title',
  Info = 'info',
}

type ReceiptPlaceholder = {
  [key in ReceiptField]:
    | string
    | {
        id: string;
        defaultMessage: string;
      };
};

export type UseReceipt = {
  template: ReceiptTemplate;
  initialValues: {
    [key in ReceiptField]?: string;
  };
  values: {
    [key in ReceiptField]?: string;
  };
  placeholders: {
    [key in ReceiptField]: string;
  };
  changeValues: (values: { [key in ReceiptField]?: string }) => void;
};

const messages = defineMessages({
  extraInfoPlaceholder: {
    id: 'EditHostInvoice.extraInfoPlaceholder',
    defaultMessage:
      "Add any other text to appear on payment receipts, such as your organization's tax ID number, info about tax deductibility of contributions, or a custom thank you message.",
  },
});

const receiptPlaceholders: { [key in ReceiptTemplate]: ReceiptPlaceholder } = {
  [ReceiptTemplate.Default]: {
    title: 'Payment Receipt',
    info: messages.extraInfoPlaceholder,
  },
  [ReceiptTemplate.Alternative]: {
    title: 'Custom Receipt',
    info: messages.extraInfoPlaceholder,
  },
};

type UseReceiptProps = {
  template: ReceiptTemplate;
  settings: {
    invoice?: {
      templates?: {
        [key in ReceiptTemplate]?: {
          [key in ReceiptField]?: string;
        };
      };
    };
  };
};

export const useReceipt = ({ settings, template }: UseReceiptProps): UseReceipt => {
  const { formatMessage } = useIntl();
  const templateData = settings.invoice?.templates?.[template] ?? {};

  const initialValues = Object.values(ReceiptField).reduce(
    (acc, field) => {
      return { ...acc, [field]: templateData[field] };
    },
    {} as { [key in ReceiptField]?: string },
  );

  const [values, setValues] = useState<{ [key in ReceiptField]?: string }>(initialValues);

  const placeholders = Object.entries(receiptPlaceholders[template]).reduce(
    (acc, [field, message]) => {
      return { ...acc, [field]: typeof message === 'object' ? formatMessage(message) : message };
    },
    {} as { [key in ReceiptField]: string },
  );

  const changeValues = (values: { [key in ReceiptField]?: string }): void => {
    setValues(prev => ({ ...prev, ...values }));
  };

  return {
    template,
    initialValues,
    values,
    placeholders,
    changeValues,
  };
};
