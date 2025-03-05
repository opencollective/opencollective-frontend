import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { AccountingCategory } from '../../../../lib/graphql/types/v2/schema';
import { AccountingCategoryAppliesTo, AccountingCategoryKind } from '../../../../lib/graphql/types/v2/schema';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';
import { Separator } from '@/components/ui/Separator';

import { Drawer, DrawerActions, DrawerHeader } from '../../../Drawer';
import HTMLContent, { isEmptyHTMLValue } from '../../../HTMLContent';
import StyledButton from '../../../StyledButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';

import type { EditableAccountingCategoryFields } from './AccountingCategoryForm';
import {
  AccountingCategoryAppliesToI18n,
  AccountingCategoryForm,
  AccountingCategoryKindI18n,
  useAccountingCategoryFormik,
} from './AccountingCategoryForm';

type AccountingCategoryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onEdit: (category: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>) => void;
  onDelete: (category: Pick<AccountingCategory, 'id'>) => void;
  accountingCategory?: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>;
  isIndependentCollective: boolean;
  isInitiallyEditing?: boolean;
};

export function AccountingCategoryDrawer(props: AccountingCategoryDrawerProps) {
  const [isEditing, setIsEditing] = React.useState(props.isInitiallyEditing || false);

  React.useEffect(() => {
    if (!props.open) {
      setIsEditing(false);
    }
  }, [props.open]);

  React.useEffect(() => {
    setIsEditing(props.isInitiallyEditing || false);
  }, [props.isInitiallyEditing]);

  return (
    <Drawer maxWidth="512px" open={props.open} onClose={props.onClose} showActionsContainer>
      <DrawerHeader title={props.accountingCategory?.name} onClose={props.onClose} />

      {!isEditing && (
        <AccountingCategoryDrawerView
          isIndependentCollective={props.isIndependentCollective}
          onEditClick={() => setIsEditing(true)}
          onDeleteClick={() => props.onDelete(props.accountingCategory)}
          accountingCategory={props.accountingCategory}
        />
      )}
      {isEditing && (
        <AccountingCategoryEditingDrawerView
          isIndependentCollective={props.isIndependentCollective}
          accountingCategory={props.accountingCategory}
          onEdit={props.onEdit}
          onExitEdit={() => setIsEditing(false)}
        />
      )}
    </Drawer>
  );
}

type AccountingCategoryDrawerViewProps = {
  accountingCategory?: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>;
  onEditClick: () => void;
  onDeleteClick: () => void;
  isIndependentCollective: boolean;
};

function AccountingCategoryDrawerView(props: AccountingCategoryDrawerViewProps) {
  const intl = useIntl();

  return (
    <React.Fragment>
      <DataList className="text-sm">
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Accounting code" id="tvVFNA" />
          </DataListItemLabel>
          <DataListItemValue>
            <span className="rounded-xl bg-slate-50 px-2 py-1 font-bold text-slate-800">
              {props.accountingCategory?.code}
            </span>
          </DataListItemValue>
        </DataListItem>

        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Category name" id="kgVqk1" />
          </DataListItemLabel>
          <DataListItemValue>{props.accountingCategory?.name}</DataListItemValue>
        </DataListItem>

        {props.accountingCategory?.friendlyName && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage id="AccountingCategory.friendlyName" defaultMessage="Friendly name" />
            </DataListItemLabel>
            <DataListItemValue className="italic">{props.accountingCategory?.friendlyName}</DataListItemValue>
          </DataListItem>
        )}

        {!props.isIndependentCollective && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Applies to" id="6WqHWi" />
            </DataListItemLabel>
            <DataListItemValue>
              {props.accountingCategory?.appliesTo && (
                <FormattedMessage {...AccountingCategoryAppliesToI18n[props.accountingCategory?.appliesTo]} />
              )}
            </DataListItemValue>
          </DataListItem>
        )}

        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Kind" id="Transaction.Kind" />
          </DataListItemLabel>
          <DataListItemValue>
            {props.accountingCategory?.kind && (
              <FormattedMessage {...AccountingCategoryKindI18n[props.accountingCategory?.kind]} />
            )}
          </DataListItemValue>
        </DataListItem>

        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Visible only to host admins" id="NvBPFR" />
          </DataListItemLabel>
          <DataListItemValue>
            {props.accountingCategory?.hostOnly ? (
              <FormattedMessage defaultMessage="Yes" id="a5msuh" />
            ) : (
              <FormattedMessage defaultMessage="No" id="oUWADl" />
            )}
          </DataListItemValue>
        </DataListItem>

        {props.accountingCategory?.kind === AccountingCategoryKind.EXPENSE && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Expense types" id="7oAuzt" />
            </DataListItemLabel>
            <DataListItemValue>
              {props.accountingCategory?.expensesTypes ? (
                props.accountingCategory.expensesTypes.map(value => i18nExpenseType(intl, value)).join(', ')
              ) : (
                <FormattedMessage id="AllExpenses" defaultMessage="All expenses" />
              )}
            </DataListItemValue>
          </DataListItem>
        )}

        {!isEmptyHTMLValue(props.accountingCategory?.instructions) && (
          <React.Fragment>
            <Separator className="my-3" />
            <DataListItem className="sm:flex-col">
              <DataListItemLabel>
                <FormattedMessage defaultMessage="Instructions" id="sV2v5L" />
              </DataListItemLabel>
              <DataListItemValue>
                <HTMLContent content={props.accountingCategory?.instructions} />
              </DataListItemValue>
            </DataListItem>
          </React.Fragment>
        )}
      </DataList>

      <DrawerActions>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <StyledButton>
              <FormattedMessage defaultMessage="More actions" id="S8/4ZI" />
            </StyledButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <React.Fragment>
              <DropdownMenuItem className="cursor-pointer text-red-500" onClick={props.onDeleteClick}>
                <FormattedMessage id="actions.delete" defaultMessage="Delete" />
              </DropdownMenuItem>
            </React.Fragment>
          </DropdownMenuContent>
        </DropdownMenu>

        <StyledButton buttonStyle="secondary" onClick={props.onEditClick}>
          <FormattedMessage defaultMessage="Edit category" id="1mQAJl" />
        </StyledButton>
      </DrawerActions>
    </React.Fragment>
  );
}

