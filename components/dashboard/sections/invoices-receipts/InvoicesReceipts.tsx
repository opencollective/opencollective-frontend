import React from 'react';
import { useMutation } from '@apollo/client';
import { Plus } from '@styled-icons/boxicons-regular/Plus';
import { Trash } from '@styled-icons/boxicons-regular/Trash';
import { get } from 'lodash';
import { Eye } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { editCollectiveSettingsMutation } from '../../../../lib/graphql/v1/mutations';
import { API_V1_CONTEXT } from '@/lib/graphql/helpers';
import type { Account } from '@/lib/graphql/types/v2/schema';

import SettingsSectionTitle from '../../../edit-collective/sections/SettingsSectionTitle';
import MessageBox from '../../../MessageBox';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { DefaultSelect } from '../../../ui/Select';
import { useToast } from '../../../ui/useToast';

import { ReceiptTemplate, useReceipt } from './hooks/useReceipt';
import ReceiptPreviewDialog from './ReceiptPreviewDialog';
import ReceiptTemplateForm from './ReceiptTemplateForm';

const BILL_TO_OPTIONS = [
  {
    value: 'host',
    label: (
      <FormattedMessage
        defaultMessage="{value} (default)"
        id="OgbGHX"
        values={{ value: <FormattedMessage id="Member.Role.HOST" defaultMessage="Host" /> }}
      />
    ),
  },
  { value: 'collective', label: <FormattedMessage id="Collective" defaultMessage="Collective" /> },
] as const;

