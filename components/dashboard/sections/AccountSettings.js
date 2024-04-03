import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { isArray, omit, pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { checkIfOCF } from '../../../lib/collective';
import { defaultBackgroundImage } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { editCollectivePageMutation } from '../../../lib/graphql/v1/mutations';
import { editCollectivePageQuery } from '../../../lib/graphql/v1/queries';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import SettingsForm from '../../edit-collective/Form';
import Loading from '../../Loading';
import { useToast } from '../../ui/useToast';
import { ALL_SECTIONS } from '../constants';
import { adminPanelQuery } from '../queries';

const AccountSettings = ({ account, section }) => {
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const router = useRouter();
  const [state, setState] = React.useState({ status: undefined, result: undefined });
  const { toast } = useToast();

  const { data, loading } = useQuery(editCollectivePageQuery, {
    variables: { slug: account.slug },
    fetchPolicy: 'network-only',
    skip: !LoggedInUser,
  });
  const collective = data?.Collective;
  const [editCollective] = useMutation(editCollectivePageMutation);

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

    const collectiveFields = [
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
      'repositoryUrl',
      'socialLinks',
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
      'hostFeePercent',
      'isActive',
    ];

    if (![ALL_SECTIONS.TIERS, ALL_SECTIONS.TICKETS].includes(section)) {
      collectiveFields.push('settings');
    }

    const CollectiveInputType = pick(collective, collectiveFields);
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
          'invoiceTemplate',
          'singleTicket',
        ]),
      );
    }

    if (isArray(collective.socialLinks)) {
      CollectiveInputType.socialLinks = collective.socialLinks.map(sl => omit(sl, '__typename'));
    }

    if (collective.location === null) {
      CollectiveInputType.location = null;
    } else {
      CollectiveInputType.location = pick(collective.location, [
        'name',
        'address',
        'lat',
        'long',
        'country',
        'structured',
      ]);
    }
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
          pathname: `/dashboard/${updatedCollective.slug}`,
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
      toast({
        variant: 'success',
        message: <FormattedMessage id="Settings.Updated" defaultMessage="Settings updated." />,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message || (
        <FormattedMessage id="Settings.Updated.Fail" defaultMessage="Update failed." />
      );
      toast({
        variant: 'error',
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
      host={account.host}
      LoggedInUser={LoggedInUser}
      onSubmit={handleEditCollective}
      status={state.status}
      section={section}
      isLegacyOCFDuplicatedAccount={checkIfOCF(account.host) && account.duplicatedAccounts?.totalCount > 0}
    />
  );
};

AccountSettings.propTypes = {
  account: PropTypes.object,
  section: PropTypes.string,
};

export default AccountSettings;
