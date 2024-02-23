import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import AttachedFiles from '../attached-files/AttachedFiles';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import LinkCollective from '../LinkCollective';
import { InfoList, InfoListItem } from '../ui/InfoList';

type AgreementProps = {
  agreement: GraphQLAgreement;
  openFileViewer?: (url: string) => void;
};

export default function Agreement({ agreement, openFileViewer = undefined }: AgreementProps) {
  return (
    <div>
      <h4 className="mb-4 text-lg font-medium text-slate-900">{agreement.title}</h4>
      <InfoList className="sm:grid-cols-2">
        {agreement.attachment && (
          <InfoListItem
            title={<FormattedMessage defaultMessage="Agreement file" />}
            value={<AttachedFiles files={[agreement.attachment]} size={128} openFileViewer={openFileViewer} />}
            className="sm:col-span-2"
          />
        )}

        <InfoListItem
          title={<FormattedMessage defaultMessage="Account" />}
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

        <InfoListItem
          title={<FormattedMessage id="Agreement.createdBy" defaultMessage="Created by" />}
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
        <InfoListItem
          title={<FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />}
          value={<DateTime value={agreement.createdAt} />}
        />
        <InfoListItem
          title={<FormattedMessage id="agreement.expiresOn" defaultMessage="Expires on" />}
          value={
            agreement.expiresAt ? (
              <DateTime value={agreement.expiresAt} />
            ) : (
              <span className="italic text-slate-500">
                <FormattedMessage defaultMessage="Never" />
              </span>
            )
          }
        />
        {agreement.notes && (
          <InfoListItem
            className="sm:col-span-2"
            title={<FormattedMessage id="expense.notes" defaultMessage="Notes" />}
            value={<p className="whitespace-pre-line">{agreement.notes}</p>}
          />
        )}
      </InfoList>
    </div>
  );
}
