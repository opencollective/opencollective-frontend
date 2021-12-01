import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { isArray, pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { defaultBackgroundImage } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { editCollectiveMutation } from '../../../lib/graphql/mutations';
import { editCollectivePageQuery } from '../../../lib/graphql/queries';

import { adminPanelQuery } from '../../../pages/admin-panel';
import SettingsForm from '../../edit-collective/Form';
import Loading from '../../Loading';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import { useUser } from '../../UserProvider';

const AccountSettings = ({ account, section }) => {
  const { LoggedInUser, refetchLoggedInUser } = useUser();
  const router = useRouter();
  const [state, setState] = React.useState({ status: undefined, result: undefined });
  const { addToast } = useToasts();

  const { data, loading } = useQuery(editCollectivePageQuery, {
    variables: { slug: account.slug },
    fetchPolicy: 'network-only',
    skip: !LoggedInUser,
  });
  const collective = data?.Collective;
  const [editCollective] = useMutation(editCollectiveMutation);

  const handleEditCollective = async updatedCollective => {
    const collective = { ...updatedCollective };

    if (typeof collective.tags === 'string') {
      collective.tags = collective.tags.split(',').map(t => t.trim());
    }
    if (collective.backgroundImage === defaultBackgroundImage[collective.type]) {
      delete collective.backgroundImage;
    }

    collective.settings = {
      ...collective.settings,
      tos: collective.tos,
    };

    delete collective.tos;
    const CollectiveInputType = pick(collective, [
      'id',
      'type',
      'slug',
      'name',
      'legalName',
      'company',
      'description',
      'longDescription',
      'tags',
      'expensePolicy',
      'website',
      'twitterHandle',
      'githubHandle',
      'location',
      'privateInstructions',
      'startsAt',
      'endsAt',
      'timezone',
      'currency',
      'quantity',
      'ParentCollectiveId',
      'HostCollectiveId',
      'image',
      'backgroundImage',
      'settings',
      'hostFeePercent',
      'isActive',
    ]);
    if (isArray(collective.tiers)) {
      CollectiveInputType.tiers = collective.tiers.map(tier =>
        pick(tier, [
          'id',
          'type',
          'name',
          'description',
          'longDescription',
          'useStandalonePage',
          'amount',
          'amountType',
          'interval',
          'maxQuantity',
          'presets',
          'minimumAmount',
          'goal',
          'button',
        ]),
      );
    }
    CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long', 'country']);
    setState({ ...state, status: 'loading' });
    try {
      const response = await editCollective({
        variables: { collective: CollectiveInputType },
        // It's heavy, but we need to refetch the information of the account after a mutation as fundamental
        // properties like its name or whether it's a fiscal host can change.
        refetchQueries: [{ query: adminPanelQuery, variables: { slug: account.slug }, context: API_V2_CONTEXT }],
      });
      const updatedCollective = response.data.editCollective;
      setState({ ...state, status: 'saved', result: { error: null } });
      const currentSlug = router.query.slug;
      if (currentSlug !== updatedCollective.slug) {
        router.replace({
          pathname: `/${updatedCollective.slug}/admin`,
          query: {
            ...router.query,
          },
        });
        await refetchLoggedInUser();
      } else {
        setTimeout(() => {
          setState({ ...state, status: null });
        }, 3000);
      }
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="Settings.Updated" defaultMessage="Settings updated." />,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err)?.message || (
        <FormattedMessage id="Settings.Updated.Fail" defaultMessage="Update failed." />
      );
      addToast({
        type: TOAST_TYPE.ERROR,
        message: errorMsg,
      });
      setState({ ...state, status: null, result: { error: errorMsg } });
    }
  };

  if (loading) {
    return <Loading />;
  } else if (!collective) {
    return null;
  }

  return (
    <SettingsForm
      collective={collective}
      LoggedInUser={LoggedInUser}
      onSubmit={handleEditCollective}
      status={state.status}
      contentOnly={true}
      section={section}
    />
  );
};

AccountSettings.propTypes = {
  account: PropTypes.object,
  section: PropTypes.string,
};

export default AccountSettings;
