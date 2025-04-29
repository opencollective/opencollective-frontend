import React from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { updateTransactionsImportRows } from './lib/graphql';
import { i18nGraphqlException } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { TransactionsImportRow } from '@/lib/graphql/types/v2/schema';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/useToast';

export const TransactionsImportRowNoteForm = ({
  row,
  autoFocus = false,
}: {
  row: Pick<TransactionsImportRow, 'id' | 'note'>;
  autoFocus?: boolean;
}) => {
  const [updateRows, { loading }] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const [newText, setNewText] = React.useState(row.note || '');
  const { toast } = useToast();
  const intl = useIntl();
  return (
    <div>
      <Label htmlFor="import-row-note" className="mb-1 font-bold text-gray-600">
        <FormattedMessage defaultMessage="Note" id="qMePPG" />
      </Label>
      <Textarea
        id="import-row-note"
        className="min-h-40"
        value={newText}
        onChange={e => setNewText(e.target.value)}
        autoFocus={autoFocus}
        maxLength={5000}
      />
      <div className={'mt-2 flex w-full justify-end'}>
        <Button
          variant="outline"
          size="sm"
          loading={loading}
          disabled={newText === (row.note || '')}
          onClick={() => {
            try {
              updateRows({
                variables: { rows: [{ id: row.id, note: newText }], action: 'UPDATE_ROWS' },
              });
            } catch (error) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, error),
              });
            }
          }}
        >
          <FormattedMessage defaultMessage="Save" id="save" />
        </Button>
      </div>
    </div>
  );
};
