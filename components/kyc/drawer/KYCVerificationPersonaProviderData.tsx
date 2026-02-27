import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { PersonaKycProviderData } from '@/lib/graphql/types/v2/schema';

import { CopyID } from '@/components/CopyId';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';

type KYCVerificationPersonaProviderDataProps = {
  providerData: PersonaKycProviderData;
};

export function KYCVerificationPersonaProviderData(props: KYCVerificationPersonaProviderDataProps) {
  const { providerData } = props;
  return (
    <React.Fragment>
      <DataList>
        {providerData.id && (
          <DataListItem>
            <DataListItemLabel className="min-w-auto sm:!basis-[180px]">
              <FormattedMessage defaultMessage="Inquiry ID" id="8v9c3K" />
            </DataListItemLabel>
            <DataListItemValue className="grow overflow-hidden whitespace-pre-line text-slate-700">
              <CopyID value={providerData.id}>{providerData.id}</CopyID>
            </DataListItemValue>
          </DataListItem>
        )}
        <DataListItem>
          <DataListItemLabel className="min-w-auto sm:!basis-[180px]">
            <FormattedMessage defaultMessage="Inquiry Status" id="+T66Aw" />
          </DataListItemLabel>
          <DataListItemValue className="grow overflow-hidden whitespace-pre-line text-slate-700">
            {providerData.status}
          </DataListItemValue>
        </DataListItem>
      </DataList>
      <h3 className="text-base font-medium tracking-wide text-slate-600 uppercase">
        <FormattedMessage defaultMessage="Persona Fields" id="yNYzrP" />
      </h3>
      <PersonaFields fields={providerData.fields} />
    </React.Fragment>
  );
}

type PersonaFieldsProps = {
  fields: Record<string, unknown>;
};

function PersonaFields(props: PersonaFieldsProps) {
  const { fields } = props;

  return (
    <DataList>
      {Object.entries(fields).map(([key, field]) => (
        <DataListItem key={key}>
          <DataListItemLabel className="min-w-auto overflow-hidden text-ellipsis sm:!basis-[180px]" title={key}>
            {key}
          </DataListItemLabel>
          <DataListItemValue className="grow overflow-hidden whitespace-pre-line text-slate-700">
            <PersonaFieldValue field={field as PersonaFieldValueProps['field']} />
          </DataListItemValue>
        </DataListItem>
      ))}
    </DataList>
  );
}

type PersonaFieldValueProps = {
  field: {
    type: string;
    value: any;
  };
};

function PersonaFieldValue(props: PersonaFieldValueProps) {
  const { field } = props;
  const value = field.value as any;

  switch (field.type) {
    case 'string':
    case 'date':
      return field.value;
    case 'selfie':
    case 'government_id':
      return value?.id ? <CopyID value={value.id}>{value.id}</CopyID> : '-';
    default:
      return <span>{JSON.stringify(field.value)}</span>;
  }
}
