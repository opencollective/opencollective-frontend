import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Banknote, CreditCard, Info, Landmark, Wallet } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import type { AccountingCategory, ManualPaymentProvider } from '../../../../lib/graphql/types/v2/graphql';
import { ManualPaymentProviderType } from '../../../../lib/graphql/types/v2/graphql';

import { getManualPaymentProviderIconComponent } from '@/components/manual-payment-provider/ManualPaymentProviderIcon';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import HTMLContent from '../../../HTMLContent';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledSelect from '../../../StyledSelect';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/Table';
import { useToast } from '../../../ui/useToast';

const paymentAccountsQuery = gql`
  query PaymentAccounts($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      connectedAccounts {
        id
        service
        createdAt
        balanceAccountingCategory {
          id
          code
          name
        }
      }
      manualPaymentProviders {
        id
        type
        name
        icon
        isArchived
        createdAt
        accountDetails
        instructions
        balanceAccountingCategory {
          id
          code
          name
        }
      }
      transactionsImports(type: [PLAID, GOCARDLESS]) {
        nodes {
          id
          source
          name
          type
          connectedAccount {
            id
            authorizationExpiresAt
          }
          assignments {
            importedAccountId
            accounts {
              id
              ...AccountHoverCardFields
            }
          }
          institutionAccounts {
            id
            name
            mask
            balanceAccountingCategory {
              id
              code
              name
            }
          }
        }
      }
      balanceAccountingCategories: accountingCategories(kind: [BALANCE_ACCOUNT, CLEARING_ACCOUNT]) {
        nodes {
          id
          code
          name
          friendlyName
          kind
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

const setConnectedAccountBalanceCategoryMutation = gql`
  mutation SetConnectedAccountBalanceAccountingCategory(
    $connectedAccount: ConnectedAccountReferenceInput!
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    setConnectedAccountBalanceAccountingCategory(connectedAccount: $connectedAccount, accountingCategory: $accountingCategory) {
      id
      balanceAccountingCategory {
        id
        code
        name
      }
    }
  }
`;


const setManualPaymentProviderBalanceCategoryMutation = gql`
  mutation SetManualPaymentProviderBalanceAccountingCategory(
    $manualPaymentProvider: ManualPaymentProviderReferenceInput!
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    updateManualPaymentProvider(
      manualPaymentProvider: $manualPaymentProvider
      input: { balanceAccountingCategory: $accountingCategory }
    ) {
      id
      balanceAccountingCategory {
        id
        code
        name
      }
    }
  }
`;

const setTransactionsImportAccountBalanceCategoryMutation = gql`
  mutation SetTransactionsImportAccountBalanceAccountingCategory(
    $transactionsImport: TransactionsImportReferenceInput!
    $importedAccountId: NonEmptyString!
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    setTransactionsImportAccountBalanceAccountingCategory(
      transactionsImport: $transactionsImport
      importedAccountId: $importedAccountId
      accountingCategory: $accountingCategory
    ) {
      id
      institutionAccounts {
        id
        balanceAccountingCategory {
          id
          code
          name
        }
      }
    }
  }
