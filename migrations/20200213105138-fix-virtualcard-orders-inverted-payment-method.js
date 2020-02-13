'use strict';

/**
 * See https://github.com/opencollective/opencollective/issues/2790
 * A bug was inverting the "PaymentMethodId" with the "SourcePaymentMethodId" in orders.
 */
module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.query(`
      WITH payment_methods_used_for_gift_cards AS (
        -- Get all payment methods used for gift cards
        SELECT      spm.*
        FROM        "PaymentMethods" pm
        INNER JOIN  "PaymentMethods" spm ON pm."SourcePaymentMethodId" = spm.id
        GROUP BY spm.id
      ), orders_made_directly_with_source_payment_methods AS (
        -- Get all ordrers made using these payment methods. Not all of these orders are erroneous:
        -- it's legit to have a payment method used both to generated gift cards and to contribute directly
        SELECT      o.*
        FROM        "Orders" o
        INNER JOIN  payment_methods_used_for_gift_cards pm ON o."PaymentMethodId" = pm.id
      ), updated_orders AS (
        -- Get only the orders where payment method was updated at some point by looking at the history
        SELECT      o.id, o."PaymentMethodId", MAX(oh."PaymentMethodId") AS __other_payment_method_id__
        FROM        orders_made_directly_with_source_payment_methods o
        INNER JOIN  "OrderHistories" oh ON o.id = oh.id AND o."PaymentMethodId" != oh."PaymentMethodId"
        GROUP BY    o.id, o."PaymentMethodId"
      ), erroneous_orders AS (
        -- Filter to get only the ones where the payment method was inverted with the source payment method
        SELECT      o.*, pm2.id AS __virtual_card_id__ FROM updated_orders
        INNER JOIN  "Orders" o ON o.id = updated_orders.id
        INNER JOIN  "PaymentMethods" pm1 ON pm1.id = updated_orders."PaymentMethodId"
        INNER JOIN  "PaymentMethods" pm2 ON pm2.id = updated_orders.__other_payment_method_id__
        WHERE       pm2."type" = 'virtualcard'
        AND         pm2."SourcePaymentMethodId" = pm1.id
      ), fixed_orders AS (
        -- Fix orders by making sure we use the virtual card id
        UPDATE ONLY "Orders" o
        SET         "PaymentMethodId" = erroneous_orders.__virtual_card_id__
        FROM        erroneous_orders WHERE erroneous_orders.id = o.id
        RETURNING   *
      ), fixed_transactions AS (
        -- Fix transactions by making sure we use the virtual card id
          UPDATE ONLY   "Transactions" t
          SET           "PaymentMethodId" = erroneous_orders.__virtual_card_id__
          FROM          erroneous_orders WHERE erroneous_orders.id = t."OrderId"
          RETURNING     t.*
      ) SELECT * FROM fixed_transactions
    `);
  },

  down: async () => {
    // No coming back!
  },
};
