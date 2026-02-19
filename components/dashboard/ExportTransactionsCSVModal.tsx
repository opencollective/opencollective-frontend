import React, { useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { debounce, isEmpty, isNil, omit, uniq, without } from 'lodash';
import { Eraser } from 'lucide-react';
import type { MouseEventHandler } from 'react';
import { FormattedMessage } from 'react-intl';
import slugify from 'slugify';

import { setRestAuthorizationCookie } from '../../lib/auth';
import { getEnvVar } from '../../lib/env-utils';
import type { CSVField } from '../../lib/export-csv/transactions-csv';
import {
  AVERAGE_TRANSACTIONS_PER_MINUTE,
  FIELD_OPTIONS,
  FieldLabels,
  FieldOptionsLabels,
  FIELDS,
  GROUP_FIELDS,
  GROUPS,
  HOST_OMITTED_FIELDS,
  PLATFORM_PRESETS,
} from '../../lib/export-csv/transactions-csv';
import type {
  Account,
  AccountReferenceInput,
  ExpenseReferenceInput,
  HostReportsQueryVariables,
  OrderReferenceInput,
  TransactionsPageQueryVariables,
  TransactionsTableQueryVariables,
} from '../../lib/graphql/types/v2/graphql';
import { ExportRequestType } from '../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { cn, parseToBoolean } from '../../lib/utils';
import useExportRequest from '@/lib/hooks/useExportRequest';

import ConfirmationModal from '../ConfirmationModal';
import { InfoTooltipIcon } from '../InfoTooltipIcon';
import Link from '../Link';
import Spinner from '../Spinner';
import Tabs from '../Tabs';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { useToast } from '../ui/useToast';

type MakeUrlParams = {
  account?: Pick<Account, 'slug'>;
  isHostReport?: boolean;
  queryFilter: {
    variables: Partial<TransactionsTableQueryVariables>;
  };
  flattenTaxesAndPaymentProcessorFees?: boolean;
  useFieldNames?: boolean;
  fields?: string[];
};

const safeJoinString = (value: string[] | string) => (Array.isArray(value) ? value.join(',') : value);

const makeUrl = ({
  account,
  isHostReport,
  queryFilter,
  flattenTaxesAndPaymentProcessorFees,
  useFieldNames,
  fields,
}: MakeUrlParams) => {
  const url = isHostReport
    ? new URL(`${process.env.REST_URL}/v2/${account?.slug}/hostTransactions.csv`)
    : new URL(`${process.env.REST_URL}/v2/${account?.slug}/transactions.csv`);

  if (isHostReport) {
    if (queryFilter.variables.account) {
      url.searchParams.set('account', (queryFilter.variables.account as AccountReferenceInput).slug);
    }
    if (queryFilter.variables.excludeAccount) {
      url.searchParams.set('excludeAccount', (queryFilter.variables.excludeAccount as AccountReferenceInput).slug);
    }
  }

  url.searchParams.set('includeGiftCardTransactions', '1');
  url.searchParams.set('includeIncognitoTransactions', '1');
  url.searchParams.set('includeChildrenTransactions', '1');

  if (queryFilter.variables.expenseType) {
    url.searchParams.set('expenseType', safeJoinString(queryFilter.variables.expenseType));
  }

  if (queryFilter.variables.kind) {
    url.searchParams.set('kind', safeJoinString(queryFilter.variables.kind));
  }

  if (queryFilter.variables.amount) {
    if (queryFilter.variables.amount.gte) {
      url.searchParams.set('minAmount', String(queryFilter.variables.amount.gte.valueInCents));
    }
    if (queryFilter.variables.amount.lte) {
      url.searchParams.set('maxAmount', String(queryFilter.variables.amount.lte.valueInCents));
    }
  }

  if (queryFilter.variables.paymentMethodService) {
    url.searchParams.set('paymentMethodService', safeJoinString(queryFilter.variables.paymentMethodService));
  }

  if (queryFilter.variables.paymentMethodType) {
    url.searchParams.set('paymentMethodType', safeJoinString(queryFilter.variables.paymentMethodType));
  }

  const manualPaymentProvider = queryFilter.variables.manualPaymentProvider;
  if (Array.isArray(manualPaymentProvider) && manualPaymentProvider.length > 0) {
    url.searchParams.set('manualPaymentProvider', manualPaymentProvider.map(p => p.id).join(','));
  }

  if (queryFilter.variables.type) {
    url.searchParams.set('type', queryFilter.variables.type);
  }

  if (queryFilter.variables.searchTerm) {
    url.searchParams.set('searchTerm', queryFilter.variables.searchTerm);
  }

  if (queryFilter.variables.dateFrom) {
    url.searchParams.set('dateFrom', queryFilter.variables.dateFrom);
  }
  if (queryFilter.variables.dateTo) {
    url.searchParams.set('dateTo', queryFilter.variables.dateTo);
  }

  if (queryFilter.variables.clearedFrom) {
    url.searchParams.set('clearedFrom', queryFilter.variables.clearedFrom);
  }
  if (queryFilter.variables.clearedTo) {
    url.searchParams.set('clearedTo', queryFilter.variables.clearedTo);
  }

  if (!isNil(queryFilter.variables.isRefund)) {
    url.searchParams.set('isRefund', queryFilter.variables.isRefund ? '1' : '0');
  }

  if (!isNil(queryFilter.variables.hasDebt)) {
    url.searchParams.set('hasDebt', queryFilter.variables.hasDebt ? '1' : '0');
  }

  if (queryFilter.variables.order) {
    url.searchParams.set('orderId', String((queryFilter.variables.order as OrderReferenceInput).legacyId));
  }

  if (queryFilter.variables.expense) {
    url.searchParams.set('expenseId', String((queryFilter.variables.expense as ExpenseReferenceInput).legacyId));
  }

  if (queryFilter.variables.merchantId) {
    url.searchParams.set('merchantId', queryFilter.variables.merchantId as string);
  }

  if (queryFilter.variables.accountingCategory) {
    url.searchParams.set('accountingCategory', safeJoinString(queryFilter.variables.accountingCategory));
  }

  if (queryFilter.variables.group) {
    url.searchParams.set('group', safeJoinString(queryFilter.variables.group));
  }

  if (flattenTaxesAndPaymentProcessorFees) {
    url.searchParams.set('flattenPaymentProcessorFee', '1');
    url.searchParams.set('flattenTax', '1');
  }

  if (useFieldNames) {
    url.searchParams.set('useFieldNames', '1');
  }

  if (!isEmpty(fields)) {
    const selectedFields = fields.join(',').replace('debitAndCreditAmounts', 'debitAmount,creditAmount');
    url.searchParams.set('fields', selectedFields);
  }

  return url.toString();
};

const FieldTag = ({ id, dragElement, canDrag }: { id: string; dragElement?: boolean; canDrag?: boolean }) => {
  const onMouseDown: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const {
    attributes,
    isDragging: isBeingDrag,
    listeners,
    setNodeRef,
    transform,
  } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  const field = FIELDS.find(f => f.id === id) || FieldLabels[id];

  return (
    <button
      className={cn(
        'rounded-lg bg-white px-2 py-1 text-xs transition-all',
        isBeingDrag && 'opacity-40',
        dragElement && 'cursor-grabbing',
        canDrag ? 'cursor-grab' : 'cursor-default',
      )}
      style={style}
      onMouseDown={onMouseDown}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {field?.label || id}
    </button>
  );
};

const DownloadLink = ({ url, disabled, children }: { url: string; disabled?: boolean; children?: React.ReactNode }) =>
  disabled ? (
    children
  ) : (
    <a href={url} rel="noreferrer" target="_blank" onClick={() => setRestAuthorizationCookie()}>
      {children}
    </a>
  );

const GenerateExportButton = ({ params, account }) => {
  const { toast } = useToast();
  const onSuccess = useCallback(() => {
    toast({
      variant: 'success',
      message: <FormattedMessage id="ExportRequest.Ready" defaultMessage="Your export request is ready!" />,
    });
  }, [toast]);

  const { create, isCreating, data, isLoading, isGenerating } = useExportRequest({ onSuccess });
  const { name, ...parameters } = params;

  const handleRequest = React.useCallback(async () => {
    const variables = {
      exportRequest: {
        account: { slug: account?.slug },
        name,
        type: ExportRequestType.TRANSACTIONS,
        parameters,
      },
    };

    try {
      await create({
        variables,
      });
      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            id="ExportRequest.Generating"
            defaultMessage="Your export is being generated. You can check its progress in the Exports section or wait here until it finishes."
          />
        ),
      });
    } catch {
      toast({
        variant: 'error',
        message: (
          <FormattedMessage
            id="ExportRequest.Failed"
            defaultMessage="Failed to create export request. Please try again."
          />
        ),
      });
    }
  }, [account, create, name, parameters, toast]);

  return data?.exportRequest?.status === 'COMPLETED' && data?.exportRequest?.file?.url ? (
    <Button variant="success" asChild>
      <Link href={data.exportRequest.file.url} target="_blank">
        <FormattedMessage id="DownloadExport" defaultMessage="Download Export" />
      </Link>
    </Button>
  ) : (
    <Button
      loading={isCreating || isLoading}
      onClick={handleRequest}
      disabled={isGenerating}
      className="whitespace-nowrap"
    >
      {isGenerating ? (
        <React.Fragment>
          <Spinner size="xs" className="mr-2" />
          <FormattedMessage id="GeneratingExport" defaultMessage="Generating Export..." />
        </React.Fragment>
      ) : (
        <FormattedMessage id="GenerateExport" defaultMessage="Generate Export" />
      )}
    </Button>
  );
};

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

type ExportTransactionsCSVModalProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  queryFilter: useQueryFilterReturnType<any, TransactionsPageQueryVariables | HostReportsQueryVariables>;
  account?: Pick<Account, 'slug' | 'settings' | 'name'>;
  isHostReport?: boolean;
  trigger?: React.ReactNode;
  canCreatePreset?: boolean;
};

const ExportTransactionsCSVModal = ({
  open,
  setOpen,
  account,
  trigger,
  queryFilter,
  isHostReport,
  canCreatePreset = true,
}: ExportTransactionsCSVModalProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const hasAsyncExportsFeature = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.ASYNC_EXPORTS);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>('#');
  const [preset, setPreset] = React.useState<FIELD_OPTIONS | string>(FIELD_OPTIONS.DEFAULT);
  const [fields, setFields] = React.useState([]);
  const [exportName, setExportName] = React.useState(
    `${account?.name || account?.slug || LoggedInUser?.collective?.name || 'Your'}'s transactions export`,
  );
  const [draggingTag, setDraggingTag] = React.useState<string | null>(null);
  const [flattenTaxesAndPaymentProcessorFees, setFlattenTaxesAndPaymentProcessorFees] = React.useState(false);
  const [useFieldNames, setUseFieldNames] = React.useState(false);
  const [tab, setTab] = React.useState(Object.keys(GROUPS)[0]);
  const [presetName, setPresetName] = React.useState('');
  const [isEditingPreset, setIsEditingPreset] = React.useState(false);
  const [isDeletingPreset, setIsDeletingPreset] = React.useState(false);

  const totalAvailableFields = React.useMemo(
    () => FIELDS.filter(({ id: fieldId }) => !(isHostReport && HOST_OMITTED_FIELDS.includes(fieldId))).length,
    [isHostReport],
  );
  const tabs = React.useMemo(
    () =>
      Object.keys(GROUP_FIELDS).map(group => ({
        id: group,
        label: GROUPS[group] || group,
        count: GROUP_FIELDS[group].filter(fieldId => !(isHostReport && HOST_OMITTED_FIELDS.includes(fieldId))).length,
      })),
    [isHostReport],
  );

  const [submitEditSettings, { loading: isSavingSet, data: updateSettingsData }] =
    useMutation(editAccountSettingsMutation);

  const customFields = React.useMemo(
    () =>
      !canCreatePreset
        ? []
        : updateSettingsData?.editAccountSetting?.settings?.exportedTransactionsFieldSets ||
          account?.settings?.exportedTransactionsFieldSets ||
          {},
    [updateSettingsData, account, canCreatePreset],
  );

  const {
    loading: isFetchingRows,
    call: fetchRows,
    data: exportedRows,
  } = useAsyncCall(async () => {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      const url = makeUrl({
        account,
        isHostReport,
        queryFilter,
        flattenTaxesAndPaymentProcessorFees,
        useFieldNames,
        fields,
      });
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const rows = parseInt(response.headers.get('x-exported-rows'), 10);
      return isNaN(rows) ? null : rows;
    }
  });

  const presetOptions: Array<{
    value: string;
    label: string;
    fields?: Array<CSVField>;
    flattenTaxesAndPaymentProcessorFees?: boolean;
    useFieldNames?: boolean;
  }> = React.useMemo(() => {
    return [
      ...(canCreatePreset
        ? Object.keys(customFields).map(key => ({
            value: key,
            label: customFields[key].name,
            fields: customFields[key].fields,
            flattenTaxesAndPaymentProcessorFees: customFields[key]?.flattenTaxesAndPaymentProcessorFees ?? false,
          }))
        : []),
      ...Object.keys(canCreatePreset ? FIELD_OPTIONS : omit(FIELD_OPTIONS, [FIELD_OPTIONS.NEW_PRESET])).map(value => ({
        value,
        label: FieldOptionsLabels[value],
      })),
    ];
  }, [customFields, canCreatePreset]);

  React.useEffect(() => {
    const selectedSet = PLATFORM_PRESETS[preset] || presetOptions.find(option => option.value === preset);
    if (selectedSet && selectedSet.fields) {
      setFields(selectedSet.fields);
      setIsEditingPreset(false);
      if (!isNil(selectedSet.label)) {
        setPresetName(selectedSet.label);
      } else {
        setPresetName('');
      }

      if (!isNil(selectedSet.flattenTaxesAndPaymentProcessorFees)) {
        setFlattenTaxesAndPaymentProcessorFees(selectedSet.flattenTaxesAndPaymentProcessorFees);
      } else {
        setFlattenTaxesAndPaymentProcessorFees(false);
      }

      if (!isNil(selectedSet.useFieldNames)) {
        setUseFieldNames(selectedSet.useFieldNames);
      } else {
        setUseFieldNames(false);
      }
    } else if (preset === FIELD_OPTIONS.NEW_PRESET) {
      setUseFieldNames(true);
      handleTaxAndPaymentProcessorFeeSwitch(false);
    }
  }, [presetOptions, preset]);

  React.useEffect(() => {
    if (open && account) {
      fetchRows();
    }
  }, [queryFilter.values, account, open]);

  React.useEffect(() => {
    setRestAuthorizationCookie();
    setDownloadUrl(
      makeUrl({ account, isHostReport, queryFilter, flattenTaxesAndPaymentProcessorFees, useFieldNames, fields }),
    );
  }, [fields, flattenTaxesAndPaymentProcessorFees, queryFilter, account, isHostReport, setDownloadUrl, useFieldNames]);

  const handleFieldSwitch = React.useCallback(
    ({ name, checked }) => {
      if (checked) {
        setFields([...fields, name]);
      } else {
        setFields(without(fields, name));
      }
    },
    [fields],
  );

  /** Handle existing "Tax and PaymentProcessorFee" columns toggle.
   * When setting it to true, we'll make sure that both columns are present in the selected fields, adding the missing ones if they're not.
   * When setting it to false, we'll enforce whatever is set in the preset.
   * */
  const handleTaxAndPaymentProcessorFeeSwitch = checked => {
    setFlattenTaxesAndPaymentProcessorFees(checked);
    if (checked) {
      setFields(uniq([...fields, 'paymentProcessorFee', 'taxAmount']));
    } else if (preset === FIELD_OPTIONS.NEW_PRESET) {
      setFields(without(fields, 'paymentProcessorFee', 'taxAmount'));
    } else {
      const selectedSet = PLATFORM_PRESETS[preset] || presetOptions.find(option => option.value === preset);
      setFields(selectedSet?.fields || []);
    }
  };

  const handleGroupSwitch = ({ name, checked }) => {
    if (checked) {
      setFields(
        uniq([
          ...fields,
          ...GROUP_FIELDS[name].filter(fieldId => !(isHostReport && HOST_OMITTED_FIELDS.includes(fieldId))),
        ]),
      );
    } else {
      setFields(fields.filter(f => !GROUP_FIELDS[name].includes(f as any)));
    }
  };

  const handleDragStart = event => {
    setDraggingTag(event.active.id);
  };

  const handleDragEnd = () => {
    setDraggingTag(null);
  };

  // Fix to avoid infinite loop caused by dragging over two items with variable sizes: https://github.com/clauderic/dnd-kit/issues/44#issuecomment-1018686592
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDragOver = React.useCallback(
    debounce(
      event => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
          setFields(selected => {
            const oldIndex = selected.findIndex(item => item === active.id);
            const newIndex = selected.findIndex(item => item === over.id);
            return arrayMove(selected, oldIndex, newIndex);
          });
        }
      },
      40,
      {
        trailing: false,
        leading: true,
      },
    ),
    [],
  );

  const handleSavePreset = async () => {
    const key = slugify(presetName, { lower: true });
    await submitEditSettings({
      variables: {
        account: { slug: account?.slug },
        key: `exportedTransactionsFieldSets.${key}`,
        value: { name: presetName, fields, flattenTaxesAndPaymentProcessorFees, useFieldNames },
      },
    });
    setIsEditingPreset(false);
    setPreset(key);
  };

  const handleDeletePreset = async () => {
    const key = preset;
    await submitEditSettings({
      variables: {
        account: { slug: account?.slug },
        key: `exportedTransactionsFieldSets`,
        value: omit(customFields, [key]),
      },
    });
    setIsEditingPreset(false);
    setIsDeletingPreset(false);
    setPreset(FIELD_OPTIONS.DEFAULT);
  };

  const handleEditPreset = () => {
    setIsEditingPreset(!isEditingPreset);
  };

  const isAboveRowLimit = exportedRows > 100e3;
  const expectedTimeInMinutes = Math.round((exportedRows * 1.1) / AVERAGE_TRANSACTIONS_PER_MINUTE);
  const disabled = !account || isAboveRowLimit || isFetchingRows || isSavingSet || isEmpty(fields);
  const isWholeTabSelected = GROUP_FIELDS[tab]
    ?.filter(fieldId => !(isHostReport && HOST_OMITTED_FIELDS.includes(fieldId)))
    .every(f => fields.includes(f));
  const canEditFields = preset === FIELD_OPTIONS.NEW_PRESET || isEditingPreset;

  return (
    <React.Fragment>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="gap-2 overflow-hidden p-0 md:max-w-4xl">
          <DialogHeader className="px-4 pt-6 sm:px-8">
            <DialogTitle className="text-xl font-bold">
              <FormattedMessage id="ExportTransactionsCSVModal.Title" defaultMessage="Export Transactions" />
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-6 pb-4 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-2">
                <h1 className="font-bold">
                  <FormattedMessage defaultMessage="Selected export set" id="1/2XlO" />
                </h1>
                <div className="flex flex-col justify-stretch gap-4 sm:flex-row sm:items-center">
                  <Select
                    onValueChange={value => setPreset(value)}
                    value={presetOptions.find(option => option.value === preset)?.value || FIELD_OPTIONS.DEFAULT}
                    name="fieldOptions"
                  >
                    <SelectTrigger className="flex-1 sm:max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {presetOptions.map(option => (
                        <SelectItem value={option.value} key={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!FIELD_OPTIONS[preset] && (
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={handleEditPreset} className="flex-1 whitespace-nowrap">
                        <FormattedMessage id="EditPreset" defaultMessage="Edit Preset" />
                      </Button>
                      <Button
                        variant="outlineDestructive"
                        onClick={() => setIsDeletingPreset(true)}
                        className="flex-1 whitespace-nowrap"
                      >
                        <FormattedMessage id="DeletePreset" defaultMessage="Delete Preset" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {preset === FIELD_OPTIONS.NEW_PRESET && (
                <div className="flex flex-1 flex-col gap-2">
                  <h1 className="font-bold">
                    <FormattedMessage defaultMessage="Set name" id="GUFh1k" />
                  </h1>
                  <Input value={presetName} onChange={e => setPresetName(e.target.value)} name="presetName" />
                  <p className="text-xs">
                    <FormattedMessage
                      id="ExportCSV.NewPresetName.Hint"
                      defaultMessage="You and the other admins in your team will be able to reuse this export set in the future."
                    />
                  </p>
                </div>
              )}
            </div>
            <Collapsible open={canEditFields} className={cn(!canEditFields && 'hidden')}>
              <CollapsibleContent>
                <h1 className="font-bold">
                  <FormattedMessage defaultMessage="Available fields" id="+Ct+Nd" />
                  <small className="ml-1 text-base font-medium text-gray-700">({totalAvailableFields})</small>
                </h1>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <Tabs variant="vertical" tabs={tabs} selectedId={tab} onChange={setTab} />
                  <div className="flex flex-1 flex-col gap-3 rounded-lg border border-solid border-slate-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{GROUPS[tab] || tab}</div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={tab}
                          checked={isWholeTabSelected}
                          onCheckedChange={checked => handleGroupSwitch({ name: tab, checked })}
                        />
                        <label
                          htmlFor={tab}
                          className="cursor-pointer text-sm leading-none font-bold! peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <FormattedMessage id="ExportTransactionsCSVModal.SelectAll" defaultMessage="Select all" />
                        </label>
                      </div>
                    </div>
                    <div className="gap-2 sm:columns-2">
                      {React.useMemo(
                        () =>
                          GROUP_FIELDS[tab]
                            .filter(fieldId => !(isHostReport && HOST_OMITTED_FIELDS.includes(fieldId)))
                            .map(fieldId => {
                              const field = FIELDS.find(f => f.id === fieldId);
                              return (
                                <div key={fieldId} className="mb-2 flex items-center gap-1">
                                  <Checkbox
                                    id={fieldId}
                                    checked={fields.includes(fieldId)}
                                    onCheckedChange={checked => handleFieldSwitch({ name: fieldId, checked })}
                                  />
                                  <label
                                    htmlFor={fieldId}
                                    className="ml-1 cursor-pointer text-sm leading-none font-normal! peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {field?.label || fieldId}
                                  </label>
                                  {field?.tooltip && <InfoTooltipIcon>{field.tooltip}</InfoTooltipIcon>}
                                </div>
                              );
                            }),
                        [fields, tab, isHostReport, handleFieldSwitch],
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div>
              <div className="flex flex-col justify-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="font-bold">
                    <FormattedMessage defaultMessage="Selected fields for export" id="xnO1Gg" />
                    <small className="ml-1 text-base font-medium text-gray-700">
                      (
                      <FormattedMessage
                        defaultMessage="{n} out of {m}"
                        id="3uinDX"
                        values={{ n: fields.length, m: totalAvailableFields }}
                      />
                      )
                    </small>
                  </h1>
                  <p className="mt-1 text-xs text-gray-500">
                    <FormattedMessage
                      defaultMessage="Fields will be exported in the order they're displayed in below. Drag and drop them to reorder them."
                      id="rFP53b"
                    />
                  </p>
                </div>

                {canEditFields && (
                  <Button variant="outline" onClick={() => setFields([])} className="whitespace-nowrap">
                    <Eraser size={16} className="mr-2" />
                    <FormattedMessage id="ClearSelection" defaultMessage="Clear Selection" />
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 rounded-lg bg-slate-100 p-2">
                {React.useMemo(
                  () =>
                    canEditFields && fields.length > 0 ? (
                      <DndContext
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragEnd}
                      >
                        <SortableContext items={fields}>
                          {fields.map(field => (
                            <FieldTag key={field} id={field} canDrag />
                          ))}
                        </SortableContext>
                        <DragOverlay>{draggingTag ? <FieldTag id={draggingTag} dragElement /> : null}</DragOverlay>
                      </DndContext>
                    ) : fields.length ? (
                      fields.map(field => <FieldTag key={field} id={field} />)
                    ) : (
                      <p className="self-center text-xs">
                        <FormattedMessage defaultMessage="You have not selected any fields for export." id="EMjZZT" />
                      </p>
                    ),
                  [canEditFields, fields, draggingTag, handleDragOver],
                )}
              </div>
            </div>
            {hasAsyncExportsFeature && (
              <div className="flex flex-col gap-2">
                <h1 className="font-bold">
                  <FormattedMessage defaultMessage="Export name" id="ExportName" />
                </h1>
                <Input value={exportName} onChange={e => setExportName(e.target.value)} name="exportName" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h1 className="font-bold">
                <FormattedMessage defaultMessage="Export options" id="b7Sq18" />
              </h1>
              <div className="flex flex-row items-center gap-2">
                <Switch checked={!useFieldNames} onCheckedChange={checked => setUseFieldNames(!checked)} />
                <p className="text-sm">
                  <FormattedMessage
                    defaultMessage="Use field IDs as column headers instead of field names."
                    id="Xq0DWl"
                  />
                </p>
                <InfoTooltipIcon>
                  <FormattedMessage
                    defaultMessage="Select this option to export a backward-compatible CSV header using field IDs (effectiveDate, legacyId) instead of field names (Effective Date & Time, Transaction ID)."
                    id="ArRZh5"
                  />
                </InfoTooltipIcon>
              </div>
              {parseToBoolean(getEnvVar('LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES')) && (
                <div className="flex flex-row items-center gap-2">
                  <Switch
                    checked={flattenTaxesAndPaymentProcessorFees}
                    onCheckedChange={handleTaxAndPaymentProcessorFeeSwitch}
                  />
                  <p className="text-sm">
                    <FormattedMessage defaultMessage="Export taxes and payment processor fees as columns" id="ZNzyMo" />
                  </p>
                  <InfoTooltipIcon>
                    <FormattedMessage
                      defaultMessage="Before 2024 payment processor fees and taxes were columns in transaction records. Since January 2024 they are separate transactions. Enable this option to transform separate payment processor fees and tax transactions into columns in the export."
                      id="frVonU"
                    />
                  </InfoTooltipIcon>
                </div>
              )}
            </div>
            {isAboveRowLimit && (
              <div className="flex flex-col gap-4 rounded-lg border border-solid border-red-600 bg-red-50 px-6 py-4">
                <p className="font-bold">
                  <FormattedMessage defaultMessage="The size of the resulting export file is too large" id="XX+VZK" />
                </p>
                <p className="text-sm">
                  <FormattedMessage
                    defaultMessage="Select a different set of filters to enable the transactions export to work."
                    id="8Q0YZb"
                  />
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-4 border-t border-solid border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="font-bold text-slate-700 sm:text-sm">
              {isFetchingRows ? (
                <React.Fragment>
                  <FormattedMessage
                    id="ExportTransactionsCSVModal.FetchingRows"
                    defaultMessage="Checking number of exported rows..."
                  />
                </React.Fragment>
              ) : !isAboveRowLimit && exportedRows ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <FormattedMessage
                    id="ExportTransactionsCSVModal.ExportRows"
                    defaultMessage="Exporting {rows} {rows, plural, one {row} other {rows}}"
                    values={{
                      rows: exportedRows,
                    }}
                  />
                  {expectedTimeInMinutes > 0 && (
                    <div className="text-sm font-normal">
                      <FormattedMessage
                        id="ExportTransactionsCSVModal.ExportTime"
                        defaultMessage="Estimated time: {expectedTimeInMinutes, plural, one {# minute} other {# minutes}}"
                        values={{
                          expectedTimeInMinutes,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col justify-stretch gap-2 sm:flex-row sm:justify-between">
              {canEditFields && (
                <Button
                  variant="outline"
                  disabled={isEmpty(presetName) || isEmpty(fields)}
                  loading={isSavingSet}
                  onClick={handleSavePreset}
                  className="flex-1"
                >
                  <FormattedMessage id="SavePreset" defaultMessage="Save Preset" />
                </Button>
              )}
              <Button disabled={disabled} variant="outline" className="whitespace-nowrap">
                <DownloadLink url={`${downloadUrl}&limit=5`} disabled={disabled}>
                  <FormattedMessage id="ExportSample" defaultMessage="Export Sample" />
                </DownloadLink>
              </Button>
              {hasAsyncExportsFeature ? (
                <GenerateExportButton
                  account={account}
                  params={{
                    name: exportName,
                    variables: omit(queryFilter.variables, ['limit', 'offset']),
                    fields,
                    useFieldNames,
                    isHostReport,
                    flattenTaxesAndPaymentProcessorFees,
                    fetchAll: true,
                  }}
                />
              ) : (
                <Button disabled={disabled} className="whitespace-nowrap">
                  <DownloadLink url={`${downloadUrl}&fetchAll=1`} disabled={disabled}>
                    <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                  </DownloadLink>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isDeletingPreset && (
        <ConfirmationModal
          isDanger
          header={<FormattedMessage id="DeletePreset" defaultMessage="Delete Preset" />}
          body={
            <FormattedMessage
              id="ExportTransactionsCSVModal.DeletePresetConfirmation.Body"
              defaultMessage="Are you sure you want to delete the {presetName} preset?"
              values={{ presetName: presetName || preset }}
            />
          }
          continueLabel={<FormattedMessage id="Delete" defaultMessage="Yes, Delete Preset" />}
          onClose={() => setIsDeletingPreset(false)}
          continueHandler={handleDeletePreset}
        />
      )}
    </React.Fragment>
  );
};

export default ExportTransactionsCSVModal;
