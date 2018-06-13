/** @module paymentProviders/opencollective */

import collective from './collective';
import * as giftcard from './giftcard';

/** Process orders from Open Collective payment method types */
async function processOrder(order) {
  switch (order.paymentMethod.type) {
  case 'giftcard': return giftcard.processOrder(order);
  case 'collective':        // Fall through
  default: return collective.processOrder(order);
  }
}

/* API expected from a Payment Method provider */
export default {
  // payment method types
  // like cc, btc, prepaid, etc.
  types: {
    default: collective,
    collective,
    giftcard,
  },
  processOrder,
};
