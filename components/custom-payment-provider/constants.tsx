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
  // @deprecated
  | 'OrderId';

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
] as const;

export const BANK_ACCOUNT_TEMPLATE_VARIABLE: TemplateVariableInfo = {
  variable: 'account',
  description: (
    <FormattedMessage
      id="bankaccount.instructions.account"
      defaultMessage="The bank account details you added above."
    />
  ),
};

export const ALL_TEMPLATE_VARIABLES: TemplateVariableInfo[] = [
  ...COMMON_TEMPLATE_VARIABLES,
  BANK_ACCOUNT_TEMPLATE_VARIABLE,
];
