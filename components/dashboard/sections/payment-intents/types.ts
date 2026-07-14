import type { HostPaymentIntentsQuery } from '../../../../lib/graphql/types/v2/graphql';

export type PaymentIntentsTableQueryNode = NonNullable<HostPaymentIntentsQuery['paymentIntents']['nodes']>[number];
