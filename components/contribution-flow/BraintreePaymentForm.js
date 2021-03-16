import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { getBraintree } from '../../lib/braintree';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import LoadingPlaceholder from '../LoadingPlaceholder';

const loggedInBraintreeTokenQuery = gqlV2/* GraphQL */ `
  query BraintreeTokenQuery($accountId: String!, $fromAccountLegacyId: Int!) {
    token: thirdPartyApiClientToken(
      service: BRAINTREE
      account: { id: $accountId }
      fromAccount: { legacyId: $fromAccountLegacyId }
    )
  }
`;

const braintreeTokenQuery = gqlV2/* GraphQL */ `
  query BraintreeTokenQuery($accountId: String!) {
    token: thirdPartyApiClientToken(service: BRAINTREE, account: { id: $accountId })
  }
`;

const BraintreeContainer = styled.div.attrs({ id: 'dropin-container' })`
  font-weight: 400;

  [data-braintree-id='choose-a-way-to-pay'],
  [data-braintree-id='methods-label'],
  [data-braintree-id='paypal-sheet-header'] {
    display: none;
  }

  [data-braintree-id='sheet-container'] {
    margin: 0;
  }

  [data-braintree-id='methods'] {
    margin-bottom: 12px;
  }

  [data-braintree-id='paypal'] {
    border: none;
    & > div {
      padding: 0;
      min-height: 45px;
    }
  }
`;

const setupBraintree = async (token, locale, onReady, onChange) => {
  const braintree = await getBraintree();
  braintree.dropin.create(
    {
      authorization: token,
      container: '#dropin-container',
      card: false,
      locale,
      dataCollector: {
        paypal: true,
      },
      paypal: {
        flow: 'vault',
        buttonStyle: {
          color: 'blue',
          tagline: false,
          size: 'large',
        },
      },
    },
    (err, instance) => {
      // TODO(Braintree): handle error
      onReady(instance);
      if (instance.isPaymentMethodRequestable()) {
        onChange({ isReady: true });
      }

      instance.on('paymentMethodRequestable', () => onChange({ isReady: true }));
      instance.on('noPaymentMethodRequestable', () => onChange({ isReady: false }));
    },
  );
};

const BraintreePaymentForm = ({ onReady, collective, fromCollective, onChange }) => {
  const fromCollectiveId = typeof fromCollective?.id === 'number' ? fromCollective.id : fromCollective?.legacyId;
  const variables = { accountId: collective.id, fromAccountLegacyId: fromCollectiveId };
  const query = fromCollectiveId ? loggedInBraintreeTokenQuery : braintreeTokenQuery;
  const { data, loading } = useQuery(query, { variables, context: API_V2_CONTEXT });
  const intl = useIntl();

  React.useEffect(() => {
    if (data?.token) {
      setupBraintree(data.token, intl.locale, onReady, onChange);
    }
  }, [data?.token]);

  return (
    <React.Fragment>
      {loading && <LoadingPlaceholder height={100} mt={22} />}
      <BraintreeContainer />
    </React.Fragment>
  );
};

BraintreePaymentForm.propTypes = {
  collective: PropTypes.object.isRequired,
  fromCollective: PropTypes.object.isRequired,
  onReady: PropTypes.func,
  onChange: PropTypes.func,
};

export default BraintreePaymentForm;
