import React from 'react';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { updateTransactionsImportRows } from './lib/graphql';
import { i18nGraphqlException } from '@/lib/errors';
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
  const [updateRows, { loading }] = useMutation(updateTransactionsImportRows);
  const [newText, setNewText] = React.useState(row.note || '');
  const { toast } = useToast();
  const intl = useIntl();
  const hasUnsavedChanges = newText !== (row.note || '');

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
          variant={hasUnsavedChanges ? 'default' : 'outline'}
          disabled={!hasUnsavedChanges}
          size="sm"
          loading={loading}
          onClick={async () => {
            try {
              const result = await updateRows({
                variables: { rows: [{ id: row.id, note: newText }], action: 'UPDATE_ROWS' },
              });
              const responseText = get(result, 'data.updateTransactionsImportRows.rows.0.note');
              if (typeof responseText === 'string') {
                setNewText(responseText);
              }
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
