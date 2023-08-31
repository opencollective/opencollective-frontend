import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import AcceptRejectButtons from '../host-dashboard/AcceptRejectButtons';
import { processApplicationMutation } from '../host-dashboard/applications/queries';
import { NotificationBarButton } from '../NotificationBar';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

export default function PendingApplicationActions({ collective, refetch }) {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [callProcessApplication, { loading }] = useMutation(processApplicationMutation, {
    context: API_V2_CONTEXT,
  });

  const processApplication = async (action: string, message?: string) => {
    try {
      await callProcessApplication({
        variables: {
          host: { legacyId: collective.host.id },
          account: { legacyId: collective.id },
          action,
          message,
        },
      });

      if (refetch) {
        await refetch();
      }
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <Flex flexWrap="wrap" alignItems="center" justifyContent="center">
      <AcceptRejectButtons
        collective={collective}
        isLoading={loading}
        onApprove={() => processApplication('APPROVE')}
        onReject={message => processApplication('REJECT', message)}
        customButton={props => <NotificationBarButton {...props} />}
      />
    </Flex>
  );
}

PendingApplicationActions.propTypes = {
  refetch: PropTypes.func,
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
    host: PropTypes.shape({
      id: PropTypes.number,
    }),
  }),
};