type AccountingCategoryEditingDrawerViewProps = {
  accountingCategory?: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>;
  onEdit: (category: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>) => void;
  onExitEdit: () => void;
  isIndependentCollective: boolean;
};

function AccountingCategoryEditingDrawerView(props: AccountingCategoryEditingDrawerViewProps) {
  const intl = useIntl();
  const initialValues = React.useMemo(() => {
    return {
      name: props.accountingCategory?.name,
      friendlyName: props.accountingCategory?.friendlyName,
      code: props.accountingCategory?.code,
      kind: {
        value: props.accountingCategory?.kind ?? AccountingCategoryKind.EXPENSE,
        label: intl.formatMessage(
          AccountingCategoryKindI18n[props.accountingCategory?.kind || AccountingCategoryKind.EXPENSE],
        ),
      },
      appliesTo: {
        value: props.accountingCategory?.appliesTo || null,
        label: intl.formatMessage(AccountingCategoryAppliesToI18n[props.accountingCategory?.appliesTo || 'ALL']),
      },
      hostOnly: {
        value: props.accountingCategory?.hostOnly,
        label: props.accountingCategory?.hostOnly
          ? intl.formatMessage({ defaultMessage: 'Yes', id: 'a5msuh' })
          : intl.formatMessage({ defaultMessage: 'No', id: 'oUWADl' }),
      },
      instructions: props.accountingCategory?.instructions,
      expensesTypes: props.accountingCategory?.expensesTypes
        ? props.accountingCategory?.expensesTypes.map(t => ({ value: t, label: i18nExpenseType(intl, t) }))
        : null,
    };
  }, [props.accountingCategory, intl]);

  const formik = useAccountingCategoryFormik({
    initialValues,
    async onSubmit(values) {
      try {
        await props.onEdit({
          ...values,
          id: props.accountingCategory?.id,
          kind: values.kind ? values.kind.value : null,
          hostOnly: values.hostOnly.value,
          instructions: values.instructions,
          expensesTypes:
            values.expensesTypes && values.expensesTypes.length > 0 ? values.expensesTypes.map(t => t.value) : null,
          appliesTo: values.appliesTo
            ? values.appliesTo.value
            : props.isIndependentCollective
              ? AccountingCategoryAppliesTo.HOST
              : AccountingCategoryAppliesTo.HOSTED_COLLECTIVES,
        });
        props.onExitEdit();
      } catch (e) {
        // toast handled by onEdit
      }
    },
  });
  return (
    <React.Fragment>
      <AccountingCategoryForm isIndependentCollective={props.isIndependentCollective} formik={formik} />
      <DrawerActions>
        <StyledButton onClick={props.onExitEdit}>
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        <StyledButton buttonStyle="secondary" onClick={formik.submitForm} loading={formik.isSubmitting} minWidth={135}>
          <FormattedMessage id="save" defaultMessage="Save" />
        </StyledButton>
      </DrawerActions>
    </React.Fragment>
  );
}
