import type { AccountPaymentIntentsQuery } from '../../../../lib/graphql/types/v2/graphql';

export type PaymentIntentsTableQueryNode = NonNullable<AccountPaymentIntentsQuery['paymentIntents']['nodes']>[number];
