import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { WebhookEvents } from '../../../lib/constants/notificationEvents';
import { i18nWebhookEventType } from '../../../lib/i18n/webhook-event-type';

import StyledModal, { ModalBody, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';

const getFakeActivity = (type, data) => {
  return {
    createdAt: '2022-07-18T10:30:44.479Z',
    id: 309906,
    CollectiveId: 16658,
    type,
    data,
  };
};

const getFakeIndividual = () => ({
  id: 4469,
  type: 'USER',
  slug: 'betree',
  name: 'Benjamin',
  twitterHandle: 'Betree83',
  githubHandle: 'Betree',
  repositoryUrl: 'https://github.com/Betree',
  image: 'https://opencollective-staging.s3.us-west-1.amazonaws.com/550ac070-e0f8-11e9-9d4c-e9c71c24ba70.jpg',
});

const getFakeCollective = () => ({
  id: 16658,
  type: 'COLLECTIVE',
  slug: 'captainfact_io',
  name: 'CaptainFact',
  twitterHandle: null,
  githubHandle: 'test',
  repositoryUrl: 'https://github.com/CaptainFact',
  image: 'https://opencollective-staging.s3.us-west-1.amazonaws.com/10dd8f00-54c8-11eb-bfdc-17c9ddbead53.png',
});

const getFakeTransaction = () => ({
  id: 233159,
  kind: 'CONTRIBUTION',
  type: 'CREDIT',
  uuid: 'a6a00550-95c4-48b2-bb32-ceb185232725',
  group: '9268b46d-74e7-4360-ac99-9413f78bb73e',
  amount: 4198,
  isDebt: false,
  OrderId: 50684,
  currency: 'EUR',
  isRefund: false,
  ExpenseId: null,
  createdAt: '2022-07-18T10:30:14.942Z',
  taxAmount: null,
  description: 'Monthly financial contribution to CaptainFact (Fixed recurring)',
  CollectiveId: 16658,
  hostCurrency: 'EUR',
  CreatedByUserId: 4829,
  FromCollectiveId: 4469,
  amountInHostCurrency: 4198,
  hostFeeInHostCurrency: 0,
  netAmountInHostCurrency: 4033,
  platformFeeInHostCurrency: 0,
  UsingGiftCardFromCollectiveId: null,
  netAmountInCollectiveCurrency: 4033,
  amountSentToHostInHostCurrency: 4033,
  paymentProcessorFeeInHostCurrency: -165,
  formattedAmount: '€41.98',
  formattedAmountWithInterval: '€41.98',
});

// All expenses have the same payload format
const getFakeExpenseEventActivity = type => {
  return getFakeActivity(type, {
    expense: {
      id: 9214,
      description: 'Food for the team retreat',
      amount: 5500,
      currency: 'USD',
      formattedAmount: '$55.00',
      formattedAmountWithInterval: '$55.00',
    },
    fromCollective: getFakeIndividual(),
    collective: getFakeCollective(),
  });
};

const getFakeMember = () => ({
  role: 'BACKER',
  description: null,
  since: '2022-07-18T10:30:14.985Z',
  tier: {
    id: 1212,
    name: 'backer',
    amount: 2000,
    currency: 'USD',
    description: 'Backers are individuals who support us',
    maxQuantity: 10,
  },
  memberCollective: {
    id: 4469,
    type: 'USER',
    slug: 'betree',
    name: 'Ben',
    company: '@CaptainFact_io @opencollective',
    website: 'https://benjamin.piouffle.com',
    twitterHandle: 'Betree83',
    githubHandle: 'Betree',
    repositoryUrl: 'https://github.com/Betree',
    description: 'Developer and civic tech enthusiast !',
    previewImage:
      'https://res.cloudinary.com/opencollective/image/fetch/c_thumb,g_face,h_48,r_max,w_48,bo_3px_solid_white/c_thumb,h_48,r_max,w_48,bo_2px_solid_rgb:66C71A/e_trim/f_jpg/https%3A%2F%2Fopencollective-staging.s3.us-west-1.amazonaws.com%2F550ac070-e0f8-11e9-9d4c-e9c71c24ba70.jpg',
  },
});

const getFakeOrder = () => ({
  id: 50684,
  totalAmount: 4198,
  currency: 'EUR',
  description: 'Monthly financial contribution to CaptainFact (Fixed recurring)',
  interval: 'month',
  createdAt: '2022-07-18T10:30:09.855Z',
  quantity: 1,
  formattedAmount: '€41.98',
  formattedAmountWithInterval: '€41.98 / month',
});

const ExpenseEvents = [
  WebhookEvents.COLLECTIVE_EXPENSE_PAID,
  WebhookEvents.COLLECTIVE_EXPENSE_CREATED,
  WebhookEvents.COLLECTIVE_EXPENSE_APPROVED,
  WebhookEvents.COLLECTIVE_EXPENSE_DELETED,
  WebhookEvents.COLLECTIVE_EXPENSE_REJECTED,
  WebhookEvents.COLLECTIVE_EXPENSE_UPDATED,
];

const WebhookEventInfo = {
  ...ExpenseEvents.reduce((acc, type) => {
    acc[type] = () => getFakeExpenseEventActivity(type);
    return acc;
  }, {}),
  [WebhookEvents.COLLECTIVE_TRANSACTION_CREATED]: () =>
    getFakeActivity(WebhookEvents.COLLECTIVE_TRANSACTION_CREATED, {
      fromCollective: getFakeIndividual(),
      collective: getFakeCollective(),
      transaction: getFakeTransaction(),
    }),
  [WebhookEvents.COLLECTIVE_MEMBER_CREATED]: () =>
    getFakeActivity(WebhookEvents.COLLECTIVE_MEMBER_CREATED, {
      member: getFakeMember(),
      order: getFakeOrder(),
    }),
  [WebhookEvents.COLLECTIVE_UPDATE_PUBLISHED]: () =>
    getFakeActivity(WebhookEvents.COLLECTIVE_UPDATE_PUBLISHED, {
      update: {
        html: '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Paria sunt igitur. Atque ab his initiis profecti omnium virtutum et originem et progressionem persecuti sunt. Non igitur de improbo, sed de callido improbo quaerimus, qualis Q. Si quidem, inquit, tollerem, sed relinquo. Non quam nostram quidem, inquit Pomponius iocans; <strong>Quantum Aristoxeni ingenium consumptum videmus in musicis?</strong><br /><br /></div><div><strong><br />Praeteritis, inquit, gaudeo.</strong> Aliter enim explicari, quod quaeritur, non potest. Hic nihil fuit, quod quaereremus. Hinc ceteri particulas arripere conati suam quisque videro voluit afferre sententiam. <strong>Nam, ut sint illa vendibiliora, haec uberiora certe sunt.</strong> Respondent extrema primis, media utrisque, omnia omnibus. Quamvis enim depravatae non sint, pravae tamen esse possunt. <em>Iam id ipsum absurdum, maximum malum neglegi.</em> <em>Expectoque quid ad id, quod quaerebam, respondeas.</em> Nec vero alia sunt quaerenda contra Carneadeam illam sententiam. Quid ei reliquisti, nisi te, quoquo modo loqueretur, intellegere, quid diceret? Si enim ad populum me vocas, eum. <br /><br /></div><div><br />Duo Reges: constructio interrete. <em>Sed ad rem redeamus;</em> Hinc ceteri particulas arripere conati suam quisque videro voluit afferre sententiam. Aperiendum est igitur, quid sit voluptas; Oratio me istius philosophi non offendit; <em>Itaque ab his ordiamur.</em></div>',
        title: 'Duo Reges: constructio interrete',
        slug: 'duo-reges-constructio-interrete',
        isPrivate: false,
      },
    }),
};

export const hasWebhookEventInfo = event => Boolean(WebhookEventInfo[event]);

const CodeContainer = styled.pre`
  max-width: 500px;
  max-height: 800px;
  overflow: auto;
`;

const WebhookActivityInfoModal = ({ activity, ...props }) => {
  const intl = useIntl();
  return (
    <StyledModal {...props}>
      <ModalHeader>
        <FormattedMessage
          defaultMessage='Details for the "{event}" webhook event'
          values={{
            event: i18nWebhookEventType(intl, activity),
          }}
        />
      </ModalHeader>
      <ModalBody mt={4}>
        <P mb={2}>
          <FormattedMessage defaultMessage="Sample payload:" />
        </P>
        <CodeContainer>{JSON.stringify(WebhookEventInfo[activity](), null, 2)}</CodeContainer>
      </ModalBody>
    </StyledModal>
  );
};

WebhookActivityInfoModal.propTypes = {
  activity: PropTypes.oneOf(Object.values(WebhookEvents)).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default WebhookActivityInfoModal;
