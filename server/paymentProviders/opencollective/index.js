/** @module paymentProviders/opencollective */

import collective from './collective';
import prepaid from './prepaid';
import giftcard from './giftcard';
import virtualcard from './virtualcard';

/** Process orders from Open Collective payment method types */
async function processOrder(order) {
  switch (order.paymentMethod.type) {
  case 'prepaid': return prepaid.processOrder(order);
  case 'giftcard': return giftcard.processOrder(order);
  case 'virtualcard': return virtualcard.processOrder(order);
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
    prepaid,
    virtualcard,
  },
  processOrder,
};