`;

const SUPPORTED_SERVICES = ['stripe', 'paypal', 'transferwise'];

const SERVICE_LABELS = { stripe: 'Stripe', paypal: 'PayPal', transferwise: 'Wise' };

const SERVICE_ICONS = { stripe: CreditCard, paypal: Wallet, transferwise: Wallet };

const getCategoryOption = (category: Pick<AccountingCategory, 'id' | 'code' | 'name'> | null) =>
  category ? { value: category.id, label: `${category.code} - ${category.name}` } : null;

const isAuthorizationExpired = (authorizationExpiresAt?: string | null) =>
  Boolean(authorizationExpiresAt && new Date(authorizationExpiresAt) < new Date());

const PaymentAccountRow = ({
  icon: Icon,
  label,
  subtitle,
  extra = null,
  value,
  options,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: React.ReactNode;
  subtitle: React.ReactNode;
  extra?: React.ReactNode;
  value: ReturnType<typeof getCategoryOption>;
  options: ReturnType<typeof getCategoryOption>[];
  onChange: (option: { value: string } | null) => void;
  disabled: boolean;
}) => (
  <TableRow>
    <TableCell className="align-top">
      <div className="flex items-start gap-3">
        <Icon size={16} className="mt-1 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2 font-medium">{label}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{subtitle}</div>
          {extra}
        </div>
      </div>
    </TableCell>
    <TableCell>
      <div className="flex justify-end">
        <StyledSelect
          inputId={`payment-account-category-${label}`}
          options={options}
          value={value}
          isClearable
          isSearchable
          disabled={disabled}
          placeholder={
            <FormattedMessage defaultMessage="Select a balance or clearing account" id="13dqX5" />
          }
          onChange={onChange}
          width="100%"
          maxWidth={420}
        />
      </div>
    </TableCell>
  </TableRow>
);

export const PaymentAccountsTable = ({ hostSlug, isAdmin }: { hostSlug: string; isAdmin: boolean }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { data, loading, error } = useQuery(paymentAccountsQuery, { variables: { hostSlug } });
  const [setConnectedAccountCategory] = useMutation(setConnectedAccountBalanceCategoryMutation);
  const [setManualProviderCategory] = useMutation(setManualPaymentProviderBalanceCategoryMutation);
  const [setBankAccountCategory] = useMutation(setTransactionsImportAccountBalanceCategoryMutation);
  const [instructionsProvider, setInstructionsProvider] = React.useState<ManualPaymentProvider | null>(null);

  const categoryOptions = React.useMemo(
    () => (data?.host?.balanceAccountingCategories?.nodes || []).map(getCategoryOption),
    [data],
  );

  const connectedAccounts = (data?.host?.connectedAccounts || [])
    .filter(ca => SUPPORTED_SERVICES.includes(ca.service))
    .toSorted((a, b) => SUPPORTED_SERVICES.indexOf(a.service) - SUPPORTED_SERVICES.indexOf(b.service));
  const manualPaymentProviders = data?.host?.manualPaymentProviders || [];
  const bankImports = (data?.host?.transactionsImports?.nodes || []).filter(
    transactionsImport => transactionsImport.institutionAccounts?.length && transactionsImport.connectedAccount,
  );

  const handleMutation = async (mutate, variables) => {
    try {
      await mutate({ variables });
      toast({ variant: 'success', message: intl.formatMessage({ id: 'saved', defaultMessage: 'Saved' }) });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  } else if (loading) {
    return <LoadingPlaceholder height={200} />;
  }

  const isEmpty = connectedAccounts.length === 0 && manualPaymentProviders.length === 0 && bankImports.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <FormattedMessage
          defaultMessage="Assign a balance or clearing account to each of your payment devices. Payments processed through them will be attributed to the selected account automatically." id="O+w8Ji"
        />
      </p>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic">
          <FormattedMessage
            defaultMessage="No payment devices setup yet. Connect Stripe, Wise or PayPal, add a manual payment method or connect a bank account" id="ill3eB"
          />
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <FormattedMessage defaultMessage="Payment device" id="QnfbGY" />
                </TableHead>
                <TableHead className="text-right">
                  <FormattedMessage defaultMessage="Balance / clearing account" id="7XkFoL" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectedAccounts.map(connectedAccount => (
                <PaymentAccountRow
                  key={connectedAccount.id}
                  icon={SERVICE_ICONS[connectedAccount.service] || Banknote}
                  label={SERVICE_LABELS[connectedAccount.service] || connectedAccount.service}
                  subtitle={<FormattedMessage defaultMessage="Payment provider" id="A1faeX" />}
                  value={getCategoryOption(connectedAccount.balanceAccountingCategory)}
                  options={categoryOptions}
                  disabled={!isAdmin}
                  onChange={option =>
                    handleMutation(setConnectedAccountCategory, {
                      connectedAccount: { id: connectedAccount.id },
                      accountingCategory: option ? { id: option.value } : null,
                    })
                  }
                />
              ))}
              {manualPaymentProviders.map(provider => (
                <PaymentAccountRow
                  key={provider.id}
                  icon={getManualPaymentProviderIconComponent(provider, Landmark)}
                  label={provider.name}
                  subtitle={
                    <React.Fragment>
                      {provider.type === ManualPaymentProviderType.BANK_TRANSFER ? (
                        <FormattedMessage defaultMessage="Bank Transfer" id="Aj4Xx4" />
                      ) : (
                        <FormattedMessage defaultMessage="Custom payment method" id="K4k2dj" />
                      )}
                      <span aria-hidden="true">&middot;</span>
                      <FormattedMessage defaultMessage="Manual payment provider" id="iFJgfz" />
                      {provider.instructions && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-5"
                          title={intl.formatMessage({
                            defaultMessage: 'View Instructions',
                            id: 'CustomPaymentMethod.ViewInstructions',
                          })}
                          onClick={() => setInstructionsProvider(provider)}
                        >
                          <Info size={13} />
                        </Button>
                      )}
                    </React.Fragment>
                  }
                  value={getCategoryOption(provider.balanceAccountingCategory)}
                  options={categoryOptions}
                  disabled={!isAdmin}
                  onChange={option =>
                    handleMutation(setManualProviderCategory, {
                      manualPaymentProvider: { id: provider.id },
                      accountingCategory: option ? { id: option.value } : null,
                    })
                  }
                />
              ))}
              {bankImports.flatMap(transactionsImport =>
                transactionsImport.institutionAccounts.map(institutionAccount => {
                  const assignments = transactionsImport.assignments || [];
                  const assignment =
                    assignments.find(a => a.importedAccountId === institutionAccount.id) ||
                    assignments.find(a => a.importedAccountId === '__default__');
                  const assignedAccounts = assignment?.accounts || [];
                  return (
                    <PaymentAccountRow
                      key={`${transactionsImport.id}-${institutionAccount.id}`}
                      icon={Landmark}
                      label={
                        institutionAccount.mask
                          ? `${institutionAccount.name} ••${institutionAccount.mask}`
                          : institutionAccount.name
                      }
                      subtitle={
                        <React.Fragment>
                          <span className="max-w-64 truncate" title={transactionsImport.source}>
                            {transactionsImport.source}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                          <FormattedMessage defaultMessage="Connected Bank Accounts" id="qPhmMo" />
                          {isAuthorizationExpired(transactionsImport.connectedAccount?.authorizationExpiresAt) && (
                            <Badge size="sm" type="warning">
                              <FormattedMessage defaultMessage="Expired" id="transactions.import.status.expired" />
                            </Badge>
                          )}
                        </React.Fragment>
                      }
                      extra={
                        assignedAccounts.length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <FormattedMessage
                              defaultMessage="Assigned to {accounts}" id="rsYtmI"
                              values={{
                                accounts: (
                                  <span className="inline-flex flex-wrap items-center gap-2">
                                    {assignedAccounts.map(assignedAccount => (
                                      <AccountHoverCard
                                        key={assignedAccount.id}
                                        account={assignedAccount}
                                        trigger={
                                          <span className="inline-flex cursor-pointer items-center gap-1">
                                            <Avatar collective={assignedAccount} radius={16} />
                                            {assignedAccount.name}
                                          </span>
                                        }
                                      />
                                    ))}
                                  </span>
                                ),
                              }}
                            />
                          </div>
                        )
                      }
                      value={getCategoryOption(institutionAccount.balanceAccountingCategory)}
                      options={categoryOptions}
                      disabled={!isAdmin}
                      onChange={option =>
                        handleMutation(setBankAccountCategory, {
                          transactionsImport: { id: transactionsImport.id },
                          importedAccountId: institutionAccount.id,
                          accountingCategory: option ? { id: option.value } : null,
                        })
                      }
                    />
                  );
                }),
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {instructionsProvider && (
        <Dialog open onOpenChange={open => !open && setInstructionsProvider(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{instructionsProvider.name}</DialogTitle>
            </DialogHeader>
            <HTMLContent content={instructionsProvider.instructions} fontSize="13px" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
