import collective from './collective';
import prepaid from './prepaid';

export default {

  // payment method types
  // like cc, btc, prepaid, etc.
  types: {
    default: collective,
    collective,
    prepaid
  },

  processOrder: (order) => {
    switch (order.paymentMethod.type) {
      case 'prepaid':
        return prepaid.processOrder(order);
      case 'collective':
      default:
        return collective.processOrder(order);

    }
  }
}