const InvoicesReceipts = ({
  account,
}: {
  account: Pick<Account, 'legacyId' | 'settings'> & { hasHosting?: boolean };
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const defaultReceipt = useReceipt({ template: ReceiptTemplate.Default, settings: account.settings });
  const alternativeReceipt = useReceipt({ template: ReceiptTemplate.Alternative, settings: account.settings });
  const [setSettings, { loading, error, data }] = useMutation(editCollectiveSettingsMutation, {
    context: API_V1_CONTEXT,
  });
  const [hasAlternativeReceipt, setHasAlternativeReceipt] = React.useState(
    alternativeReceipt.values.title !== undefined,
  );
  const [isFieldChanged, setIsFieldChanged] = React.useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const [previewTemplate, setPreviewTemplate] = React.useState<ReceiptTemplate>(ReceiptTemplate.Default);
  const isSaved =
    get(data, 'editCollective.settings.invoice.templates.default.title') === defaultReceipt.values.title &&
    get(data, 'editCollective.settings.invoice.templates.alternative.title') === alternativeReceipt.values.title;
  const infoIsSaved =
    get(data, 'editCollective.settings.invoice.templates.default.info') === defaultReceipt.values.info &&
    get(data, 'editCollective.settings.invoice.templates.alternative.info') === alternativeReceipt.values.info;
  const embeddedImageIsSaved =
    get(data, 'editCollective.settings.invoice.templates.default.embeddedImage') ===
      defaultReceipt.values.embeddedImage &&
    get(data, 'editCollective.settings.invoice.templates.alternative.embeddedImage') ===
      alternativeReceipt.values.embeddedImage;

  // For Bill To
  const getInExpenseTemplate = (account, field: string) =>
    get(account, `settings.invoice.expenseTemplates.default.${field}`);
  const [billTo, setBillTo] = React.useState<string | undefined>(getInExpenseTemplate(account, 'billTo'));
  const billToIsSaved = getInExpenseTemplate(account, 'billTo') === billTo;

  const deleteAlternativeReceipt = () => {
    alternativeReceipt.changeValues({ title: undefined, info: undefined, embeddedImage: undefined });
    setHasAlternativeReceipt(false);
    setIsFieldChanged(true);
  };

  const getInvoiceTemplatesObj = () => {
    const expenseTemplates = { default: { billTo } };
    const templates: Record<string, { title?: string; info?: string; embeddedImage?: string }> = {};

    templates.default = {
      title: defaultReceipt.values.title,
      info: defaultReceipt.values.info,
      embeddedImage: defaultReceipt.values.embeddedImage,
    };

    const {
      title: alternativeTitle,
      info: alternativeInfo,
      embeddedImage: alternativeEmbeddedImage,
    } = alternativeReceipt.values;

    if (alternativeTitle || alternativeInfo || alternativeEmbeddedImage) {
      templates.alternative = {
        title: alternativeTitle,
        info: alternativeInfo,
        embeddedImage: alternativeEmbeddedImage,
      };
    }

    return { templates, expenseTemplates };
  };

  const onChangeField = () => {
    setIsFieldChanged(true);
  };

  const onChange = (value: string, stateFunction: (value: string) => void) => {
    stateFunction(value);
    setIsFieldChanged(true);
  };

  const handlePreviewClick = (template: ReceiptTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const getCurrentReceiptValues = () => {
    return previewTemplate === ReceiptTemplate.Default ? defaultReceipt : alternativeReceipt;
  };

  return (
    <div className="w-full">
      <h2 className="mb-3 text-2xl leading-8 font-bold">
        <FormattedMessage id="becomeASponsor.invoiceReceipts" defaultMessage="Invoices & Receipts" />
      </h2>
      <div className="mb-6">
        <SettingsSectionTitle>
          <FormattedMessage id="Expenses" defaultMessage="Expenses" />
        </SettingsSectionTitle>

        {account.hasHosting && (
          <div className="mt-4">
            <Label htmlFor="expense-bill-to-select" className="text-black-800 text-base leading-6 font-bold">
              {intl.formatMessage({ defaultMessage: 'Bill To', id: 'izhuHE' })}
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {intl.formatMessage({
                defaultMessage:
                  'Set this to "Collective" to use the collective info for generated invoices\' "Bill To" section. You need to make sure that this pattern is legal under your jurisdiction.',
                id: 'yMFA0e',
              })}
            </p>
            <div className="mt-2">
              <DefaultSelect
                name="expense-bill-to-select"
                placeholder={intl.formatMessage({ defaultMessage: 'No selection', id: 'Select.Placeholder' })}
                value={billTo || ''}
                setValue={value => onChange(value, setBillTo)}
                options={BILL_TO_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
              />
            </div>
          </div>
        )}
      </div>
      <SettingsSectionTitle
        actions={
          <Button onClick={() => handlePreviewClick(ReceiptTemplate.Default)} variant="outline" size="xs" className="">
            <Eye size={17} />
            <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
          </Button>
        }
      >
        <FormattedMessage id="financialContributions" defaultMessage="Financial contributions" />
      </SettingsSectionTitle>
      <p className="mb-6 text-sm">
        <FormattedMessage
          id="EditHostInvoice.Receipt.Instructions"
          defaultMessage="You can customize the title (and add custom text) on automatically generated receipts for financial contributions, e.g., 'donation receipt' or 'tax receipt' or a phrase appropriate for your legal entity type, language, and location. Keep this field empty to use the default title:"
        />
        {/** Un-localized on purpose, because it's not localized in the actual invoice */}
        &nbsp;<i>{defaultReceipt.placeholders.title}</i>.
      </p>
      {error && (
        <MessageBox type="error" fontSize="14px" withIcon className="mb-3">
          {i18nGraphqlException(intl, error)}
        </MessageBox>
      )}
      <div className="flex flex-col">
        <ReceiptTemplateForm receipt={defaultReceipt} onChange={onChangeField} />
        <div className="mt-8">
          <SettingsSectionTitle
            actions={
              !hasAlternativeReceipt ? (
                <Button size="xs" variant="outline" onClick={() => setHasAlternativeReceipt(true)}>
                  <Plus size={16} />
                  <FormattedMessage defaultMessage="Add alternative receipt" id="7It+w9" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => deleteAlternativeReceipt()}
                    variant="outlineDestructive"
                    size="xs"
                    className=""
                  >
                    <Trash size={17} />
                    <FormattedMessage defaultMessage="Delete alternative receipt" id="aXAB2R" />
                  </Button>
                  <Button
                    onClick={() => handlePreviewClick(ReceiptTemplate.Alternative)}
                    variant="outline"
                    size="xs"
                    className=""
                  >
                    <Eye size={17} />
                    <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
                  </Button>
                </div>
              )
            }
          >
            <FormattedMessage defaultMessage="Alternative receipt template" id="CJtvlX" />
          </SettingsSectionTitle>
          <p className="text-sm">
            <FormattedMessage
              defaultMessage="You can create an additional receipt for you to use as a non-tax-deductible payments for cases like event tickets, merch, or services."
              id="MNi3fa"
            />
          </p>
        </div>
        {hasAlternativeReceipt && (
          <div className="my-5 flex w-full flex-col flex-wrap">
            <ReceiptTemplateForm receipt={alternativeReceipt} onChange={onChangeField} />
          </div>
        )}
        {hasAlternativeReceipt && (
          <MessageBox type="info">
            <FormattedMessage
              defaultMessage="Please advise your Collectives to select the correct receipt setting for any tiers where the alternative receipt should be used, or manage related contributions through the Add Funds process, where you as the Host Admin can select the correct receipt."
              id="nYrU4E"
            />
          </MessageBox>
        )}
        <Button
          loading={loading}
          disabled={!isFieldChanged}
          className="mt-8"
          onClick={() => {
            setSettings({
              variables: {
                id: account.legacyId,
                settings: {
                  ...account.settings,
                  invoice: getInvoiceTemplatesObj(),
                },
              },
            });
            setIsFieldChanged(false);
            toast({
              variant: 'success',
              message: <FormattedMessage defaultMessage="Invoices updated successfully" id="6P4LG/" />,
            });
          }}
        >
          {isSaved && infoIsSaved && billToIsSaved && embeddedImageIsSaved ? (
            <FormattedMessage id="saved" defaultMessage="Saved" />
          ) : (
            <FormattedMessage id="save" defaultMessage="Save" />
          )}
        </Button>
      </div>

      <ReceiptPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        title={getCurrentReceiptValues().values.title || getCurrentReceiptValues().placeholders.title}
        info={getCurrentReceiptValues().values.info || ''}
        embeddedImage={getCurrentReceiptValues().values.embeddedImage || ''}
      />
    </div>
  );
};

export default InvoicesReceipts;
