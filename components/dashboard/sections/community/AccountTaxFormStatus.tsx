import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { Host, LegalDocument } from '@/lib/graphql/types/v2/schema';

import { useLegalDocumentActions } from '@/components/dashboard/sections/legal-documents/actions';
import LegalDocumentDrawer from '@/components/dashboard/sections/legal-documents/LegalDocumentDrawer';
import { LegalDocumentStatusBadge } from '@/components/dashboard/sections/legal-documents/LegalDocumentStatusBadge';
import DateTime from '@/components/DateTime';
import { Button } from '@/components/ui/Button';

type AccountTaxFormStatusProps = {
  taxForm: LegalDocument;
  host: Pick<Host, 'id' | 'slug'>;
  onRefetch?: () => void;
};

export const AccountTaxFormStatus = ({ taxForm, host, onRefetch }: AccountTaxFormStatusProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const getActions = useLegalDocumentActions(host, onRefetch ?? (() => {}), false);
  return (
    <React.Fragment>
      <Button variant="outline" className="px-2" onClick={() => setIsDrawerOpen(true)}>
        <LegalDocumentStatusBadge status={taxForm.status} />
        <span className="">
          <FormattedMessage
            defaultMessage="on {date}"
            id="mzGohi"
            values={{
              date: <DateTime value={taxForm.updatedAt} dateStyle="medium" />,
            }}
          />
        </span>
      </Button>
      <LegalDocumentDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        host={host}
        document={taxForm as LegalDocument}
        getActions={getActions}
      />
    </React.Fragment>
  );
};
