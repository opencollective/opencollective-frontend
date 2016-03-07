const config = require('config');
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AZaQpRstiyI1ymEOGUXXuLUzjwm3jJzt0qrI__txWlVM29f0pTIVFk5wM9hLY98w5pKCE7Rik9QYvdYA',
  'client_secret': 'EILQQAMVCuCTyNDDOWTGtS7xBQmfzdMcgSVZJrCaPzRbpGjQFdd8sylTGE-8dutpcV0gJkGnfDE0PmD8'
});

// https://developer.paypal.com/docs/api/#billing-plan-object
const billingPlan = {
  "description": "Create Plan for Regular",
  "name": "Testing1-Regular1",
  "merchant_preferences": {
    "cancel_url": "http://www.cancel.com",
    "return_url": "http://www.success.com"
  },
  "payment_definitions": [
    {
      "amount": {
        "currency": "USD",
        "value": "100"
      },
      "cycles": "0",
      "frequency": "MONTH",
      "frequency_interval": "1",
      "name": "Regular 1",
      "type": "REGULAR"
    }
  ],
  "type": "INFINITE"
};

const planId = 'P-90D08647YU2378629IFZ47ZA';

// response
// { id: 'P-90D08647YU2378629IFZ47ZA',
//   state: 'CREATED',
//   name: 'Testing1-Regular1',
//   description: 'Create Plan for Regular',
//   type: 'INFINITE',
//   payment_definitions:
//    [ { id: 'PD-3UL66015N1438573HIFZ47ZA',
//        name: 'Regular 1',
//        type: 'REGULAR',
//        frequency: 'Month',
//        amount: [Object],
//        cycles: '0',
//        charge_models: [],
//        frequency_interval: '1' } ],
//   merchant_preferences:
//    { setup_fee: { currency: 'USD', value: '0' },
//      max_fail_attempts: '0',
//      return_url: 'http://www.success.com',
//      cancel_url: 'http://www.cancel.com',
//      auto_bill_amount: 'NO',
//      initial_fail_amount_action: 'CONTINUE' },
//   create_time: '2016-03-04T11:47:02.244Z',
//   update_time: '2016-03-04T11:47:02.244Z',
//   links:
//    [ { href: 'https://api.sandbox.paypal.com/v1/payments/billing-plans/P-90D08647YU2378629IFZ47ZA',
//        rel: 'self',
//        method: 'GET' } ],
//   httpStatusCode: 201 }


//  paypal.billingPlan.activate(planId, (err, res) => {
//   console.log('err', err ? JSON.stringify(err) : '')
//   console.log('Create billingPlan activate Response');
//   console.log(res);
//   process.exit();
// });
// response : { httpStatusCode: 200 }

// https://github.com/paypal/PayPal-node-SDK/blob/master/samples/subscription/billing_agreements/create.js#L99
// var isoDate = new Date();
// isoDate.setSeconds(isoDate.getSeconds() + 4);
// isoDate.toISOString().slice(0, 19) + 'Z';

// const billingAgreement = {
//   "name": "Fast Speed Agreement",
//   "description": "Agreement for Fast Speed Plan",
//   "start_date": isoDate,
//   "plan": {
//     "id": planId
//   },
//   "payer": {
//     "payment_method": "paypal"
//   }
// };
//  paypal.billingAgreement.create(billingAgreement, (err, res) => {
//   console.log('err', err ? JSON.stringify(err) : '')
//   console.log('Create Billing Agreement Response');
//   console.log(res);
//   process.exit();
// });
// response
// { name: 'Fast Speed Agreement',
  // description: 'Agreement for Fast Speed Plan',
  // plan:
  //  { id: 'P-90D08647YU2378629IFZ47ZA',
  //    state: 'ACTIVE',
  //    name: 'Testing1-Regular1',
  //    description: 'Create Plan for Regular',
  //    type: 'INFINITE',
  //    payment_definitions: [ [Object] ],
  //    merchant_preferences:
  //     { setup_fee: [Object],
  //       max_fail_attempts: '0',
  //       return_url: 'http://www.success.com',
  //       cancel_url: 'http://www.cancel.com',
  //       auto_bill_amount: 'NO',
  //       initial_fail_amount_action: 'CONTINUE' } },
  // links:
  //  [ { href: 'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-5N119010ER622382K',
  //      rel: 'approval_url',
  //      method: 'REDIRECT' },
  //    { href: 'https://api.sandbox.paypal.com/v1/payments/billing-agreements/EC-5N119010ER622382K/agreement-execute',
  //      rel: 'execute',
  //      method: 'POST' } ],
  // start_date: '2016-03-04T13:25:26.754Z',
  // httpStatusCode: 201 }
  //
  // then redirect to http://www.success.com/?token=EC-5N119010ER622382K
//
paypal.billingAgreement.execute('EC-5N119010ER622382K', (err, res) => {
  console.log('err', err ? JSON.stringify(err) : '')
  console.log('Create Billing agreement Response');
  console.log(res);
  process.exit();
});

// response
// { id: 'I-RN9TKR4DHWFL',
  state: 'Active',
  description: 'Agreement for Fast Speed Plan',
  payer:
   { payment_method: 'paypal',
     status: 'verified',
     payer_info:
      { email: 'arnaudbenard13+paypalsandbox@gmail.com',
        first_name: 'Xavier',
        last_name: 'Damman',
        payer_id: 'BZJH5KTM84F2G',
        shipping_address: [Object] } },
  plan:
   { payment_definitions: [ [Object] ],
     merchant_preferences:
      { setup_fee: [Object],
        max_fail_attempts: '0',
        auto_bill_amount: 'NO' },
     links: [],
     currency_code: 'USD' },
  links:
   [ { href: 'https://api.sandbox.paypal.com/v1/payments/billing-agreements/I-RN9TKR4DHWFL',
       rel: 'self',
       method: 'GET' } ],
  start_date: '2016-03-04T08:00:00Z',
  shipping_address:
   { recipient_name: 'Xavier Damman',
     line1: '1 Main Terrace',
     city: 'Wolverhampton',
     state: 'West Midlands',
     postal_code: 'W12 4LQ',
     country_code: 'GB' },
  agreement_details:
   { outstanding_balance: { value: '0.00' },
     cycles_remaining: '0',
     cycles_completed: '0',
     next_billing_date: '2016-03-04T10:00:00Z',
     final_payment_date: '1970-01-01T00:00:00Z',
     failed_payment_count: '0' },
  httpStatusCode: 200 }