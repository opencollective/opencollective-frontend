import React from 'react';
import { size } from 'lodash';
import { PauseCircle, SquareSlashIcon, UndoDot } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getPossibleActionsForSelectedRows } from './lib/table-selection';
import { TransactionsImportRowStatus } from '@/lib/graphql/types/v2/schema';

import { Button } from '@/components/ui/Button';

export const TransactionsImportRowsBatchActionsBar = ({
  rows,
  selection,
  dispatchSelection,
  setRowsStatus,
  totalCount,
}) => {
  const [submittingAction, setSubmittingAction] = React.useState<'ignore' | 'restore' | 'on-hold' | null>(null);
  const nbSelected = size(selection.rows);
  if (!nbSelected || !rows) {
    return null;
  }

  const selectedRows = rows.filter(row => selection.rows[row.id]);
  const nbLinked = selectedRows.filter(row => row.status === TransactionsImportRowStatus.LINKED).length;
  const totalSelectable = nbSelected - nbLinked; // Can't do any action on linked rows
  if (totalSelectable === 0) {
    return null;
  }

  const includeAllPages = selection.includeAllPages;
  const rowsActions = getPossibleActionsForSelectedRows(selectedRows);
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-100 px-6 py-2 text-sm text-neutral-800">
      <div>
        {selection.includeAllPages || totalSelectable === totalCount || nbSelected === totalCount ? (
          <React.Fragment>
            <FormattedMessage
              defaultMessage="All {count} rows are selected."
              id="1bUrqi"
              values={{ count: totalCount }}
            />
            <Button variant="link" size="xs" onClick={() => dispatchSelection({ type: 'CLEAR' })}>
              <FormattedMessage defaultMessage="Clear selection" id="EYIw2M" />
            </Button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <FormattedMessage
              defaultMessage="{count} rows on this page are selected."
              id="mJiYf5"
              values={{ count: totalSelectable }}
            />
            <Button variant="link" size="xs" onClick={() => dispatchSelection({ type: 'SELECT_ALL_PAGES' })}>
              <FormattedMessage defaultMessage="Select all {count} rows." id="vbHaiI" values={{ count: totalCount }} />
            </Button>
          </React.Fragment>
        )}
      </div>
      <div>
        <div className="flex min-w-36 justify-end">
          {includeAllPages ||
          rowsActions.canIgnore.length ||
          rowsActions.canRestore.length ||
          rowsActions.canPutOnHold.length ? (
            <div className="flex gap-1">
              {(includeAllPages || rowsActions.canRestore.length > 0) && (
                <Button
                  variant="outline"
                  size="xs"
                  className="text-xs whitespace-nowrap"
                  loading={submittingAction === 'restore'}
                  disabled={Boolean(submittingAction)}
                  onClick={async () => {
                    setSubmittingAction('restore');
                    try {
                      if (
                        await setRowsStatus(rowsActions.canRestore, TransactionsImportRowStatus.PENDING, {
                          includeAllPages,
                        })
                      ) {
                        dispatchSelection({ type: 'CLEAR' });
                      }
                    } finally {
                      setSubmittingAction(null);
                    }
                  }}
                >
                  <UndoDot size={12} />
                  <FormattedMessage defaultMessage="Restore" id="zz6ObK" />
                </Button>
              )}

              {(includeAllPages || rowsActions.canIgnore.length > 0) && (
                <Button
                  variant="outline"
                  size="xs"
                  className="text-xs whitespace-nowrap"
                  loading={submittingAction === 'ignore'}
                  disabled={Boolean(submittingAction)}
                  onClick={async () => {
                    setSubmittingAction('ignore');
                    try {
                      if (
                        await setRowsStatus(rowsActions.canIgnore, TransactionsImportRowStatus.IGNORED, {
                          includeAllPages,
                        })
                      ) {
                        dispatchSelection({ type: 'CLEAR' });
                      }
                    } finally {
                      setSubmittingAction(null);
                    }
                  }}
                >
                  <SquareSlashIcon size={12} />
                  <FormattedMessage defaultMessage="No action" id="zue9QR" />
                </Button>
              )}

              {(includeAllPages || rowsActions.canPutOnHold.length > 0) && (
                <Button
                  variant="outline"
                  size="xs"
                  className="text-xs whitespace-nowrap"
                  loading={submittingAction === 'on-hold'}
                  disabled={Boolean(submittingAction)}
                  onClick={async () => {
                    setSubmittingAction('on-hold');
                    try {
                      if (
                        await setRowsStatus(rowsActions.canPutOnHold, TransactionsImportRowStatus.ON_HOLD, {
                          includeAllPages,
                        })
                      ) {
                        dispatchSelection({ type: 'CLEAR' });
                      }
                    } finally {
                      setSubmittingAction(null);
                    }
                  }}
                >
                  <PauseCircle size={13} />
                  <FormattedMessage defaultMessage="Put on hold" id="K1HLMq" />
                </Button>
              )}
            </div>
          ) : (
            <div>
              <FormattedMessage defaultMessage="Actions" id="CollectivePage.NavBar.ActionMenu.Actions" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
