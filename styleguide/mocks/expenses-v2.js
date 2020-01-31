/**
 * Mocks for expenses as returned by API V2
 */

import { payoutMethodPaypal } from './payout-methods';

export const expenseInvoice = {
  description: 'March invoice',
  payoutMethod: payoutMethodPaypal,
  privateInfo: 'Please pay the money fast',
  currency: 'USD',
  type: 'INVOICE',
  attachments: [
    {
      id: '661ae79b-ff2b-4c64-aee4-44b7e6b21a4c',
      incurredAt: '2020-02-14',
      description: 'Development work',
      amount: 18600,
    },
    {
      id: '7934a6bb-1f54-4b69-891b-2cca14cbe8fa',
      incurredAt: '2020-02-14',
      description: 'Hosting for the website',
      amount: 5600,
    },
  ],
  fromAccount: {
    id: 'v6r0gonw-x8kv75ml-74j9z3yq-emla4pdy',
    slug: 'betree',
    imageUrl: 'https://images-staging.opencollective.com/betree/a65d6a6/avatar.png',
    type: 'INDIVIDUAL',
    name: 'Benjamin Piouffle',
    location: {
      address: '1749 Wheeler Blv, New York, New York 31636 United States',
      country: 'FR',
    },
  },
  createdByAccount: {
    id: 'v6r0gonw-x8kv75ml-74j9z3yq-emla4pdy',
    slug: 'betree',
    imageUrl: 'https://images-staging.opencollective.com/betree/a65d6a6/avatar.png',
    type: 'INDIVIDUAL',
    name: 'Benjamin Piouffle',
  },
};

export const expenseReceipt = {
  description: 'Brussels January team retreat',
  payoutMethod: payoutMethodPaypal,
  privateInfo: '',
  currency: 'USD',
  type: 'RECEIPT',
  attachments: [
    {
      id: '661ae79b-ff2b-4c64-aee4-44b7e6b21a4c',
      incurredAt: '2020-02-14',
      description: 'Fancy restaurant',
      amount: 18600,
      url: 'https://loremflickr.com/120/120/invoice?lock=0',
    },
    {
      id: '7934a6bb-1f54-4b69-891b-2cca14cbe8fa',
      incurredAt: '2020-02-14',
      description: 'Potatoes & cheese for the non-vegan raclette',
      amount: 5600,
      url: 'https://loremflickr.com/120/120/invoice?lock=1',
    },
  ],
  fromAccount: {
    id: 'v6r0gonw-x8kv75ml-74j9z3yq-emla4pdy',
    slug: 'betree',
    imageUrl: 'https://images-staging.opencollective.com/betree/a65d6a6/avatar.png',
    type: 'INDIVIDUAL',
    name: 'Benjamin Piouffle',
    location: {
      address: '1749 Wheeler Blv, New York, New York 31636 United States',
      country: 'FR',
    },
  },
  createdByAccount: {
    id: 'v6r0gonw-x8kv75ml-74j9z3yq-emla4pdy',
    slug: 'betree',
    imageUrl: 'https://images-staging.opencollective.com/betree/a65d6a6/avatar.png',
    type: 'INDIVIDUAL',
    name: 'Benjamin Piouffle',
  },
};
