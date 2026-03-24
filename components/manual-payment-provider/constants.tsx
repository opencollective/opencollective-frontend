import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  BadgeEuro,
  BadgeJapaneseYen,
  BadgePoundSterling,
  Banknote,
  Bitcoin,
  Coins,
  CreditCard,
  DollarSign,
  HandCoins,
  Landmark,
  Nfc,
  PiggyBank,
  QrCode,
  Receipt,
  ShoppingCart,
  Smartphone,
  Store,
  Wallet,
  WalletCards,
} from 'lucide-react';
import type React from 'react';
import { FormattedMessage } from 'react-intl';

export const CUSTOM_PAYMEMENT_ICON_MAP: Record<string, LucideIcon> = {
  // 1st row
  BadgeDollarSign,
  BadgeEuro,
  BadgePoundSterling,
  BadgeJapaneseYen,
  // 2nd row
  DollarSign,
  Receipt,
  Nfc,
  Bitcoin,
  // 3rd row
  WalletCards,
  CreditCard,
  QrCode,
  Landmark,
  // 4th row
  Wallet,
  HandCoins,
  Banknote,
  Coins,
  // 5th row
  Store,
  ShoppingCart,
  PiggyBank,
  Smartphone,
};

export type TEMPLATE_VARIABLES =
  | 'amount'
  | 'collective'
  | 'reference'
  | 'account'
  | 'contributionId'
  // @deprecated
  | 'OrderId';

/** Default payment reference template when none is configured. */
export const DEFAULT_REFERENCE_TEMPLATE = '{contributionId}';

export type ReferenceTemplateVariableInfo = { variable: TEMPLATE_VARIABLES; description: React.ReactNode };

export const COMMON_REFERENCE_TEMPLATE_VARIABLES: ReferenceTemplateVariableInfo[] = [
  {
    variable: 'contributionId',
    description: (
      <FormattedMessage
        id="CustomPaymentMethod.referenceTemplate.contributionId"
        defaultMessage="Legacy numeric contribution ID (same value as order ID)."
      />
    ),
  },
  {
    variable: 'OrderId',
    description: (
      <FormattedMessage
        id="CustomPaymentMethod.referenceTemplate.orderId"
        defaultMessage="Legacy numeric order ID (same as contribution ID)."
      />
    ),
  },
  {
    variable: 'amount',
    description: (
      <FormattedMessage id="bankaccount.instructions.amount" defaultMessage="Total amount the payer should transfer." />
    ),
  },
  {
    variable: 'collective',
    description: (
      <FormattedMessage
        id="bankaccount.instructions.collective"
        defaultMessage="Collective to receive the funds. If you only have one Collective, you might not need to include this."
      />
    ),
  },
];

export const BANK_REFERENCE_TEMPLATE_VARIABLES: ReferenceTemplateVariableInfo[] = [
  ...COMMON_REFERENCE_TEMPLATE_VARIABLES,
  {
    variable: 'account',
    description: (
      <FormattedMessage defaultMessage="Formatted bank account details based on the above account." id="AbOvK4" />
    ),
  },
];

type TemplateVariableInfo = { variable: TEMPLATE_VARIABLES; description: React.ReactNode };

export const COMMON_TEMPLATE_VARIABLES: TemplateVariableInfo[] = [
  {
    variable: 'amount',
    description: (
      <FormattedMessage id="bankaccount.instructions.amount" defaultMessage="Total amount the payer should transfer." />
    ),
  },
  {
    variable: 'collective',
    description: (
      <FormattedMessage
        id="bankaccount.instructions.collective"
        defaultMessage="Collective to receive the funds. If you only have one Collective, you might not need to include this."
      />
    ),
  },
  {
    variable: 'reference',
    description: (
      <FormattedMessage
        id="bankaccount.instructions.reference"
        defaultMessage="Unique ID code, to confirm receipt of funds."
      />
    ),
  },
  {
    variable: 'contributionId',
    description: (
      <FormattedMessage
        id="CustomPaymentMethod.instructions.contributionId"
        defaultMessage="Legacy numeric contribution ID (same value as order ID)."
      />
    ),
  },
] as const;

export const BANK_ACCOUNT_TEMPLATE_VARIABLE: TemplateVariableInfo = {
  variable: 'account',
  description: (
    <FormattedMessage defaultMessage="Formatted bank account details based on the above account." id="AbOvK4" />
  ),
};

/** Single list for edit dialogs: variables for both payment reference template and instructions (non–bank transfer). */
export const EDIT_DIALOG_UNIFIED_VARIABLES_OTHER: ReferenceTemplateVariableInfo[] = [
  {
    variable: 'reference',
    description: (
      <FormattedMessage
        id="CustomPaymentMethod.Variables.referenceUnified"
        defaultMessage="For instructions only: the resolved payment reference (from your payment reference template below). Do not use in the payment reference field."
      />
    ),
  },
  ...COMMON_REFERENCE_TEMPLATE_VARIABLES,
];

/** Same as above, including {account} for bank transfer dialogs. */
export const EDIT_DIALOG_UNIFIED_VARIABLES_BANK: ReferenceTemplateVariableInfo[] = [
  ...EDIT_DIALOG_UNIFIED_VARIABLES_OTHER,
  {
    variable: 'account',
    description: (
      <FormattedMessage defaultMessage="Formatted bank account details based on the above account." id="AbOvK4" />
    ),
  },
];
