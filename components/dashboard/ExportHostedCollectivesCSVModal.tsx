import React from 'react';
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
import {
  AVERAGE_ROWS_PER_MINUTE,
  FIELD_OPTIONS,
  FieldOptionsLabels,
  FIELDS,
  GROUP_FIELDS,
  GROUPS,
  PLATFORM_PRESETS,
} from '../../lib/export-csv/hosted-collectives-csv';
import type { CSVField } from '../../lib/export-csv/transactions-csv';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { HostReportsQueryVariables, TransactionsPageQueryVariables } from '../../lib/graphql/types/v2/graphql';
import type { Account } from '../../lib/graphql/types/v2/schema';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { cn } from '../../lib/utils';

import ConfirmationModal from '../ConfirmationModal';
import { InfoTooltipIcon } from '../InfoTooltipIcon';
import Tabs from '../Tabs';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

const TOTAL_AVAILABLE_FIELDS = FIELDS.length;

const TABS = Object.keys(GROUP_FIELDS).map(group => ({
  id: group,
  label: GROUPS[group] || group,
  count: GROUP_FIELDS[group].length,
}));

const makeUrl = ({ account, queryFilter, fields }) => {
  const url = new URL(`${process.env.REST_URL}/v2/${account?.slug}/hosted-collectives.csv`);

  if (queryFilter.values.type) {
    url.searchParams.set('type', queryFilter.values.type);
  }
  if (queryFilter.values.currencies) {
    url.searchParams.set('currencies', queryFilter.values.currencies);
  }
  if (queryFilter.values.searchTerm) {
    url.searchParams.set('searchTerm', queryFilter.values.searchTerm);
  }
  if (queryFilter.values.sort) {
    url.searchParams.set('sort', JSON.stringify(queryFilter.values.sort));
  }
  if (queryFilter.variables.consolidatedBalance) {
    url.searchParams.set('consolidatedBalance', JSON.stringify(queryFilter.variables.consolidatedBalance));
  }
  if (!isNil(queryFilter.variables.isFrozen)) {
    url.searchParams.set('isFrozen', queryFilter.variables.isFrozen ? '1' : '0');
  }
  if (!isNil(queryFilter.variables.isUnhosted)) {
    url.searchParams.set('isUnhosted', queryFilter.variables.isUnhosted ? '1' : '0');
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
  const field = FIELDS.find(f => f.id === id);

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
    <a href={url} rel="noreferrer" target="_blank">
      {children}
    </a>
  );

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

type ExportHostedCollectivesCSVModalProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  queryFilter: useQueryFilterReturnType<any, TransactionsPageQueryVariables | HostReportsQueryVariables>;
  account?: Pick<Account, 'slug' | 'settings'>;
  isHostReport?: boolean;
  trigger?: React.ReactNode;
};

