import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import AttachedFiles from '../attached-files/AttachedFiles';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import LinkCollective from '../LinkCollective';
import { DataList, DataListItem } from '../ui/DataList';

type AgreementProps = {
  agreement: GraphQLAgreement;
  openFileViewer?: (url: string) => void;
};

export default function AgreementDetails({ agreement, openFileViewer = undefined }: AgreementProps) {
  return (
    <div>
      <DataList className="gap-6">
        {agreement.attachment && (
          <DataListItem
            label={<FormattedMessage defaultMessage="Agreement file" id="i22tK5" />}
            value={<AttachedFiles files={[agreement.attachment]} size={128} openFileViewer={openFileViewer} />}
          />
        )}

        <DataListItem
          label={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
          value={
            <LinkCollective
              collective={agreement.account}
              className="flex items-center gap-2 truncate font-medium text-slate-700 hover:text-slate-700 hover:underline"
              withHoverCard
            >
              <Avatar collective={agreement.account} radius={24} />
              {agreement.account.name}
            </LinkCollective>
          }
        />

        <DataListItem
          label={<FormattedMessage id="Agreement.createdBy" defaultMessage="Created by" />}
          value={
            <LinkCollective
              collective={agreement.createdBy}
              className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
              withHoverCard
              hoverCardProps={{ includeAdminMembership: { accountSlug: agreement.account.slug } }}
            >
              <Avatar collective={agreement.createdBy} radius={24} />
              {agreement.createdBy.name}
            </LinkCollective>
          }
        />
        <DataListItem
          label={<FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />}
          value={<DateTime value={agreement.createdAt} />}
        />
        <DataListItem
          label={<FormattedMessage id="agreement.expiresOn" defaultMessage="Expires on" />}
          value={
            agreement.expiresAt ? (
              <DateTime value={agreement.expiresAt} />
            ) : (
              <span className="text-slate-500 italic">
                <FormattedMessage defaultMessage="Never" id="du1laW" />
              </span>
            )
          }
        />
        {agreement.notes && (
          <DataListItem
            label={<FormattedMessage id="expense.notes" defaultMessage="Notes" />}
            value={<p className="whitespace-pre-line">{agreement.notes}</p>}
          />
        )}
      </DataList>
    </div>
  );
}
