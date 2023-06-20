import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';

import { exchangeLoginToken, refreshToken, refreshTokenWithTwoFactorCode } from '../api';
import { loggedInUserQuery } from '../graphql/queries';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from '../local-storage';
import LoggedInUser from '../LoggedInUser';

const exchangeLoginTokenAndStore = async loginToken => {
  const res = await exchangeLoginToken(loginToken);
  const { token, error } = res;

  if (error) {
    throw Error(error);
  }

  setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
  return token;
};
const user = {
  __typename: 'UserDetails',
  id: 45672,
  email: 'gustav.larsson@gmail.com',
  image: 'https://avatars.githubusercontent.com/gustavlrsn',
  isLimited: null,
  CollectiveId: 56396,
  hasSeenLatestChangelogEntry: true,
  hasTwoFactorAuth: true,
  hasPassword: true,
  isRoot: false,
  collective: {
    __typename: 'User',
    id: 56396,
    name: 'Gustav Larsson',
    legalName: null,
    type: 'USER',
    slug: 'gustav-larsson',
    imageUrl: 'https://images-staging.opencollective.com/gustav-larsson/5c88b00/avatar.png',
    settings: {
      earlyAccess: {
        another: false,
        dashboard: true,
        undefined: false,
      },
      collectivePage: {
        background: {
          crop: {
            x: 346,
            y: -420,
          },
          zoom: '0.67',
          mediaSize: {
            width: 2048,
            height: 1360,
          },
          isAlignedRight: true,
        },
      },
      dismissedHelpMessages: {
        asdasda: true,
        asdasdasd: true,
        undefined: true,
        somethingCool: true,
        'never-to-bee-seen-again': true,
      },
    },
    currency: 'USD',
    categories: [],
    location: {
      __typename: 'LocationType',
      id: '6236',
      address: 'Gyllenkrooksgatan 23\nGöteborg\n412 82',
      country: 'SE',
      structured: {
        city: 'Göteborg',
        address1: 'Gyllenkrooksgatan 23',
        postalCode: '412 82',
      },
    },
  },
  memberOf: [
    {
      __typename: 'Member',
      id: 54768,
      role: 'ADMIN',
      collective: {
        __typename: 'Organization',
        id: 8686,
        slug: 'opencollective',
        type: 'ORGANIZATION',
        isIncognito: false,
        name: 'Open Collective Inc.',
        currency: 'USD',
        isHost: true,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/opencollective/019a512/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 8686,
        },
        settings: {
          apply: true,
          goals: [{}],
          budget: {
            version: 'v1',
          },
          editor: 'html',
          invoice: {
            templates: {
              default: {},
            },
            expenseTemplates: {
              default: {},
            },
          },
          features: {
            alipay: true,
            privacyVcc: true,
            transferwise: true,
            virtualCards: true,
            paypalPayouts: true,
            stripePaymentIntent: true,
          },
          feesOnTop: true,
          moderation: {
            rejectedCategories: [],
          },
          expenseTypes: {
            GRANT: false,
            INVOICE: true,
            RECEIPT: true,
          },
          transferwise: {
            ott: true,
            ignorePaymentProcessorFees: true,
          },
          virtualcards: {
            policy: '',
            reminder: true,
            autopause: true,
            requestcard: true,
          },
          collectivePage: {
            sections: [
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'projects',
                    type: 'SECTION',
                    isEnabled: false,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 2,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
            primaryColor: '#297EFF',
          },
          hostCollective: {
            id: 8686,
          },
          paymentMethods: {
            manual: {
              instructions:
                'Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.\n\nAmount: {amount}\nReference: {reference}\nDetail: {collective}\n{account}\n',
            },
          },
          payoutsTwoFactorAuth: {
            enabled: true,
            rollingLimit: 1000,
          },
          giftCardsMaxDailyCount: 500,
          hideCreditCardPostalCode: true,
          disableCustomPayoutMethod: true,
          disablePublicExpenseSubmission: false,
        },
        location: {
          __typename: 'LocationType',
          id: '6222',
          address: 'dasdsad\ndsadsad\n13111\nArkansas',
          country: 'US',
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 56179,
            slug: 'open-collective-sync-577cb486',
            type: 'EVENT',
            name: 'Open Collective sync',
            isActive: false,
            imageUrl: 'https://images-staging.opencollective.com/open-collective-sync-577cb486/019a512/logo.png',
            host: {
              __typename: 'Organization',
              id: 8686,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54476,
      role: 'BACKER',
      collective: {
        __typename: 'Organization',
        id: 8686,
        slug: 'opencollective',
        type: 'ORGANIZATION',
        isIncognito: false,
        name: 'Open Collective Inc.',
        currency: 'USD',
        isHost: true,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/opencollective/019a512/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 8686,
        },
        settings: {
          apply: true,
          goals: [{}],
          budget: {
            version: 'v1',
          },
          editor: 'html',
          invoice: {
            templates: {
              default: {},
            },
            expenseTemplates: {
              default: {},
            },
          },
          features: {
            alipay: true,
            privacyVcc: true,
            transferwise: true,
            virtualCards: true,
            paypalPayouts: true,
            stripePaymentIntent: true,
          },
          feesOnTop: true,
          moderation: {
            rejectedCategories: [],
          },
          expenseTypes: {
            GRANT: false,
            INVOICE: true,
            RECEIPT: true,
          },
          transferwise: {
            ott: true,
            ignorePaymentProcessorFees: true,
          },
          virtualcards: {
            policy: '',
            reminder: true,
            autopause: true,
            requestcard: true,
          },
          collectivePage: {
            sections: [
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'projects',
                    type: 'SECTION',
                    isEnabled: false,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 2,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
            primaryColor: '#297EFF',
          },
          hostCollective: {
            id: 8686,
          },
          paymentMethods: {
            manual: {
              instructions:
                'Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.\n\nAmount: {amount}\nReference: {reference}\nDetail: {collective}\n{account}\n',
            },
          },
          payoutsTwoFactorAuth: {
            enabled: true,
            rollingLimit: 1000,
          },
          giftCardsMaxDailyCount: 500,
          hideCreditCardPostalCode: true,
          disableCustomPayoutMethod: true,
          disablePublicExpenseSubmission: false,
        },
        location: {
          __typename: 'LocationType',
          id: '6222',
          address: 'dasdsad\ndsadsad\n13111\nArkansas',
          country: 'US',
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 56179,
            slug: 'open-collective-sync-577cb486',
            type: 'EVENT',
            name: 'Open Collective sync',
            isActive: false,
            imageUrl: 'https://images-staging.opencollective.com/open-collective-sync-577cb486/019a512/logo.png',
            host: {
              __typename: 'Organization',
              id: 8686,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54447,
      role: 'ADMIN',
      collective: {
        __typename: 'Organization',
        id: 11004,
        slug: 'opensource',
        type: 'ORGANIZATION',
        isIncognito: false,
        name: 'Open Source Collective',
        currency: 'USD',
        isHost: true,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/opensource/788ac41/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 11004,
        },
        settings: {
          tos: 'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub',
          apply: true,
          goals: [{}],
          editor: 'html',
          invoice: {
            templates: {
              default: {
                info: 'To the moon!',
                title: '',
              },
            },
          },
          features: {
            updates: true,
            virtualCards: true,
            paypalDonations: true,
          },
          moderation: {
            rejectedCategories: [],
          },
          applyMessage:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Te enim iudicem aequum puto, modo quae dicat ille bene noris. Quam tu ponis in verbis, ego positam in re putabam. Quam ob rem tandem, inquit, non satisfacit? Quo minus animus a se ipse dissidens secumque discordans gustare partem ullam liquidae voluptatis et liberae potest. Omnes enim iucundum motum, quo sensus hilaretur. Duo Reges: constructio interrete. Sed quoniam et advesperascit et mihi ad villam revertendum est, nunc quidem hactenus; Quae animi affectio suum cuique tribuens atque hanc, quam dico.',
          expenseTypes: {
            GRANT: true,
            INVOICE: true,
            RECEIPT: true,
          },
          transferwise: {
            ott: true,
          },
          virtualcards: {
            requestcard: true,
          },
          cryptoEnabled: true,
          collectivePage: {
            sections: [
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 2,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
            background: {
              crop: {
                x: -265,
                y: -7,
              },
              zoom: '1.67',
              mediaSize: {
                width: 840,
                height: 346,
              },
              isAlignedRight: true,
            },
            tiersOrder: [15383, 'custom'],
            primaryColor: '#663299',
            useNewSections: false,
            legacySectionsBackup: [
              {
                section: 'contributors',
                isEnabled: true,
              },
              {
                section: 'updates',
                isEnabled: true,
              },
              {
                section: 'contributions',
                isEnabled: true,
                restrictedTo: [],
              },
              {
                section: 'conversations',
                isEnabled: false,
              },
              {
                section: 'transactions',
                isEnabled: true,
              },
              {
                section: 'recurring-contributions',
                isEnabled: true,
              },
              {
                section: 'about',
                isEnabled: true,
                restrictedTo: [],
              },
            ],
          },
          hostCollective: {
            id: 11004,
          },
          paymentMethods: {
            manual: {
              instructions:
                'Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.\n\nAmount: {amount}\nReference: {reference}\nDetail: {collective}\n{account}\n',
            },
          },
          disablePaypalPayouts: false,
          payoutsTwoFactorAuth: {
            enabled: false,
            rollingLimit: 1000,
          },
          disablePublicExpenseSubmission: false,
        },
        location: {
          __typename: 'LocationType',
          id: '6224',
          address: 'EIN 82-2037583\n340 S LEMON AVE #3717\nWalnut, CA 91789 USA',
          country: 'US',
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 57093,
            slug: 'testing-event-b4bad0b5',
            type: 'EVENT',
            name: 'Testing Event',
            isActive: false,
            imageUrl: 'https://images-staging.opencollective.com/opensource/788ac41/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54478,
      role: 'CONTRIBUTOR',
      collective: {
        __typename: 'Organization',
        id: 11004,
        slug: 'opensource',
        type: 'ORGANIZATION',
        isIncognito: false,
        name: 'Open Source Collective',
        currency: 'USD',
        isHost: true,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/opensource/788ac41/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 11004,
        },
        settings: {
          tos: 'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub',
          apply: true,
          goals: [{}],
          editor: 'html',
          invoice: {
            templates: {
              default: {
                info: 'To the moon!',
                title: '',
              },
            },
          },
          features: {
            updates: true,
            virtualCards: true,
            paypalDonations: true,
          },
          moderation: {
            rejectedCategories: [],
          },
          applyMessage:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Te enim iudicem aequum puto, modo quae dicat ille bene noris. Quam tu ponis in verbis, ego positam in re putabam. Quam ob rem tandem, inquit, non satisfacit? Quo minus animus a se ipse dissidens secumque discordans gustare partem ullam liquidae voluptatis et liberae potest. Omnes enim iucundum motum, quo sensus hilaretur. Duo Reges: constructio interrete. Sed quoniam et advesperascit et mihi ad villam revertendum est, nunc quidem hactenus; Quae animi affectio suum cuique tribuens atque hanc, quam dico.',
          expenseTypes: {
            GRANT: true,
            INVOICE: true,
            RECEIPT: true,
          },
          transferwise: {
            ott: true,
          },
          virtualcards: {
            requestcard: true,
          },
          cryptoEnabled: true,
          collectivePage: {
            sections: [
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 2,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
            background: {
              crop: {
                x: -265,
                y: -7,
              },
              zoom: '1.67',
              mediaSize: {
                width: 840,
                height: 346,
              },
              isAlignedRight: true,
            },
            tiersOrder: [15383, 'custom'],
            primaryColor: '#663299',
            useNewSections: false,
            legacySectionsBackup: [
              {
                section: 'contributors',
                isEnabled: true,
              },
              {
                section: 'updates',
                isEnabled: true,
              },
              {
                section: 'contributions',
                isEnabled: true,
                restrictedTo: [],
              },
              {
                section: 'conversations',
                isEnabled: false,
              },
              {
                section: 'transactions',
                isEnabled: true,
              },
              {
                section: 'recurring-contributions',
                isEnabled: true,
              },
              {
                section: 'about',
                isEnabled: true,
                restrictedTo: [],
              },
            ],
          },
          hostCollective: {
            id: 11004,
          },
          paymentMethods: {
            manual: {
              instructions:
                'Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.\n\nAmount: {amount}\nReference: {reference}\nDetail: {collective}\n{account}\n',
            },
          },
          disablePaypalPayouts: false,
          payoutsTwoFactorAuth: {
            enabled: false,
            rollingLimit: 1000,
          },
          disablePublicExpenseSubmission: false,
        },
        location: {
          __typename: 'LocationType',
          id: '6224',
          address: 'EIN 82-2037583\n340 S LEMON AVE #3717\nWalnut, CA 91789 USA',
          country: 'US',
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 57093,
            slug: 'testing-event-b4bad0b5',
            type: 'EVENT',
            name: 'Testing Event',
            isActive: false,
            imageUrl: 'https://images-staging.opencollective.com/opensource/788ac41/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54477,
      role: 'ADMIN',
      collective: {
        __typename: 'Collective',
        id: 20206,
        slug: 'backyourstack',
        type: 'COLLECTIVE',
        isIncognito: false,
        name: 'BackYourStack',
        currency: 'USD',
        isHost: false,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 11004,
        },
        settings: {
          goals: [{}],
          editor: 'html',
          features: {
            conversations: true,
          },
          githubRepo: 'opencollective/backyourstack',
          moderation: {
            rejectedCategories: [],
          },
          earlyAccess: {
            activityLog: true,
          },
          collectivePage: {
            sections: [
              {
                name: 'goals',
                type: 'SECTION',
                isEnabled: true,
              },
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'projects',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 1,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
            tiersOrder: ['custom', 15574, 5798, 5797, 10333],
          },
          disableCryptoContributions: true,
          disableCustomContributions: true,
          disablePublicExpenseSubmission: false,
        },
        location: {
          __typename: 'LocationType',
          id: '6234',
          address: null,
          country: null,
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 57163,
            slug: 'testing-event-62384d23',
            type: 'EVENT',
            name: 'Testing Event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56090,
            slug: 'latest-event-fed9904b',
            type: 'EVENT',
            name: 'Latest Event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/latest-event-fed9904b/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56089,
            slug: 'my-event-19-20-939bbfa2',
            type: 'EVENT',
            name: 'My Event 19 20',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56088,
            slug: 'my-event-la-104e3fa4',
            type: 'EVENT',
            name: 'My Event LA',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56087,
            slug: 'my-event-12-13-8ddcafcb',
            type: 'EVENT',
            name: 'My Event 12 13',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/my-event-12-13-8ddcafcb/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56086,
            slug: 'my-event-88f11262',
            type: 'EVENT',
            name: 'My Event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/my-event-88f11262/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 50999,
            slug: 'bys-today-ed9393f1',
            type: 'EVENT',
            name: 'BYS Today',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54475,
      role: 'BACKER',
      collective: {
        __typename: 'Collective',
        id: 20206,
        slug: 'backyourstack',
        type: 'COLLECTIVE',
        isIncognito: false,
        name: 'BackYourStack',
        currency: 'USD',
        isHost: false,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 11004,
        },
        settings: {
          goals: [{}],
          editor: 'html',
          features: {
            conversations: true,
          },
          githubRepo: 'opencollective/backyourstack',
          moderation: {
            rejectedCategories: [],
          },
          earlyAccess: {
            activityLog: true,
          },
          collectivePage: {
            sections: [
              {
                name: 'goals',
                type: 'SECTION',
                isEnabled: true,
              },
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'projects',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 1,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
            tiersOrder: ['custom', 15574, 5798, 5797, 10333],
          },
          disableCryptoContributions: true,
          disableCustomContributions: true,
          disablePublicExpenseSubmission: false,
        },
        location: {
          __typename: 'LocationType',
          id: '6234',
          address: null,
          country: null,
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 57163,
            slug: 'testing-event-62384d23',
            type: 'EVENT',
            name: 'Testing Event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56090,
            slug: 'latest-event-fed9904b',
            type: 'EVENT',
            name: 'Latest Event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/latest-event-fed9904b/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56089,
            slug: 'my-event-19-20-939bbfa2',
            type: 'EVENT',
            name: 'My Event 19 20',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56088,
            slug: 'my-event-la-104e3fa4',
            type: 'EVENT',
            name: 'My Event LA',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56087,
            slug: 'my-event-12-13-8ddcafcb',
            type: 'EVENT',
            name: 'My Event 12 13',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/my-event-12-13-8ddcafcb/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 56086,
            slug: 'my-event-88f11262',
            type: 'EVENT',
            name: 'My Event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/my-event-88f11262/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
          {
            __typename: 'Event',
            id: 50999,
            slug: 'bys-today-ed9393f1',
            type: 'EVENT',
            name: 'BYS Today',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/backyourstack/0878f3f/logo.png',
            host: {
              __typename: 'Organization',
              id: 11004,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54480,
      role: 'MEMBER',
      collective: {
        __typename: 'Collective',
        id: 28652,
        slug: 'engineering',
        type: 'COLLECTIVE',
        isIncognito: false,
        name: 'Open Collective Engineering',
        currency: 'USD',
        isHost: false,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/engineering/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: null,
        },
        parentCollective: null,
        host: {
          __typename: 'Organization',
          id: 8686,
        },
        settings: {
          goals: [{}],
          editor: 'html',
          features: {
            conversations: true,
            newExpenseFlow: true,
            recurringExpenses: true,
            multiCurrencyExpenses: true,
            submitExpenseOnBehalf: true,
          },
          collectivePage: {
            sections: [
              {
                name: 'goals',
                type: 'SECTION',
                isEnabled: true,
              },
              {
                name: 'CONTRIBUTE',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'contribute',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'projects',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'events',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'connected-collectives',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'top-financial-contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'contributors',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'CONTRIBUTIONS',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'recurring-contributions',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'BUDGET',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'budget',
                    type: 'SECTION',
                    version: 2,
                    isEnabled: true,
                    restrictedTo: [],
                  },
                ],
              },
              {
                name: 'CONNECT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'updates',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'conversations',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
              {
                name: 'ABOUT',
                type: 'CATEGORY',
                sections: [
                  {
                    name: 'about',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                  {
                    name: 'our-team',
                    type: 'SECTION',
                    isEnabled: true,
                  },
                ],
              },
            ],
            showGoals: false,
          },
          'collective-page': {
            sections: ['budget', 'contributors'],
          },
        },
        location: {
          __typename: 'LocationType',
          id: '279',
          address: '666',
          country: 'DZ',
          structured: null,
        },
        children: [],
      },
    },
    {
      __typename: 'Member',
      id: 54390,
      role: 'ADMIN',
      collective: {
        __typename: 'Collective',
        id: 56398,
        slug: 'social-building-collective',
        type: 'COLLECTIVE',
        isIncognito: false,
        name: 'Social Building Collective',
        currency: 'SEK',
        isHost: true,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/social-building-collective/9bcac03/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Collective',
          id: 56398,
        },
        settings: {
          features: {
            conversations: true,
          },
          collectivePage: {
            background: {
              crop: {
                x: 1875,
                y: -1798,
              },
              zoom: '0.25',
              mediaSize: {
                width: 5000,
                height: 4000,
              },
              isAlignedRight: true,
            },
            tiersOrder: [15910, 15912, 15913, 15915, 15914, 15909, 15916, 'custom'],
            primaryColor: '#B13BC6',
          },
          paymentMethods: {
            manual: {
              title: 'Bank transfer',
              features: {
                recurring: false,
              },
              instructions:
                'Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.\n\nAmount: {amount}\nReference: {reference}\nDetail: {collective}\n{account}\n',
            },
          },
        },
        location: {
          __typename: 'LocationType',
          id: '6209',
          address: 'Gyllenkrooksgatan 23\n412 82 Göteborg',
          country: 'SE',
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 57092,
            slug: 'test-event-42-898ec3d5',
            type: 'EVENT',
            name: 'Test event 42',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/social-building-collective/9bcac03/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
          {
            __typename: 'Event',
            id: 57091,
            slug: 'test-event-3e35b5e5',
            type: 'EVENT',
            name: 'Test event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/social-building-collective/9bcac03/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
          {
            __typename: 'Project',
            id: 56401,
            slug: 'tiny-house-village',
            type: 'PROJECT',
            name: 'Tiny House Village',
            isActive: false,
            imageUrl: 'https://images-staging.opencollective.com/tiny-house-village/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
          {
            __typename: 'Event',
            id: 56399,
            slug: 'lets-build-a-cob-house-cdc5127f',
            type: 'EVENT',
            name: "Let's build a cob house",
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/lets-build-a-cob-house-cdc5127f/9bcac03/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54592,
      role: 'BACKER',
      collective: {
        __typename: 'Collective',
        id: 56398,
        slug: 'social-building-collective',
        type: 'COLLECTIVE',
        isIncognito: false,
        name: 'Social Building Collective',
        currency: 'SEK',
        isHost: true,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/social-building-collective/9bcac03/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: {
          __typename: 'Collective',
          id: 56398,
        },
        settings: {
          features: {
            conversations: true,
          },
          collectivePage: {
            background: {
              crop: {
                x: 1875,
                y: -1798,
              },
              zoom: '0.25',
              mediaSize: {
                width: 5000,
                height: 4000,
              },
              isAlignedRight: true,
            },
            tiersOrder: [15910, 15912, 15913, 15915, 15914, 15909, 15916, 'custom'],
            primaryColor: '#B13BC6',
          },
          paymentMethods: {
            manual: {
              title: 'Bank transfer',
              features: {
                recurring: false,
              },
              instructions:
                'Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.\n\nAmount: {amount}\nReference: {reference}\nDetail: {collective}\n{account}\n',
            },
          },
        },
        location: {
          __typename: 'LocationType',
          id: '6209',
          address: 'Gyllenkrooksgatan 23\n412 82 Göteborg',
          country: 'SE',
          structured: null,
        },
        children: [
          {
            __typename: 'Event',
            id: 57092,
            slug: 'test-event-42-898ec3d5',
            type: 'EVENT',
            name: 'Test event 42',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/social-building-collective/9bcac03/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
          {
            __typename: 'Event',
            id: 57091,
            slug: 'test-event-3e35b5e5',
            type: 'EVENT',
            name: 'Test event',
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/social-building-collective/9bcac03/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
          {
            __typename: 'Project',
            id: 56401,
            slug: 'tiny-house-village',
            type: 'PROJECT',
            name: 'Tiny House Village',
            isActive: false,
            imageUrl: 'https://images-staging.opencollective.com/tiny-house-village/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
          {
            __typename: 'Event',
            id: 56399,
            slug: 'lets-build-a-cob-house-cdc5127f',
            type: 'EVENT',
            name: "Let's build a cob house",
            isActive: true,
            imageUrl: 'https://images-staging.opencollective.com/lets-build-a-cob-house-cdc5127f/9bcac03/logo.png',
            host: {
              __typename: 'Collective',
              id: 56398,
            },
          },
        ],
      },
    },
    {
      __typename: 'Member',
      id: 54676,
      role: 'ADMIN',
      collective: {
        __typename: 'Event',
        id: 56399,
        slug: 'lets-build-a-cob-house-cdc5127f',
        type: 'EVENT',
        isIncognito: false,
        name: "Let's build a cob house",
        currency: 'SEK',
        isHost: false,
        endsAt: 'Wed Dec 13 2023 19:00:00 GMT+0000 (Coordinated Universal Time)',
        imageUrl: 'https://images-staging.opencollective.com/lets-build-a-cob-house-cdc5127f/9bcac03/logo.png',
        categories: [],
        isArchived: false,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: {
          __typename: 'Collective',
          id: 56398,
          policies: {
            __typename: 'Policies',
            REQUIRE_2FA_FOR_ADMINS: false,
          },
        },
        host: {
          __typename: 'Collective',
          id: 56398,
        },
        settings: {
          features: {
            conversations: true,
          },
          disableCustomContributions: true,
        },
        location: {
          __typename: 'LocationType',
          id: '6203',
          address: 'https://google.com',
          country: 'SE',
          structured: null,
        },
        children: [],
      },
    },
    {
      __typename: 'Member',
      id: 54705,
      role: 'ADMIN',
      collective: {
        __typename: 'Organization',
        id: 57095,
        slug: 'test-org-99',
        type: 'ORGANIZATION',
        isIncognito: false,
        name: 'Test urganisation',
        currency: 'USD',
        isHost: false,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/test-org-99/logo.png',
        categories: [],
        isArchived: true,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: null,
        settings: {
          features: {
            conversations: true,
          },
        },
        location: null,
        children: [],
      },
    },
    {
      __typename: 'Member',
      id: 54706,
      role: 'ADMIN',
      collective: {
        __typename: 'Organization',
        id: 57096,
        slug: 'another-org-2',
        type: 'ORGANIZATION',
        isIncognito: false,
        name: 'Another org',
        currency: 'USD',
        isHost: false,
        endsAt: null,
        imageUrl: 'https://images-staging.opencollective.com/another-org-2/logo.png',
        categories: [],
        isArchived: true,
        policies: {
          __typename: 'Policies',
          REQUIRE_2FA_FOR_ADMINS: false,
        },
        parentCollective: null,
        host: null,
        settings: {
          features: {
            conversations: true,
          },
        },
        location: null,
        children: [],
      },
    },
  ],
};
const maybeRefreshSessionTokenAndStore = async currentToken => {
  const decodeResult = jwt.decode(currentToken);
  if (!decodeResult) {
    return null;
  }

  // Update token if it expires in less than a month
  const shouldUpdate = dayjs(decodeResult.exp * 1000)
    .subtract(15, 'day')
    .isBefore(new Date());

  if (shouldUpdate) {
    // call to API again to exchange for long term token or 2FA token
    const res = await refreshToken(currentToken);
    const { token, error } = res;
    if (error) {
      return null;
    } else if (token) {
      setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
      return token;
    }
  }

  return currentToken;
};

const withLoggedInUser = WrappedComponent => {
  return class withLoggedInUser extends React.Component {
    static async getInitialProps(context) {
      return typeof WrappedComponent.getInitialProps === 'function'
        ? await WrappedComponent.getInitialProps(context)
        : {};
    }

    static displayName = `withLoggedInUser(${WrappedComponent.displayName})`;

    static propTypes = {
      client: PropTypes.object,
    };

    getLoggedInUserFromServer = () => {
      // return new LoggedInUser(user);

      return this.props.client.query({ query: loggedInUserQuery, fetchPolicy: 'network-only' }).then(result => {
        if (result.data?.LoggedInUser) {
          const user = result.data.LoggedInUser;
          Sentry.configureScope(scope => {
            scope.setUser({
              id: user.id,
              email: user.email,
              slug: user.collective?.slug,
              CollectiveId: user.collective?.id,
            });
          });
          return new LoggedInUser(user);
        } else {
          Sentry.configureScope(scope => {
            scope.setUser(null);
          });
          return null;
        }
      });
    };

    /**
     * If `token` is passed in `options`, function it will throw if
     * that token is invalid and it won't try to load user from the local cache
     * but instead force refetch it from the server.
     */
    getLoggedInUser = async (options = {}) => {
      // return this.getLoggedInUserFromServer();

      const { token = null, twoFactorAuthenticatorCode, twoFactorAuthenticationType } = options;

      // only Client Side for now
      if (!process.browser || !window) {
        return null;
      }

      if (token) {
        // Ensure token is valid
        const decodeResult = jwt.decode(token);
        if (!decodeResult || !decodeResult.exp) {
          throw new Error('Invalid token');
        }

        if (decodeResult.scope === 'session') {
          setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
        }

        // We received directly a 'twofactorauth' prompt after login in with password
        else if (decodeResult.scope === 'twofactorauth') {
          if (twoFactorAuthenticatorCode && twoFactorAuthenticationType) {
            const newToken = await refreshTokenWithTwoFactorCode(token, {
              twoFactorAuthenticatorCode,
              twoFactorAuthenticationType,
            });
            setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newToken);
          } else {
            setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
            throw new Error('Two-factor authentication is enabled on this account. Please enter the code');
          }
        } else if (decodeResult.scope === 'login') {
          const newToken = await exchangeLoginTokenAndStore(token);
          if (!newToken) {
            throw new Error('Invalid login token');
          }
          const decodedNewToken = jwt.decode(newToken);
          if (decodedNewToken.scope === 'twofactorauth') {
            throw new Error('Two-factor authentication is enabled on this account. Please enter the code');
          }
          setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newToken);
        } else {
          throw new Error(`Unsupported scope: ${decodeResult.scope}`);
        }
      } else {
        const localStorageToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        if (!localStorageToken) {
          return null;
        }

        const decodedLocalStorageToken = jwt.decode(localStorageToken);

        // A null token means the token is malformed, clear it from local storage
        if (!decodedLocalStorageToken) {
          setLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, null);
          return null;
        }

        if (decodedLocalStorageToken.scope === 'twofactorauth') {
          return null;
        }

        // refresh Access Token in the background if needed
        await maybeRefreshSessionTokenAndStore(localStorageToken);
      }

      // Synchronously
      return this.getLoggedInUserFromServer();
    };

    render() {
      return <WrappedComponent getLoggedInUser={this.getLoggedInUser} {...this.props} />;
    }
  };
};

export default withLoggedInUser;