const ExportHostedCollectivesCSVModal = ({
  open,
  setOpen,
  account,
  trigger,
  queryFilter,
  isHostReport,
}: ExportHostedCollectivesCSVModalProps) => {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>('#');
  const [preset, setPreset] = React.useState<FIELD_OPTIONS | string>(FIELD_OPTIONS.DEFAULT);
  const [fields, setFields] = React.useState([]);
  const [draggingTag, setDraggingTag] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState(Object.keys(GROUPS)[0]);
  const [presetName, setPresetName] = React.useState('');
  const [isEditingPreset, setIsEditingPreset] = React.useState(false);
  const [isDeletingPreset, setIsDeletingPreset] = React.useState(false);

  const [submitEditSettings, { loading: isSavingSet, data: updateSettingsData }] = useMutation(
    editAccountSettingsMutation,
    { context: API_V2_CONTEXT },
  );

  const customFields = React.useMemo(
    () =>
      updateSettingsData?.editAccountSetting?.settings?.exportedHostedCollectivesFieldSets ||
      account?.settings?.exportedHostedCollectivesFieldSets ||
      {},
    [updateSettingsData, account],
  );

  const {
    loading: isFetchingRows,
    call: fetchRows,
    data: exportedRows,
  } = useAsyncCall(async () => {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      const url = makeUrl({ account, queryFilter, fields });
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
  }> = React.useMemo(() => {
    return [
      ...Object.keys(customFields).map(key => ({
        value: key,
        label: customFields[key].name,
        fields: customFields[key].fields,
        flattenTaxesAndPaymentProcessorFees: customFields[key]?.flattenTaxesAndPaymentProcessorFees ?? false,
      })),
      ...Object.keys(FIELD_OPTIONS).map(value => ({ value, label: FieldOptionsLabels[value] })),
    ];
  }, [customFields]);

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
    }
  }, [presetOptions, preset]);

  React.useEffect(() => {
    if (open) {
      fetchRows();
    }
  }, [queryFilter.values, account, open]);

  React.useEffect(() => {
    setRestAuthorizationCookie();
    setDownloadUrl(makeUrl({ account, queryFilter, fields }));
  }, [fields, queryFilter, account, isHostReport, setDownloadUrl]);

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

  const handleGroupSwitch = ({ name, checked }) => {
    if (checked) {
      setFields(uniq([...fields, ...GROUP_FIELDS[name]]));
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
        key: `exportedHostedCollectivesFieldSets.${key}`,
        value: { name: presetName, fields },
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
        key: `exportedHostedCollectivesFieldSets`,
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

  const isAboveRowLimit = exportedRows > 10e3;
  const expectedTimeInMinutes = Math.round((exportedRows * 1.1) / AVERAGE_ROWS_PER_MINUTE);
  const disabled = isAboveRowLimit || isFetchingRows || isSavingSet || isEmpty(fields);
  const isWholeTabSelected = GROUP_FIELDS[tab]?.every(f => fields.includes(f));
  const canEditFields = preset === FIELD_OPTIONS.NEW_PRESET || isEditingPreset;

  return (
    <React.Fragment>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="gap-2 overflow-hidden p-0 md:max-w-4xl">
          <DialogHeader className="px-4 pt-6 sm:px-8">
            <DialogTitle className="text-xl font-bold">
              <FormattedMessage id="ExportHostedCollectivesCSVModal.Title" defaultMessage="Export Hosted Collectives" />
            </DialogTitle>
            <DialogDescription>
              <FormattedMessage
                defaultMessage="Export a CSV file with information about the hosted collectives that match the filters you've selected.{br}The information exported is contextual to your fiscal host and does not include information about the time a collective was hosted by another fiscal host."
                values={{
                  br: <br />,
                }}
                id="APGvDq"
              />
            </DialogDescription>
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
                  <small className="ml-1 text-base font-medium text-gray-700">({TOTAL_AVAILABLE_FIELDS})</small>
                </h1>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <Tabs variant="vertical" tabs={TABS} selectedId={tab} onChange={setTab} />
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
                          GROUP_FIELDS[tab].map(fieldId => {
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
                        [fields, tab, handleFieldSwitch],
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
                        values={{ n: fields.length, m: TOTAL_AVAILABLE_FIELDS }}
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
            {isAboveRowLimit && (
              <div className="flex flex-col gap-4 rounded-lg border border-solid border-red-600 bg-red-50 px-6 py-4">
                <p className="font-bold">
                  <FormattedMessage defaultMessage="The size of the resulting export file is too large" id="XX+VZK" />
                </p>
                <p className="text-sm">
                  <FormattedMessage
                    defaultMessage="Select a different set of filters to enable the export to work."
                    id="YesI6+"
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
            <div className="flex flex-col justify-stretch gap-2 sm:flex-row sm:justify-normal">
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
              <Button disabled={disabled} className="whitespace-nowrap">
                <DownloadLink url={`${downloadUrl}&fetchAll=1`} disabled={disabled}>
                  <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                </DownloadLink>
              </Button>
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

export default ExportHostedCollectivesCSVModal;
